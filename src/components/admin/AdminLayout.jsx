import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, History, LogOut, Sparkles, ChevronLeft, ChevronRight, Menu, X, Percent, Store, Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import NewSaleModal from './NewSaleModal';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_WARNING_THRESHOLD = 5 * 60 * 1000; // Show warning at 5 minutes before expiry

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [sessionTimeLeft, setSessionTimeLeft] = useState(null);
    const [showSessionWarning, setShowSessionWarning] = useState(false);
    const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
    const [isSaleButtonExpanded, setIsSaleButtonExpanded] = useState(false);

    // Session timeout management
    const resetSessionTimer = useCallback(() => {
        const lastActivity = Date.now();
        localStorage.setItem('lux_last_activity', lastActivity.toString());
        setShowSessionWarning(false);
        setSessionTimeLeft(null);
    }, []);

    useEffect(() => {
        const checkSession = () => {
            const lastActivity = localStorage.getItem('lux_last_activity');
            if (!lastActivity) {
                resetSessionTimer();
                return;
            }

            const elapsed = Date.now() - parseInt(lastActivity);
            const remaining = SESSION_TIMEOUT - elapsed;

            if (remaining <= 0) {
                // Session expired
                handleLogout();
            } else if (remaining <= SESSION_WARNING_THRESHOLD) { // Show warning before expiry
                setShowSessionWarning(true);
                setSessionTimeLeft(Math.ceil(remaining / 60000));
            }
        };

        // Check session every minute
        const interval = setInterval(checkSession, 60000);

        // Reset on user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, resetSessionTimer);
        });

        resetSessionTimer();

        return () => {
            clearInterval(interval);
            events.forEach(event => {
                document.removeEventListener(event, resetSessionTimer);
            });
        };
    }, [resetSessionTimer]);

    const handleLogout = async () => {
        localStorage.removeItem('lux_auth');
        localStorage.removeItem('lux_last_activity');
        localStorage.removeItem('lux_login_attempts');
        localStorage.removeItem('lux_login_locked_until');

        // Sign out from Supabase
        await supabase.auth.signOut();

        navigate('/');
    };

    const menuItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Pedidos', path: '/admin/orders', icon: ShoppingCart },
        { name: 'Inventario', path: '/admin/inventory', icon: Package },
        { name: 'Ventas', path: '/admin/sales', icon: History },
        { name: 'Clientes', path: '/admin/customers', icon: Users },
        { name: 'Destacados', path: '/admin/featured', icon: Sparkles },
        { name: 'Promociones', path: '/admin/promotions', icon: Percent },
    ];

    return (
        <div className="min-h-screen bg-secondary-light flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="w-80 bg-primary p-12 flex flex-col hidden lg:flex sticky top-0 h-screen shadow-[10px_0_50px_rgba(0,0,0,0.2)] overflow-y-auto no-scrollbar border-r border-white/5 relative z-50">
                {/* Subtle Ambient Glow */}
                <div className="absolute top-0 left-0 w-full h-40 bg-secondary/5 blur-[100px] pointer-events-none" />

                <div className="flex items-center justify-between mb-24 relative z-10">
                    <Link to="/" className="flex items-center gap-4 group">
                        <div className="relative">
                            <img src="/img/logo.svg" className="w-14 h-14 transition-all duration-700 group-hover:rotate-[360deg] group-hover:scale-110" />
                            <div className="absolute inset-0 bg-secondary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h2 className="text-4xl font-serif font-black italic text-secondary-light leading-[0.8] tracking-tighter">
                            Lux<br /><span className="text-xl opacity-30 italic font-medium tracking-widest pl-1 uppercase font-sans">Admin</span>
                        </h2>
                    </Link>
                </div>

                <nav className="flex-1 space-y-4 relative z-10">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-secondary-light/10 mb-6 pl-6">Navegación Oficial</p>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-5 px-8 py-5 rounded-[2.5rem] transition-all duration-500 group relative overflow-hidden ${isActive
                                    ? 'bg-secondary text-primary font-bold shadow-[0_20px_40px_rgba(212,175,55,0.15)] scale-[1.05]'
                                    : 'text-secondary-light/30 hover:text-secondary-light hover:bg-white/[0.03] border border-transparent hover:border-white/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'stroke-[2.5px]' : 'group-hover:scale-110 group-hover:rotate-6'}`} />
                                <span className="tracking-[0.2em] uppercase text-[9px] font-black italic">{item.name}</span>
                                {isActive && <motion.div layoutId="activeNav" className="absolute left-0 w-1.5 h-6 bg-primary rounded-full" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="pt-10 border-t border-white/5 mt-10 relative z-10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-5 px-8 py-5 text-secondary-light/20 hover:text-red-400 hover:bg-red-400/5 rounded-[2.5rem] transition-all group border border-transparent hover:border-red-400/10"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-black uppercase tracking-[0.2em] text-[10px] italic">Finalizar Sesión</span>
                    </button>

                    <div className="mt-8 flex items-center gap-4 px-8 opacity-10 grayscale hover:opacity-50 transition-opacity duration-700">
                        <div className="w-8 h-8 rounded-full bg-secondary-light/20 flex items-center justify-center">
                            <Store className="w-4 h-4 text-secondary-light" />
                        </div>
                        <p className="text-[7px] font-black uppercase tracking-widest text-secondary-light">Luxessence Secure Console</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 h-screen flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden flex justify-between items-center p-6 bg-primary shadow-xl shrink-0 z-50">
                    <div className="flex items-center gap-3">
                        <img src="/img/logo.svg" className="w-10 h-10" />
                        <h2 className="text-xl font-serif font-black italic text-secondary-light leading-none">Admin <span className="opacity-50">Suite</span></h2>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-4 bg-secondary-light/10 text-secondary-light rounded-2xl active:scale-90 transition-all shadow-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Session Warning Banner */}
                {showSessionWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-center gap-3 shrink-0"
                    >
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-800">
                            Tu sesión expirará en {sessionTimeLeft} minuto{sessionTimeLeft > 1 ? 's' : ''}. ¿Sigues ahí?
                        </span>
                        <button
                            onClick={resetSessionTimer}
                            className="text-xs font-bold text-amber-700 hover:text-amber-900 underline"
                        >
                            Extender sesión
                        </button>
                    </motion.div>
                )}

                <main className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar relative min-w-0">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-7xl mx-auto"
                    >
                        <Outlet />
                    </motion.div>
                </main>

                {/* Expandable New Sale Button */}
                <div
                    className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center bg-green-600 border border-green-600 border-r-0 rounded-l-3xl p-1.5 md:p-2 pr-4 shadow-[-10px_0_30px_rgba(34,197,94,0.3)] gap-2 transition-transform duration-500 ease-in-out ${isSaleButtonExpanded ? 'translate-x-[0.5rem] md:translate-x-0' : 'translate-x-[calc(100%-2.2rem)] md:translate-x-[calc(100%-3rem)]'}`}
                >
                    <button
                        onClick={() => setIsSaleButtonExpanded(!isSaleButtonExpanded)}
                        className="w-8 h-12 md:w-10 md:h-14 flex items-center justify-center text-white hover:bg-green-700 transition-colors rounded-l-2xl"
                    >
                        {isSaleButtonExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => { setIsNewSaleOpen(true); setIsSaleButtonExpanded(false); }}
                        className="bg-green-700 hover:bg-green-800 border border-green-500/50 text-white px-4 py-3 md:px-5 md:py-3.5 rounded-xl md:rounded-2xl shadow-inner transition-all hover:scale-105 active:scale-95 flex items-center gap-2 md:gap-3 w-max"
                    >
                        <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 mb-0.5" />
                        <span className="font-bold text-sm tracking-wide">Nueva Venta</span>
                    </button>
                </div>

                {/* New Sale Modal */}
                <NewSaleModal
                    isOpen={isNewSaleOpen}
                    onClose={() => setIsNewSaleOpen(false)}
                    onSaleComplete={() => window.location.reload()}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-luxury-black/60 backdrop-blur-md z-[100] lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '100%', opacity: 0.5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0.5 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-[85%] max-w-[400px] bg-primary z-[110] flex flex-col p-8 lg:hidden shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.5)] border-l border-white/5"
                        >
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-3">
                                    <img src="/img/logo.svg" className="w-8 h-8" />
                                    <h2 className="text-lg font-serif font-black italic text-secondary-light">Admin <span className="opacity-40">Menu</span></h2>
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-3 bg-white/5 text-secondary-light rounded-xl active:scale-95 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-8">
                                <div className="text-[8px] font-black uppercase tracking-[0.3em] text-secondary-light/20 mb-6 pl-4">Navegación Principal</div>
                                {menuItems.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center justify-between p-6 rounded-[2rem] transition-all group ${isActive
                                                ? 'bg-secondary-light text-primary font-bold shadow-xl'
                                                : 'text-secondary-light/40 hover:text-secondary-light hover:bg-white/5 border border-white/5'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                                <span className="text-xs font-black uppercase tracking-widest leading-none">{item.name}</span>
                                            </div>
                                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </Link>
                                    );
                                })}

                                <div className="pt-8 mt-4 border-t border-white/5">
                                    <div className="text-[8px] font-black uppercase tracking-[0.3em] text-secondary-light/20 mb-6 pl-4">Accesos Directos</div>
                                    <button
                                        onClick={() => { navigate('/'); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-4 p-6 text-secondary-light/40 hover:text-secondary-light bg-white/5 rounded-[2rem] transition-all border border-white/5 mb-3"
                                    >
                                        <Store className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest leading-none">Ver Tienda</span>
                                    </button>
                                    <button
                                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-4 p-6 text-red-400 bg-red-400/5 rounded-[2rem] transition-all border border-red-400/10"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest leading-none">Cerrar Sesión</span>
                                    </button>
                                </div>
                            </nav>

                            <div className="pt-6 border-t border-white/5 flex items-center justify-center">
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10 italic">Luxessence v1.0.2</p>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Ambient Decorative */}
            <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-primary/2 rounded-full blur-[120px] pointer-events-none -z-10" />
        </div>
    );
};

export default AdminLayout;
