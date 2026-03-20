import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, PlusSquare, X, Smartphone, Globe } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [platform, setPlatform] = useState('other'); // ios, android, other

    useEffect(() => {
        // 1. Detect platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        
        if (isIos) setPlatform('ios');
        else if (isAndroid) setPlatform('android');

        // 2. Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        
        if (isStandalone) return;

        // 3. Show after a short delay to ensure user is seated
        const timer = setTimeout(() => {
            const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');
            // We show it if not dismissed OR if it's been a while (optional)
            if (!hasDismissed) {
                setIsVisible(true);
            }
        }, 3000); // 3 seconds delay for a better first impression

        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-24 left-4 right-4 z-[9999] md:left-auto md:right-8 md:w-96"
                >
                    <div className="glass-panel p-6 rounded-[2.5rem] bg-white shadow-[0_20px_50px_rgba(113,17,22,0.2)] border border-primary/10 relative overflow-hidden group">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-all duration-700" />
                        
                        <button 
                            onClick={dismiss}
                            className="absolute top-4 right-4 p-2 text-primary/20 hover:text-primary transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex gap-4 items-start relative z-10">
                            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                                <Smartphone className="w-7 h-7 text-white" />
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-serif font-black italic text-primary leading-tight">Instala Luxessence</h3>
                                    <p className="text-[10px] text-primary/50 font-black uppercase tracking-widest leading-relaxed">
                                        Acceso directo y mejor experiencia desde tu pantalla de inicio
                                    </p>
                                </div>

                                <div className="p-4 bg-primary/5 rounded-2xl space-y-3">
                                    <p className="text-[11px] font-bold text-primary/70 italic uppercase tracking-wider">Instrucciones:</p>
                                    
                                    {platform === 'ios' ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-[11px] font-black text-primary uppercase tracking-tighter">
                                                <span className="w-5 h-5 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">1</span>
                                                <span>Pulsa el botón de <Share className="w-3.5 h-3.5 inline mx-1 text-blue-500" /> "Compartir"</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] font-black text-primary uppercase tracking-tighter">
                                                <span className="w-5 h-5 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">2</span>
                                                <span>Selecciona <PlusSquare className="w-3.5 h-3.5 inline mx-1" /> "Añadir a pantalla de inicio"</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-[11px] font-black text-primary uppercase tracking-tighter">
                                                <span className="w-5 h-5 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">1</span>
                                                <span>Toca los tres puntos <Globe className="w-3.5 h-3.5 inline mx-1" /> arriba</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] font-black text-primary uppercase tracking-tighter">
                                                <span className="w-5 h-5 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">2</span>
                                                <span>Pulsa "Instalar aplicación"</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={dismiss}
                                    className="w-full py-3 bg-primary text-secondary-light rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-black transition-all active:scale-95"
                                >
                                    Entendido, gracias
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
