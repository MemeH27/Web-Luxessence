import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useRef } from 'react';
import { useUpdate } from '../context/UpdateContext';
import { APP_VERSION, UPDATE_CHANGELOG } from '../lib/version';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Zap, Bug, Server, Rocket, ChevronRight, X } from 'lucide-react';

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

    const shouldShow = (needUpdate && !isDismissed) || showModal || (updateAvailable && !isDismissed);
    const isUpdate = needUpdate || updateAvailable;

    useEffect(() => {
        if (shouldShow && isUpdate) {
            setTimeout(() => {
                confetti({
                    particleCount: 120,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#711116', '#E5C158', '#FFFFFF']
                });
            }, 300);
        }
    }, [shouldShow, isUpdate]);

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

    if (!shouldShow) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#14040A]/60 backdrop-blur-[20px]"
                    onClick={close}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
                    className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-[0_30px_60px_-15px_rgba(113,17,22,0.3)] border border-primary/10"
                >
                    {/* Header Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3" />

                    <div className="relative z-10">
                        {/* Status Bar */}
                        <div className="w-full bg-gradient-to-r from-primary to-primary-light h-2" />
                        
                        <div className="p-8 sm:p-10 flex flex-col items-center">
                            {/* Close Button */}
                            <button 
                                onClick={close}
                                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-primary/5 text-primary/40 hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Icon Animation */}
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-light opacity-10 rounded-3xl blur-xl" />
                                <div className="relative w-20 h-20 bg-gradient-to-tr from-primary to-primary-light rounded-[1.5rem] flex items-center justify-center shadow-xl border border-white/20 text-white">
                                    <Rocket className="w-10 h-10" />
                                </div>
                            </motion.div>

                            {/* Title & Version */}
                            <div className="text-center mb-8 space-y-3">
                                <h2 className="text-3xl font-serif font-bold italic text-primary leading-none">
                                    {isUpdate ? 'Nueva Versión' : 'Lista sin conexión'}
                                </h2>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[11px] uppercase tracking-widest font-black text-primary/80">
                                        Versión {APP_VERSION}
                                    </span>
                                </div>
                                <p className="text-sm text-primary/60 font-medium px-4 pt-2 leading-relaxed">
                                    {isUpdate 
                                        ? 'Hemos preparado mejoras increíbles para tu experiencia en Luxessence.'
                                        : 'La aplicación ha sido cacheada completamente para uso off-line.'}
                                </p>
                            </div>

                            {/* Changelog */}
                            {isUpdate && UPDATE_CHANGELOG && UPDATE_CHANGELOG.length > 0 && (
                                <div className="w-full text-left space-y-4 mb-8 bg-primary/[0.03] rounded-3xl p-6 border border-primary/[0.05]">
                                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/40 italic flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5" /> Novedades
                                    </p>
                                    <ul className="space-y-4">
                                        {UPDATE_CHANGELOG.map((item, i) => (
                                            <motion.li 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                key={i} 
                                                className="flex items-start gap-3"
                                            >
                                                <div className="mt-1 shrink-0 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm border border-primary/10">
                                                    {item.type === 'new' ? <Sparkles className="w-2.5 h-2.5 text-amber-500" /> :
                                                     item.type === 'fix' ? <Bug className="w-2.5 h-2.5 text-emerald-500" /> :
                                                     item.type === 'improve' ? <Zap className="w-2.5 h-2.5 text-blue-500" /> :
                                                     <Server className="w-2.5 h-2.5 text-slate-500" />}
                                                </div>
                                                <span className="text-sm font-medium text-primary/80 leading-snug">{item.text}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-3 w-full">
                                {isUpdate ? (
                                    <>
                                        <button
                                            onClick={doUpdate}
                                            className="group relative overflow-hidden w-full py-4 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_15px_30px_-5px_rgba(113,17,22,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(113,17,22,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                                            <span className="relative z-10">Instalar Actualización</span>
                                            <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={close}
                                            className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                                        >
                                            En otro momento
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={close}
                                        className="w-full py-4 rounded-2xl border border-primary/10 text-[11px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all active:scale-[0.98]"
                                    >
                                        Excelente
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default UpdatePrompt;
