import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Grid, Users, Send, User } from 'lucide-react';
import GlassSurface from './GlassSurface';
import { useUpdate } from '../context/UpdateContext';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { updateAvailable, isDismissed, setIsDismissed, setShowModal } = useUpdate();
    const [isAuthOpen, setIsAuthOpen] = useState(document.body.classList.contains('auth-open'));
    const [isOverDark, setIsOverDark] = useState(false);

    useEffect(() => {
        const handleAuthChange = (e) => setIsAuthOpen(e.detail.open);
        window.addEventListener('auth-modal-change', handleAuthChange);
        setIsAuthOpen(document.body.classList.contains('auth-open'));

        const checkFooterOverlap = () => {
            if (window.innerWidth >= 768) return;
            const navElement = document.getElementById('bottom-nav-container');
            const footerElement = document.getElementById('site-footer');
            if (!navElement || !footerElement) return;

            const navRect = navElement.getBoundingClientRect();
            const footerRect = footerElement.getBoundingClientRect();

            const isOverlapping = navRect.bottom > footerRect.top && navRect.top < footerRect.bottom;
            setIsOverDark(isOverlapping);
        };

        window.addEventListener('scroll', checkFooterOverlap);
        window.addEventListener('resize', checkFooterOverlap);
        const timeout = setTimeout(checkFooterOverlap, 300);

        return () => {
            window.removeEventListener('auth-modal-change', handleAuthChange);
            window.removeEventListener('scroll', checkFooterOverlap);
            window.removeEventListener('resize', checkFooterOverlap);
            clearTimeout(timeout);
        };
    }, [location.pathname]);

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

    const navColor = isOverDark ? 'text-white' : 'text-primary';
    const navMuteColor = isOverDark ? 'text-white/40' : 'text-primary/30';
    const navActiveBg = isOverDark ? 'bg-white/10' : 'bg-primary/5';

    return (
        <div id="bottom-nav-container" className="md:hidden fixed bottom-10 left-0 right-0 z-[200] flex justify-center px-4 pointer-events-none transition-transform duration-500">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pointer-events-auto"
            >
                <GlassSurface
                    borderRadius={48}
                    height={86}
                    width="auto"
                    className={`px-4 shadow-[0_30px_70px_-20px_rgba(0,0,0, ${isOverDark ? '0.5' : '0.25'})] border-white/50 transition-all duration-700`}
                    backgroundOpacity={isOverDark ? 0.08 : 0.12}
                    brightness={isOverDark ? 45 : 90}
                    blur={45}
                    saturation={isOverDark ? 1.2 : 2.8}
                    borderWidth={0.01}
                    displace={6}
                    distortionScale={-220}
                    mixBlendMode={isOverDark ? 'screen' : 'plus-lighter'}
                >
                    <div className="flex items-center h-full gap-2 relative">
                        {/* Dynamic Liquid Highlight */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                            <div className={`absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-gradient-to-br transition-opacity duration-1000 ${isOverDark ? 'from-white/0 via-transparent to-white/5 opacity-50' : 'from-gold/5 via-transparent to-white/10 opacity-100'} animate-[spin_10s_linear_infinite]`} />
                        </div>
                        {tabs.map((tab) => {
                            const isActive = location.pathname === tab.path;

                            if (tab.isCenter) {
                                return (
                                    <div key={tab.id} className="relative group">
                                        <button
                                            onClick={() => navigate(tab.path)}
                                            className="relative flex flex-col items-center justify-center mx-1 z-20"
                                        >
                                            <motion.div
                                                animate={{
                                                    scale: isActive ? 1.15 : 1,
                                                    y: isActive ? -4 : 0
                                                }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                                className={`w-15 h-15 rounded-full flex items-center justify-center transition-all duration-700 shadow-xl ${isActive
                                                    ? (isOverDark ? 'bg-white text-primary shadow-[0_15px_30px_rgba(255,255,255,0.2)]' : 'bg-primary text-secondary shadow-[0_15px_30px_rgba(113,17,22,0.4)]')
                                                    : (isOverDark ? 'bg-white/5 text-white border border-white/10' : 'bg-primary/5 text-primary border border-primary/5')
                                                    }`}
                                            >
                                                <tab.icon className={`w-7 h-7 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                                            </motion.div>
                                            <motion.span
                                                animate={{
                                                    opacity: isActive ? 1 : 0.6,
                                                    scale: isActive ? 1.05 : 0.9
                                                }}
                                                className={`text-[8px] font-black uppercase tracking-widest mt-1.5 transition-colors duration-700 ${navColor}`}
                                            >
                                                {tab.label}
                                            </motion.span>
                                        </button>

                                        {/* Update Indicator in Nav */}
                                        {updateAvailable && isDismissed && tab.id === 'profile' && (
                                            <motion.button
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                whileHover={{ scale: 1.1 }}
                                                onClick={() => {
                                                    setIsDismissed(false);
                                                    setShowModal(true);
                                                }}
                                                className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center z-[30] shadow-lg border-2 border-white animate-bounce"
                                            >
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                </motion.div>
                                            </motion.button>
                                        )}
                                    </div>
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
                                            className={`absolute inset-x-1 inset-y-2.5 rounded-[2rem] -z-10 transition-colors duration-700 ${navActiveBg}`}
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}

                                    <div className={`p-2 transition-all duration-700 ${isActive ? navColor : `${navMuteColor} group-hover:${navColor}`}`}>
                                        <tab.icon className={`w-5.5 h-5.5 stroke-[1.5px] transition-transform duration-500 ${isActive ? 'scale-110' : ''}`} />
                                    </div>

                                    <motion.span
                                        animate={{
                                            opacity: isActive ? 1 : 0.5,
                                            y: isActive ? 0 : 2
                                        }}
                                        className={`text-[8px] font-extrabold uppercase tracking-tighter transition-colors duration-700 ${isActive ? navColor : navMuteColor}`}
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
