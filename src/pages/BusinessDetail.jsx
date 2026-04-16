import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { useAuth } from '../context/AuthContext';
import RatingCircle from '../components/RatingCircle';
import StarRating from '../components/StarRating';
import ReviewModal from '../components/ReviewModal';
import { ReviewSkeleton } from '../components/Skeleton';
import { MapPin, Tag, ArrowLeft, PenLine, Clock, User, ImageIcon } from 'lucide-react';

export default function BusinessDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [loadingRevs, setLoadingRevs] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchBusiness = async () => {
    const { data } = await insforge.database.from('businesses').select('*').eq('id', id).single();
    setBusiness(data);
    setLoadingBiz(false);
  };

  const fetchReviews = async () => {
    setLoadingRevs(true);
    const { data } = await insforge.database
      .from('reviews').select('*')
      .eq('business_id', id).eq('status', 'approved')
      .order('created_at', { ascending: false });
    setReviews(data || []);
    setLoadingRevs(false);
  };

  useEffect(() => { fetchBusiness(); fetchReviews(); }, [id]);

  if (loadingBiz) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  if (!business) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-white/50 text-lg">Business not found</p>
      <Link to="/" className="btn-ghost">← Back to Home</Link>
    </div>
  );

  const overallAvg = business.avg_overall > 0 ? Number(business.avg_overall).toFixed(1) : null;

  return (
    <div className="page-enter min-h-screen">
      {/* Hero image */}
      <div className="relative h-72 sm:h-96">
        <img
          src={business.cover_image_url || `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200`}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-black/40 to-transparent" />
        <Link to="/" className="absolute top-4 left-4 btn-ghost flex items-center gap-1.5 text-sm !bg-black/40 !border-white/20">
          <ArrowLeft size={15} /> Back
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 relative z-10 pb-20">
        {/* Business header */}
        <div className="glass-card p-6 mb-6 !hover:transform-none">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-violet">{business.category}</span>
                {overallAvg && (
                  <div className="flex items-center gap-1.5 badge badge-amber">
                    ★ {overallAvg} overall
                  </div>
                )}
              </div>
              <h1 className="font-display text-3xl font-bold text-white mb-2">{business.name}</h1>
              <div className="flex items-center gap-1.5 text-white/45 text-sm">
                <MapPin size={14} />
                <span>{business.location}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/35 text-xs">{business.total_reviews} reviews</p>
            </div>
          </div>
          {business.description && (
            <p className="text-white/55 mt-4 leading-relaxed border-t border-white/8 pt-4">{business.description}</p>
          )}
        </div>

        {/* Rating circles */}
        {business.avg_overall > 0 && (
          <div className="glass-card p-6 mb-6 !hover:transform-none">
            <h2 className="font-display text-lg font-bold text-white mb-6">Rating Breakdown</h2>
            <div className="flex items-center justify-around flex-wrap gap-6">
              <RatingCircle label="Quality" value={Number(business.avg_quality)} color="hsl(250,70%,65%)" />
              <RatingCircle label="Service" value={Number(business.avg_service)} color="hsl(145,65%,55%)" />
              <RatingCircle label="Value"   value={Number(business.avg_value)}   color="hsl(38,95%,65%)" />
            </div>
          </div>
        )}

        {/* Reviews section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-white">
            Reviews ({reviews.length})
          </h2>
          {user && (
            <button
              id="write-review-btn"
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm"
            >
              <PenLine size={15} /> Write a Review
            </button>
          )}
        </div>

        {!user && (
          <div className="glass-card p-5 mb-4 text-center !hover:transform-none">
            <p className="text-white/45 text-sm">
              <Link to="/sign-in" className="text-primary-300 hover:underline">Sign in</Link> to write a review
            </p>
          </div>
        )}

        {/* Review list */}
        {loadingRevs ? (
          <div className="space-y-4">{Array(3).fill(0).map((_, i) => <ReviewSkeleton key={i} />)}</div>
        ) : reviews.length === 0 ? (
          <div className="glass-card p-10 text-center !hover:transform-none">
            <p className="text-white/35 text-lg mb-1">No approved reviews yet</p>
            <p className="text-white/20 text-sm">Be the first to review this business!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="glass-card p-5 !hover:transform-none">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(review.user_name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">{review.user_name || 'Anonymous'}</span>
                      <div className="flex gap-3 text-xs text-white/35">
                        <span title="Quality">Q: {review.rating_quality}/5</span>
                        <span title="Service">S: {review.rating_service}/5</span>
                        <span title="Value">V: {review.rating_value}/5</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-white/30 text-xs mt-0.5">
                      <Clock size={11} />
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <StarRating value={Math.round((review.rating_quality + review.rating_service + review.rating_value) / 3)} size={14} readonly />
                </div>
                <p className="text-white/65 text-sm leading-relaxed">{review.text}</p>
                {review.photo_url && (
                  <img
                    src={review.photo_url}
                    alt="review"
                    className="mt-3 rounded-xl max-h-48 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(review.photo_url, '_blank')}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ReviewModal
          business={business}
          onClose={() => setShowModal(false)}
          onSubmitted={() => { fetchBusiness(); fetchReviews(); }}
        />
      )}
    </div>
  );
}
