import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToExcel } from '../../utils/export';
import { generateInvoice, shareInvoicePDF } from '../../utils/billing';
import { Search, Calendar, Download, Filter, Trash2, Eye, DollarSign, CreditCard, Receipt, TrendingUp, Share2, Printer, X, Phone } from 'lucide-react';
import SecurityModal from '../../components/admin/SecurityModal';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';

const SalesHistory = () => {
    const { addToast } = useToast();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPeriod, setFilterPeriod] = useState('all'); // day, week, month, all
    const [filterMethod, setFilterMethod] = useState('all'); // Contado, Crédito, all

    // Modal States
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [securityAction, setSecurityAction] = useState(null); // { type: 'delete' | 'edit', id: string, data?: any }
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [isProfitOpen, setIsProfitOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ total: 0, discount: 0, payment_method: '', is_paid: false });

    const invoiceRef = useRef(null);
    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: `Factura_Luxessence_${selectedSale?.id.slice(0, 8)}`,
    });

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('sales')
            .select('*, orders(*, items), customers(*)')
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setSales(data || []);
        setLoading(false);
    };

    const handleSecurityConfirm = () => {
        if (!securityAction) return;
        if (securityAction.type === 'delete') {
            executeDelete(securityAction.id);
        } else if (securityAction.type === 'edit') {
            executeEdit(securityAction.id);
        }
        setSecurityAction(null);
    };

    const handleDeleteSale = (id) => {
        setSecurityAction({ type: 'delete', id });
        setIsSecurityOpen(true);
    };

    const handleOpenEdit = (sale) => {
        setSelectedSale(sale);
        setEditForm({
            total: sale.total,
            discount: sale.discount,
            payment_method: sale.payment_method,
            is_paid: sale.is_paid
        });
        setSecurityAction({ type: 'edit', id: sale.id });
        setIsSecurityOpen(true);
    };

    const executeDelete = async (id) => {
        if (!confirm('¿Eliminar este registro de venta? El stock de los productos se revertirá automáticamente.')) return;
        try {
            const saleToDelete = sales.find(s => s.id === id);
            // 1. Revert Stock
            const items = saleToDelete.orders?.items || [];
            for (const item of items) {
                const { data: prod } = await supabase.from('products').select('stock').eq('id', item.id || item.product_id).single();
                if (prod) {
                    await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.id || item.product_id);
                }
            }

            // 2. Delete Sale
            const { error } = await supabase.from('sales').delete().eq('id', id);
            if (error) throw error;

            addToast('Registro eliminado y stock revertido');
            fetchSales();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar registro');
        }
    };

    const executeEdit = (id) => {
        setIsEditModalOpen(true);
    };

    const handleExport = () => {
        const exportData = filteredSales.map(s => ({
            ID: s.id.slice(0, 8),
            Fecha: new Date(s.created_at).toLocaleDateString(),
            Cliente: `${s.customers?.first_name} ${s.customers?.last_name}`,
            Total: s.total,
            Descuento: s.discount,
            Metodo: s.payment_method,
            Estado: s.is_paid ? 'Pagado' : 'Pendiente',
            Items: s.orders?.items?.map(i => `${i.name} (${i.quantity})`).join(', ')
        }));
        exportToExcel(exportData, 'Historial_Ventas_Luxessence', 'Ventas');
    };

    const filteredSales = sales.filter(s => {
        const matchesSearch = `${s.customers?.first_name} ${s.customers?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesMethod = filterMethod === 'all' || s.payment_method === filterMethod;

        let matchesPeriod = true;
        if (filterPeriod !== 'all') {
            const saleDate = new Date(s.created_at);
            const now = new Date();
            if (filterPeriod === 'day') {
                matchesPeriod = saleDate.toDateString() === now.toDateString();
            } else if (filterPeriod === 'week') {
                const oneWeekAgo = new Date().setDate(now.getDate() - 7);
                matchesPeriod = saleDate >= oneWeekAgo;
            } else if (filterPeriod === 'month') {
                matchesPeriod = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
            }
        }

        return matchesSearch && matchesMethod && matchesPeriod;
    });

    const metrics = {
        total: filteredSales.reduce((acc, curr) => acc + curr.total, 0),
        pending: filteredSales.filter(s => !s.is_paid).reduce((acc, curr) => acc + curr.total, 0),
        cost: filteredSales.reduce((acc, curr) => acc + (curr.total_cost || 0), 0),
        profit: filteredSales.reduce((acc, curr) => acc + (curr.total_profit || 0), 0),
        count: filteredSales.length
    };



    const handleShareInvoice = async (sale) => {
        const message = `Factura Luxessence: L. ${sale.total}. Cliente: ${sale.customers?.first_name}. ID: ${sale.id.slice(0, 8)}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Factura Luxessence',
                    text: message,
                    url: window.location.href
                });
            } catch (err) {
                console.error('Error al compartir');
            }
        } else {
            addToast('Copiado al portapapeles');
            navigator.clipboard.writeText(message);
        }
    };

    return (
        <div className="space-y-12 pb-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-serif font-bold italic text-primary">Libro de Ventas</h1>
                    <p className="text-primary/40 tracking-widest uppercase text-xs font-black">Historial oficial de transacciones</p>
                </div>
                <button onClick={handleExport} className="btn-primary flex items-center gap-2">
                    <Download className="w-5 h-5" /> Exportar a Excel
                </button>
            </header>

            {/* Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-panel p-8 rounded-[2rem] border-primary/20">
                    <p className="text-[10px] uppercase font-black text-primary/40 tracking-[0.2em] mb-1">Volumen Total</p>
                    <h3 className="text-3xl font-serif font-bold italic text-primary">L. {metrics.total}</h3>
                </div>
                <div className="glass-panel p-8 rounded-[2rem] border-primary/20">
                    <p className="text-[10px] uppercase font-black text-green-600/40 tracking-[0.2em] mb-1">Ganancia Neta</p>
                    <h3 className="text-3xl font-serif font-bold italic text-green-600">L. {metrics.profit}</h3>
                </div>
                <div className="glass-panel p-8 rounded-[2rem] border-primary/20">
                    <p className="text-[10px] uppercase font-black text-red-500/40 tracking-[0.2em] mb-1">Costo de Ventas</p>
                    <h3 className="text-3xl font-serif font-bold italic text-red-600">L. {metrics.cost}</h3>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-6 rounded-[2rem] flex flex-col xl:flex-row gap-6 items-center justify-between border-primary/10">
                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar cliente o ID..."
                        className="w-full bg-primary/5 border border-primary/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-1 focus:ring-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    <div className="flex bg-primary/5 p-1 rounded-xl">
                        {['all', 'day', 'week', 'month'].map(p => (
                            <button
                                key={p}
                                onClick={() => setFilterPeriod(p)}
                                className={`px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all ${filterPeriod === p ? 'bg-primary text-secondary-light shadow-md' : 'text-primary/40 hover:text-primary'
                                    }`}
                            >
                                {p === 'all' ? 'Todo' : p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-primary/5 p-1 rounded-xl">
                        {['all', 'Contado', 'Crédito'].map(m => (
                            <button
                                key={m}
                                onClick={() => setFilterMethod(m)}
                                className={`px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all ${filterMethod === m ? 'bg-primary text-secondary-light shadow-md' : 'text-primary/40 hover:text-primary'
                                    }`}
                            >
                                {m === 'all' ? 'Todos los Métodos' : m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile List / Desktop Table */}
            <div className="glass-panel rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-primary/10 shadow-xl bg-white/40">
                <div className="overflow-x-auto no-scrollbar">
                    {/* Desktop Table View */}
                    <table className="hidden md:table w-full text-left">
                        <thead>
                            <tr className="bg-primary/5 border-b border-primary/5">
                                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-primary/40">Fecha</th>
                                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-primary/40">Cliente</th>
                                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-primary/40">ID Venta</th>
                                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-primary/40">Método</th>
                                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-primary/40 ring-1 ring-primary/5">Total</th>
                                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-primary/40">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3].map(i => <tr key={i} className="animate-pulse border-b border-primary/5"><td colSpan="6" className="h-16" /></tr>)
                            ) : filteredSales.length === 0 ? (
                                <tr><td colSpan="6" className="py-20 text-center italic text-primary/20">No se encontraron ventas con estos filtros</td></tr>
                            ) : (
                                filteredSales.map((sale) => (
                                    <tr key={sale.id} className="border-b border-primary/5 hover:bg-primary/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-primary/80">{new Date(sale.created_at).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-primary/30 uppercase">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-luxury-black">{sale.customers?.first_name} {sale.customers?.last_name}</p>
                                            <p className="text-[10px] text-primary/30">{sale.customers?.phone}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] bg-primary/5 text-primary/60 py-1 px-3 rounded-full font-mono font-bold tracking-widest">
                                                {sale.id.slice(0, 8).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                {sale.payment_method === 'Contado' ? (
                                                    <DollarSign className="w-3 h-3 text-green-600" />
                                                ) : (
                                                    <CreditCard className="w-3 h-3 text-orange-600" />
                                                )}
                                                <span className={`text-[10px] uppercase font-black tracking-widest ${sale.payment_method === 'Contado' ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {sale.payment_method}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 bg-primary/[0.01]">
                                            <p className="text-lg font-sans font-bold text-primary">L. {sale.total}</p>
                                            {sale.discount > 0 && <p className="text-[10px] text-red-500 font-bold italic">(-L. {sale.discount})</p>}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setSelectedSale(sale); setIsDetailsModalOpen(true); }} title="Ver Detalle" className="p-2 hover:bg-primary/5 rounded-xl transition-colors text-primary/40 hover:text-primary"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => { setSelectedSale(sale); setIsInvoiceOpen(true); }} title="Factura" className="p-2 hover:bg-primary/5 rounded-xl transition-colors text-primary/40 hover:text-primary"><Receipt className="w-4 h-4" /></button>
                                                <button onClick={() => { setSelectedSale(sale); setIsProfitOpen(true); }} title="Análisis de Rentabilidad" className="p-2 hover:bg-primary/5 rounded-xl transition-colors text-green-600/40 hover:text-green-600"><TrendingUp className="w-4 h-4" /></button>
                                                <button onClick={() => handleOpenEdit(sale)} title="Editar" className="p-2 hover:bg-primary/5 rounded-xl transition-colors text-primary/40 hover:text-primary"><Calendar className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteSale(sale.id)} title="Eliminar" className="p-2 hover:bg-red-500/5 rounded-xl transition-colors text-red-500/40 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-primary/5">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="p-6 animate-pulse h-32" />)
                        ) : filteredSales.length === 0 ? (
                            <div className="py-20 text-center italic text-primary/20">No se encontraron ventas</div>
                        ) : (
                            filteredSales.map((sale) => (
                                <div key={sale.id} className="p-6 space-y-4 hover:bg-primary/[0.02] transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-black text-primary lowercase">{sale.customers?.first_name} {sale.customers?.last_name}</p>
                                            <p className="text-[10px] text-primary/30 font-bold">{new Date(sale.created_at).toLocaleDateString()} • {sale.payment_method}</p>
                                        </div>
                                        <p className="text-lg font-sans font-bold text-primary">L. {sale.total}</p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-primary/5 pt-4">
                                        <div className="flex gap-1">
                                            <button onClick={() => { setSelectedSale(sale); setIsDetailsModalOpen(true); }} className="p-2.5 bg-primary/5 rounded-xl text-primary/40 active:bg-primary active:text-white transition-all"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => { setSelectedSale(sale); setIsInvoiceOpen(true); }} className="p-2.5 bg-primary/5 rounded-xl text-primary/40 active:bg-primary active:text-white transition-all"><Receipt className="w-4 h-4" /></button>
                                            <button onClick={() => { setSelectedSale(sale); setIsProfitOpen(true); }} className="p-2.5 bg-green-500/5 rounded-xl text-green-600/40 active:bg-green-600 active:text-white transition-all"><TrendingUp className="w-4 h-4" /></button>
                                            <button onClick={() => handleOpenEdit(sale)} className="p-2.5 bg-primary/5 rounded-xl text-primary/40 active:bg-primary active:text-white transition-all"><Calendar className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteSale(sale.id)} className="p-2.5 bg-red-500/5 rounded-xl text-red-500/40 active:bg-red-500 active:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold text-primary/20 uppercase tracking-widest">#{sale.id.slice(0, 6)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {/* Invoice Modal */}
                {isInvoiceOpen && selectedSale && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-4xl max-h-[95vh] rounded-[2rem] md:rounded-[3rem] shadow-4xl relative overflow-hidden flex flex-col"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsInvoiceOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all z-50 lg:p-3"
                            >
                                <X className="w-5 h-5 lg:w-6 h-6" />
                            </button>

                            {/* Content Wrapper (Scrollable) */}
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <div ref={invoiceRef} className="bg-white p-6 md:p-14 lg:p-20">
                                    {/* Header Design */}
                                    <div className="flex flex-col md:flex-row justify-between gap-8 border-b-2 border-primary/10 pb-10">
                                        <div className="space-y-4">
                                            <h2 className="text-4xl lg:text-5xl font-serif font-black italic text-primary tracking-tighter">LUXESSENCE</h2>
                                            <div className="space-y-1">
                                                <p className="text-[10px] md:text-xs font-black text-primary/40 uppercase tracking-[0.3em]">Perfumería de Gama Alta</p>
                                                <div className="text-[9px] md:text-xs text-primary/60 font-medium">
                                                    <p>Santa Rosa de Copán | San Pedro Sula</p>
                                                    <p>Tel: 3313-5869 / 8896-6603</p>
                                                    <p>www.luxessence.store</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-left md:text-right space-y-4">
                                            <div className="bg-primary/5 p-5 lg:p-8 rounded-[2.5rem] border border-primary/5 inline-block text-left md:text-right">
                                                <p className="text-[10px] uppercase font-black text-primary/30 tracking-widest">Nº de Factura</p>
                                                <p className="text-xl lg:text-2xl font-mono font-bold text-primary">#LUX-{selectedSale.id.slice(0, 8).toUpperCase()}</p>
                                                <p className="text-[10px] uppercase font-black text-primary/30 tracking-widest mt-4">Fecha de Emisión</p>
                                                <p className="text-sm font-bold text-primary">{new Date(selectedSale.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Participants Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-12">
                                        <div className="space-y-4">
                                            <p className="text-[10px] uppercase font-black text-primary/30 tracking-widest border-l-2 border-primary pl-3">Datos del Comprador</p>
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-serif font-bold italic text-primary">{selectedSale.customers?.first_name} {selectedSale.customers?.last_name}</h3>
                                                <div className="text-sm text-primary/60 space-y-1 font-medium">
                                                    <p className="flex items-center gap-2 font-bold"><Phone className="w-4 h-4 text-primary/40" /> {selectedSale.customers?.phone}</p>
                                                    <p className="flex items-start gap-2 max-w-xs">{selectedSale.customers?.address || 'Honduras'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 md:text-right">
                                            <p className="text-[10px] uppercase font-black text-primary/30 tracking-widest md:border-r-2 md:border-primary md:pr-3">Detalles de Venta</p>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-[10px] uppercase font-black text-primary/20">Método de Pago</p>
                                                    <p className="text-sm font-black text-primary uppercase">{selectedSale.payment_method}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-black text-primary/20">Estado</p>
                                                    <p className={`text-sm font-bold ${selectedSale.is_paid ? 'text-green-600' : 'text-red-500'}`}>{selectedSale.is_paid ? 'PAGADO' : 'PENDIENTE'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] uppercase font-black text-primary/30 tracking-widest">Descripción de Artículos</p>
                                        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-primary/5 bg-primary/[0.01]">
                                            <table className="w-full text-left min-w-[600px]">
                                                <thead>
                                                    <tr className="bg-primary text-white text-[10px] uppercase font-black tracking-[0.2em]">
                                                        <th className="px-6 py-4">Cant.</th>
                                                        <th className="px-6 py-4">Descripción del Producto</th>
                                                        <th className="px-6 py-4 text-right">Unitario</th>
                                                        <th className="px-6 py-4 text-right">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-primary/5">
                                                    {selectedSale.orders?.items?.map((item, idx) => (
                                                        <tr key={idx} className="text-sm">
                                                            <td className="px-6 py-4 font-black text-primary/40">{item.quantity}</td>
                                                            <td className="px-6 py-4 font-bold text-primary">{item.name}</td>
                                                            <td className="px-6 py-4 text-right text-primary/60 italic">L. {Number(item.price).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right font-black text-primary">L. {(item.price * item.quantity).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="md:hidden text-center">
                                            <p className="text-[8px] text-primary/20 uppercase font-black animate-pulse">Desliza para ver más →</p>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="flex flex-col md:flex-row justify-between items-end gap-10 mt-12 pt-10 border-t border-primary/10">
                                        <div className="max-w-xs space-y-4 text-[10px] text-primary/30 font-bold leading-relaxed hidden md:block italic">
                                            <p>Gracias por elegir la distinción de Luxessence. Este documento sirve como comprobante comercial de su adquisición.</p>
                                        </div>
                                        <div className="w-full md:w-80 space-y-4">
                                            <div className="space-y-2 px-4 text-sm">
                                                <div className="flex justify-between font-bold text-primary/40 uppercase text-[10px] tracking-widest">
                                                    <span>Suma Neto</span>
                                                    <span>L. {(selectedSale.total + (selectedSale.discount || 0)).toLocaleString()}</span>
                                                </div>
                                                {selectedSale.discount > 0 && (
                                                    <div className="flex justify-between font-black text-red-500/60 uppercase text-[10px] tracking-widest">
                                                        <span>Incentivo Aplicado</span>
                                                        <span>- L. {selectedSale.discount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Clean Sans Serif Total */}
                                            <div className="flex justify-between items-end pt-6 border-t border-primary/5 px-4">
                                                <div className="space-y-1">
                                                    <p className="text-[11px] uppercase font-black tracking-[0.2em] text-primary/40">Total a Pagar</p>
                                                    <p className="text-4xl font-sans font-black text-primary tracking-tighter leading-none">
                                                        L. {Number(selectedSale.total).toLocaleString()}
                                                    </p>
                                                </div>
                                                <Receipt className="w-10 h-10 text-primary/10" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Print Styles */}
                                    <style>{`
                                        @media print {
                                            @page { margin: 15mm; size: auto; }
                                            body { background: white !important; }
                                            .no-print { display: none !important; }
                                            .print\\:p-0 { padding: 0 !important; }
                                            .print\\:shadow-none { shadow: none !important; }
                                            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                        }
                                    `}</style>
                                </div>
                            </div>

                            {/* Sticky Footer Actions */}
                            <div className="bg-primary/5 p-6 md:p-10 border-t border-primary/5 flex flex-col md:flex-row gap-4">
                                <button
                                    onClick={(e) => { e.preventDefault(); handlePrint(); }}
                                    className="flex-1 btn-primary !py-5 flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 group active:scale-95 transition-all"
                                >
                                    <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs tracking-[0.2em] font-black">IMPRIMIR FACTURA</span>
                                </button>
                                <button
                                    onClick={() => generateInvoice({
                                        customer: selectedSale.customers,
                                        order: { total: selectedSale.total + (selectedSale.discount || 0) },
                                        sale: selectedSale,
                                        items: selectedSale.orders?.items || []
                                    }, false)}
                                    className="flex-1 bg-white hover:bg-primary/5 text-primary py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-primary/10 shadow-sm active:scale-95"
                                >
                                    <Download className="w-5 h-5 text-primary/40" /> DESCARGAR PDF
                                </button>
                                <button
                                    onClick={() => shareInvoicePDF({
                                        customer: selectedSale.customers,
                                        order: { total: selectedSale.total + (selectedSale.discount || 0) },
                                        sale: selectedSale,
                                        items: selectedSale.orders?.items || []
                                    })}
                                    className="md:flex-1 p-5 bg-green-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 active:scale-95"
                                >
                                    <Share2 className="w-5 h-5 text-white/60" /> ENVIAR WHATSAPP
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Profit Analysis Modal */}
                {isProfitOpen && selectedSale && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-md" onClick={() => setIsProfitOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[3.5rem] p-10 relative z-10 shadow-3xl border border-primary/20">
                            <div className="flex justify-between items-center mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-serif font-bold italic text-primary">Rentabilidad del Pedido</h3>
                                    <p className="text-[10px] uppercase font-black text-green-600 tracking-widest">Análisis de Costos y Margen</p>
                                </div>
                                <button onClick={() => setIsProfitOpen(false)} className="p-2 hover:bg-primary/5 rounded-full"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="space-y-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="text-[10px] uppercase font-black text-primary/40 border-b border-primary/5">
                                            <tr>
                                                <th className="py-4 px-2">Producto</th>
                                                <th className="py-4 px-2 text-center">Costo Unit.</th>
                                                <th className="py-4 px-2 text-center">Venta Unit.</th>
                                                <th className="py-4 px-2 text-right">Margen</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedSale.orders?.items || []).map((item, i) => {
                                                const cost = item.cost || item.cost_price || 0;
                                                const price = item.price;
                                                const profit = price - cost;
                                                return (
                                                    <tr key={i} className="border-b border-primary/5">
                                                        <td className="py-4 px-2">
                                                            <p className="font-bold text-primary text-sm">{item.name}</p>
                                                            <p className="text-[8px] uppercase font-black text-primary/20">Cant: {item.quantity}</p>
                                                        </td>
                                                        <td className="py-4 px-2 text-center text-red-500 font-bold text-sm">L. {cost}</td>
                                                        <td className="py-4 px-2 text-center text-primary font-bold text-sm">L. {price}</td>
                                                        <td className="py-4 px-2 text-right text-green-600 font-bold text-sm">L. {profit * item.quantity}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="grid grid-cols-3 gap-6 pt-6">
                                    <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10">
                                        <p className="text-[10px] uppercase font-black text-red-500/40 mb-1">Costo Total</p>
                                        <p className="text-2xl font-sans font-bold text-red-600 italic tracking-tighter">L. {(selectedSale.orders?.items || []).reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0)}</p>
                                    </div>
                                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                                        <p className="text-[10px] uppercase font-black text-primary/40 mb-1">Venta Total</p>
                                        <p className="text-2xl font-sans font-bold text-primary italic tracking-tighter">L. {selectedSale.total}</p>
                                    </div>
                                    <div className="p-6 bg-green-500/5 rounded-3xl border border-green-500/10 shadow-xl shadow-green-500/5">
                                        <p className="text-[10px] uppercase font-black text-green-600/40 mb-1">Ganancia Bruta</p>
                                        <p className="text-2xl font-sans font-bold text-green-600 italic tracking-tighter">L. {selectedSale.total - (selectedSale.orders?.items || []).reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0)}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Details Modal */}
                {isDetailsModalOpen && selectedSale && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsDetailsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[3rem] p-10 relative z-10 shadow-2xl border border-primary/10 overflow-y-auto max-h-[80vh]">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-serif font-bold italic text-primary">Detalle Operativo</h3>
                                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-primary/5 rounded-full"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-4 text-center">
                                <p className="text-xs uppercase font-black text-primary/20 tracking-widest italic">Análisis de artículos vendidos</p>
                                <div className="space-y-4">
                                    {(selectedSale.orders?.items || []).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-primary/5 rounded-2xl">
                                            <div className="text-left">
                                                <p className="font-bold text-primary">{item.name}</p>
                                                <p className="text-xs text-primary/40 font-black">CANTIDAD: {item.quantity}</p>
                                            </div>
                                            <p className="font-serif italic font-bold text-primary">L. {item.price * item.quantity}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Edit Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[3rem] p-10 relative z-10 shadow-3xl border border-primary/10">
                            <h3 className="text-2xl font-serif font-bold italic text-primary mb-6">Editar Registro</h3>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setLoading(true);
                                const { error } = await supabase.from('sales').update(editForm).eq('id', selectedSale.id);
                                if (!error) { setIsEditModalOpen(false); fetchSales(); addToast('Venta actualizada'); }
                                else { alert('Error al actualizar'); setLoading(false); }
                            }} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-black text-primary/40 ml-1">Método de Pago</label>
                                    <select
                                        value={editForm.payment_method}
                                        onChange={e => setEditForm({ ...editForm, payment_method: e.target.value })}
                                        className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="Contado">Contado</option>
                                        <option value="Crédito">Crédito</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-black text-primary/40 ml-1">Estado de Pago</label>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setEditForm({ ...editForm, is_paid: true })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editForm.is_paid ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-primary/5 text-primary/40'}`}>Liquidado</button>
                                        <button type="button" onClick={() => setEditForm({ ...editForm, is_paid: false })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!editForm.is_paid ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-primary/5 text-primary/40'}`}>Pendiente</button>
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full btn-primary !py-5 shadow-2xl">{loading ? 'Procesando...' : 'Confirmar Cambios'}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Security Confirmation Modal */}
            <SecurityModal
                isOpen={isSecurityOpen}
                onClose={() => setIsSecurityOpen(false)}
                onConfirm={handleSecurityConfirm}
                title={securityAction?.type === 'delete' ? 'Eliminar Registro' : 'Editar Registro'}
            />
        </div>
    );
};

export default SalesHistory;
