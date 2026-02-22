import { useState, useEffect, useRef, useCallback } from 'react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface Props {
  'client:load'?: boolean;
  'client:idle'?: boolean;
  'client:visible'?: boolean;
  'client:only'?: string;
}

export default function CookieBanner(_props: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Siempre activadas
    analytics: false,
    marketing: false,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeBanner = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 300);
  }, []);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie-consent');
      if (!consent) {
        timerRef.current = setTimeout(() => setIsVisible(true), 1000);
      }
    } catch {
      // localStorage not available
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const acceptAll = useCallback(() => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    try {
      localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
      localStorage.setItem('cookie-consent-date', new Date().toISOString());
    } catch { /* localStorage not available */ }
    closeBanner();
    loadAnalytics();
  }, [closeBanner]);

  const rejectAll = useCallback(() => {
    const onlyNecessary = { necessary: true, analytics: false, marketing: false };
    try {
      localStorage.setItem('cookie-consent', JSON.stringify(onlyNecessary));
      localStorage.setItem('cookie-consent-date', new Date().toISOString());
    } catch { /* localStorage not available */ }
    closeBanner();
  }, [closeBanner]);

  const savePreferences = useCallback(() => {
    try {
      localStorage.setItem('cookie-consent', JSON.stringify(preferences));
      localStorage.setItem('cookie-consent-date', new Date().toISOString());
    } catch { /* localStorage not available */ }
    closeBanner();
    if (preferences.analytics) loadAnalytics();
  }, [preferences, closeBanner]);

  const loadAnalytics = () => {
    // Aquí cargarías Google Analytics u otros scripts de analítica
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} 
        onClick={rejectAll}
        aria-hidden="true"
      />
      
      {/* Banner */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[70] p-4 transition-all duration-300 ${isClosing ? 'translate-y-full opacity-0' : 'animate-fade-in-up'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Preferencias de cookies"
      >
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          {!showSettings ? (
            // Vista principal
            <div className="p-6">
              <div className="flex items-start gap-4">
                <svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M21.598 11.064a1.006 1.006 0 0 0-.854-.172A2.938 2.938 0 0 1 20 11c-1.654 0-3-1.346-3-3 0-.217.031-.444.099-.716a1.004 1.004 0 0 0-1.299-1.126A9.067 9.067 0 0 0 12 6c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9a8.93 8.93 0 0 0-.402-2.936zM12 22c-3.859 0-7-3.14-7-7s3.141-7 7-7a7.007 7.007 0 0 1 2.762.568c-.022.086-.042.172-.058.258A4.996 4.996 0 0 0 20 13a4.96 4.96 0 0 0 1.408-.202A7.012 7.012 0 0 1 12 22z"/><circle cx="8.5" cy="14.5" r="1.5"/><circle cx="10.5" cy="10.5" r="1.5"/><circle cx="15" cy="15" r="1.5"/></svg>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Tu privacidad es importante
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Utilizamos cookies para mejorar tu experiencia, personalizar contenido y analizar nuestro tráfico. 
                    Puedes aceptar todas, rechazarlas o configurar tus preferencias.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={acceptAll}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Aceptar todas
                    </button>
                    <button
                      onClick={rejectAll}
                      className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Solo necesarias
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                    >
                      Configurar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Al hacer clic en "Aceptar todas", aceptas el almacenamiento de cookies en tu dispositivo. 
                    <a href="/legal/cookies" className="text-purple-600 hover:underline ml-1">Más información</a>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Vista de configuración
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-gray-900">Configurar cookies</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Necesarias */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Cookies necesarias</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Esenciales para el funcionamiento del sitio web. No se pueden desactivar.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="w-5 h-5 rounded text-purple-600"
                    />
                  </div>
                </div>

                {/* Analíticas */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Cookies analíticas</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Nos ayudan a entender cómo usas el sitio web para mejorarlo.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Marketing */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Cookies de marketing</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Permiten mostrarte anuncios relevantes en otras plataformas.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={savePreferences}
                  className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Guardar preferencias
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Aceptar todas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
