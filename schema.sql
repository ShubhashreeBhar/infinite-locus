-- =============================================================================
--  schema.sql — Infinite Locus Platform
--  Generated from live database: https://szgn4dib.us-east.insforge.app
-- =============================================================================
--
--  Run this file against a fresh InsForge / Supabase PostgreSQL instance to
--  recreate the entire database schema, security policies, and helper functions.
--
--  Order of execution:
--    1. Extensions
--    2. Tables          (businesses → reviews, because reviews FK → businesses)
--    3. Indexes
--    4. Grants
--    5. Row Level Security (RLS) policies
--    6. Functions       (recalculate_business_ratings, promote_to_admin)
--
--  NOTE: auth.users is managed by InsForge internally and is NOT recreated here,
--  but it is referenced in RLS policies and the promote_to_admin helper.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0.  EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Required for gen_random_uuid() used as table primary key defaults.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.  TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- ---------------------------------------------------------------------------
-- businesses
--   Core listing table.  Rating columns are denormalised aggregates updated
--   server-side by the recalculate_business_ratings() RPC whenever a review
--   is approved or rejected.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    name             TEXT         NOT NULL,
    description      TEXT,
    category         TEXT         NOT NULL,
    location         TEXT         NOT NULL,

    -- Denormalised rating columns (maintained by RPC, never written by client)
    avg_quality      NUMERIC      DEFAULT 0,
    avg_service      NUMERIC      DEFAULT 0,
    avg_value        NUMERIC      DEFAULT 0,
    avg_overall      NUMERIC      DEFAULT 0,
    total_reviews    INTEGER      DEFAULT 0,

    -- Cover image stored in InsForge Storage bucket "business-images"
    cover_image_url  TEXT,
    cover_image_key  TEXT,        -- internal storage key used for deletion/replace

    created_at       TIMESTAMPTZ  DEFAULT now(),

    CONSTRAINT businesses_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.businesses              IS 'Registered businesses visible to the public.';
COMMENT ON COLUMN public.businesses.avg_quality  IS 'Rolling average of approved rating_quality values (0–5).';
COMMENT ON COLUMN public.businesses.avg_service  IS 'Rolling average of approved rating_service values (0–5).';
COMMENT ON COLUMN public.businesses.avg_value    IS 'Rolling average of approved rating_value values (0–5).';
COMMENT ON COLUMN public.businesses.avg_overall  IS 'Mean of avg_quality, avg_service, avg_value (0–5).';
COMMENT ON COLUMN public.businesses.cover_image_key IS 'Storage object key used to delete/replace the image file.';


-- ---------------------------------------------------------------------------
-- reviews
--   User-submitted reviews.  status follows the lifecycle:
--     pending  →  approved | rejected   (changed only by admins)
--
--   ON DELETE CASCADE ensures that deleting a business automatically removes
--   all associated reviews without leaving orphan rows.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    business_id     UUID         NOT NULL,
    user_id         TEXT         NOT NULL,   -- InsForge auth user id (text, e.g. UUID string)
    user_name       TEXT,
    text            TEXT         NOT NULL,
    status          TEXT         NOT NULL DEFAULT 'pending',

    -- Multi-criteria ratings: each is 1–5 (enforced by the frontend, not a DB CHECK
    -- to allow future flexibility, but you may add: CHECK (rating_quality BETWEEN 1 AND 5))
    rating_quality  INTEGER      NOT NULL,
    rating_service  INTEGER      NOT NULL,
    rating_value    INTEGER      NOT NULL,

    -- Optional review photo stored in InsForge Storage bucket "review-photos"
    photo_url       TEXT,
    photo_key       TEXT,

    created_at      TIMESTAMPTZ  DEFAULT now(),

    CONSTRAINT reviews_pkey          PRIMARY KEY (id),
    CONSTRAINT reviews_status_check  CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT reviews_business_id_fkey
        FOREIGN KEY (business_id)
        REFERENCES public.businesses (id)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
);

COMMENT ON TABLE  public.reviews         IS 'User-submitted business reviews awaiting or having passed admin moderation.';
COMMENT ON COLUMN public.reviews.status  IS 'Moderation lifecycle: pending → approved | rejected.';
COMMENT ON COLUMN public.reviews.user_id IS 'InsForge auth user ID (stored as TEXT to match auth.users.id cast).';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2.  INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Speed up the most common query pattern: fetching approved reviews per business.
CREATE INDEX IF NOT EXISTS idx_reviews_business_status
    ON public.reviews (business_id, status);

-- Speed up home-page search queries (text search on name).
CREATE INDEX IF NOT EXISTS idx_businesses_name
    ON public.businesses USING btree (name);

-- Speed up category filter on the home page.
CREATE INDEX IF NOT EXISTS idx_businesses_category
    ON public.businesses (category);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3.  ROLE GRANTS
