import { Link } from 'react-router-dom';
import { MapPin, Star, MessageSquare } from 'lucide-react';

const CATEGORY_COLORS = {
  Restaurant: 'badge-amber',
  Cafe: 'badge-emerald',
  Hotel: 'badge-violet',
  Retail: 'badge-blue',
  Healthcare: 'badge-red',
  Fitness: 'badge-emerald',
  default: 'badge-violet',
};

export default function BusinessCard({ business }) {
  const { id, name, description, category, location, avg_overall, total_reviews, cover_image_url } = business;
  const badgeClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

  return (
    <Link to={`/business/${id}`} className="block group">
      <div className="glass-card overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative h-44 overflow-hidden rounded-t-2xl bg-surface-700">
          <img
            src={cover_image_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={e => {
              e.currentTarget.onerror = null; // prevent infinite loop
              e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className={`badge ${badgeClass} absolute top-3 left-3`}>{category}</div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-display text-lg font-bold text-white mb-1 group-hover:text-primary-300 transition-colors line-clamp-1">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-white/45 text-xs mb-3">
            <MapPin size={12} />
            <span>{location}</span>
          </div>
          <p className="text-white/50 text-sm line-clamp-2 flex-1 mb-4">{description}</p>

          <div className="flex items-center justify-between pt-3 border-t border-white/8">
            <div className="flex items-center gap-1.5">
              <Star size={15} className="text-amber-400" fill="currentColor" />
              <span className="text-white font-bold text-sm">{avg_overall > 0 ? Number(avg_overall).toFixed(1) : 'New'}</span>
              {avg_overall > 0 && <span className="text-white/30 text-xs">/5</span>}
            </div>
            <div className="flex items-center gap-1 text-white/35 text-xs">
              <MessageSquare size={12} />
              <span>{total_reviews} {total_reviews === 1 ? 'review' : 'reviews'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
