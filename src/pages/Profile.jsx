import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserCircle, Mail, Phone, MapPin, Save, ShieldCheck, Clock, Package, ChevronUp, ChevronDown, Award, LogOut, Sparkles, Star, Gift, LayoutDashboard, RefreshCw, CheckCircle2, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { ADMIN_EMAIL } from '../lib/constants';
import { useUpdate } from '../context/UpdateContext';
import { APP_VERSION } from '../lib/version';
import OrderTracker from '../components/profile/OrderTracker';
import AnimatedIcon from '../components/profile/AnimatedIcon';

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
    const [showFullHistory, setShowFullHistory] = useState(false);

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
            .order('created_at', { ascending: false });
        setOrders(ordersData || []);
    };

    const fetchProfile = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setUser(session.user);
            const rawPhone = (session.user.user_metadata?.phone || '').replace('+504', '').replace(/\D/g, '').slice(0, 8);

            setFormData({
                first_name: session.user.user_metadata?.first_name || '',
                last_name: session.user.user_metadata?.last_name || '',
                phone: rawPhone,
                address: session.user.user_metadata?.address || '',
                city: session.user.user_metadata?.city || '',
                department: session.user.user_metadata?.department || ''
            });

            // Fetch loyalty stamps from customers table
            // Robust check: try by email first, then by phone if available
            let { data: customerData } = await supabase
                .from('customers')
                .select('loyalty_stamps, email, phone')
                .eq('email', session.user.email)
                .maybeSingle();

            if (!customerData && rawPhone) {
                // Try finding by phone if email didn't match (phone in metadata should match phone in customers)
                const { data: byPhone } = await supabase
                    .from('customers')
                    .select('loyalty_stamps, email, phone')
                    .eq('phone', `+504 ${rawPhone}`)
                    .maybeSingle();
                customerData = byPhone;
            }

            if (customerData) {
                const stamps = Number(customerData.loyalty_stamps) || 0;
                setLoyaltyStamps(stamps);

                // If reward is ready and it's a fresh load/refresh, show some magic
                if (stamps >= 5 && !loading) {
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#E5C158', '#000000', '#FFFFFF']
                    });
                }
            } else if (session.user.email !== ADMIN_EMAIL) {
                // Si el usuario no está en la tabla customers y no es admin, fue eliminado
                await supabase.auth.signOut();
                addToast('Tu cuenta ha sido eliminada por el administrador. Crea una nueva para continuar.', 'error');
                window.location.href = '/';
                return;
            }

            fetchOrdersOnly(session.user.email);
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const rawPhone = formData.phone.replace(/\D/g, '').slice(0, 8);
        if (rawPhone.length !== 8) {
            addToast('El número de teléfono debe tener exactamente 8 dígitos (sin contar +504)', 'error');
            setSaving(false);
            return;
        }

        const formattedPhone = `+504 ${rawPhone}`;

        try {
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formattedPhone,
                    address: formData.address,
                    city: formData.city,
                    department: formData.department
                }
            });

            if (authError) throw authError;

            // Also search and update customers table to keep synced
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                await supabase.from('customers')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formattedPhone,
                        address: formData.address,
                    })
                    .eq('email', session.user.email);
            }

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

    const requestNotifications = async () => {
        if (!("Notification" in window)) {
            addToast("Este explorador no soporta notificaciones", "error");
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            addToast("¡Notificaciones activadas con éxito!", "success");
            localStorage.setItem('luxessence_notifications', 'true');
        } else {
            addToast("Permiso de notificaciones denegado", "error");
        }
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

                <footer className="mt-12 pt-12 pb-6 flex flex-col items-center gap-4 border-t border-primary/5">
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
                    <p className="text-[9px] text-primary/20 uppercase tracking-[0.4em] font-bold">Luxessence PWA v{APP_VERSION}</p>
                </footer>
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
                    {/*
                    <button
                        onClick={requestNotifications}
                        className="flex-1 relative overflow-hidden group flex items-center justify-center gap-2 bg-secondary text-primary py-3.5 px-2 rounded-[1.25rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <ShieldCheck className="w-4 h-4 active:rotate-12 transition-transform relative z-10" />
                        <span className="relative z-10 leading-none mt-0.5">Alertas Lux</span>
                    </button>
                    */}
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
                                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                    <input
                                        type="text"
                                        placeholder="Tu nombre"
                                        className="w-full bg-white border border-primary/5 rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-1 focus:ring-primary shadow-inner placeholder:text-primary/10"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Apellido</label>
                                <div className="relative">
                                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                    <input
                                        type="text"
                                        placeholder="Tu apellido"
                                        className="w-full bg-white border border-primary/5 rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-1 focus:ring-primary shadow-inner placeholder:text-primary/10"
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
                                <div className="flex bg-white border border-primary/5 rounded-2xl shadow-inner focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden items-stretch">
                                    <div className="bg-primary/5 px-4 flex items-center justify-center border-r border-primary/10 shrink-0">
                                        <span className="text-primary font-bold text-xs">+504</span>
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="0000 0000"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                            setFormData({ ...formData, phone: val });
                                        }}
                                        className="w-full bg-transparent py-4 px-4 outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Ciudad</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                    <input
                                        type="text"
                                        placeholder="Su ciudad"
                                        className="w-full bg-white border border-primary/5 rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-1 focus:ring-primary shadow-inner placeholder:text-primary/10"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Departamento</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                    <select
                                        className="w-full bg-white border border-primary/5 rounded-2xl py-4 pl-12 pr-10 outline-none focus:ring-1 focus:ring-primary shadow-inner text-sm appearance-none"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    >
                                        <option value="" disabled>Seleccione un departamento</option>
                                        {["Atlántida", "Choluteca", "Colón", "Comayagua", "Copán", "Cortés", "El Paraíso", "Francisco Morazán", "Gracias a Dios", "Intibucá", "Islas de la Bahía", "La Paz", "Lempira", "Ocotepeque", "Olancho", "Santa Bárbara", "Valle", "Yoro"].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 pointer-events-none" />
                                </div>
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
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl md:text-4xl font-serif font-bold italic text-secondary-light leading-tight">Tarjeta Cliente Frecuente</h2>
                                            <button
                                                onClick={() => fetchProfile()}
                                                disabled={loading}
                                                className={`p-2 hover:bg-white/10 rounded-full transition-all ${loading ? 'animate-spin opacity-50' : 'hover:scale-110 active:scale-90'}`}
                                                title="Actualizar sellos"
                                            >
                                                <RefreshCw className="w-4 h-4 text-secondary/40" />
                                            </button>
                                        </div>
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
                                <div className="flex flex-col items-center gap-2">
                                    <span className="bg-secondary text-primary px-6 py-3 md:px-4 md:py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg animate-pulse shrink-0 mt-4 md:mt-0 w-full md:w-auto text-center flex items-center gap-2 justify-center">
                                        <PartyPopper className="w-4 h-4" /> ¡Recompensa Lista!
                                    </span>
                                </div>
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
                <div className="lg:col-span-3 space-y-8">
                    <div className="glass-panel p-10 rounded-[4rem] space-y-10 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-serif font-bold italic text-primary">Mis Tesoros Adquiridos</h3>
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/30 mt-1">Historial de exclusividad</p>
                                </div>
                            </div>

                            {orders.length > 0 && (
                                <Link
                                    to="/orders"
                                    className="px-8 py-3 bg-primary/5 border border-primary/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary/60 hover:bg-primary hover:text-secondary-light transition-all shadow-sm active:scale-95"
                                >
                                    Ver Historial Completo
                                </Link>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                            {orders.length > 0 ? (
                                (showFullHistory ? orders : orders.slice(0, 3)).map(order => (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col h-full"
                                    >
                                        <div
                                            className={`p-8 bg-white/40 border-2 rounded-[3rem] hover:bg-white transition-all text-left space-y-6 flex flex-col justify-between h-full group ${expandedOrder === order.id ? 'border-primary shadow-2xl' : 'border-primary/5 shadow-sm'}`}
                                        >
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic leading-none">Orden Lux</p>
                                                        <p className="text-sm font-black text-primary flex items-center gap-2">
                                                            #{order.id.slice(0, 8)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-2xl text-primary font-sans leading-none">L. {(Number(order.total) || 0).toLocaleString()}</p>
                                                        <p className="text-[10px] text-primary/30 uppercase tracking-widest mt-1 italic">{new Date(order.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>

                                                <div className="h-px bg-primary/5 w-full" />

                                                <div className="space-y-3">
                                                    <p className="text-[9px] uppercase tracking-widest font-black text-primary/20 italic">Estado Actual</p>
                                                    <div className="flex items-center gap-3">
                                                        <AnimatedIcon
                                                            icon={
                                                                order.status === 'pending' ? Clock :
                                                                    order.status === 'processing' ? Package :
                                                                        order.status === 'shipped' ? Truck : CheckCircle2
                                                            }
                                                            color="#711116"
                                                            size={20}
                                                            animation="pulse"
                                                        />
                                                        <span className="text-xs font-black uppercase text-primary italic">
                                                            {order.status === 'pending' ? 'Recibido' :
                                                                order.status === 'processing' ? 'Preparando su Pedido' :
                                                                    order.status === 'shipped' ? 'En camino a su hogar' :
                                                                        (order.status === 'processed' || order.status === 'delivered') ? 'Entregado con Éxito' : 'Cancelado'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                                className="w-full mt-6 py-4 bg-primary/5 hover:bg-primary text-primary/60 hover:text-secondary-light rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 group/btn shadow-sm"
                                            >
                                                {expandedOrder === order.id ? 'OCULTAR DETALLES' : 'RASTREAR Y DETALLES'}
                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-500 ${expandedOrder === order.id ? 'rotate-180' : 'group-hover/btn:translate-y-0.5'}`} />
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {expandedOrder === order.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-white/50 backdrop-blur-xl border-x-2 border-b-2 border-primary rounded-b-[2.5rem] mt-[-1.5rem] pt-8"
                                                >
                                                    <div className="p-8 space-y-8 font-sans">
                                                        {/* Status Tracking Visual */}
                                                        <div className="bg-white/30 rounded-3xl p-6 border border-primary/5">
                                                            <OrderTracker currentStatus={order.status} />
                                                        </div>

                                                        {/* Items List */}
                                                        <div className="space-y-4 pt-4 border-t border-primary/5">
                                                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/30 italic">Artículos Exclusivos</p>
                                                            {order.items?.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center group/item">
                                                                    <div className="flex gap-4 items-center">
                                                                        <span className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center font-black text-primary text-xs shrink-0 group-hover/item:scale-110 transition-transform">x{item.quantity}</span>
                                                                        <span className="font-serif font-bold text-primary italic leading-tight text-base">{item.name}</span>
                                                                    </div>
                                                                    <span className="font-black text-primary/80 font-sans">L. {(item.price * item.quantity).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="pt-6 border-t border-primary/5 mt-4 flex justify-between items-center bg-primary/5 -mx-8 -mb-8 p-8">
                                                            <div>
                                                                <p className="text-[9px] text-primary/30 uppercase font-black italic tracking-widest leading-none">Modo de Entrega</p>
                                                                <p className="text-xs font-black text-primary uppercase mt-1 italic tracking-widest">
                                                                    {order.delivery_mode === 'domicilio' ? 'Servicio a Domicilio Premium' : 'Pick-up en Boutique Lux'}
                                                                </p>
                                                            </div>
                                                            <AnimatedIcon icon={Truck} color="#711116" size={24} animation="bounce" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 bg-primary/5 rounded-[3rem] border border-dashed border-primary/10 flex flex-col items-center gap-6 group">
                                    <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center group-hover:bg-primary group-hover:text-secondary-light transition-all duration-700">
                                        <Package className="w-10 h-10 opacity-30 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-primary/40 text-sm italic font-medium">Aún no hay tesoros registrados en su historial.</p>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/20">Descubra nuestro catálogo exclusivo</p>
                                    </div>
                                    <Link to="/catalog" className="text-[10px] font-black uppercase text-primary border-b border-primary/20 hover:border-primary transition-all mt-4 tracking-[0.3em]">Explorar Ahora</Link>
                                </div>
                            )}
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/[0.02] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-primary/[0.01] rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
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
                <p className="text-[9px] text-primary/20 uppercase tracking-[0.4em] font-bold">Luxessence PWA v{APP_VERSION}</p>
            </footer>
        </div >
    );
};

export default Profile;
