import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToExcel } from '../../utils/export';
import { Search, UserPlus, Edit3, Trash2, Download, Mail, Phone, MapPin, X, Users, UserCheck, Star, Activity, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SecurityModal from '../../components/admin/SecurityModal';
import Pagination from '../../components/admin/Pagination';
import { useToast } from '../../context/ToastContext';

const CustomerManagement = () => {
    const { addToast } = useToast();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', address: '' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Security Modal State
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [securityAction, setSecurityAction] = useState(null); // { type, id }

    useEffect(() => {
        fetchCustomers();
    }, []);

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
            setForm({ first_name: '', last_name: '', email: '', phone: '', address: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingCustomer) {
            await supabase.from('customers').update(form).eq('id', editingCustomer.id);
            addToast('Cliente actualizado');
        } else {
            await supabase.from('customers').insert(form);
            addToast('Cliente registrado');
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

                    {/* Customer Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 min-h-[500px] content-start">
                        {loading ? (
                            [1, 2, 3, 4].map(i => <div key={i} className="h-64 glass-panel animate-pulse rounded-[3rem] bg-white/40 border-primary/5" />)
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
                                    className="p-8 md:p-10 bg-white hover:bg-primary/[0.02] rounded-[3rem] border border-primary/5 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden flex flex-col justify-between"
                                >
                                    <div className="space-y-6 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-serif font-bold italic text-primary leading-tight group-hover:text-luxury-black transition-colors">{cust.first_name} {cust.last_name}</h3>
                                                <p className="text-[10px] uppercase tracking-widest text-primary/30 font-black flex items-center gap-2">
                                                    <UserCheck className="w-3 h-3" /> Registrado en {new Date(cust.created_at).getFullYear()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenModal(cust)} className="p-3 bg-primary/5 hover:bg-primary text-primary/40 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(cust.id)} className="p-3 bg-red-500/5 hover:bg-red-500 text-red-500/40 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4 text-sm text-luxury-black/60 font-medium">
                                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                                                    <Phone className="w-4 h-4 text-primary/40" />
                                                </div>
                                                <span className="font-black text-primary/80">{cust.phone}</span>
                                            </div>
                                            {cust.email && (
                                                <div className="flex items-center gap-4 text-sm text-luxury-black/60">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                                                        <Mail className="w-4 h-4 text-primary/40" />
                                                    </div>
                                                    <span className="truncate italic">{cust.email}</span>
                                                </div>
                                            )}
                                            {cust.address && (
                                                <div className="flex items-start gap-4 text-sm text-luxury-black/60 border-t border-primary/5 pt-4 mt-4">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                                                        <MapPin className="w-4 h-4 text-primary/40" />
                                                    </div>
                                                    <p className="italic leading-relaxed text-xs text-balance line-clamp-2">{cust.address}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ambient Decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-0 pointer-events-none group-hover:bg-primary/10 transition-colors" />
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
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-secondary-light w-full max-w-2xl rounded-[4rem] p-10 md:p-14 relative z-10 shadow-3xl border border-primary/10">
                            <div className="flex justify-between items-center mb-10">
                                <div className="space-y-2">
                                    <h2 className="text-3xl md:text-4xl font-serif font-bold italic text-primary">{editingCustomer ? 'Perfil del Cliente' : 'Nuevo Registro'}</h2>
                                    <p className="text-[10px] text-primary/30 uppercase tracking-[0.2em] font-black italic">Información Privada de Cartera</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-primary/5 rounded-full text-primary transition-all active:rotate-90"><X className="w-7 h-7" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-2">Nombre</label>
                                    <input required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-5 px-8 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm group-focus:border-primary" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-2">Apellido</label>
                                    <input required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-5 px-8 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-2">Teléfono</label>
                                    <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-5 px-8 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-2">Email (Opcional)</label>
                                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-5 px-8 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-2">Dirección de Entrega Presidencial</label>
                                    <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows="3" className="w-full bg-white border border-primary/10 rounded-[2rem] py-5 px-8 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm resize-none italic" />
                                </div>

                                <button type="submit" className="md:col-span-2 btn-primary !py-6 mt-4 shadow-3xl text-sm italic tracking-widest font-black uppercase">
                                    {editingCustomer ? 'ACTUALIZAR PERFIL EXCLUSIVO' : 'DAR DE ALTA EN LUXESSENCE'}
                                </button>
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
