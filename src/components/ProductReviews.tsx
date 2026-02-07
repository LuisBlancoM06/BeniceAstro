import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para el lado del cliente (auth)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Review {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  verified_purchase: boolean;
  helpful_count: number;
}

interface ReviewStats {
  avg_rating: number;
  total_reviews: number;
  distribution: Record<string, number>;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ avg_rating: 0, total_reviews: 0, distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 } });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Toast simple
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Verificar sesión del usuario
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email || '' });
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email || '' });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cargar reseñas
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        productId,
        sort: sortBy,
        ...(filterRating > 0 && { rating: filterRating.toString() }),
      });
      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews);
        setStats(data.stats);
        // Detectar si el usuario actual ya tiene reseña
        if (currentUser) {
          const mine = data.reviews.find((r: Review) => r.user_id === currentUser.id);
          setUserReview(mine || null);
        }
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [productId, sortBy, filterRating, currentUser]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Enviar / actualizar reseña
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (newReview.comment.length > 0 && newReview.comment.length < 3) {
      showToast('El comentario debe tener al menos 3 caracteres', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('Tu sesión ha expirado. Inicia sesión de nuevo.', 'error');
        return;
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          productId,
          rating: newReview.rating,
          comment: newReview.comment || '',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.updated ? '¡Reseña actualizada!' : '¡Gracias por tu reseña!', 'success');
        setShowForm(false);
        setEditMode(false);
        setNewReview({ rating: 5, comment: '' });
        fetchReviews();
      } else {
        showToast(data.error || 'Error al enviar la reseña', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar reseña
  const handleDelete = async (reviewId: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta reseña?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/reviews?reviewId=${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        showToast('Reseña eliminada', 'info');
        setUserReview(null);
        fetchReviews();
      }
    } catch {
      showToast('Error al eliminar', 'error');
    }
  };

  // Editar reseña propia
  const startEdit = (review: Review) => {
    setNewReview({ rating: review.rating, comment: review.comment || '' });
    setEditMode(true);
    setShowForm(true);
  };

  // Marcar como útil
  const markHelpful = async (reviewId: string) => {
    if (!currentUser) {
      showToast('Inicia sesión para votar', 'info');
      return;
    }
    // Optimistic update
    setReviews(prev => prev.map(r =>
      r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
    ));
    showToast('¡Gracias por tu feedback!', 'info');
  };

  // Componente de estrellas
  const StarRating = ({ rating, interactive = false, size = 'md', onChange }: {
    rating: number;
    interactive?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onChange?: (r: number) => void;
  }) => {
    const [hover, setHover] = useState(0);
    const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
          >
            <svg
              className={`${sizes[size]} ${(hover || rating) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const totalReviews = stats.total_reviews;
  const avgRating = stats.avg_rating;
  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: stats.distribution[r.toString()] || 0,
    percentage: totalReviews > 0 ? ((stats.distribution[r.toString()] || 0) / totalReviews) * 100 : 0,
  }));

  return (
    <div id="valoraciones" className="border-t pt-12 mb-16">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 transition-all ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toast.type === 'success' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Opiniones de clientes</h2>
          <p className="text-gray-600">{totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'} para {productName}</p>
        </div>
        {currentUser ? (
          userReview && !editMode ? (
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(userReview)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Editar mi reseña
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setShowForm(!showForm); setEditMode(false); setNewReview({ rating: 5, comment: '' }); }}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Escribir reseña
            </button>
          )
        ) : (
          <a
            href="/auth/login"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 no-underline"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            Inicia sesión para opinar
          </a>
        )}
      </div>

      {/* Formulario de reseña (solo usuarios logueados) */}
      {showForm && currentUser && (
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
          <h3 className="font-bold text-lg mb-4">{editMode ? 'Editar tu reseña' : 'Escribe tu reseña'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tu puntuación *</label>
              <StarRating
                rating={newReview.rating}
                interactive
                size="lg"
                onChange={(rating) => setNewReview({ ...newReview, rating })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tu comentario <span className="text-gray-400 font-normal">(opcional)</span></label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="¿Qué te ha parecido este producto? Cuéntanos tu experiencia..."
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{newReview.comment.length}/1000</p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando...' : editMode ? 'Actualizar reseña' : 'Publicar reseña'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditMode(false); }}
                className="text-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Resumen de puntuaciones (izquierda) */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-gray-900">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</div>
              <div className="flex justify-center mt-1">
                <StarRating rating={Math.round(avgRating)} size="md" />
              </div>
              <p className="text-sm text-gray-500 mt-2">{totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}</p>
            </div>

            {/* Barras de distribución */}
            <div className="space-y-2">
              {ratingCounts.map(({ rating, count, percentage }) => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(filterRating === rating ? 0 : rating)}
                  className={`w-full flex items-center gap-2 text-sm hover:bg-gray-100 p-1.5 rounded transition-colors ${
                    filterRating === rating ? 'bg-purple-100 ring-1 ring-purple-300' : ''
                  }`}
                >
                  <span className="w-8 text-gray-600 font-medium">{rating} ★</span>
                  <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${rating >= 4 ? 'bg-yellow-400' : rating === 3 ? 'bg-yellow-300' : 'bg-orange-400'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-500 text-right">{count}</span>
                </button>
              ))}
            </div>

            {filterRating > 0 && (
              <button
                onClick={() => setFilterRating(0)}
                className="w-full mt-4 text-purple-600 hover:underline text-sm"
              >
                Mostrar todas
              </button>
            )}

            {/* Info para invitados */}
            {!currentUser && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  <a href="/auth/login" className="text-purple-600 hover:underline font-medium">Inicia sesión</a> o{' '}
                  <a href="/auth/registro" className="text-purple-600 hover:underline font-medium">regístrate</a>{' '}
                  para dejar tu opinión
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lista de reseñas */}
        <div className="lg:col-span-3">
          {/* Ordenar */}
          <div className="flex justify-between items-center mb-4">
            {filterRating > 0 && (
              <p className="text-sm text-gray-500">Mostrando reseñas de {filterRating} ★</p>
            )}
            <div className="ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="recent">Más recientes</option>
                <option value="helpful">Más útiles</option>
                <option value="highest">Mayor puntuación</option>
                <option value="lowest">Menor puntuación</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 mt-1" />
                </div>
              ))}
            </div>
          )}

          {/* Reseñas */}
          {!loading && (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className={`bg-white border rounded-xl p-6 ${review.user_id === currentUser?.id ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                        review.user_id === currentUser?.id ? 'bg-purple-600' : 'bg-gray-400'
                      }`}>
                        {review.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-gray-900">
                            {review.user_name}
                            {review.user_id === currentUser?.id && (
                              <span className="text-purple-600 text-xs ml-1">(Tú)</span>
                            )}
                          </span>
                          {review.verified_purchase && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                              Compra verificada
                            </span>
                          )}
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      {/* Acciones del propietario */}
                      {review.user_id === currentUser?.id && (
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => startEdit(review)}
                            className="text-gray-400 hover:text-purple-600 p-1 rounded transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-gray-600 mb-4 whitespace-pre-line">{review.comment}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <button
                      onClick={() => markHelpful(review.id)}
                      disabled={review.user_id === currentUser?.id}
                      className={`flex items-center gap-1 transition-colors ${
                        review.user_id === currentUser?.id
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-purple-600'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      Útil ({review.helpful_count})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sin reseñas */}
          {!loading && reviews.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aún no hay opiniones</h3>
              <p className="text-gray-500 mb-4">Sé el primero en compartir tu experiencia con este producto</p>
              {currentUser ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Escribir la primera reseña
                </button>
              ) : (
                <a
                  href="/auth/login"
                  className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors no-underline"
                >
                  Inicia sesión para opinar
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
