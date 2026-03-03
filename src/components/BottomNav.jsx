import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Grid, Users, Send, User } from 'lucide-react';
import GlassSurface from './GlassSurface';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAuthOpen, setIsAuthOpen] = useState(document.body.classList.contains('auth-open'));

    useEffect(() => {
        const handleAuthChange = (e) => setIsAuthOpen(e.detail.open);
        window.addEventListener('auth-modal-change', handleAuthChange);

        // Also check on mount in case it was already open
        setIsAuthOpen(document.body.classList.contains('auth-open'));

        return () => window.removeEventListener('auth-modal-change', handleAuthChange);
    }, []);

    const tabs = [
        { id: 'home', path: '/', icon: Home, label: 'Inicio' },
        { id: 'catalog', path: '/catalog', icon: Grid, label: 'Tienda' },
        { id: 'profile', path: '/profile', icon: User, label: 'Mi Perfil', isCenter: true },
        { id: 'about', path: '/about', icon: Users, label: 'Nosotros' },
        { id: 'contact', path: '/contact', icon: Send, label: 'Contacto' },
    ];

    if (
        location.pathname === '/cart' ||
        location.pathname.startsWith('/admin') ||
        location.pathname === '/reset-password' ||
        isAuthOpen
    ) return null;

    return (
        <div className="md:hidden fixed bottom-10 left-0 right-0 z-[200] flex justify-center px-4 pointer-events-none">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pointer-events-auto"
            >
                <GlassSurface
                    borderRadius={44}
                    height={80}
                    width="auto"
                    className="px-2 shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                    backgroundOpacity={0.25}
                    blur={30}
                    saturation={1.8}
                    borderWidth={0.02}
                >
                    <div className="flex items-center h-full gap-1">
                        {tabs.map((tab) => {
                            const isActive = location.pathname === tab.path;

                            if (tab.isCenter) {
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => navigate(tab.path)}
                                        className="relative flex flex-col items-center justify-center mx-1 z-20"
                                    >
                                        <motion.div
                                            animate={{
                                                scale: isActive ? 1.15 : 1,
                                                y: isActive ? -4 : 0
                                            }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            className={`w-15 h-15 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${isActive
                                                ? 'bg-primary text-secondary shadow-[0_15px_30px_rgba(113,17,22,0.4)]'
                                                : 'bg-primary/5 text-primary border border-primary/5'
                                                }`}
                                        >
                                            <tab.icon className={`w-7 h-7 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                                        </motion.div>
                                        <motion.span
                                            animate={{
                                                opacity: isActive ? 1 : 0.6,
                                                scale: isActive ? 1.05 : 0.9
                                            }}
                                            className={`text-[8px] font-black uppercase tracking-widest mt-1.5 ${isActive ? 'text-primary' : 'text-primary'
                                                }`}
                                        >
                                            {tab.label}
                                        </motion.span>
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => navigate(tab.path)}
                                    className="relative w-15 h-full flex flex-col items-center justify-center group flex-1"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-bg"
                                            className="absolute inset-x-1 inset-y-2.5 bg-primary/5 rounded-[2rem] -z-10"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}

                                    <div className={`p-2 transition-all duration-300 ${isActive ? 'text-primary' : 'text-primary/30 group-hover:text-primary/60'
                                        }`}>
                                        <tab.icon className={`w-5.5 h-5.5 stroke-[1.5px] transition-transform duration-500 ${isActive ? 'scale-110' : ''}`} />
                                    </div>

                                    <motion.span
                                        animate={{
                                            opacity: isActive ? 1 : 0.5,
                                            y: isActive ? 0 : 2
                                        }}
                                        className={`text-[8px] font-extrabold uppercase tracking-tighter transition-all ${isActive ? 'text-primary' : 'text-primary/40'
                                            }`}
                                    >
                                        {tab.label}
                                    </motion.span>
                                </button>
                            );
                        })}
                    </div>
                </GlassSurface>
            </motion.div>
        </div>
    );
};

export default BottomNav;
