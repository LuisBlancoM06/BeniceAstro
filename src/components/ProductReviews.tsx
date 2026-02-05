import { useState, useEffect } from 'react';
import { toast } from './Toast';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  verified_purchase: boolean;
  helpful_count: number;
  images?: string[];
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

// Reseñas de ejemplo (en producción vendrían de Supabase)
const mockReviews: Review[] = [
  {
    id: '1',
    user_name: 'María G.',
    rating: 5,
    title: '¡Excelente calidad!',
    comment: 'Mi perro está encantado con este producto. Lo recomiendo totalmente, se nota que es de buena calidad y el precio es muy competitivo.',
    created_at: '2024-01-10T10:00:00Z',
    verified_purchase: true,
    helpful_count: 12,
  },
  {
    id: '2',
    user_name: 'Carlos R.',
    rating: 4,
    title: 'Muy bueno, pero el envío tardó',
    comment: 'El producto es muy bueno y a mi gato le encanta. Solo que el envío tardó un poco más de lo esperado.',
    created_at: '2024-01-08T14:30:00Z',
    verified_purchase: true,
    helpful_count: 5,
  },
  {
    id: '3',
    user_name: 'Ana L.',
    rating: 5,
    title: 'Repetiré seguro',
    comment: 'Segunda vez que compro y sigue siendo igual de bueno. Muy contenta con la compra.',
    created_at: '2024-01-05T09:15:00Z',
    verified_purchase: true,
    helpful_count: 8,
  },
];

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState(0);

  // Estadísticas
  const totalReviews = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews || 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / totalReviews) * 100 || 0,
  }));

  // Filtrar y ordenar
  const filteredReviews = reviews
    .filter(r => filterRating === 0 || r.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'helpful') return b.helpful_count - a.helpful_count;
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const review: Review = {
      id: Date.now().toString(),
      user_name: 'Tú',
      rating: newReview.rating,
      title: newReview.title,
      comment: newReview.comment,
      created_at: new Date().toISOString(),
      verified_purchase: false,
      helpful_count: 0,
    };

    setReviews([review, ...reviews]);
    setNewReview({ rating: 5, title: '', comment: '' });
    setShowForm(false);
    toast.success('¡Gracias por tu reseña!');
  };

  const markHelpful = (reviewId: string) => {
    setReviews(reviews.map(r => 
      r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
    ));
    toast.info('¡Gracias por tu feedback!');
  };

  const StarRating = ({ rating, interactive = false, size = 'md', onChange }: { 
    rating: number; 
    interactive?: boolean; 
    size?: 'sm' | 'md' | 'lg';
    onChange?: (rating: number) => void;
  }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-8 h-8',
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            <svg
              className={`${sizeClasses[size]} ${
                (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
              }`}
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

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Opiniones de clientes</h2>
          <p className="text-gray-600">{totalReviews} reseñas para {productName}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Escribir reseña
        </button>
      </div>

      {/* Formulario de reseña */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-lg mb-4">Escribe tu reseña</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tu puntuación</label>
              <StarRating 
                rating={newReview.rating} 
                interactive 
                size="lg" 
                onChange={(rating) => setNewReview({ ...newReview, rating })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                placeholder="Resumen de tu opinión"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tu opinión</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="¿Qué te ha parecido este producto?"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Publicar reseña
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Resumen de puntuaciones */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
              <StarRating rating={Math.round(avgRating)} size="md" />
              <p className="text-sm text-gray-500 mt-2">{totalReviews} reseñas</p>
            </div>
            
            {/* Barras de puntuación */}
            <div className="space-y-2">
              {ratingCounts.map(({ rating, count, percentage }) => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(filterRating === rating ? 0 : rating)}
                  className={`w-full flex items-center gap-2 text-sm hover:bg-gray-100 p-1 rounded transition-colors ${
                    filterRating === rating ? 'bg-purple-100' : ''
                  }`}
                >
                  <span className="w-8">{rating}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-500">{count}</span>
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
          </div>
        </div>

        {/* Lista de reseñas */}
        <div className="lg:col-span-3">
          {/* Ordenar */}
          <div className="flex justify-end mb-4">
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

          {/* Reseñas */}
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{review.user_name}</span>
                      {review.verified_purchase && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          Compra verificada
                        </span>
                      )}
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                <p className="text-gray-600 mb-4">{review.comment}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <button
                    onClick={() => markHelpful(review.id)}
                    className="text-gray-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
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

          {filteredReviews.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <p className="text-gray-500">No hay reseñas con esta puntuación</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
