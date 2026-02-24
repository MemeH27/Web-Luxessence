import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToExcel } from '../../utils/export';
import { Search, UserPlus, Edit3, Trash2, Download, Mail, Phone, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SecurityModal from '../../components/admin/SecurityModal';
import { useToast } from '../../context/ToastContext';

const CustomerManagement = () => {
    const { addToast } = useToast();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', address: '' });

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
        } else {
            await supabase.from('customers').insert(form);
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
        if (!confirm('¿Seguro que desea eliminar este cliente permanentemente?')) return;
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) {
            addToast('Error al eliminar cliente');
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

    return (
        <div className="space-y-12 pb-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-serif font-bold italic text-primary">Directorio Premium</h1>
                    <p className="text-primary/40 tracking-widest uppercase text-xs font-black">Gestión de cartera de clientes</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleExport} className="glass-panel p-4 rounded-2xl hover:bg-primary/5 text-primary/60 transition-colors">
                        <Download className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
                        <UserPlus className="w-5 h-5" /> Nuevo Cliente
                    </button>
                </div>
            </header>

            {/* Search Bar */}
            <div className="glass-panel p-6 rounded-[2rem] flex flex-col md:flex-row gap-6 items-center justify-between border-primary/10">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o teléfono..."
                        className="w-full bg-primary/5 border border-primary/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-1 focus:ring-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <p className="text-[10px] uppercase tracking-widest font-black text-primary/40">
                    {filteredCustomers.length} Clientes Identificados
                </p>
            </div>

            {/* Customer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 glass-panel animate-pulse rounded-[2.5rem]" />)
                ) : filteredCustomers.length === 0 ? (
                    <div className="col-span-full py-20 text-center italic text-primary/20 italic">No se encontraron clientes registrados</div>
                ) : (
                    filteredCustomers.map(cust => (
                        <motion.div
                            layout
                            key={cust.id}
                            className="glass-card p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] space-y-4 md:space-y-6 hover:shadow-2xl hover:shadow-primary/5 group relative overflow-hidden bg-white/40"
                        >
                            <div className="flex justify-between items-start relative z-10">
                                <div className="space-y-1">
                                    <h3 className="text-xl md:text-2xl font-serif font-bold italic text-primary leading-tight">{cust.first_name} {cust.last_name}</h3>
                                    <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary/40 font-black">Cliente desde {new Date(cust.created_at).getFullYear()}</p>
                                </div>
                                <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(cust)} className="p-2.5 bg-primary/5 hover:bg-primary text-primary hover:text-secondary-light rounded-xl transition-all shadow-sm"><Edit3 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDelete(cust.id)} className="p-2.5 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[11px] md:text-sm text-luxury-black/60 font-bold">
                                        <Phone className="w-3 h-3 text-primary/40 focus:text-primary" /> {cust.phone}
                                    </div>
                                    {cust.email && (
                                        <div className="flex items-center gap-2 text-[11px] md:text-sm text-luxury-black/60 overflow-hidden text-ellipsis whitespace-nowrap">
                                            <Mail className="w-3 h-3 text-primary/40" /> {cust.email}
                                        </div>
                                    )}
                                </div>
                                {cust.address && (
                                    <div className="flex items-start gap-2 text-[11px] md:text-sm text-luxury-black/60 border-l border-primary/5 pl-4">
                                        <MapPin className="w-3 h-3 text-primary/40 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2 italic leading-tight">{cust.address}</span>
                                    </div>
                                )}
                            </div>

                            <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-primary/5 rounded-bl-[60px] md:rounded-bl-[100px] -z-0 pointer-events-none" />
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-secondary-light w-full max-w-xl rounded-[3.5rem] p-10 md:p-14 relative z-10 shadow-2xl border border-primary/10">
                            <div className="flex justify-between items-center mb-10">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-serif font-bold italic text-primary">{editingCustomer ? 'Perfil del Cliente' : 'Nuevo Registro'}</h2>
                                    <p className="text-[10px] text-primary/30 uppercase tracking-[0.2em] font-black">Información de Cartera</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-primary/5 rounded-full text-primary transition-colors"><X className="w-6 h-6" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-bold ml-1">Nombre</label>
                                    <input required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-bold ml-1">Apellido</label>
                                    <input required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-bold ml-1">Teléfono</label>
                                    <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-bold ml-1">Email (Opcional)</label>
                                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-bold ml-1">Dirección de Entrega</label>
                                    <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows="3" className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm resize-none" />
                                </div>

                                <button type="submit" className="md:col-span-2 btn-primary !py-5 mt-4">
                                    {editingCustomer ? 'Actualizar Perfil' : 'Dar de Alta Cliente'}
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
