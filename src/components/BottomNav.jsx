import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Grid, ShoppingBag, Send } from 'lucide-react';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'home', path: '/', icon: Home, label: 'Inicio' },
        { id: 'catalog', path: '/catalog', icon: Grid, label: 'Catálogo' },
        { id: 'cart', path: '/cart', icon: ShoppingBag, label: 'Carrito' },
        { id: 'contact', path: '/contact', icon: Send, label: 'Contacto' },
    ];

    if (
        location.pathname === '/cart' ||
        location.pathname.startsWith('/admin') ||
        location.pathname === '/reset-password' ||
        document.body.classList.contains('auth-open')
    ) return null;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[200] px-6 pb-6 mt-auto pointer-events-none bottom-nav-container">
            <div className="glass-panel rounded-full px-4 py-3 flex justify-around items-center pointer-events-auto shadow-2xl border-primary/10">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className="relative flex flex-col items-center gap-1 group"
                        >
                            <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary text-secondary-light scale-110' : 'text-primary/40 hover:text-primary'
                                }`}>
                                <tab.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${isActive ? 'text-primary' : 'text-luxury-black/30'
                                }`}>
                                {tab.label}
                            </span>

                            {isActive && (
                                <motion.div
                                    layoutId="bottom-glow"
                                    className="absolute -bottom-1 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(113,17,22,0.3)]"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
