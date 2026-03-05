import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Package,
    Truck,
    CheckCircle2,
    ChevronLeft,
    ExternalLink,
    Search,
    Filter,
    ArrowRight,
    ShoppingBag
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import OrderTracker from '../components/profile/OrderTracker';
import AnimatedIcon from '../components/profile/AnimatedIcon';

const Orders = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'processed', 'shipped'
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchUserAndOrders = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('client_email', session.user.email)
                    .order('created_at', { ascending: false });
                setOrders(ordersData || []);
            } else {
                navigate('/');
                addToast('Por favor, inicia sesión para ver tus pedidos', 'error');
            }
            setLoading(false);
        };

        fetchUserAndOrders();
    }, [navigate, addToast]);

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'all' || order.status === filter;
        const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.items?.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen pt-40 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary-light/30 pt-40 pb-20 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <Link to="/profile" className="flex items-center gap-2 text-primary/40 hover:text-primary text-[10px] font-black uppercase tracking-[0.2em] transition-colors group">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Volver al Perfil
                        </Link>
                        <h1 className="text-5xl md:text-6xl font-serif font-bold italic text-primary leading-tight">Mis Órdenes</h1>
                        <p className="text-primary/30 uppercase text-[10px] font-black tracking-[0.4em] italic leading-none">Historial completo de exclusividad</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar por ID o producto..."
                                className="w-full md:w-64 bg-white border border-primary/10 rounded-2xl py-3 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary shadow-sm text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-white border border-primary/10 rounded-2xl py-3 px-4 outline-none focus:ring-1 focus:ring-primary shadow-sm text-sm font-black uppercase tracking-widest text-primary/60"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="all">TODOS</option>
                            <option value="pending">PENDIENTES</option>
                            <option value="processing">PROCESANDO</option>
                            <option value="shipped">EN CAMINO</option>
                            <option value="processed">ENTREGADOS</option>
                        </select>
                    </div>
                </header>

                {/* Orders List */}
                <div className="space-y-8">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order, idx) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass-panel p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden group hover:shadow-2xl transition-all duration-700"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10">

                                    {/* Order Info */}
                                    <div className="lg:col-span-1 space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic">Nº Orden</p>
                                            <h3 className="text-xl font-black text-primary font-sans leading-none">#{order.id.slice(0, 12).toUpperCase()}</h3>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic">Fecha Registrada</p>
                                            <p className="text-sm font-bold text-primary italic capitalize">
                                                {new Date(order.created_at).toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="pt-4 border-t border-primary/5">
                                            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic">Inversión Total</p>
                                            <p className="text-3xl font-black text-primary font-sans">L. {(Number(order.total) || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-primary/5 p-3 rounded-2xl group-hover:bg-primary transition-colors duration-500">
                                            <div className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center shrink-0">
                                                <ShoppingBag className="w-4 h-4" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-primary tracking-widest group-hover:text-secondary-light">
                                                {order.items?.length || 0} Tesoros Adquiridos
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tracking Visual */}
                                    <div className="lg:col-span-3 flex flex-col justify-center space-y-8">
                                        <div className="bg-white/40 border border-primary/5 rounded-[2.5rem] p-4 shadow-inner">
                                            <OrderTracker currentStatus={order.status} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic flex items-center gap-2">
                                                    <Filter className="w-3 h-3" />
                                                    Detalle del Pedido
                                                </p>
                                                <div className="space-y-3 bg-white/20 p-6 rounded-3xl border border-primary/5">
                                                    {order.items?.map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center text-sm font-bold text-primary italic">
                                                            <div className="flex gap-3 items-center">
                                                                <span className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center font-black text-[10px] not-italic tracking-tighter">x{item.quantity}</span>
                                                                <span>{item.name}</span>
                                                            </div>
                                                            <span className="font-sans font-black text-primary/40 not-italic tabular-nums">L. {(item.price * item.quantity).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-end gap-3">
                                                <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic">Entrega Exclusiva</p>
                                                <div className="bg-gradient-to-tr from-primary to-primary-light p-6 rounded-3xl text-secondary-light flex items-center justify-between shadow-xl">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Modo de Envío</p>
                                                        <p className="text-sm font-bold italic uppercase tracking-wider">{order.delivery_mode === 'domicilio' ? 'Premium Domicilio' : 'Pick-up Boutique'}</p>
                                                    </div>
                                                    <AnimatedIcon icon={Truck} color="#FFFFFF" size={28} animation="bounce" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Background Accents */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/5 transition-all duration-700" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/1 rounded-full blur-[100px] pointer-events-none opacity-50" />
                            </motion.div>
                        ))
                    ) : (
                        <div className="glass-panel py-32 flex flex-col items-center justify-center space-y-8 rounded-[4rem] text-center px-6">
                            <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center animate-bounce">
                                <ShoppingBag className="w-12 h-12 text-primary/20" />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-4xl font-serif font-bold italic text-primary">Aún no hay tesoros</h2>
                                <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.3em]">Tu historia con Luxessence está por comenzar</p>
                            </div>
                            <Link to="/catalog" className="btn-primary !px-12 !py-5 flex items-center gap-3 shadow-2xl group mt-4">
                                EXPLORAR CATÁLOGO
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Brand Footer */}
                <footer className="pt-20 text-center space-y-6">
                    <img
                        src="/img/logo.svg"
                        alt="Luxessence"
                        className="h-16 mx-auto opacity-10 transition-opacity hover:opacity-20 cursor-default"
                        style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(35%) saturate(7000%) hue-rotate(345deg) brightness(85%) contrast(100%)' }}
                    />
                    <div className="flex items-center justify-center gap-6">
                        <p className="text-[9px] text-primary/20 uppercase tracking-[0.5em] font-black font-sans">Luxessence S.A. © 2024</p>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default Orders;
