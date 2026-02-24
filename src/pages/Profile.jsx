import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Save, ShieldCheck, Clock, Package } from 'lucide-react';

const Profile = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        city: '',
        department: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

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

            // Fetch recent orders
            const { data: ordersData } = await supabase
                .from('orders')
                .select('*')
                .eq('client_email', session.user.email)
                .order('created_at', { ascending: false })
                .limit(5);

            setOrders(ordersData || []);
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

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
            <header className="space-y-4">
                <h1 className="text-5xl font-serif font-bold italic text-primary">Mi Perfil</h1>
                <p className="text-primary/40 tracking-[0.3em] uppercase text-xs font-black italic">Gestión de membresía exclusiva</p>
                <div className="w-20 h-1 bg-primary/20 rounded-full" />
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
                                    <div key={order.id} className="p-4 bg-white/50 border border-primary/5 rounded-2xl flex justify-between items-center group hover:bg-white transition-all">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-primary">#{order.id.slice(0, 8)}</p>
                                            <p className="text-[10px] text-primary/40 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary font-sans">L. {order.total}</p>
                                            <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-full ${order.status === 'processed' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                                                }`}>
                                                {order.status === 'pending' ? 'Pedido en proceso' :
                                                    order.status === 'processing' ? 'Preparando envío' :
                                                        order.status === 'shipped' ? 'En camino' :
                                                            order.status === 'processed' ? 'Pedido Exitoso' : 'Entregado'}
                                            </span>
                                        </div>
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
        </div >
    );
};

export default Profile;
