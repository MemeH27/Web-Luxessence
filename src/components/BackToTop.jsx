import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BackToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    onClick={scrollToTop}
                    className="fixed bottom-32 right-6 z-40 p-4 bg-primary/20 text-primary rounded-full shadow-2xl border border-primary/10 lg:hidden hover:scale-110 active:scale-95 transition-all group overflow-hidden"
                    style={{ 
                        boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)'
                    }}
                    aria-label="Volver al inicio"
                >
                    {/* Inner Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                    
                    <div className="relative">
                        <ChevronUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform duration-300 stroke-[2.5px]" />
                        <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                    </div>
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default BackToTop;
