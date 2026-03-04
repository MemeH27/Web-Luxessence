import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Save, ShieldCheck, Clock, Package, ChevronUp, ChevronDown, Award, LogOut, Sparkles, Star, Gift, LayoutDashboard, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ADMIN_EMAIL } from '../lib/constants';
import { useUpdate } from '../context/UpdateContext';

const Profile = () => {
    const { addToast } = useToast();
    const { checkForUpdate, isChecking, lastCheckResult, setLastCheckResult } = useUpdate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        city: '',
        department: ''
    });
    const [loyaltyStamps, setLoyaltyStamps] = useState(0);

    useEffect(() => {
        fetchProfile();

        // Listen for auth changes to update Profile state
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser(session.user);
                fetchProfile();
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            setLastCheckResult('none');
        };
    }, []);

    const fetchOrdersOnly = async (email) => {
        const { data: ordersData } = await supabase
            .from('orders')
            .select('*')
            .eq('client_email', email)
            .order('created_at', { ascending: false })
            .limit(5);
        setOrders(ordersData || []);
    };

    const fetchProfile = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setUser(session.user);
            setFormData({
                first_name: session.user.user_metadata?.first_name || '',
                last_name: session.user.user_metadata?.last_name || '',
                phone: session.user.user_metadata?.phone || '',
                address: session.user.user_metadata?.address || '',
                city: session.user.user_metadata?.city || '',
                department: session.user.user_metadata?.department || ''
            });

            // Fetch loyalty stamps from customers table
            const { data: customerData } = await supabase
                .from('customers')
                .select('loyalty_stamps')
                .eq('email', session.user.email)
                .single();

            if (customerData) {
                setLoyaltyStamps(customerData.loyalty_stamps || 0);
            }

            fetchOrdersOnly(session.user.email);
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    department: formData.department
                }
            });

            if (error) throw error;
            addToast('Perfil actualizado correctamente');
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        addToast('Sesión cerrada correctamente');
        window.location.reload();
    };

    const openLogin = () => {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto px-6 pt-40 pb-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-10 md:p-16 rounded-[4rem] space-y-8 relative overflow-hidden flex flex-col items-center"
                >
                    <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                        <User className="w-12 h-12 text-primary/30" strokeWidth={1} />
                    </div>

                    <div className="space-y-4 max-w-lg">
                        <h1 className="text-4xl md:text-5xl font-serif font-bold italic text-primary">Descubre Tu Mundo Luxessence</h1>
                        <p className="text-primary/60 text-lg">Inicia sesión para desbloquear una experiencia de compra personalizada y beneficios exclusivos.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
                        <div className="bg-white/50 p-6 rounded-3xl border border-primary/5 flex gap-4 items-start">
                            <Star className="w-6 h-6 text-primary shrink-0" />
                            <div>
                                <h3 className="font-bold text-primary italic uppercase tracking-widest text-xs">Tarjeta de Sellos</h3>
                                <p className="text-[10px] text-primary/60 mt-1 uppercase font-black">Obtén 20% OFF en tu 5ta compra automáticamente.</p>
                            </div>
                        </div>
                        <div className="bg-white/50 p-6 rounded-3xl border border-primary/5 flex gap-4 items-start">
                            <Clock className="w-6 h-6 text-primary shrink-0" />
                            <div>
                                <h3 className="font-bold text-primary italic uppercase tracking-widest text-xs">Historial VIP</h3>
                                <p className="text-[10px] text-primary/60 mt-1 uppercase font-black">Rastrea tus pedidos exclusivos en tiempo real.</p>
                            </div>
                        </div>
                        <div className="bg-white/50 p-6 rounded-3xl border border-primary/5 flex gap-4 items-start md:col-span-2">
                            <Gift className="w-6 h-6 text-primary shrink-0" />
                            <div>
                                <h3 className="font-bold text-primary italic uppercase tracking-widest text-xs">Acceso Anticipado</h3>
                                <p className="text-[10px] text-primary/60 mt-1 uppercase font-black">Sé el primero en adquirir nuestras piezas de edición limitada.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={openLogin}
                        className="btn-primary !px-12 !py-5 flex items-center gap-3 shadow-2xl mt-4 group"
                    >
                        INICIAR SESIÓN AHORA
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </button>

                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/3 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/3 rounded-full blur-[100px] pointer-events-none" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 pt-40 space-y-12">
            <header className="space-y-6 flex flex-col md:flex-row md:items-end justify-between">
                <div className="space-y-4">
                    <h1 className="text-5xl font-serif font-bold italic text-primary">Mi Perfil</h1>
                    <p className="text-primary/40 tracking-[0.3em] uppercase text-xs font-black italic">Gestión de membresía exclusiva</p>
                    <div className="w-20 h-1 bg-primary/20 rounded-full" />
                </div>

                <div className="flex flex-row items-center gap-3 pt-6 md:pt-0 w-full md:max-w-md">
                    {user?.email === ADMIN_EMAIL && (
                        <Link
                            to="/admin/dashboard"
                            className="flex-1 relative overflow-hidden group flex items-center justify-center gap-2 bg-gradient-to-tr from-primary to-primary-light text-secondary-light py-3.5 px-2 rounded-[1.25rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(113,17,22,0.15)] hover:shadow-[0_15px_30px_rgba(113,17,22,0.25)] hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                            <LayoutDashboard className="w-4 h-4 relative z-10" />
                            <span className="relative z-10 leading-none mt-0.5">Gestión VIP</span>
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex-1 relative overflow-hidden group flex items-center justify-center gap-2 bg-white/70 backdrop-blur-xl border border-primary/10 text-primary py-3.5 px-2 rounded-[1.25rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] hover:bg-white hover:border-primary/20 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                        <LogOut className="w-4 h-4 text-primary/40 group-hover:text-primary transition-colors relative z-10" />
                        <span className="relative z-10 leading-none mt-0.5">Cerrar Sesión</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left: Profile Form */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleUpdate} className="glass-panel p-10 rounded-[3rem] space-y-8 relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-2">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            <h2 className="text-2xl font-serif font-bold italic text-primary">Información Personal</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Nombre</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                    <input
                                        type="text"
                                        placeholder="Tu nombre"
                                        className="w-full bg-white border border-primary/5 rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-1 focus:ring-primary shadow-inner"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Apellido</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                    <input
                                        type="text"
                                        placeholder="Tu apellido"
                                        className="w-full bg-white border border-primary/5 rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-1 focus:ring-primary shadow-inner"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Email (No editable)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/10" />
                                    <input
                                        type="email"
                                        disabled
                                        className="w-full bg-primary/[0.02] border border-primary/5 rounded-2xl py-4 pl-12 pr-6 text-primary/30 font-medium"
                                        value={user?.email || ''}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Teléfono</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                    <input
                                        type="tel"
                                        placeholder="9999-9999"
                                        className="w-full bg-white border border-primary/5 rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-1 focus:ring-primary shadow-inner"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Ciudad</label>
                                <input
                                    type="text"
                                    placeholder="Su ciudad"
                                    className="w-full bg-white border border-primary/5 rounded-2xl py-4 px-6 outline-none focus:ring-1 focus:ring-primary shadow-inner"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Departamento</label>
                                <select
                                    className="w-full bg-white border border-primary/5 rounded-2xl py-4 px-6 outline-none focus:ring-1 focus:ring-primary shadow-inner text-sm"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                >
                                    <option value="" disabled>Seleccione un departamento</option>
                                    {["Atlántida", "Choluteca", "Colón", "Comayagua", "Copán", "Cortés", "El Paraíso", "Francisco Morazán", "Gracias a Dios", "Intibucá", "Islas de la Bahía", "La Paz", "Lempira", "Ocotepeque", "Olancho", "Santa Bárbara", "Valle", "Yoro"].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Dirección Predeterminada</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-4 w-4 h-4 text-primary/30" />
                                <textarea
                                    rows="3"
                                    placeholder="Su dirección para envíos..."
                                    className="w-full bg-white border border-primary/5 rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-1 focus:ring-primary shadow-inner resize-none"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary w-full !py-5 flex items-center justify-center gap-3 shadow-2xl transition-all"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? 'Guardando Cambios...' : 'ACTUALIZAR DATOS'}
                        </button>

                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/3 rounded-full blur-3xl pointer-events-none" />
                    </form>

                    {/* Loyalty Card */}
                    <div className="glass-panel p-10 rounded-[3rem] space-y-8 bg-gradient-to-br from-primary to-primary-light text-secondary-light relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 flex flex-col xl:flex-row gap-6 items-center xl:items-start justify-between text-center xl:text-left">
                            <div className="flex flex-col items-center xl:items-start space-y-3 xl:space-y-1">
                                <div className="flex flex-col xl:flex-row items-center gap-3 xl:gap-4">
                                    <div className="flex flex-col md:flex-row items-center gap-3 xl:gap-4">
                                        <Award className="w-12 h-12 md:w-10 md:h-10 text-secondary shrink-0" />
                                        <h2 className="text-3xl md:text-4xl font-serif font-bold italic text-secondary-light leading-tight">Tarjeta Cliente Frecuente</h2>
                                    </div>
                                    <span className="text-6xl md:text-5xl font-black font-sans tracking-tighter text-[#E5C158] drop-shadow-[0_0_20px_rgba(229,193,88,0.4)] leading-none mt-2 xl:mt-0 xl:ml-2">
                                        20% OFF
                                    </span>
                                </div>
                                <span className="text-[12px] uppercase tracking-widest text-secondary-light/60 font-black xl:ml-[3.5rem] block text-center xl:text-left">
                                    Un sello por cada compra
                                </span>
                            </div>
                            {loyaltyStamps >= 5 && (
                                <span className="bg-secondary text-primary px-6 py-3 md:px-4 md:py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg animate-pulse shrink-0 mt-4 md:mt-0 w-full md:w-auto text-center">¡Recompensa Lista!</span>
                            )}
                        </div>

                        <div className="relative z-10 grid grid-cols-5 gap-3 md:gap-6 bg-white/5 p-6 md:p-8 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                            {[1, 2, 3, 4, 5].map((stamp) => (
                                <div key={stamp} className={`aspect-square rounded-full flex flex-col items-center justify-center border-2 transition-all duration-500 relative ${loyaltyStamps >= stamp ? 'bg-transparent border-transparent scale-[1.15] drop-shadow-2xl' : 'bg-transparent border-white/20 border-dashed shadow-inner'}`}>
                                    {loyaltyStamps >= stamp ? (
                                        <img src="/img/sello.png" className="w-full h-full object-contain absolute opacity-90" alt="Stamped" />
                                    ) : (
                                        <span className="text-white/20 font-black font-sans text-xl">{stamp}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="relative z-10 pt-4 text-center border-t border-white/10">
                            <p className="text-xs italic text-secondary-light/80">Al acumular 5 sellos, obtienes automáticamente un <strong className="text-secondary font-sans font-bold text-sm">20% de descuento</strong> en tu siguiente compra. Aplican restricciones.</p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/20 rounded-full blur-3xl pointer-events-none" />
                    </div>
                </div>

                {/* Right: Order History Summary */}
                <div className="space-y-8">
                    <div className="glass-panel p-8 rounded-[3rem] space-y-6">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <h3 className="text-xl font-serif font-bold italic text-primary">Mis Pedidos</h3>
                        </div>

                        <div className="space-y-4">
                            {orders.length > 0 ? (
                                orders.map(order => (
                                    <div key={order.id} className="flex flex-col">
                                        <button
                                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                            className="p-5 bg-white/50 border border-primary/5 rounded-2xl flex justify-between items-center group hover:bg-white transition-all text-left"
                                        >
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-primary flex items-center gap-2">
                                                    #{order.id.slice(0, 8)}
                                                    {expandedOrder === order.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 text-primary/30" />}
                                                </p>
                                                <p className="text-[10px] text-primary/40 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary font-sans">L. {Number(order.total).toLocaleString()}</p>
                                                <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-full ${order.status === 'processed' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                                                    }`}>
                                                    {order.status === 'pending' ? 'Recibido' :
                                                        order.status === 'processing' ? 'Preparando' :
                                                            order.status === 'shipped' ? 'En camino' :
                                                                order.status === 'processed' ? 'Venta Exitosa' : 'Entregado'}
                                                </span>
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {expandedOrder === order.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-primary/[0.02] mx-2 rounded-b-2xl border-x border-b border-primary/5"
                                                >
                                                    <div className="p-4 space-y-3 font-sans">
                                                        {order.items?.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-[10px]">
                                                                <div className="flex gap-2 items-center">
                                                                    <span className="font-black text-primary/30">x{item.quantity}</span>
                                                                    <span className="font-medium text-primary/60 italic truncate max-w-[120px]">{item.name}</span>
                                                                </div>
                                                                <span className="font-bold text-primary">L. {(item.price * item.quantity).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                        <div className="pt-2 border-t border-primary/5 mt-2">
                                                            <p className="text-[9px] text-primary/30 uppercase font-black italic">Modo: {order.delivery_mode === 'domicilio' ? 'A Domicilio' : 'Pick-up'}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 space-y-4">
                                    <Package className="w-10 h-10 text-primary/10 mx-auto" />
                                    <p className="text-primary/30 text-xs italic">Aún no hay pedidos registrados con esta cuenta.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div >

            <footer className="pt-12 pb-6 flex flex-col items-center gap-4 border-t border-primary/5">
                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={checkForUpdate}
                        disabled={isChecking}
                        className="flex items-center gap-2 bg-white/50 hover:bg-white border border-primary/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary/50 transition-all disabled:opacity-50 shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                        {isChecking ? 'Buscando...' : 'Buscar Actualización de Luxessence'}
                    </button>

                    <AnimatePresence>
                        {lastCheckResult === 'up-to-date' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Estás en la versión más reciente
                            </motion.div>
                        )}
                        {lastCheckResult === 'update-found' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="text-[10px] text-amber-600 font-black uppercase tracking-widest flex items-center gap-1.5 bg-amber-50 px-4 py-2 rounded-full border border-amber-100"
                            >
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                ¡Nueva actualización encontrada!
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <p className="text-[9px] text-primary/20 uppercase tracking-[0.4em] font-bold">Luxessence PWA v1.0.5</p>
            </footer>
        </div >
    );
};

export default Profile;
