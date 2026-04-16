import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { insforge } from '../lib/insforge';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2, ClipboardList, CheckCircle2, XCircle,
  BarChart3, Plus, X, Clock, Star, AlertTriangle, Trash2, ImagePlus, Pencil
} from 'lucide-react';

// ── Add Business Modal ────────────────────────────────────────────────────────
function AddBusinessModal({ onClose, onAdded }) {
  const CATEGORIES = ['Restaurant', 'Cafe', 'Hotel', 'Retail', 'Healthcare', 'Fitness', 'Other'];
  const [form, setForm] = useState({ name: '', description: '', category: 'Restaurant', location: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Image must be under 8MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let cover_image_url = null;
    let cover_image_key = null;

    // Upload cover image to business-images bucket if provided
    if (imageFile) {
      const { data: upData, error: upErr } = await insforge.storage
        .from('business-images')
        .uploadAuto(imageFile);
      if (upErr) {
        toast.error('Image upload failed — business not saved');
        setLoading(false);
        return;
      }
      cover_image_url = upData.url;
      cover_image_key = upData.key;
    }

    const { error } = await insforge.database.from('businesses').insert([{
      ...form,
      cover_image_url,
      cover_image_key,
    }]);

    if (error) toast.error(error.message || 'Failed to add business');
    else { toast.success('Business added!'); onAdded(); onClose(); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg glass-card !hover:transform-none !hover:shadow-none animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="font-display text-xl font-bold text-white">Add Business</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Cover image upload */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Cover Image (optional)</label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="preview" className="w-full h-36 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-500/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="w-full h-28 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 text-white/30 hover:border-primary-400/50 hover:text-primary-300 hover:bg-primary-500/5 transition-all"
              >
                <ImagePlus size={24} />
                <span className="text-xs">Click to upload cover photo</span>
                <span className="text-[10px] text-white/20">JPG, PNG, WEBP · max 8 MB</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          </div>

          {/* Text fields */}
          {[
            { key: 'name', label: 'Business Name', placeholder: 'e.g. The Golden Fork' },
            { key: 'location', label: 'Location', placeholder: 'e.g. Connaught Place, New Delhi' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-white/70 mb-1.5">{label}</label>
              <input type="text" className="input-field" placeholder={placeholder}
                value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Category</label>
            <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
            <textarea className="input-field resize-none" rows={3} placeholder="A brief description..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" id="add-business-submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{imageFile ? 'Uploading...' : 'Saving...'}</>
                : <><Plus size={16} />Add Business</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ── Edit Business Modal ───────────────────────────────────────────────────────
function EditBusinessModal({ business, onClose, onUpdated }) {
  const CATEGORIES = ['Restaurant', 'Cafe', 'Hotel', 'Retail', 'Healthcare', 'Fitness', 'Other'];
  const [form, setForm] = useState({
    name: business.name || '',
    description: business.description || '',
    category: business.category || 'Restaurant',
    location: business.location || '',
  });
  // Track current image (existing URL or new file preview)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(business.cover_image_url || null);
  const [clearImage, setClearImage] = useState(false); // user explicitly removed image
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Image must be under 8MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setClearImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setClearImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let cover_image_url = business.cover_image_url;
    let cover_image_key = business.cover_image_key;

    // If a new file was picked → delete old from storage + upload new
    if (imageFile) {
      // Delete old image if it existed
      if (business.cover_image_key) {
        await insforge.storage.from('business-images').delete(business.cover_image_key);
      }
      const { data: upData, error: upErr } = await insforge.storage
        .from('business-images')
        .uploadAuto(imageFile);
      if (upErr) {
        toast.error('Image upload failed — changes not saved');
        setLoading(false);
        return;
      }
      cover_image_url = upData.url;
      cover_image_key = upData.key;
    }

    // If user explicitly cleared the image → delete old from storage
    if (clearImage && business.cover_image_key) {
      await insforge.storage.from('business-images').delete(business.cover_image_key);
      cover_image_url = null;
      cover_image_key = null;
    }

    const { error } = await insforge.database
      .from('businesses')
      .update({ ...form, cover_image_url, cover_image_key })
      .eq('id', business.id);

    if (error) {
      console.error('[EditBusiness] error:', error);
      toast.error(error.message || 'Failed to update business');
    } else {
      toast.success(`"${form.name}" updated successfully ✏️`);
      onUpdated();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg glass-card !hover:transform-none !hover:shadow-none animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Edit Business</h2>
            <p className="text-white/35 text-xs mt-0.5">{business.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Cover image */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Cover Image</label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="preview" className="w-full h-36 object-cover rounded-xl" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button type="button" onClick={() => fileRef.current.click()}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-primary-600/80 transition-colors" title="Replace image">
                    <ImagePlus size={14} />
                  </button>
                  <button type="button" onClick={handleRemoveImage}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-500/80 transition-colors" title="Remove image">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current.click()}
                className="w-full h-28 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 text-white/30 hover:border-primary-400/50 hover:text-primary-300 hover:bg-primary-500/5 transition-all">
                <ImagePlus size={24} />
                <span className="text-xs">Click to upload cover photo</span>
                <span className="text-[10px] text-white/20">JPG, PNG, WEBP · max 8 MB</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          </div>

          {/* Text fields */}
          {[
            { key: 'name', label: 'Business Name', placeholder: 'e.g. The Golden Fork' },
            { key: 'location', label: 'Location', placeholder: 'e.g. Connaught Place, New Delhi' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-white/70 mb-1.5">{label}</label>
              <input type="text" className="input-field" placeholder={placeholder}
                value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Category</label>
            <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
            <textarea className="input-field resize-none" rows={3}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" id="edit-business-submit" disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{imageFile ? 'Uploading...' : 'Saving...'}</>
                : <><Pencil size={15} />Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('moderation');
  const [businesses, setBusinesses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [showAddBiz, setShowAddBiz] = useState(false);
  const [editingBiz, setEditingBiz] = useState(null); // business object being edited
  const [actioningId, setActioningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Redirect non-admins
  if (!authLoading && (!user || !isAdmin)) return <Navigate to="/" replace />;

  const fetchAll = async () => {
    setLoadingData(true);
    const [bizRes, revRes, statRes] = await Promise.all([
      insforge.database.from('businesses').select('*').order('created_at', { ascending: false }),
      insforge.database.from('reviews').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      insforge.database.from('reviews').select('status', { count: 'exact' }),
    ]);

    setBusinesses(bizRes.data || []);
    setReviews(revRes.data || []);

    // Calculate stats
    const all = statRes.data || [];
    const pending = all.filter(r => r.status === 'pending').length;
    const approved = all.filter(r => r.status === 'approved').length;
    const rejected = all.filter(r => r.status === 'rejected').length;
    setStats({ total: businesses.length, pending, approved, rejected });
    setLoadingData(false);
  };

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin]);

  const handleModerate = async (reviewId, businessId, newStatus) => {
    setActioningId(reviewId);
    const { error } = await insforge.database
      .from('reviews').update({ status: newStatus }).eq('id', reviewId).select();

    if (error) {
      toast.error('Action failed');
    } else {
      if (newStatus === 'approved') {
        await insforge.database.rpc('recalculate_business_ratings', { p_business_id: businessId });
        toast.success('Review approved & ratings updated ✅');
      } else {
        toast.success('Review rejected');
      }
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setStats(s => ({
        ...s,
        pending: s.pending - 1,
        approved: newStatus === 'approved' ? s.approved + 1 : s.approved,
        rejected: newStatus === 'rejected' ? s.rejected + 1 : s.rejected,
      }));
    }
    setActioningId(null);
  };

  const handleDelete = async (biz) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${biz.name}"?\n\nThis will permanently remove the business and ALL its reviews. This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(biz.id);
    const { error } = await insforge.database
      .from('businesses')
      .delete()
      .eq('id', biz.id);

    if (error) {
      console.error('[handleDelete] error:', error);
      toast.error(error.message || 'Failed to delete business');
    } else {
      setBusinesses(prev => prev.filter(b => b.id !== biz.id));
      toast.success(`"${biz.name}" deleted successfully 🗑️`);
    }
    setDeletingId(null);
  };

  const handleUpdate = (updatedBiz) => {
    // Refresh list after a successful edit
    fetchAll();
  };

  const TABS = [
    { key: 'moderation', label: 'Moderation Queue', icon: ClipboardList },
    { key: 'businesses', label: 'Businesses', icon: Building2 },
  ];

  const STAT_CARDS = [
    { label: 'Total Businesses', value: businesses.length, icon: Building2, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { label: 'Pending Reviews', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ];

  return (
    <div className="page-enter min-h-screen">
      {/* Admin Header */}
      <div className="hero-gradient border-b border-white/8 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600">
              <BarChart3 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-white/40 text-sm">Manage businesses and moderate reviews</p>
            </div>
            {stats.pending > 0 && (
              <div className="ml-auto flex items-center gap-1.5 badge badge-amber animate-pulse">
                <AlertTriangle size={12} />
                {stats.pending} pending
              </div>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`glass-card p-4 !hover:transform-none ${bg} border ${border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className={color} />
                  <span className="text-white/40 text-xs">{label}</span>
                </div>
                <span className="font-display text-3xl font-bold text-white">{loadingData ? '—' : value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit mb-8">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              id={`admin-tab-${key}`}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-primary-600 text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              <Icon size={15} />
              {label}
              {key === 'moderation' && stats.pending > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.pending > 9 ? '9+' : stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── MODERATION TAB ── */}
        {tab === 'moderation' && (
          <div>
            {loadingData ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="glass-card p-16 text-center !hover:transform-none">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4 opacity-60" />
                <h3 className="font-display text-xl font-bold text-white mb-2">All clear!</h3>
                <p className="text-white/35">No pending reviews to moderate.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="glass-card p-5 !hover:transform-none">
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Left: review info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {(review.user_name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white text-sm">{review.user_name || 'Anonymous'}</span>
                            <div className="flex gap-2 text-xs text-white/35 mt-0.5">
                              <span className="text-violet-400">Q:{review.rating_quality}</span>
                              <span className="text-emerald-400">S:{review.rating_service}</span>
                              <span className="text-amber-400">V:{review.rating_value}</span>
                              <span>· {new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-white/60 text-sm leading-relaxed mb-3 line-clamp-3">{review.text}</p>

                        {review.photo_url && (
                          <img src={review.photo_url} alt="review" className="h-28 w-auto rounded-lg object-cover mb-3" />
                        )}
                      </div>

                      {/* Right: actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          id={`approve-${review.id}`}
                          onClick={() => handleModerate(review.id, review.business_id, 'approved')}
                          disabled={actioningId === review.id}
                          className="btn-success flex items-center gap-1.5"
                        >
                          {actioningId === review.id
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <><CheckCircle2 size={15} /> Approve</>
                          }
                        </button>
                        <button
                          id={`reject-${review.id}`}
                          onClick={() => handleModerate(review.id, review.business_id, 'rejected')}
                          disabled={actioningId === review.id}
                          className="btn-danger flex items-center gap-1.5"
                        >
                          <XCircle size={15} /> Reject
                        </button>
                      </div>
                    </div>

                    {/* Business tag */}
                    <div className="mt-3 pt-3 border-t border-white/8 flex items-center gap-1.5 text-xs text-white/30">
                      <Building2 size={11} />
                      <span>Business ID: {review.business_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BUSINESSES TAB ── */}
        {tab === 'businesses' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-white">All Businesses ({businesses.length})</h2>
              <button id="add-business-btn" onClick={() => setShowAddBiz(true)} className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm">
                <Plus size={15} /> Add Business
              </button>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="glass-card overflow-hidden !hover:transform-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/8 text-white/40 text-xs uppercase tracking-wider">
                        <th className="text-left px-5 py-3">Business</th>
                        <th className="text-left px-5 py-3 hidden sm:table-cell">Category</th>
                        <th className="text-left px-5 py-3 hidden md:table-cell">Location</th>
                        <th className="text-left px-5 py-3">Rating</th>
                        <th className="text-left px-5 py-3 hidden sm:table-cell">Reviews</th>
                        <th className="text-left px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businesses.map((biz, i) => (
                        <tr key={biz.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}>
                          <td className="px-5 py-4">
                            <span className="font-medium text-white">{biz.name}</span>
                          </td>
                          <td className="px-5 py-4 hidden sm:table-cell">
                            <span className="badge badge-violet text-[10px]">{biz.category}</span>
                          </td>
                          <td className="px-5 py-4 text-white/40 hidden md:table-cell">{biz.location}</td>
                          <td className="px-5 py-4">
                            {biz.avg_overall > 0 ? (
                              <div className="flex items-center gap-1">
                                <Star size={13} className="text-amber-400" fill="currentColor" />
                                <span className="text-white font-medium">{Number(biz.avg_overall).toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-white/25 text-xs">No ratings</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-white/40 hidden sm:table-cell">{biz.total_reviews}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {/* Edit */}
                              <button
                                id={`edit-biz-${biz.id}`}
                                onClick={() => setEditingBiz(biz)}
                                title={`Edit ${biz.name}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-300 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/25 hover:border-primary-500/40 hover:text-primary-200 transition-all"
                              >
                                <Pencil size={13} />
                                Edit
                              </button>
                              {/* Delete */}
                              <button
                                id={`delete-biz-${biz.id}`}
                                onClick={() => handleDelete(biz)}
                                disabled={deletingId === biz.id}
                                title={`Delete ${biz.name}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/25 hover:border-red-500/40 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                {deletingId === biz.id
                                  ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                  : <Trash2 size={13} />}
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showAddBiz && <AddBusinessModal onClose={() => setShowAddBiz(false)} onAdded={fetchAll} />}
      {editingBiz && <EditBusinessModal business={editingBiz} onClose={() => setEditingBiz(null)} onUpdated={() => { handleUpdate(); setEditingBiz(null); }} />}
    </div>
  );
}
