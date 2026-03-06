import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToExcel } from '../../utils/export';
import { Search, UserPlus, Edit3, Trash2, Download, Mail, Phone, MapPin, X, Users, UserCheck, Star, Activity, ShieldCheck, ChevronLeft, ChevronRight, RefreshCw, Award, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SecurityModal from '../../components/admin/SecurityModal';
import Pagination from '../../components/admin/Pagination';
import { useToast } from '../../context/ToastContext';

const ADMIN_EMAIL = 'luxessence504@gmail.com';

const CustomerManagement = () => {
    const { addToast } = useToast();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', address: '', loyalty_stamps: 0 });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Security Modal State
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [securityAction, setSecurityAction] = useState(null); // { type, id }

    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const recalculateStamps = async (id, email) => {
        if (!confirm('¿Deseas recalcular los sellos basados en el historial de pedidos procesados?')) return;
        setSyncing(id);
        try {
            // Count processed orders for this customer id or email
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'processed')
                .or(`customer_id.eq.${id},client_email.eq.${email}`);

            if (error) throw error;

            const newStamps = Math.min(count % 6, 5); // 5 stamps, 6th is discount
            await supabase.from('customers').update({ loyalty_stamps: newStamps }).eq('id', id);
            addToast('Sellos actualizados según historial');
            fetchCustomers();
        } catch (err) {
            addToast('Error al sincronizar: ' + err.message, 'error');
        } finally {
            setSyncing(false);
        }
    };

    const fetchCustomers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (error) console.error(error);
        else setCustomers(data || []);
        setLoading(false);
    };

    const handleOpenModal = (cust = null) => {
        if (cust) {
            setEditingCustomer(cust);
            setForm({ ...cust });
        } else {
            setEditingCustomer(null);
            setForm({ first_name: '', last_name: '', email: '', phone: '+504 ', address: '', loyalty_stamps: 0 });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const rawPhone = form.phone ? form.phone.replace('+504', '').replace(/\D/g, '') : '';
        if (rawPhone.length > 0 && rawPhone.length !== 8) {
            addToast('El número de teléfono debe tener exactamente 8 dígitos (sin contar +504)', 'error');
            return;
        }

        const formattedForm = { ...form, phone: rawPhone.length === 8 ? `+504 ${rawPhone}` : '' };

        if (editingCustomer) {
            await supabase.from('customers').update(formattedForm).eq('id', editingCustomer.id);
            addToast('Cliente actualizado');
        } else {
            // Use upsert to prevent duplicates if phone already exists
            const { error } = await supabase.from('customers').upsert(formattedForm, { onConflict: 'phone' });
            if (error) {
                addToast('Error al registrar cliente: ' + error.message, 'error');
            } else {
                addToast('Cliente registrado / actualizado');
            }
        }
        setIsModalOpen(false);
        fetchCustomers();
    };

    const handleSecurityConfirm = () => {
        if (!securityAction) return;
        if (securityAction.type === 'delete') {
            executeDelete(securityAction.id);
        }
        setSecurityAction(null);
    };

    const handleDelete = (id) => {
        // Buscar el cliente para verificar el correo
        const customer = customers.find(c => c.id === id);

        if (customer?.email === ADMIN_EMAIL) {
            addToast('Esta cuenta es de administrador. Por favor, póngase en contacto con el desarrollador para realizar cualquier acción sobre esta cuenta.', 'warning');
            return;
        }

        setSecurityAction({ type: 'delete', id });
        setIsSecurityOpen(true);
    };

    const executeDelete = async (id) => {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) {
            addToast('Error al eliminar cliente', 'error');
        } else {
            addToast('Cliente eliminado');
            fetchCustomers();
        }
    };

    const handleExport = () => {
        const exportData = filteredCustomers.map(c => ({
            Nombre: c.first_name,
            Apellido: c.last_name,
            Email: c.email || 'N/A',
            Teléfono: c.phone,
            Dirección: c.address || 'N/A',
            Registro: new Date(c.created_at).toLocaleDateString()
        }));
        exportToExcel(exportData, 'Directorio_Clientes_Luxessence', 'Clientes');
    };

    const filteredCustomers = customers.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="space-y-12 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold italic text-primary leading-tight text-balance">Directorio de Clientes</h1>
                    <p className="text-primary/40 font-medium italic">Gestión centralizada de perfiles y fidelización.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleExport} className="glass-panel p-5 rounded-2xl hover:bg-primary/5 text-primary/60 transition-colors shadow-sm">
                        <Download className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleOpenModal()} className="btn-primary !px-8 !py-5 flex items-center gap-3 shadow-2xl shadow-primary/20">
                        <UserPlus className="w-5 h-5" /> <span className="text-xs uppercase font-black tracking-widest italic tracking-tighter">NUEVO PERFIL</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    {/* Search Bar */}
                    <div className="glass-panel p-6 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-center justify-between border-primary/10 bg-white/40">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o teléfono..."
                                className="w-full bg-primary/5 border border-primary/10 rounded-2xl py-4 pl-16 pr-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/40 bg-white/50 px-6 py-2 rounded-full border border-primary/5">
                            {filteredCustomers.length} Clientes Identificados
                        </p>
                    </div>

                    {/* Compact Minimalist Luxury Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[500px] content-start">
                        {loading ? (
                            [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 glass-panel animate-pulse rounded-[2.5rem] bg-white/40 border-primary/5" />)
                        ) : paginatedCustomers.length === 0 ? (
                            <div className="col-span-full py-32 text-center bg-white/40 rounded-[3rem] border border-dashed border-primary/10 flex flex-col items-center gap-6">
                                <Users className="w-16 h-16 text-primary/10" />
                                <p className="italic text-primary/20 text-xl font-serif">No se encontraron clientes registrados</p>
                            </div>
                        ) : (
                            paginatedCustomers.map(cust => (
                                <motion.div
                                    layout
                                    key={cust.id}
                                    className="group relative bg-white rounded-[2rem] border border-primary/10 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden flex flex-col p-6"
                                >
                                    {/* Action Header - Subtle but always present */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary text-secondary flex items-center justify-center font-serif font-black text-lg shadow-md group-hover:scale-110 transition-transform duration-500">
                                            {cust.first_name?.[0]}{cust.last_name?.[0]}
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleOpenModal(cust)} className="p-2.5 text-primary/20 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(cust.id)} className="p-2.5 text-red-500/20 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>

                                    {/* Name & ID Section */}
                                    <div className="space-y-1 mb-6">
                                        <h3 className="text-lg font-serif font-bold italic text-primary leading-tight line-clamp-1 group-hover:text-primary/80 transition-colors">
                                            {cust.first_name} {cust.last_name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-primary/30">
                                            <Clock className="w-2.5 h-2.5" />
                                            <span>MIEMBRO DESDE {new Date(cust.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    {/* Contact Stats - Compact Row Style */}
                                    <div className="space-y-3 py-4 border-y border-primary/5 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-secondary transition-all">
                                                <Phone className="w-3 h-3" />
                                            </div>
                                            <span className="text-xs font-bold text-primary/70">{cust.phone}</span>
                                        </div>
                                        {cust.email && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-secondary transition-all">
                                                    <Mail className="w-3 h-3" />
                                                </div>
                                                <span className="text-[10px] italic text-primary/40 truncate flex-1">{cust.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Loyalty Section - Small & Spaced Out */}
                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 font-black text-[8px] uppercase tracking-widest text-primary/40">
                                                <Award className="w-3 h-3 text-secondary" />
                                                FIDELIDAD
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); recalculateStamps(cust.id, cust.email); }}
                                                className="text-[8px] font-black text-primary/20 hover:text-primary transition-colors flex items-center gap-1"
                                            >
                                                SYNC <RefreshCw className={`w-2 h-2 ${syncing === cust.id ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-5 gap-2">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <div
                                                    key={s}
                                                    className={`aspect-square rounded-lg flex items-center justify-center border transition-all duration-500 ${cust.loyalty_stamps >= s ? 'border-secondary/20 bg-secondary/5' : 'border-primary/5 bg-primary/5'}`}
                                                >
                                                    {cust.loyalty_stamps >= s ? (
                                                        <img src="/img/sello.png" className="w-4 h-4 object-contain" alt="Stamp" />
                                                    ) : (
                                                        <span className="text-[8px] text-primary/10 font-bold">{s}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Hover Decorator */}
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-primary transform translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                </motion.div>
                            ))
                        )}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredCustomers.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Sidebar Metrics */}
                <div className="space-y-8">
                    <div className="bg-primary p-12 rounded-[4rem] text-secondary-light space-y-10 shadow-3xl relative overflow-hidden">
                        <div className="space-y-4 relative z-10">
                            <h2 className="text-3xl font-serif font-bold italic">Kpis de Audiencia</h2>
                            <p className="text-secondary-light/40 text-xs font-medium uppercase tracking-[0.2em]">Salud de la Cartera</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 relative z-10">
                            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 group hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-light/40 mb-3">Total Clientes Activos</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-3xl font-serif font-bold italic text-secondary">{customers.length}</p>
                                    <Users className="w-8 h-8 opacity-20" />
                                </div>
                            </div>

                            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 group hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-light/40 mb-3">Fidelización Estimada</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-3xl font-serif font-bold italic text-secondary">84%</p>
                                    <Star className="w-8 h-8 opacity-20 text-yellow-500" />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-secondary/10 rounded-[2.5rem] border border-secondary/20 relative z-10">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Actividad Reciente
                            </p>
                            <p className="text-xs italic leading-relaxed">
                                Se han registrado <span className="text-secondary font-bold">{customers.filter(c => {
                                    const regDate = new Date(c.created_at);
                                    const now = new Date();
                                    return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
                                }).length} nuevos perfiles</span> este mes. Tu cartera sigue creciendo con distinción.
                            </p>
                        </div>

                        <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full blur-3xl opacity-50" />
                    </div>

                    <div className="bg-white border border-secondary/20 p-8 rounded-[3rem] space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 text-primary">
                            <ShieldCheck className="w-5 h-5" />
                            <h4 className="font-serif font-bold italic">Protección de Datos</h4>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest group">
                                <span className="text-primary/40 group-hover:text-primary transition-colors">Cifrado SSL:</span>
                                <span className="text-green-500">Activo</span>
                            </li>
                            <li className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest group">
                                <span className="text-primary/40 group-hover:text-primary transition-colors">LOPD Status:</span>
                                <span className="text-green-500">Cumplido</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-secondary-light w-full max-w-2xl rounded-[3rem] md:rounded-[4rem] p-6 md:p-14 relative z-10 shadow-3xl border border-primary/10 max-h-[90vh] overflow-y-auto no-scrollbar">
                            <div className="flex justify-between items-start md:items-center mb-8 md:mb-10">
                                <div className="space-y-1 md:space-y-2 pt-2 md:pt-0">
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold italic text-primary">{editingCustomer ? 'Perfil del Cliente' : 'Nuevo Registro'}</h2>
                                    <p className="text-[9px] md:text-[10px] text-primary/30 uppercase tracking-[0.2em] font-black italic">Información Privada de Cartera</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 md:p-3 hover:bg-primary/5 rounded-full text-primary transition-all active:rotate-90 shrink-0"><X className="w-5 h-5 md:w-7 md:h-7" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary/40 font-black ml-2">Nombre</label>
                                    <input required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-3 px-6 md:py-5 md:px-8 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm group-focus:border-primary" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary/40 font-black ml-2">Apellido</label>
                                    <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-3 px-6 md:py-5 md:px-8 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary/40 font-black ml-2">Teléfono</label>
                                    <div className="flex bg-white border border-primary/10 rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden items-stretch">
                                        <div className="bg-primary/5 px-4 md:px-6 flex items-center justify-center border-r border-primary/10 shrink-0">
                                            <span className="text-primary font-bold text-sm md:text-base">+504</span>
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="0000 0000"
                                            value={form.phone ? form.phone.replace('+504', '').trim() : ''}
                                            onChange={e => {
                                                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                setForm({ ...form, phone: `+504 ${digitsOnly}` });
                                            }}
                                            className="w-full bg-transparent py-3 px-4 md:py-5 md:px-6 outline-none text-sm md:text-base font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-1">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary/40 font-black ml-2">Email (Opcional)</label>
                                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-3 px-6 md:py-5 md:px-8 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-1">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary/40 font-black ml-2">Sellos de Fidelidad</label>
                                    <div className="relative">
                                        <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-secondary" />
                                        <input type="number" min="0" max="5" value={form.loyalty_stamps || 0} onChange={e => setForm({ ...form, loyalty_stamps: parseInt(e.target.value) || 0 })} className="w-full bg-white border border-primary/10 rounded-2xl py-3 px-6 pl-12 md:py-5 md:pl-14 md:px-8 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm font-bold text-primary" />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary/40 font-black ml-2">Dirección de Entrega Presidencial</label>
                                    <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows="3" className="w-full bg-white border border-primary/10 rounded-[2rem] py-4 px-6 md:py-5 md:px-8 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm resize-none italic text-sm md:text-base" />
                                </div>

                                <div className="md:col-span-2 pt-2 md:pt-4">
                                    <button type="submit" className="w-full btn-primary !py-4 md:!py-6 shadow-3xl text-xs md:text-sm italic tracking-widest font-black uppercase">
                                        {editingCustomer ? 'ACTUALIZAR PERFIL EXCLUSIVO' : 'DAR DE ALTA EN LUXESSENCE'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SecurityModal
                isOpen={isSecurityOpen}
                onClose={() => setIsSecurityOpen(false)}
                onConfirm={handleSecurityConfirm}
                title="Eliminar Cliente"
            />
        </div>
    );
};

export default CustomerManagement;