--     PostgREST uses the 'anon' and 'authenticated' roles.
--     project_admin always has full access (auto-created by InsForge).
-- ─────────────────────────────────────────────────────────────────────────────

-- businesses: public read; insert/update/delete restricted via RLS below
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;

-- reviews: public read (anon); authenticated users can insert their own
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews    TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews    TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4.  ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
--
--  Admin identity is determined at query time by reading the 'role' field from
--  the auth.users.profile JSONB column, matched against the JWT 'sub' claim
--  that PostgREST injects via current_setting('request.jwt.claims').
--
--  Helper expression (used in all admin-gated policies):
--
--    EXISTS (
--      SELECT 1 FROM auth.users
--      WHERE id::text = (current_setting('request.jwt.claims', true)::jsonb->>'sub')
--        AND profile->>'role' = 'admin'
--    )
--
-- ─────────────────────────────────────────────────────────────────────────────

-- ── businesses ───────────────────────────────────────────────────────────────

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- InsForge project_admin role always has full unrestricted access.
CREATE POLICY "project_admin_policy"
    ON public.businesses
    AS PERMISSIVE FOR ALL
    TO project_admin
    USING (true)
    WITH CHECK (true);

-- Anyone (logged in or not) can read the business listing.
CREATE POLICY "businesses_select_public"
    ON public.businesses
    AS PERMISSIVE FOR SELECT
    TO anon, authenticated
    USING (true);

-- Only authenticated admin users can INSERT new businesses.
CREATE POLICY "businesses_insert_admin_only"
    ON public.businesses
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id::text = (current_setting('request.jwt.claims', true)::jsonb->>'sub')
              AND profile->>'role' = 'admin'
        )
    );

-- Only authenticated admin users can UPDATE existing businesses.
CREATE POLICY "businesses_update_admin_only"
    ON public.businesses
    AS PERMISSIVE FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id::text = (current_setting('request.jwt.claims', true)::jsonb->>'sub')
              AND profile->>'role' = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id::text = (current_setting('request.jwt.claims', true)::jsonb->>'sub')
              AND profile->>'role' = 'admin'
        )
    );

-- Only authenticated admin users can DELETE businesses.
-- ON DELETE CASCADE on reviews.business_id ensures reviews are wiped too.
CREATE POLICY "businesses_delete_admin_only"
    ON public.businesses
    AS PERMISSIVE FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id::text = (current_setting('request.jwt.claims', true)::jsonb->>'sub')
              AND profile->>'role' = 'admin'
        )
    );


-- ── reviews ──────────────────────────────────────────────────────────────────
--
--  RLS is intentionally LEFT DISABLED on reviews because:
--    • Public SELECT (approved reviews) is handled by the frontend filter.
--    • INSERT is allowed for any authenticated user.
--    • UPDATE (status change) is performed server-side by the admin flow.
--  Enable and add policies here if stricter access control is required.
--
--  Example policies (uncomment to activate):
--
--  ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
--
--  -- Anyone can read approved reviews
--  CREATE POLICY "reviews_select_approved"
--      ON public.reviews FOR SELECT
--      TO anon, authenticated
--      USING (status = 'approved');
--
--  -- Authenticated users can insert their own reviews
--  CREATE POLICY "reviews_insert_authenticated"
--      ON public.reviews FOR INSERT
--      TO authenticated
--      WITH CHECK (
--          user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')
--      );
--
--  -- Only admins can update review status
--  CREATE POLICY "reviews_update_admin_only"
--      ON public.reviews FOR UPDATE
--      TO authenticated
--      USING (
--          EXISTS (
--              SELECT 1 FROM auth.users
--              WHERE id::text = (current_setting('request.jwt.claims', true)::jsonb->>'sub')
--                AND profile->>'role' = 'admin'
--          )
--      );


