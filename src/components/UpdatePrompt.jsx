import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';

function UpdatePrompt() {
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


    const close = () => {
        setOfflineReady(false);
        setNeedUpdate(false);
    };

    useEffect(() => {
        // Si estamos en iOS, a veces el SW necesita un empujón extra
        // Podríamos forzar un check aquí si quisiéramos
    }, [needUpdate]);

    if (!needUpdate && !offlineReady) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="bg-black/90 backdrop-blur-xl border border-[#B8860B]/30 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-4 max-w-lg mx-auto">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#B8860B]/10 flex items-center justify-center border border-[#B8860B]/20 flex-shrink-0">
                        <svg className="w-6 h-6 text-[#B8860B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-serif text-[#B8860B] text-lg leading-tight uppercase tracking-widest">Luxessence Update</h4>
                        <p className="text-gray-400 text-sm mt-1">
                            {needUpdate
                                ? 'Una nueva versión exclusiva está lista para ti.'
                                : 'La web ya está disponible para usar sin conexión.'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    {needUpdate && (
                        <button
                            onClick={() => {
                                updateServiceWorker?.(true);
                                // Forzamos el reload después de un pequeño delay para asegurar que el SW tome el control
                                setTimeout(() => {
                                    window.location.reload();
                                }, 500);
                            }}
                            className="bg-[#B8860B] hover:bg-[#966d09] text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex-1 sm:flex-none"
                        >
                            Actualizar Ahora
                        </button>
                    )}
                    <button
                        onClick={close}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-xl text-sm transition-all flex-1 sm:flex-none"
                    >
                        {needUpdate ? 'Después' : 'Cerrar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UpdatePrompt;
