import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { useUpdate } from '../context/UpdateContext';

function UpdatePrompt() {
    const {
        setUpdateAvailable,
        isDismissed,
        setIsDismissed,
        showModal,
        setShowModal
    } = useUpdate();

    const res = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered');
            if (r) {
                setInterval(() => {
                    r.update();
                }, 15 * 60 * 1000);
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
    const shouldShow = (needUpdate && !isDismissed) || showModal;

    if (!shouldShow) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="bg-black/90 backdrop-blur-xl border border-[#B8860B]/30 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-4 max-w-lg mx-auto text-white">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#B8860B]/10 flex items-center justify-center border border-[#B8860B]/20 flex-shrink-0">
                        <svg className="w-6 h-6 text-[#B8860B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-serif text-[#B8860B] text-2xl leading-tight font-bold">
                            Luxessence update
                        </h4>
                        <p className="text-gray-400 text-sm mt-1">
                            {needUpdate
                                ? 'Una nueva versión exclusiva está lista para ti.'
                                : 'La web ya está disponible para usar sin conexión.'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    {needUpdate ? (
                        <>
                            <button
                                onClick={() => {
                                    updateServiceWorker?.(true);
                                    setTimeout(() => {
                                        window.location.reload();
                                    }, 500);
                                }}
                                className="bg-[#B8860B] hover:bg-[#966d09] text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex-1 sm:flex-none whitespace-nowrap"
                            >
                                Actualizar ahora
                            </button>
                            <button
                                onClick={close}
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-xl text-sm transition-all flex-1 sm:flex-none"
                            >
                                Después
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={close}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-xl text-sm transition-all flex-1 sm:flex-none w-full sm:w-auto"
                        >
                            Entendido
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UpdatePrompt;
