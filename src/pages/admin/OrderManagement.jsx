import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { shareInvoicePNG, downloadInvoicePNG } from '../../utils/billing';
import { exportToExcel } from '../../utils/export';
import { CheckCircle2, X, Download, Share2, Filter, Search, Calendar, Landmark, ChevronUp, ChevronDown, Printer, Receipt, Phone, Edit3, Trash2, ListChecks, TrendingUp, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import SecurityModal from '../../components/admin/SecurityModal';
import Pagination from '../../components/admin/Pagination';
import InvoiceTemplate from '../../components/admin/InvoiceTemplate';
import { useToast } from '../../context/ToastContext';

const OrderManagement = () => {
    const { addToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Contado');
    const [filterStatus, setFilterStatus] = useState('pending');
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPostSaleModal, setShowPostSaleModal] = useState(false);
    const [lastSaleData, setLastSaleData] = useState(null);
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [securityAction, setSecurityAction] = useState(null);
    const [deleteConfirmOrder, setDeleteConfirmOrder] = useState(null); // order waiting confirm

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const invoiceRef = useRef(null);
    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: `Factura_Luxessence_${lastSaleData?.sale?.id.slice(0, 8)}`,
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        const { data } = await supabase.from('orders').select('*, customers(*)').order('created_at', { ascending: false });
        setOrders(data || []);
        setLoading(false);
    };

    const handleSecurityConfirm = () => {
        if (!securityAction) return;
        if (securityAction.type === 'delete') {
            executeDelete(securityAction.id);
        } else if (securityAction.type === 'process') {
            executeProcessSale();
        }
        setSecurityAction(null);
    };

    const handleDeleteOrder = (id) => {
        const order = orders.find(o => o.id === id);
        if (order?.status === 'processed') {
            // Show custom warning: deleting a processed order also removes the sale record
            setDeleteConfirmOrder(order);
        } else {
            // Normal unprocessed order — use standard security modal
            setSecurityAction({ type: 'delete', id });
            setIsSecurityOpen(true);
        }
    };

    const executeDelete = async (id) => {
        try {
            const orderToDelete = orders.find(o => o.id === id);
            if (!orderToDelete) return;

            if (orderToDelete.status === 'processed') {
                // Processed order: restock ONCE here, then delete linked sale and payments
                for (const item of orderToDelete.items) {
                    const { data: prod } = await supabase.from('products').select('stock').eq('id', item.id || item.product_id).single();
                    if (prod) {
                        await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.id || item.product_id);
                    }
                }
                // Delete linked payments first (FK constraint)
                const { data: linkedSale } = await supabase.from('sales').select('id').eq('order_id', id).single();
                if (linkedSale) {
                    await supabase.from('payments').delete().eq('sale_id', linkedSale.id);
                }
                // Delete linked sale record
                await supabase.from('sales').delete().eq('order_id', id);
            }

            // Delete the order itself
            const { error } = await supabase.from('orders').delete().eq('id', id);
            if (!error) {
                addToast(orderToDelete.status === 'processed'
                    ? 'Pedido y factura anulados. Stock revertido correctamente.'
                    : 'Pedido eliminado.');
                setDeleteConfirmOrder(null);
                fetchOrders();
            } else {
                throw error;
            }
        } catch (err) {
            console.error(err);
            addToast('Error al eliminar el pedido.', 'error');
        }
    };

    const handleOpenBilling = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleProcessSale = () => {
        setSecurityAction({ type: 'process' });
        setIsSecurityOpen(true);
    };

    const handleExport = () => {
        const exportData = orders.map(o => ({
            ID: o.id.slice(0, 8),
            Cliente: `${o.customers?.first_name} ${o.customers?.last_name}`,
            Estado: o.status,
            Total: o.total,
            Artículos: o.items.map(i => `${i.name} (x${i.quantity})`).join(', ')
        }));
        exportToExcel(exportData, 'Pedidos_Luxessence', 'Pedidos');
    };

    const executeProcessSale = async () => {
        setProcessing(true);
        try {
            const finalTotal = selectedOrder.total - Number(discount);
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    order_id: selectedOrder.id,
                    customer_id: selectedOrder.customer_id,
                    total: finalTotal,
                    discount: Number(discount),
                    payment_method: paymentMethod,
                    is_paid: paymentMethod === 'Contado'
                })
                .select().single();

            if (saleError) throw saleError;

            // Update Stock
            for (const item of selectedOrder.items) {
                const { data: prod } = await supabase.from('products').select('stock').eq('id', item.id || item.product_id).single();
                if (prod) {
                    const newStock = Math.max(0, prod.stock - item.quantity);
                    await supabase.from('products').update({ stock: newStock }).eq('id', item.id || item.product_id);
                }
            }

            await supabase.from('orders').update({ status: 'processed' }).eq('id', selectedOrder.id);

            const totalCost = selectedOrder.items.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0);
            const totalProfit = finalTotal - totalCost;

            await supabase.from('sales').update({
                total_cost: totalCost,
                total_profit: totalProfit
            }).eq('id', sale.id);

            const billingData = {
                customer: selectedOrder.customers,
                order: selectedOrder,
                sale: { ...sale, total: finalTotal },
                items: selectedOrder.items
            };

            setLastSaleData(billingData);
            setIsModalOpen(false);
            setShowPostSaleModal(true);
            fetchOrders();
        } catch (error) {
            console.error(error);
            addToast('Error al procesar la venta.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = `${o.customers?.first_name} ${o.customers?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.customers?.phone.includes(searchTerm);

        const matchesStatus = filterStatus === 'all' || o.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    return (
        <div className="space-y-6 md:space-y-12 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold italic text-primary">Gestión de Pedidos</h1>
                    <p className="text-primary/40 font-medium italic">Monitor de flujo comercial y facturación en tiempo real.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleExport} className="glass-panel p-3 md:p-5 rounded-xl md:rounded-2xl hover:bg-primary/5 text-primary/60 transition-colors shadow-sm">
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-5 md:space-y-8">
                    {/* Integrated Search & Filter Bar */}
                    <div className="flex flex-col xl:flex-row gap-4 md:gap-6 items-center justify-between glass-panel p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border-primary/10 bg-white/40">
                        <div className="relative w-full xl:w-80 group shrink-0">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="w-full bg-primary/5 border border-primary/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-14 md:pl-16 pr-4 md:pr-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner text-sm md:text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap justify-center bg-primary/5 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-primary/5 w-full xl:w-auto">
                            {[
                                { id: 'all', label: 'Todos', icon: Filter },
                                { id: 'pending', label: 'Pendientes', icon: Calendar },
                                { id: 'processed', label: 'Listos', icon: CheckCircle2 }
                            ].map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => setFilterStatus(btn.id)}
                                    className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] uppercase font-black tracking-wider md:tracking-widest transition-all whitespace-nowrap ${filterStatus === btn.id
                                        ? 'bg-primary text-white shadow-xl'
                                        : 'text-primary/40 hover:text-primary'
                                        }`}
                                >
                                    <btn.icon className="w-3.5 h-3.5" />
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-32 md:h-40 glass-panel animate-pulse rounded-2xl md:rounded-[2.5rem] bg-white/40" />)
                        ) : paginatedOrders.length === 0 ? (
                            <div className="py-10 md:py-20 text-center italic text-primary/20 text-sm md:text-base bg-white/40 rounded-2xl md:rounded-[2.5rem] border border-dashed border-primary/10">No se encontraron pedidos en esta categoría</div>
                        ) : (
                            paginatedOrders.map((order) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={order.id}
                                    className="p-5 md:p-10 bg-white hover:bg-primary/[0.02] rounded-2xl md:rounded-[3rem] border border-primary/5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col md:flex-row items-center gap-5 md:gap-10 group"
                                >
                                    <div className="flex-1 flex flex-col md:flex-row gap-5 md:gap-10 w-full">
                                        <div className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-primary/5 pb-4 md:pb-0 md:pr-10">
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-serif font-bold italic text-primary leading-tight">
                                                    {order.customers?.first_name} {order.customers?.last_name}
                                                </h3>
                                                <p className="text-[10px] text-primary/40 font-black uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="mt-3 md:mt-6 flex items-end gap-2">
                                                <span className="text-3xl font-sans font-black text-primary">L. {Number(order.total).toLocaleString()}</span>
                                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border mb-1.5 ${order.status === 'pending'
                                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                    : 'bg-green-500/10 text-green-600 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                                                    }`}>
                                                    {order.status === 'pending' ? 'Por Procesar' : 'Facturado'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full">
                                            <div className="space-y-4">
                                                <p className="text-[9px] uppercase tracking-[0.3em] text-primary/30 font-black">Detalle del Pedido</p>
                                                <div className="space-y-2 max-h-24 overflow-y-auto no-scrollbar scroll-smooth p-1">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex items-center gap-3 text-sm">
                                                            <span className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center font-black text-primary text-[10px]">x{item.quantity}</span>
                                                            <span className="text-primary/60 font-medium italic truncate">{item.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-4 md:border-l border-primary/5 md:pl-8">
                                                <p className="text-[9px] uppercase tracking-[0.3em] text-primary/30 font-black">Entrega y Contacto</p>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-primary/80 italic flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/20 shrink-0 mt-2" />
                                                        {order.customers?.address || 'Honduras'}
                                                    </p>
                                                    <p className="text-sm font-black text-primary flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5 opacity-30" /> {order.customers?.phone}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-primary/5">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleOpenBilling(order)}
                                                className="flex-1 md:w-40 bg-primary text-secondary-light py-4 md:py-5 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3"
                                            >
                                                <Receipt className="w-4 h-4" /> FACTURAR
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteOrder(order.id)}
                                            className="p-4 md:p-5 bg-white hover:bg-red-500 text-red-500/40 hover:text-white rounded-xl md:rounded-2xl transition-all border border-primary/5 active:scale-95 flex items-center justify-center shadow-sm"
                                            title="Cancelar Pedido"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredOrders.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Sidebar Widget */}
                <div className="space-y-5 md:space-y-8">
                    <div className="bg-primary p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] text-secondary-light space-y-6 md:space-y-10 shadow-3xl relative overflow-hidden">
                        <div className="space-y-2 md:space-y-4 relative z-10">
                            <h2 className="text-2xl md:text-3xl font-serif font-bold italic">Resumen Comercial</h2>
                            <p className="text-secondary-light/40 text-xs font-medium uppercase tracking-[0.2em]">Kpis de Pedidos</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:gap-6 relative z-10">
                            <div className="bg-white/5 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/10 group hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-light/40 mb-2 md:mb-3">Pendientes de Cobro</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-2xl md:text-3xl font-serif font-bold italic text-amber-500">L. {orders.filter(o => o.status === 'pending').reduce((acc, o) => acc + o.total, 0).toLocaleString()}</p>
                                    <Calendar className="w-8 h-8 opacity-20" />
                                </div>
                            </div>

                            <div className="bg-white/5 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/10 group hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-light/40 mb-2 md:mb-3">Volumen Total Procesado</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-2xl md:text-3xl font-serif font-bold italic text-secondary">L. {orders.filter(o => o.status === 'processed').reduce((acc, o) => acc + o.total, 0).toLocaleString()}</p>
                                    <TrendingUp className="w-8 h-8 opacity-20" />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 md:p-8 bg-secondary/10 rounded-2xl md:rounded-[2.5rem] border border-secondary/20 relative z-10">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" /> Flujo de Ventas
                            </p>
                            <p className="text-xs italic leading-relaxed">
                                Tienes <span className="text-secondary font-bold">{orders.filter(o => o.status === 'pending').length} pedidos</span> esperando ser facturados.
                                Procesa los más antiguos para mantener el flujo de caja.
                            </p>
                        </div>

                        {/* Ambient Decoration */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full blur-3xl opacity-50" />
                    </div>

                    <div className="bg-white border border-secondary/20 p-5 md:p-8 rounded-2xl md:rounded-[3rem] space-y-4 md:space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 text-primary">
                            <ListChecks className="w-5 h-5" />
                            <h4 className="font-serif font-bold italic">Sincronización Operativa</h4>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest group">
                                <span className="text-primary/40 group-hover:text-primary transition-colors">Base de Datos:</span>
                                <span className="text-green-500 flex items-center gap-2">En Línea <CheckCircle2 className="w-3 h-3" /></span>
                            </li>
                            <li className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest group">
                                <span className="text-primary/40 group-hover:text-primary transition-colors">Cola de Facturas:</span>
                                <span className="text-green-500 flex items-center gap-2">Vacía <CheckCircle2 className="w-3 h-3" /></span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Billing Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-secondary-light w-full max-w-lg rounded-[4rem] p-10 md:p-14 relative z-10 shadow-3xl border border-primary/10">
                            <div className="space-y-2 mb-10 text-center">
                                <Landmark className="w-16 h-16 text-primary mx-auto opacity-30 mb-4" />
                                <h3 className="text-3xl font-serif italic text-primary">Liquidación de Venta</h3>
                                <p className="text-[10px] text-primary/40 uppercase tracking-[0.2em] font-black">Conciliación Financiera</p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Estructura de Pago</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Contado', 'Crédito'].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setPaymentMethod(m)}
                                                className={`py-5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all border ${paymentMethod === m
                                                    ? 'bg-primary text-secondary-light border-primary shadow-xl shadow-primary/20 scale-105'
                                                    : 'bg-white border-primary/10 text-primary/40 hover:bg-primary/5'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Incentivo / Descuento (L)</label>
                                    <div className="flex items-center gap-4 bg-white border border-primary/10 rounded-2xl p-2 shadow-sm">
                                        <button onClick={() => setDiscount(Math.max(0, Number(discount) - 50))} className="p-4 hover:bg-primary/5 rounded-xl text-primary/40 transition-colors"><ChevronDown className="w-5 h-5" /></button>
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(e.target.value)}
                                            className="w-full bg-transparent border-none text-center font-serif font-bold text-2xl text-primary outline-none"
                                        />
                                        <button onClick={() => setDiscount(Number(discount) + 50)} className="p-4 hover:bg-primary/5 rounded-xl text-primary/40 transition-colors"><ChevronUp className="w-5 h-5" /></button>
                                    </div>
                                </div>

                                <div className="bg-primary/5 p-8 rounded-[2.5rem] space-y-4 border border-primary/5 shadow-inner">
                                    <div className="flex justify-between text-xs text-primary/40 uppercase tracking-widest font-bold">
                                        <span>Subtotal Neto</span>
                                        <span>L. {selectedOrder?.total}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-red-600/60 uppercase tracking-widest font-black italic">
                                        <span>Aplicación de Descuento</span>
                                        <span>- L. {discount || 0}</span>
                                    </div>
                                    <div className="pt-6 border-t border-primary/10 flex justify-between items-end">
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/40">Total a Percibir</span>
                                        <span className="text-4xl font-serif font-bold text-primary tracking-tighter">L. {selectedOrder?.total - (discount || 0)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleProcessSale}
                                    disabled={processing}
                                    className="w-full btn-primary !py-6 text-xs uppercase tracking-widest font-black shadow-2xl flex items-center justify-center gap-4"
                                >
                                    {processing ? 'Generando PDF...' : 'FINALIZAR Y DESCARGAR FACTURAS'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Post-Sale Invoice & Sharing Modal */}
            <AnimatePresence>
                {showPostSaleModal && lastSaleData && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={() => setShowPostSaleModal(false)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-4xl max-h-[95vh] rounded-[2rem] md:rounded-[3rem] shadow-4xl relative overflow-hidden flex flex-col z-[310]"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowPostSaleModal(false)}
                                className="absolute top-6 right-6 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all z-50 lg:p-3"
                            >
                                <X className="w-5 h-5 lg:w-6 h-6" />
                            </button>

                            {/* Success Banner */}
                            <div className="bg-green-600 p-4 text-center">
                                <p className="text-white text-[10px] uppercase font-black tracking-[0.3em] flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Venta Procesada Exitosamente
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <InvoiceTemplate ref={invoiceRef} saleData={lastSaleData} />
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
                                    onClick={() => downloadInvoicePNG(invoiceRef.current, lastSaleData)}
                                    className="flex-1 bg-white hover:bg-primary/5 text-primary py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-primary/10 shadow-sm active:scale-95"
                                >
                                    <Download className="w-5 h-5 text-primary/40" /> DESCARGAR FOTO
                                </button>
                                <button
                                    onClick={() => shareInvoicePNG(invoiceRef.current, lastSaleData)}
                                    className="md:flex-1 p-5 bg-green-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 active:scale-95"
                                >
                                    <Share2 className="w-5 h-5 text-white/60" /> ENVIAR WHATSAPP
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SecurityModal
                isOpen={isSecurityOpen}
                onClose={() => setIsSecurityOpen(false)}
                onConfirm={handleSecurityConfirm}
                title={securityAction?.type === 'delete' ? 'Eliminar Pedido' : 'Autorizar Facturación'}
            />

            {/* Custom Warning Modal for deleting PROCESSED orders */}
            <AnimatePresence>
                {deleteConfirmOrder && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmOrder(null)}
                            className="absolute inset-0 bg-primary/30 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl space-y-6 z-10"
                        >
                            <div className="w-16 h-16 bg-red-100 rounded-[1.5rem] flex items-center justify-center mx-auto">
                                <Trash2 className="w-8 h-8 text-red-600" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-serif font-bold italic text-primary">¿Anular Pedido Facturado?</h3>
                                <p className="text-sm text-primary/50 leading-relaxed">
                                    El pedido de{' '}
                                    <span className="font-bold text-primary">
                                        {deleteConfirmOrder.customers?.first_name} {deleteConfirmOrder.customers?.last_name}
                                    </span>{' '}
                                    ya fue facturado y está registrado en el Libro de Ventas.
                                </p>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">⚠ Esto también hará:</p>
                                <ul className="text-xs text-amber-700 space-y-1 mt-2">
                                    <li>• Eliminará la factura del Libro de Ventas</li>
                                    <li>• Revertirá el stock de los productos <span className="font-bold">una sola vez</span></li>
                                    <li>• Borrará los abonos/cuotas registrados de esa venta</li>
                                </ul>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmOrder(null)}
                                    className="flex-1 py-4 bg-primary/5 text-primary rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-primary/10 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => executeDelete(deleteConfirmOrder.id)}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-200"
                                >
                                    Sí, Anular Todo
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderManagement;
