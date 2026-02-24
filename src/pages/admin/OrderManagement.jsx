import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { generateInvoice, shareInvoicePDF } from '../../utils/billing';
import { exportToExcel } from '../../utils/export';
import { CheckCircle2, X, Download, Share2, Filter, Search, Calendar, Landmark, ChevronUp, ChevronDown, Printer, Receipt, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import SecurityModal from '../../components/admin/SecurityModal';
import { useToast } from '../../context/ToastContext';

const OrderManagement = () => {
    const { addToast } = useToast();
    const [orders, setOrders] = useState([]);
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

    const invoiceRef = useRef(null);
    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: `Factura_Luxessence_${lastSaleData?.sale?.id.slice(0, 8)}`,
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const { data } = await supabase.from('orders').select('*, customers(*)').order('created_at', { ascending: false });
        setOrders(data || []);
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
        setSecurityAction({ type: 'delete', id });
        setIsSecurityOpen(true);
    };

    const executeDelete = async (id) => {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (!error) {
            addToast('Pedido eliminado');
            fetchOrders();
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
            await supabase.from('orders').update({ status: 'processed' }).eq('id', selectedOrder.id);

            // Calculate total cost and profit
            const totalCost = selectedOrder.items.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0);
            const totalProfit = finalTotal - totalCost;

            // Update sale with metrics if columns exist
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
            alert('Error al procesar la venta.');
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

    return (
        <div className="space-y-12 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-serif font-bold italic text-primary">Gestión de Pedidos</h1>
                    <p className="text-primary/40 tracking-widest uppercase text-xs font-black">Control de flujo comercial</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleExport} className="glass-panel p-4 rounded-2xl hover:bg-primary/5 text-primary/60 transition-colors">
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6 justify-between items-center glass-panel p-6 rounded-[2rem] border-primary/10 bg-white/40">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar cliente o teléfono..."
                        className="w-full bg-primary/5 border border-primary/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-1 focus:ring-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'all', label: 'Todos', icon: Filter },
                        { id: 'pending', label: 'Por Procesar', icon: Calendar },
                        { id: 'processed', label: 'Completados', icon: CheckCircle2 }
                    ].map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setFilterStatus(btn.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all ${filterStatus === btn.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-primary/5 text-primary/40 hover:bg-primary/10'
                                }`}
                        >
                            <btn.icon className="w-3 h-3" />
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-8">
                {filteredOrders.length === 0 ? (
                    <div className="py-20 text-center italic text-primary/20">No se encontraron pedidos en esta categoría</div>
                ) : (
                    filteredOrders.map((order) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={order.id}
                            className="glass-card p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col lg:flex-row gap-3 md:gap-6 bg-white/40 relative overflow-hidden group border border-primary/5"
                        >
                            {/* Main Info Row (Horizontal on all screens) */}
                            <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-8 min-w-0">
                                <div className="flex justify-between items-center md:block md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-primary/5 pb-2 md:pb-0 md:pr-6">
                                    <div className="space-y-0.5 min-w-0">
                                        <h3 className="text-sm md:text-2xl font-serif italic text-primary truncate">
                                            {order.customers?.first_name} {order.customers?.last_name}
                                        </h3>
                                        <p className="text-[8px] md:text-[10px] text-primary/40 font-bold uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right md:text-left md:mt-3">
                                        <p className="text-lg md:text-3xl font-sans font-black text-primary">L. {Number(order.total).toLocaleString()}</p>
                                        <span className={`inline-block px-1.5 py-0.5 md:px-3 md:py-1 rounded-md text-[7px] md:text-[9px] font-black uppercase tracking-tighter border mt-1 ${order.status === 'pending'
                                            ? 'bg-amber-500/5 text-amber-600 border-amber-500/10'
                                            : 'bg-green-500/5 text-green-600 border-green-500/10'
                                            }`}>
                                            {order.status === 'pending' ? 'Por Procesar' : 'Listo'}
                                        </span>
                                    </div>
                                </div>

                                {/* Details Grid (More compact) */}
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-2 gap-4 min-w-0">
                                    <div className="space-y-1.5 min-w-0">
                                        <p className="text-[7px] md:text-[9px] uppercase tracking-[0.2em] text-primary/30 font-black">Pedido</p>
                                        <div className="space-y-0.5 max-h-16 overflow-y-auto no-scrollbar">
                                            {order.items.map((item, i) => (
                                                <p key={i} className="text-[9px] md:text-sm text-luxury-black/60 truncate">
                                                    <span className="font-black text-primary">x{item.quantity}</span> {item.name}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 min-w-0 border-l border-primary/5 pl-4">
                                        <p className="text-[7px] md:text-[9px] uppercase tracking-[0.2em] text-primary/30 font-black">Entrega</p>
                                        <p className="text-[9px] md:text-sm font-medium text-luxury-black/70 italic line-clamp-1">{order.customers?.address || 'Honduras'}</p>
                                        <p className="text-[9px] md:text-sm font-black text-primary">{order.customers?.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-primary/5">
                                {order.status === 'pending' && (
                                    <button
                                        onClick={() => handleOpenBilling(order)}
                                        className="flex-1 lg:w-32 btn-primary !py-2.5 md:!py-3 text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                                    >
                                        PROCESAR
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="p-2.5 md:p-3 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all shadow-sm border border-red-500/10 active:scale-95 flex items-center justify-center"
                                    title="Cancelar Pedido"
                                >
                                    <X className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
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
                                                <p className="text-xl lg:text-2xl font-mono font-bold text-primary">#LUX-{lastSaleData.sale.id.slice(0, 8).toUpperCase()}</p>
                                                <p className="text-[10px] uppercase font-black text-primary/30 tracking-widest mt-4">Fecha de Emisión</p>
                                                <p className="text-sm font-bold text-primary">{new Date(lastSaleData.sale.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Participants Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-12">
                                        <div className="space-y-4">
                                            <p className="text-[10px] uppercase font-black text-primary/30 tracking-widest border-l-2 border-primary pl-3">Datos del Comprador</p>
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-serif font-bold italic text-primary">{lastSaleData.customer.first_name} {lastSaleData.customer.last_name}</h3>
                                                <div className="text-sm text-primary/60 space-y-1 font-medium">
                                                    <p className="flex items-center gap-2 font-bold"><Phone className="w-4 h-4 text-primary/40" /> {lastSaleData.customer.phone}</p>
                                                    <p className="flex items-start gap-2 max-w-xs">{lastSaleData.customer.address || 'Honduras'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 md:text-right">
                                            <p className="text-[10px] uppercase font-black text-primary/30 tracking-widest md:border-r-2 md:border-primary md:pr-3">Detalles de Venta</p>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-[10px] uppercase font-black text-primary/20">Método de Pago</p>
                                                    <p className="text-sm font-black text-primary uppercase">{lastSaleData.sale.payment_method}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-black text-primary/20">Estado</p>
                                                    <p className={`text-sm font-bold ${lastSaleData.sale.is_paid ? 'text-green-600' : 'text-red-500'}`}>{lastSaleData.sale.is_paid ? 'PAGADO' : 'PENDIENTE'}</p>
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
                                                    {lastSaleData.items.map((item, idx) => (
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
                                                    <span>L. {(lastSaleData.sale.total + (lastSaleData.sale.discount || 0)).toLocaleString()}</span>
                                                </div>
                                                {lastSaleData.sale.discount > 0 && (
                                                    <div className="flex justify-between font-black text-red-500/60 uppercase text-[10px] tracking-widest">
                                                        <span>Incentivo Aplicado</span>
                                                        <span>- L. {lastSaleData.sale.discount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Clean Sans Serif Total */}
                                            <div className="flex justify-between items-end pt-6 border-t border-primary/5 px-4">
                                                <div className="space-y-1">
                                                    <p className="text-[11px] uppercase font-black tracking-[0.2em] text-primary/40">Total a Pagar</p>
                                                    <p className="text-4xl font-sans font-black text-primary tracking-tighter leading-none">
                                                        L. {Number(lastSaleData.sale.total).toLocaleString()}
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
                                    onClick={() => generateInvoice(lastSaleData, false)}
                                    className="flex-1 bg-white hover:bg-primary/5 text-primary py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-primary/10 shadow-sm active:scale-95"
                                >
                                    <Download className="w-5 h-5 text-primary/40" /> DESCARGAR PDF
                                </button>
                                <button
                                    onClick={() => shareInvoicePDF(lastSaleData)}
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
        </div>
    );
};

export default OrderManagement;
