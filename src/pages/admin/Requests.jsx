import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Trash2, X, Search, ExternalLink, Calendar, User, Phone, Package, ChevronRight, Activity, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import SecurityModal from '../../components/admin/SecurityModal';
import Pagination from '../../components/admin/Pagination';

const Requests = () => {
    const { addToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('product_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error('Error fetching requests:', err);
            addToast('Error al cargar solicitudes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (request) => {
        setRequestToDelete(request);
        setIsSecurityOpen(true);
    };

    const confirmDelete = async () => {
        if (!requestToDelete) return;

        try {
            const { error } = await supabase
                .from('product_requests')
                .delete()
                .eq('id', requestToDelete.id);

            if (error) throw error;
            addToast('Solicitud eliminada');
            setRequests(requests.filter(r => r.id !== requestToDelete.id));
            if (selectedRequest?.id === requestToDelete.id) setSelectedRequest(null);
        } catch (err) {
            addToast('Error al eliminar', 'error');
        } finally {
            setIsSecurityOpen(false);
            setRequestToDelete(null);
        }
    };

    const filteredRequests = requests.filter(r =>
        r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.whatsapp?.includes(searchTerm)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
            {/* Minimal Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif font-bold italic text-primary">Solicitudes</h1>
                        <p className="text-[9px] text-primary/60 uppercase tracking-[0.2em] font-black">Búsquedas Personalizadas</p>
                    </div>
                </div>

                <div className="relative group w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-primary/5 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary shadow-sm text-sm transition-all"
                    />
                </div>
            </div>

            {/* List Table - Full Width */}
            <div className="glass-card rounded-3xl bg-white border border-primary/5 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-primary/5 border-b border-primary/5">
                            <tr className="text-[9px] uppercase font-black tracking-widest text-primary/60">
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4 text-right hidden md:table-cell">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {loading ? (
                                <tr><td colSpan="4" className="py-12 text-center text-primary/60 font-serif italic text-lg">Cargando datos...</td></tr>
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan="4" className="py-12 text-center text-primary/60 font-serif italic text-lg">No hay registros</td></tr>
                            ) : (
                                currentItems.map((req) => (
                                    <tr
                                        key={req.id}
                                        onClick={() => setSelectedRequest(req)}
                                        className="group hover:bg-primary/[0.02] transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-bold text-primary/60">{new Date(req.created_at).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-primary uppercase text-[10px]">{req.customer_name}</span>
                                                <span className="text-[9px] text-primary font-bold">+{req.whatsapp}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-serif italic text-primary/70">{req.product_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right hidden md:table-cell">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }}
                                                    className="p-2 bg-primary/5 text-primary rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
                                                    title="Ver Detalles"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(req); }}
                                                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* Details Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
                            onClick={() => setSelectedRequest(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl border border-primary/10 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="space-y-1">
                                    <span className="px-3 py-1 bg-secondary text-primary text-[8px] font-black uppercase tracking-widest rounded-full">Detalles</span>
                                    <h2 className="text-xl font-serif font-black italic text-primary">Solicitud de Cliente</h2>
                                </div>
                                <button onClick={() => setSelectedRequest(null)} className="p-2 bg-primary/5 hover:bg-red-50 rounded-full transition-all text-primary/40 hover:text-red-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] uppercase font-black text-primary/60 tracking-widest">Cliente</p>
                                        <p className="text-sm font-bold text-primary italic uppercase">{selectedRequest.customer_name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] uppercase font-black text-primary/40 tracking-widest">WhatsApp</p>
                                        <a href={`https://wa.me/${selectedRequest.whatsapp.replace(/\D/g, '')}`} target="_blank" className="text-sm font-bold text-primary italic flex items-center gap-1 hover:underline">
                                            +{selectedRequest.whatsapp} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>

                                <div className="space-y-1 bg-primary/5 p-4 rounded-2xl border border-primary/5">
                                    <p className="text-[9px] uppercase font-black text-primary/60 tracking-widest">Producto Solicitado</p>
                                    <p className="text-base font-serif font-black italic text-primary leading-tight">{selectedRequest.product_name}</p>
                                </div>

                                {selectedRequest.product_link && (
                                    <div className="space-y-2">
                                        <p className="text-[9px] uppercase font-black text-primary/60 tracking-widest">Referencia Externa</p>
                                        <a
                                            href={selectedRequest.product_link}
                                            target="_blank"
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg"
                                        >
                                            Ver Link <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-primary/5 flex items-center justify-between">
                                    <div className="text-[9px] font-black text-primary/60 uppercase tracking-tighter">
                                        Recibida: {new Date(selectedRequest.created_at).toLocaleString()}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteClick(selectedRequest)}
                                        className="px-4 py-2 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Security Modal */}
            <SecurityModal
                isOpen={isSecurityOpen}
                onClose={() => setIsSecurityOpen(false)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default Requests;
