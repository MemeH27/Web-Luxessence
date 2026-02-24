import { useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, History, LogOut, Sparkles, ChevronLeft, Menu, X, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('lux_auth');
        navigate('/');
    };

    const menuItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Pedidos', path: '/admin/orders', icon: ShoppingCart },
        { name: 'Inventario', path: '/admin/inventory', icon: Package },
        { name: 'Ventas', path: '/admin/sales', icon: History },
        { name: 'Clientes', path: '/admin/customers', icon: Users },
        { name: 'Promociones', path: '/admin/promotions', icon: Percent },
    ];

    return (
        <div className="min-h-screen bg-secondary-light flex">
            {/* Sidebar */}
            <aside className="w-80 bg-primary p-10 flex flex-col hidden lg:flex sticky top-0 h-screen shadow-2xl overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-20">
                    <Link to="/" className="flex items-center gap-4 group">
                        <img src="/img/logo.svg" className="w-12 h-12 transition-transform duration-500 group-hover:rotate-12" />
                        <h2 className="text-4xl font-serif font-black italic text-secondary-light leading-[0.85]">
                            Admin<br /><span className="text-2xl opacity-50">Suite</span>
                        </h2>
                    </Link>
                    <button
                        onClick={() => navigate('/')}
                        className="p-3 bg-secondary-light/10 hover:bg-secondary-light/20 rounded-2xl transition-all text-secondary-light shadow-lg group"
                        title="Volver a la tienda"
                    >
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>

                <nav className="flex-1 space-y-3">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-8 py-5 rounded-[2rem] transition-all duration-500 group ${isActive
                                    ? 'bg-secondary-light text-primary font-bold shadow-2xl shadow-black/20 scale-[1.02]'
                                    : 'text-secondary-light/40 hover:text-secondary-light hover:bg-secondary-light/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'group-hover:translate-x-1 transition-transform'}`} />
                                <span className="tracking-widest uppercase text-[10px] font-black">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="pt-8 border-t border-secondary-light/5 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-8 py-5 text-secondary-light/40 hover:text-red-400 hover:bg-red-400/5 rounded-[2rem] transition-all group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-black uppercase tracking-widest text-[10px]">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto p-6 md:p-12 no-scrollbar relative">
                {/* Mobile Header */}
                <div className="lg:hidden flex justify-between items-center mb-10 bg-primary p-6 rounded-[2.5rem] shadow-xl pt-safe relative z-[110]">
                    <div className="flex items-center gap-3">
                        <img src="/img/logo.svg" className="w-10 h-10" />
                        <h2 className="text-xl font-serif font-black italic text-secondary-light leading-none">Admin <span className="opacity-50">Suite</span></h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/')}
                            className="p-4 bg-secondary-light/10 text-secondary-light rounded-2xl active:scale-90 transition-all"
                            title="Volver a la tienda"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-4 bg-secondary-light/10 text-secondary-light rounded-2xl active:scale-90 transition-all"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-0 z-[100] bg-primary flex flex-col p-10 pt-40"
                        >
                            <nav className="flex-1 space-y-4">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center justify-between p-8 rounded-[2.5rem] transition-all ${location.pathname === item.path
                                            ? 'bg-secondary-light text-primary font-bold shadow-2xl'
                                            : 'text-secondary-light/60 border border-secondary-light/5'}`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <item.icon className="w-6 h-6" />
                                            <span className="text-xl font-serif italic">{item.name}</span>
                                        </div>
                                        <ChevronLeft className="w-5 h-5 opacity-20 rotate-180" />
                                    </Link>
                                ))}
                            </nav>
                            <div className="pt-10 border-t border-secondary-light/5 pb-safe">
                                <button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    className="w-full flex items-center gap-4 p-8 text-red-400 bg-red-400/5 rounded-[2.5rem] font-black uppercase tracking-widest text-[10px]"
                                >
                                    <LogOut className="w-5 h-5" /> Cerrar Sesión
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-7xl mx-auto"
                >
                    <Outlet />
                </motion.div>

                {/* Ambient Decorative */}
                <div className="fixed top-0 right-0 w-[300px] h-[300px] bg-primary/2 rounded-full blur-[100px] pointer-events-none -z-10" />
            </main>
        </div>
    );
};

export default AdminLayout;
