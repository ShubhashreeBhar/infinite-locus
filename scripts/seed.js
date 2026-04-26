import 'dotenv/config'; // ES module equivalent of require('dotenv').config()

/**
 * scripts/seed.js
 * Run with: npm run db:seed
 *
 * Seeds the FeedTrust database with 9 businesses and 2 approved
 * reviews for The Golden Fork so the 4.0-star rating is immediately visible.
 *
 * IMPORTANT — RLS note:
 * The businesses table has an admin-only INSERT policy. This script uses the
 * anon key, so direct REST inserts are blocked. To seed from the CLI you have
 * two options:
 *
 *   Option A (recommended): Use the MCP tool (already done for you)
 *     mcp_insforge_run-raw-sql — bypasses RLS with full admin access.
 *
 *   Option B: Replace ANON_KEY below with a signed-in admin access token
 *     obtained via insforge.auth.signIn() and pass it as the Bearer token.
 *
 * The data has already been seeded via MCP. Re-run this script only when
 * you need to reset the database to its initial state using an admin token.
 */

// Read from .env (VITE_ prefix) with hardcoded fallbacks
const BASE_URL =
  process.env.VITE_INSFORGE_URL ||
  'https://szgn4dib.us-east.insforge.app';
const ANON_KEY =
  process.env.VITE_INSFORGE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzI2Mjd9.MpTUCHyPAdNcCDbSq3mJV3SbKHNufPoKN4qNcWJdGf8';

// ── Verify env vars are loaded ───────────────────────────────────────────────
console.log('[env] VITE_INSFORGE_URL    =', process.env.VITE_INSFORGE_URL  || '(using hardcoded fallback)');
console.log('[env] VITE_INSFORGE_ANON_KEY =', process.env.VITE_INSFORGE_ANON_KEY ? '***loaded***' : '(using hardcoded fallback)');
console.log('[env] Connecting to:', BASE_URL);
console.log('');

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${ANON_KEY}`,
  apikey: ANON_KEY,
};

// ── Businesses ──────────────────────────────────────────────────────────────────
const BUSINESSES = [
  {
    name: 'The Golden Fork',
    category: 'Restaurant',
    location: 'Connaught Place, New Delhi',
    description:
      'Award-winning fine dining restaurant with a farm-to-table philosophy and an extensive wine cellar.',
    cover_image_url:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
  },
  {
    name: 'Brew & Bean Co.',
    category: 'Cafe',
    location: 'Koregaon Park, Pune',
    description:
      'Artisan specialty coffee roastery and cafe with single-origin beans and freshly baked pastries.',
    cover_image_url:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
  },
  {
    name: 'StayWell Suites',
    category: 'Hotel',
    location: 'Bandra West, Mumbai',
    description:
      'Modern boutique hotel with rooftop pool, spa, and personalised concierge services in the heart of the city.',
    cover_image_url:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  },
  {
    name: 'TechZone Electronics',
    category: 'Retail',
    location: 'Indiranagar, Bangalore',
    description:
      'Premium consumer electronics retailer with expert staff, trade-in programs, and 2-year extended warranty.',
    cover_image_url:
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',
  },
  {
    name: 'WellCare Clinic',
    category: 'Healthcare',
    location: 'Salt Lake, Kolkata',
    description:
      'Multi-speciality outpatient clinic with experienced doctors, modern diagnostics, and same-day appointments.',
    cover_image_url:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
  },
  {
    name: 'The Reading Nook',
    category: 'Cafe',
    location: 'Hauz Khas, New Delhi',
    description:
      'Independent bookstore and cafe hybrid - browse first editions over a hand-crafted latte.',
    cover_image_url:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
  },
  {
    name: 'FitLife Gym & Spa',
    category: 'Fitness',
    location: 'Whitefield, Bangalore',
    description:
      'State-of-the-art fitness centre with Olympic lifting platforms, yoga studio, and recovery spa.',
    cover_image_url:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  },
  {
    name: 'Spice Route Kitchen',
    category: 'Restaurant',
    location: 'Anna Nagar, Chennai',
    description:
      'Authentic regional Indian cuisine from Kerala to Rajasthan - a culinary journey on every plate.',
    cover_image_url:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  },
  {
    name: 'Olive Beach',
    category: 'Restaurant',
    location: 'Indiranagar, Bangalore',
    description:
      'Mediterranean bistro known for wood-fired flatbreads, fresh mezze, and a stunning open-air terrace.',
    cover_image_url:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
  },
];

// ── Seed reviews for The Golden Fork (avg 4.0) ─────────────────────────────────
const GOLDEN_FORK_REVIEWS = [
  {
    user_id: 'seed-user-1',
    user_name: 'Priya Sharma',
    text: 'Absolutely stunning dining experience. The tasting menu was exceptional and every course was a work of art. Service was impeccable and the wine pairing was spot on.',
    status: 'approved',
    rating_quality: 4,
    rating_service: 4,
    rating_value: 4,
  },
  {
    user_id: 'seed-user-2',
    user_name: 'Arjun Mehta',
    text: 'The Golden Fork lives up to its reputation. Loved the farm-to-table concept — ingredients were incredibly fresh. A bit pricey but well worth it for a special occasion.',
    status: 'approved',
    rating_quality: 4,
    rating_service: 4,
    rating_value: 4,
  },
];

// ── PostgREST INSERT helper ─────────────────────────────────────────────────────
async function pgInsert(table, rows) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'return=representation' },
      body: JSON.stringify(rows),
    });
  } catch (networkErr) {
    throw new Error(
      `Network error reaching ${BASE_URL} — is the URL correct?\n  Details: ${networkErr.message}`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const html = await res.text();
    throw new Error(
      `INSERT into ${table} failed (${res.status}): server returned HTML instead of JSON.\n` +
      `  This usually means the BASE_URL is wrong or the server is down.\n` +
      `  URL used: ${BASE_URL}\n` +
      `  First 300 chars of response: ${html.slice(0, 300)}`
    );
  }

  let json;
  try {
    json = await res.json();
  } catch (parseErr) {
    const raw = await res.clone().text().catch(() => '(could not read body)');
    throw new Error(
      `INSERT into ${table} failed (${res.status}): response is not valid JSON.\n` +
      `  First 300 chars: ${raw.slice(0, 300)}`
    );
  }

  if (!res.ok) {
    throw new Error(`INSERT into ${table} failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

