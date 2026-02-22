/**
 * AddressAutocomplete — Componente React para autocompletado de direcciones.
 * 
 * Usa nuestros endpoints proxy (/api/google/places-*) para NO exponer
 * la API Key de Google al cliente.
 * 
 * Características:
 * - Debounce de 300ms para evitar llamadas excesivas
 * - Session tokens de Google para agrupar facturación
 * - Accesible (ARIA roles, navegación con teclado)
 * - Manejo de errores con fallback a edición manual
 * - Rellena automáticamente los campos del formulario al seleccionar
 */
import { useState, useRef, useEffect, useCallback } from 'react';

interface Prediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface ParsedAddress {
  street_number: string;
  route: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  country_code: string;
  formatted_address: string;
}

interface AddressAutocompleteProps {
  /** IDs de los inputs del formulario a rellenar */
  fieldIds?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  /** Callback cuando se selecciona una dirección */
  onAddressSelected?: (address: ParsedAddress) => void;
  /** Placeholder custom */
  placeholder?: string;
  /** Clases CSS adicionales para el input */
  className?: string;
  /** ID del input */
  id?: string;
  /** Texto principal del label (por defecto: "Buscar dirección") */
  label?: string;
  /** Texto secundario del label (por defecto: "— autocompletado"). Pasar null para ocultar */
  sublabel?: string | null;
  /** Clases CSS del label (por defecto: "block text-xs font-semibold text-gray-600 mb-1.5") */
  labelClassName?: string;
}

/** Genera un UUID v4 para session tokens de Google */
function generateSessionToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function AddressAutocomplete({
  fieldIds = {},
  onAddressSelected,
  placeholder = 'Escribe tu dirección...',
  className = '',
  id = 'address-autocomplete',
  label = 'Buscar dirección',
  sublabel = '— autocompletado',
  labelClassName = 'block text-xs font-semibold text-gray-600 mb-1.5',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const sessionTokenRef = useRef(generateSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Buscar sugerencias vía nuestro proxy backend */
  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/google/places-autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          sessionToken: sessionTokenRef.current,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al buscar direcciones');
      }

      const data = await res.json();
      const preds = data.predictions || [];
      
      setPredictions(preds);
      setIsOpen(preds.length > 0);
      setActiveIndex(-1);
      
      if (preds.length === 0 && input.length >= 5) {
        setError('No se encontraron direcciones. Puedes escribirla manualmente.');
      }
    } catch (err) {
      console.error('Autocomplete error:', err);
      setError('Error de conexión. Escribe la dirección manualmente.');
      setPredictions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Manejar cambio en el input con debounce */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedAddress(null);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchPredictions(value);
    }, 300);
  };

  /** Seleccionar una sugerencia y obtener detalles */
  const selectPrediction = async (prediction: Prediction) => {
    setQuery(prediction.description);
    setSelectedAddress(prediction.description);
    setIsOpen(false);
    setPredictions([]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/google/place-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: prediction.placeId,
          sessionToken: sessionTokenRef.current,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al obtener detalles');
      }

      const data = await res.json();
      const addr: ParsedAddress = data.address;

      // Renovar session token para la próxima búsqueda
      sessionTokenRef.current = generateSessionToken();

      // Rellenar campos del formulario
      fillFormFields(addr);

      // Notificar al padre
      onAddressSelected?.(addr);

      // Actualizar input con la dirección formateada
      if (addr.formatted_address) {
        setQuery(addr.formatted_address);
        setSelectedAddress(addr.formatted_address);
      }

    } catch (err) {
      console.error('Place details error:', err);
      setError('No se pudieron cargar los detalles. Completa los campos manualmente.');
    } finally {
      setIsLoading(false);
    }
  };

  /** Rellenar los inputs del formulario existente */
  const fillFormFields = (addr: ParsedAddress) => {
    const setField = (fieldId: string | undefined, value: string) => {
      if (!fieldId || !value) return;
      const el = document.getElementById(fieldId) as HTMLInputElement | HTMLSelectElement | null;
      if (!el) return;

      el.value = value;
      // Disparar evento para que otros listeners (React, validación) se enteren
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));

      // Feedback visual: highlight brevemente el campo rellenado
      el.classList.add('ring-2', 'ring-green-400', 'bg-green-50');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-green-400', 'bg-green-50');
      }, 1500);
    };

    setField(fieldIds.line1, addr.address_line1);
    setField(fieldIds.line2, addr.address_line2);
    setField(fieldIds.city, addr.city);
    setField(fieldIds.state, addr.state);
    setField(fieldIds.postalCode, addr.postal_code);

    // Para el país usamos el código ISO (es un <select>)
    if (fieldIds.country && addr.country_code) {
      const countryEl = document.getElementById(fieldIds.country) as HTMLSelectElement | null;
      if (countryEl) {
        // Verificar que la opción existe en el select
        const optionExists = Array.from(countryEl.options).some(
          (opt) => opt.value === addr.country_code
        );
        if (optionExists) {
          countryEl.value = addr.country_code;
          countryEl.dispatchEvent(new Event('change', { bubbles: true }));
          countryEl.classList.add('ring-2', 'ring-green-400', 'bg-green-50');
          setTimeout(() => {
            countryEl.classList.remove('ring-2', 'ring-green-400', 'bg-green-50');
          }, 1500);
        }
      }
    }
  };

  /** Navegación con teclado en el listbox */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, predictions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < predictions.length) {
          selectPrediction(predictions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Scroll activo al item seleccionado
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const item = listboxRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const inputBaseClass =
    'w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow bg-gray-50 focus:bg-white';

  return (
    <div ref={wrapperRef} className="relative">
      <label
        htmlFor={id}
        className={labelClassName}
      >
        {label}
        {sublabel && <span className="text-gray-400 font-normal ml-1">{sublabel}</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={
            activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
          }
          className={`${inputBaseClass} pr-10 ${className}`}
        />

        {/* Icono de búsqueda / spinner */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <svg
              className="w-4 h-4 text-purple-500 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : selectedAddress ? (
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Mensaje de error / sin resultados */}
      {error && (
        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Dropdown de sugerencias */}
      {isOpen && predictions.length > 0 && (
        <ul
          ref={listboxRef}
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
        >
          {predictions.map((pred, idx) => (
            <li
              key={pred.placeId}
              id={`${id}-option-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                selectPrediction(pred);
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`
                flex items-start gap-2.5 px-3.5 py-2.5 cursor-pointer text-sm transition-colors
                ${idx === activeIndex ? 'bg-purple-50 text-purple-900' : 'text-gray-700 hover:bg-gray-50'}
                ${idx === 0 ? 'rounded-t-xl' : ''}
                ${idx === predictions.length - 1 ? 'rounded-b-xl' : ''}
              `}
            >
              <svg
                className="w-4 h-4 text-gray-400 mt-0.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div className="min-w-0">
                <span className="font-medium block truncate">
                  {pred.mainText}
                </span>
                {pred.secondaryText && (
                  <span className="text-xs text-gray-500 block truncate">
                    {pred.secondaryText}
                  </span>
                )}
              </div>
            </li>
          ))}
          {/* Atribución requerida por Google */}
          <li className="px-3.5 py-2 border-t border-gray-100 text-[10px] text-gray-400 text-right">
            Powered by Google
          </li>
        </ul>
      )}
    </div>
  );
}
