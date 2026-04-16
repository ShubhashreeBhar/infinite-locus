import { useState, useRef } from 'react';
import { insforge } from '../lib/insforge';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import toast from 'react-hot-toast';
import { X, Upload, ImagePlus, Send } from 'lucide-react';

const CRITERIA = [
  { key: 'rating_quality', label: 'Quality', color: 'text-violet-400' },
  { key: 'rating_service', label: 'Service', color: 'text-emerald-400' },
  { key: 'rating_value', label: 'Value', color: 'text-amber-400' },
];

export default function ReviewModal({ business, onClose, onSubmitted }) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState({ rating_quality: 0, rating_service: 0, rating_value: 0 });
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ratings.rating_quality || !ratings.rating_service || !ratings.rating_value) {
      toast.error('Please rate all three criteria'); return;
    }
    if (text.trim().length < 10) { toast.error('Review must be at least 10 characters'); return; }

    setLoading(true);
    let photo_url = null, photo_key = null;

    // Upload photo if provided
    if (photo) {
      const { data: upData, error: upErr } = await insforge.storage.from('review-photos').uploadAuto(photo);
      if (upErr) { toast.error('Photo upload failed'); setLoading(false); return; }
      photo_url = upData.url;
      photo_key = upData.key;
    }

    const { error } = await insforge.database.from('reviews').insert([{
      business_id: business.id,
      user_id: user.id,
      user_name: user.profile?.name || user.email,
      text: text.trim(),
      status: 'pending',
      rating_quality: ratings.rating_quality,
      rating_service: ratings.rating_service,
      rating_value: ratings.rating_value,
      photo_url,
      photo_key,
    }]);

    if (error) {
      console.error('[ReviewModal] Insert error:', error);
      toast.error(error.message || 'Failed to submit review');
    } else {
      toast.success('Review submitted! It will appear after admin approval ✅');
      onSubmitted?.();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg glass-card !hover:transform-none !hover:shadow-none animate-slide-up overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Write a Review</h2>
            <p className="text-white/40 text-sm mt-0.5">{business.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Ratings */}
          <div className="space-y-4">
            {CRITERIA.map(({ key, label, color }) => (
              <div key={key} className="flex items-center justify-between">
                <span className={`font-medium text-sm ${color}`}>{label}</span>
                <StarRating
                  value={ratings[key]}
                  onChange={val => setRatings(r => ({ ...r, [key]: val }))}
                  size={22}
                />
              </div>
            ))}
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Your Review</label>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="Share your experience in detail..."
              value={text}
              onChange={e => setText(e.target.value)}
              required
            />
            <p className="text-right text-xs text-white/25 mt-1">{text.length} chars</p>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Photo (optional)</label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="preview" className="w-full h-36 object-cover rounded-xl" />
                <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-500/80 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current.click()}
                className="w-full h-24 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 text-white/30 hover:border-primary-400/50 hover:text-primary-300 hover:bg-primary-500/5 transition-all">
                <ImagePlus size={22} />
                <span className="text-xs">Click to add photo</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" id="review-submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} />Submit Review</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
