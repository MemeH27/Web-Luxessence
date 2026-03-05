import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { useUpdate } from '../context/UpdateContext';
import { APP_VERSION, UPDATE_CHANGELOG } from '../lib/version';

function UpdatePrompt() {
    const {
        updateAvailable,
        setUpdateAvailable,
        isDismissed,
        setIsDismissed,
        showModal,
        setShowModal,
        registration,
        setRegistration
    } = useUpdate();

    const res = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered');
            if (r) {
                setRegistration(r);
                // Check for updates immediately
                r.update();

                // Then check every 15 minutes
                setInterval(() => {
                    r.update();
                }, 15 * 60 * 1000);

                // Check for update when the page is visible again (e.g. after backgrounding)
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        r.update();
                    }
                });
            }
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    const {
        offlineReady: [offlineReady, setOfflineReady] = [false, () => { }],
        needUpdate: [needUpdate, setNeedUpdate] = [false, () => { }],
        updateServiceWorker,
    } = res || {};

    useEffect(() => {
        if (needUpdate) {
            setUpdateAvailable(true);
        }
    }, [needUpdate, setUpdateAvailable]);

    const close = () => {
        setIsDismissed(true);
        setShowModal(false);
        if (setOfflineReady) setOfflineReady(false);
        if (setNeedUpdate) setNeedUpdate(false);
    };

    // Solo mostramos si hay una actualización real pendiente (y no ha sido descartada)
    // o si el usuario abrió el modal manualmente desde el botón de la barra de navegación.
    const shouldShow = (needUpdate && !isDismissed) || showModal || (updateAvailable && !isDismissed);
    const isUpdate = needUpdate || updateAvailable;

    if (!shouldShow) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-500" onClick={close} />
            <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-[20px] animate-in zoom-in-95 duration-500">
                {/* Reflejos de cristal líquidos */}
                <div className="absolute -top-24 -left-20 w-48 h-48 bg-[#B8860B]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-20 w-48 h-48 bg-[#B8860B]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                <div className="relative z-10 p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B8860B]/20 to-[#B8860B]/5 flex items-center justify-center border border-[#B8860B]/30 mb-6 shadow-[0_0_15px_rgba(184,134,11,0.2)]">
                        <svg className="w-8 h-8 text-[#B8860B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>

                    <h4 className="font-serif text-[#B8860B] text-2xl leading-tight font-bold mb-2 drop-shadow-md">
                        {isUpdate ? 'Nueva Actualización' : 'Luxessence HQ'}
                    </h4>

                    <div className="inline-block px-3 py-1 bg-white/10 border border-white/10 rounded-full mb-4">
                        <span className="text-[10px] uppercase tracking-widest font-black text-white/80">Versión {APP_VERSION}</span>
                    </div>

                    <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                        {isUpdate
                            ? 'Experimenta mejoras exclusivas y nuevas funciones añadidas a tu PWA.'
                            : 'La web ya está optimizada y lista para usar sin conexión.'}
                    </p>

                    {isUpdate && UPDATE_CHANGELOG && (
                        <div className="w-full text-left bg-black/20 rounded-2xl p-4 mb-8 border border-white/5 shadow-inner max-h-[160px] overflow-y-auto custom-scrollbar">
                            <ul className="space-y-3">
                                {UPDATE_CHANGELOG.map((log, i) => (
                                    <li key={i} className="text-white/70 text-xs flex items-start leading-snug">
                                        <span className="shrink-0 mr-2 text-[#B8860B]">•</span>
                                        {log}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 w-full mt-auto">
                        {isUpdate ? (
                            <>
                                <button
                                    onClick={() => {
                                        if (updateServiceWorker) {
                                            updateServiceWorker(true);
                                        }
                                        if (registration?.waiting) {
                                            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                                        }
                                        if (registration?.installing) {
                                            registration.installing.postMessage({ type: 'SKIP_WAITING' });
                                        }
                                        setTimeout(() => {
                                            window.location.reload();
                                        }, 500);
                                    }}
                                    className="relative group overflow-hidden w-full bg-[#B8860B] hover:bg-[#966d09] text-black py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-[0_5px_15px_rgba(184,134,11,0.3)]"
                                >
                                    <span className="relative z-10">Actualizar ahora</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                </button>
                                <button
                                    onClick={close}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3.5 rounded-xl text-sm transition-all"
                                >
                                    Recordarme después
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={close}
                                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3.5 rounded-xl text-sm transition-all font-medium"
                            >
                                Entendido
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UpdatePrompt;
