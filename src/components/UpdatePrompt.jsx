import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useRef } from 'react';
import { useUpdate } from '../context/UpdateContext';
import { APP_VERSION, UPDATE_CHANGELOG } from '../lib/version';

function UpdatePrompt() {
    const isMounted = useRef(true);
    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);
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
            if (r && isMounted.current) {
                if (typeof setRegistration === 'function') setRegistration(r);
                r.update();
                const interval = setInterval(() => {
                    if (isMounted.current) r.update();
                }, 15 * 60 * 1000);

                const handleVisibility = () => {
                    if (document.visibilityState === 'visible' && isMounted.current) r.update();
                };
                document.addEventListener('visibilitychange', handleVisibility);

                return () => {
                    clearInterval(interval);
                    document.removeEventListener('visibilitychange', handleVisibility);
                };
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
        if (needUpdate && isMounted.current) {
            if (typeof setUpdateAvailable === 'function') setUpdateAvailable(true);
        }
    }, [needUpdate, setUpdateAvailable]);

    const close = () => {
        setIsDismissed(true);
        setShowModal(false);
        if (setOfflineReady) setOfflineReady(false);
        if (setNeedUpdate) setNeedUpdate(false);
    };

    const doUpdate = () => {
        if (updateServiceWorker) updateServiceWorker(true);
        if (registration?.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        if (registration?.installing) registration.installing.postMessage({ type: 'SKIP_WAITING' });
        setTimeout(() => window.location.reload(), 500);
    };

    const shouldShow = (needUpdate && !isDismissed) || showModal || (updateAvailable && !isDismissed);
    const isUpdate = needUpdate || updateAvailable;

    if (!shouldShow) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5">
            {/* iOS-style blurred backdrop */}
            <div
                className="absolute inset-0 animate-in fade-in duration-500"
                style={{
                    backdropFilter: 'blur(24px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                    background: 'rgba(20, 4, 10, 0.55)',
                }}
                onClick={close}
            />

            {/* Modal card */}
            <div
                className="relative w-full max-w-[340px] animate-in zoom-in-95 fade-in duration-400 overflow-hidden"
                style={{
                    borderRadius: '2.25rem',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 60%, rgba(113,17,22,0.10) 100%)',
                    backdropFilter: 'blur(40px) saturate(2)',
                    WebkitBackdropFilter: 'blur(40px) saturate(2)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    boxShadow: '0 8px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.1)',
                }}
            >
                {/* Top shimmer highlight — iOS glass rim */}
                <div
                    className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}
                />

                {/* Ambient blobs */}
                <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(113,17,22,0.35) 0%, transparent 70%)', filter: 'blur(24px)' }} />
                <div className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', filter: 'blur(20px)' }} />

                <div className="relative z-10 px-7 pt-8 pb-7 flex flex-col items-center text-center">

                    {/* Icon */}
                    <div
                        className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center mb-5"
                        style={{
                            background: 'linear-gradient(145deg, rgba(113,17,22,0.70), rgba(80,10,30,0.85))',
                            boxShadow: '0 4px 24px rgba(113,17,22,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
                            border: '1px solid rgba(255,255,255,0.12)',
                        }}
                    >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h4 className="text-white text-xl font-bold tracking-tight mb-1">
                        {isUpdate ? 'Nueva Actualización' : 'Lista sin conexión'}
                    </h4>

                    {/* Version pill */}
                    <div
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
                        style={{
                            background: 'rgba(255,255,255,0.10)',
                            border: '1px solid rgba(255,255,255,0.14)',
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/70">
                            v{APP_VERSION}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-white/60 text-[13px] mb-5 leading-relaxed font-medium">
                        {isUpdate
                            ? 'Actualizaciones disponibles para mejorar tu experiencia Luxessence.'
                            : 'La aplicación está lista para usarla sin conexión a internet.'}
                    </p>

                    {/* Changelog */}
                    {isUpdate && UPDATE_CHANGELOG && UPDATE_CHANGELOG.length > 0 && (() => {
                        const userItems = UPDATE_CHANGELOG.filter(l => l.type !== 'system');
                        const hasSystem = UPDATE_CHANGELOG.some(l => l.type === 'system');

                        const iconFor = (type) => {
                            if (type === 'new') return (
                                <svg className="w-3 h-3 shrink-0 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                            );
                            if (type === 'fix') return (
                                <svg className="w-3 h-3 shrink-0 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            );
                            // improve
                            return (
                                <svg className="w-3 h-3 shrink-0 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            );
                        };

                        return (
                            <div
                                className="w-full text-left rounded-2xl p-4 mb-6 max-h-[150px] overflow-y-auto"
                                style={{ background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-white/30 mb-2.5">Novedades</p>
                                <ul className="space-y-2.5">
                                    {userItems.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2.5 leading-snug">
                                            <span className="mt-0.5">{iconFor(item.type)}</span>
                                            <span className="text-white/60 text-[11px]">{item.text}</span>
                                        </li>
                                    ))}
                                    {hasSystem && (
                                        <li className="flex items-start gap-2.5 leading-snug">
                                            <svg className="w-3 h-3 shrink-0 text-white/40 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" />
                                            </svg>
                                            <span className="text-white/40 text-[11px]">Mejoras de estabilidad y rendimiento</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        );
                    })()}

                    {/* Divider */}
                    <div className="w-full h-px mb-5" style={{ background: 'rgba(255,255,255,0.08)' }} />

                    {/* Actions */}
                    <div className="flex flex-col gap-2.5 w-full">
                        {isUpdate ? (
                            <>
                                <button
                                    onClick={doUpdate}
                                    className="relative overflow-hidden w-full py-3.5 rounded-[1.1rem] text-sm font-bold text-white transition-all active:scale-[0.97]"
                                    style={{
                                        background: 'linear-gradient(145deg, rgba(113,17,22,0.95), rgba(80,10,30,1))',
                                        boxShadow: '0 4px 20px rgba(113,17,22,0.5), inset 0 1px 0 rgba(255,255,255,0.20)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                    }}
                                >
                                    Actualizar ahora
                                </button>
                                <button
                                    onClick={close}
                                    className="w-full py-3.5 rounded-[1.1rem] text-sm font-medium text-white/60 transition-all active:scale-[0.97] hover:text-white/80"
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.09)',
                                    }}
                                >
                                    Recordarme después
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={close}
                                className="w-full py-3.5 rounded-[1.1rem] text-sm font-medium text-white/70 transition-all active:scale-[0.97] hover:text-white"
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                }}
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
