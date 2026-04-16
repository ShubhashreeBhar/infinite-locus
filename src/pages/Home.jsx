import { useState, useEffect, useCallback } from 'react';
import { insforge } from '../lib/insforge';
import BusinessCard from '../components/BusinessCard';
import { CardSkeleton } from '../components/Skeleton';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

const CATEGORIES = ['All', 'Restaurant', 'Cafe', 'Hotel', 'Retail', 'Healthcare', 'Fitness'];
const PAGE_SIZE = 8;

export default function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [category]);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = insforge.database
      .from('businesses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (category !== 'All') query = query.eq('category', category);
    if (debouncedSearch) query = query.ilike('name', `%${debouncedSearch}%`);

    const { data, error, count } = await query;
    if (!error) { setBusinesses(data || []); setTotal(count || 0); }
    setLoading(false);
  }, [page, category, debouncedSearch]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="hero-gradient py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 badge badge-violet mb-6">
            <MapPin size={12} />
            <span>Discover Local Businesses</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mb-5 leading-tight">
            Find the <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">best places</span><br />near you
          </h1>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
            Real reviews from real people. Rate Quality, Service, and Value to help your community.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input
              id="home-search"
              type="text"
              placeholder="Search restaurants, cafes, hotels..."
              className="input-field pl-12 py-4 text-base rounded-2xl !border-white/15"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-white/40 text-sm mr-2">
            <SlidersHorizontal size={14} />
            <span>Filter:</span>
          </div>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              id={`filter-${cat.toLowerCase()}`}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                category === cat
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-700/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Results count */}
        {!loading && (
          <p className="text-white/35 text-sm mb-6">
            {total > 0 ? `Showing ${businesses.length} of ${total} businesses` : 'No businesses found'}
            {category !== 'All' && ` in ${category}`}
            {debouncedSearch && ` matching "${debouncedSearch}"`}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading
            ? Array(PAGE_SIZE).fill(0).map((_, i) => <CardSkeleton key={i} />)
            : businesses.map(b => <BusinessCard key={b.id} business={b} />)
          }
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="btn-ghost flex items-center gap-1.5 disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    p === page ? 'bg-primary-600 text-white shadow-md' : 'text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
              className="btn-ghost flex items-center gap-1.5 disabled:opacity-30"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