// ── PostgREST RPC helper ────────────────────────────────────────────────────────
async function pgRpc(fnName, params) {
  const res = await fetch(`${BASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RPC ${fnName} failed (${res.status}): ${body}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('======================================');
  console.log('  FeedTrust — Database Seed');
  console.log('======================================\n');

  // --- Insert businesses
  console.log(`[1/3] Inserting ${BUSINESSES.length} businesses...`);
  const inserted = await pgInsert('businesses', BUSINESSES);
  console.log(`      OK — ${inserted.length} rows created\n`);

  // --- Find The Golden Fork
  const goldenFork = inserted.find((b) => b.name === 'The Golden Fork');
  if (!goldenFork) {
    throw new Error('Could not resolve The Golden Fork ID from insert response.');
  }

  // --- Insert seed reviews
  console.log('[2/3] Inserting 2 approved reviews for The Golden Fork...');
  const reviews = GOLDEN_FORK_REVIEWS.map((r) => ({
    ...r,
    business_id: goldenFork.id,
  }));
  await pgInsert('reviews', reviews);
  console.log('      OK — 2 reviews inserted\n');

  // --- Recalculate ratings
  console.log('[3/3] Recalculating ratings via RPC...');
  await pgRpc('recalculate_business_ratings', { p_business_id: goldenFork.id });
  console.log('      OK — The Golden Fork now shows 4.0 stars\n');

  console.log('======================================');
  console.log('  Seed complete!');
  console.log('  Visit http://localhost:5173 to verify');
  console.log('======================================\n');
}

main().catch((err) => {
  console.error('\n[ERROR]', err.message);
  process.exit(1);
});