-- ─────────────────────────────────────────────────────────────────────────────
-- 5.  FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- ---------------------------------------------------------------------------
-- recalculate_business_ratings(p_business_id UUID)
--
--   Atomically recomputes all rating averages and total_reviews for a single
--   business by aggregating only APPROVED reviews.
--
--   Called via InsForge RPC from the Admin Dashboard whenever a review is
--   approved or rejected:
--     insforge.database.rpc('recalculate_business_ratings', { p_business_id })
--
--   Using a server-side function instead of client-side aggregation ensures:
--   • Concurrency safety — no race conditions between simultaneous approvals.
--   • Data integrity — averages are always derived from the source of truth.
--   • Simplicity — no need to send aggregate payloads over the network.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_business_ratings(p_business_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_avg_quality NUMERIC;
    v_avg_service NUMERIC;
    v_avg_value   NUMERIC;
    v_avg_overall NUMERIC;
    v_total       INTEGER;
BEGIN
    SELECT
        ROUND(AVG(rating_quality)::NUMERIC, 2),
        ROUND(AVG(rating_service)::NUMERIC, 2),
        ROUND(AVG(rating_value)::NUMERIC, 2),
        ROUND(((AVG(rating_quality) + AVG(rating_service) + AVG(rating_value)) / 3)::NUMERIC, 2),
        COUNT(*)
    INTO v_avg_quality, v_avg_service, v_avg_value, v_avg_overall, v_total
    FROM public.reviews
    WHERE business_id = p_business_id
      AND status = 'approved';

    UPDATE public.businesses SET
        avg_quality   = COALESCE(v_avg_quality, 0),
        avg_service   = COALESCE(v_avg_service, 0),
        avg_value     = COALESCE(v_avg_value,   0),
        avg_overall   = COALESCE(v_avg_overall, 0),
        total_reviews = COALESCE(v_total,       0)
    WHERE id = p_business_id;
END;
$$;

-- Grant execute to all authenticated roles (admins call this via the SDK)
GRANT EXECUTE ON FUNCTION public.recalculate_business_ratings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_business_ratings(UUID) TO anon;

COMMENT ON FUNCTION public.recalculate_business_ratings IS
    'Recomputes avg_quality, avg_service, avg_value, avg_overall and total_reviews '
    'for a business from its approved reviews. Call after any review status change.';


-- ---------------------------------------------------------------------------
-- promote_to_admin(p_email TEXT) → TEXT
--
--   Admin bootstrap helper. Sets profile->>'role' = 'admin' for a given user.
--
--   Usage (run once per new admin via InsForge MCP or SQL console):
--     SELECT promote_to_admin('user@example.com');
--
--   The role is stored in auth.users.profile (JSONB), which InsForge embeds
--   in the user's JWT on next sign-in.  The frontend reads it as:
--     user.profile?.role === 'admin'
--
--   Security note: this function uses SECURITY DEFINER so it can write to
--   auth.users regardless of caller permissions.  Restrict it to trusted
--   contexts (direct SQL / MCP only — never expose via PostgREST).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.promote_to_admin(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER   -- runs with owner privileges to access auth.users
AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id
    FROM auth.users
    WHERE email = p_email;

    IF v_id IS NULL THEN
        RETURN 'User not found: ' || p_email;
    END IF;

    UPDATE auth.users
    SET profile = profile || '{"role": "admin"}'::jsonb
    WHERE id = v_id;

    RETURN 'Promoted ' || p_email || ' to admin';
END;
$$;

-- Revoke public execute — this must only be called by the project owner via SQL
REVOKE EXECUTE ON FUNCTION public.promote_to_admin(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.promote_to_admin(TEXT) TO project_admin;

COMMENT ON FUNCTION public.promote_to_admin IS
    'Grants admin role to a user by email. Run via SQL console or InsForge MCP only. '
    'Usage: SELECT promote_to_admin(''admin@example.com'');';


-- ─────────────────────────────────────────────────────────────────────────────
-- 6.  STORAGE BUCKETS  (reference — created via InsForge MCP / dashboard)
-- ─────────────────────────────────────────────────────────────────────────────
--
--  The following buckets must exist and be set to PUBLIC in InsForge Storage:
--
--    bucket name      | public | purpose
--    ─────────────────┼────────┼────────────────────────────────────────────
--    business-images  |  YES   | Cover photos uploaded via Admin Dashboard
--    review-photos    |  YES   | Photos attached to user-submitted reviews
--
--  Create via MCP:
--    mcp_insforge_create-bucket { bucketName: "business-images", isPublic: true }
--    mcp_insforge_create-bucket { bucketName: "review-photos",   isPublic: true }
--
--  Or via InsForge SDK (admin session):
--    insforge.storage.createBucket('business-images', { public: true })
--    insforge.storage.createBucket('review-photos',   { public: true })
--


-- ─────────────────────────────────────────────────────────────────────────────
-- 7.  AUTH SCHEMA REFERENCE  (managed by InsForge — DO NOT recreate)
-- ─────────────────────────────────────────────────────────────────────────────
--
--  auth.users (relevant columns, read-only reference):
--
--    id               UUID
--    email            TEXT
--    password         TEXT        (hashed)
--    email_verified   BOOLEAN
--    profile          JSONB       -- { "name": "...", "role": "admin"|null }
--    metadata         JSONB
--    is_project_admin BOOLEAN
--    is_anonymous     BOOLEAN
--    created_at       TIMESTAMPTZ
--    updated_at       TIMESTAMPTZ
--
--  The promote_to_admin() function merges {"role": "admin"} into profile.
--  The frontend reads role as: user.profile?.role === 'admin'
--
--  RLS policies identify the current user via:
--    current_setting('request.jwt.claims', true)::jsonb->>'sub'
--  which equals auth.users.id cast to TEXT.
--
-- =============================================================================
--  END OF SCHEMA
-- =============================================================================
