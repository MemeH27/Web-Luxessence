import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToExcel } from '../../utils/export';
import { shareInvoicePNG, downloadInvoicePNG } from '../../utils/billing';
import { Search, Calendar, Download, Trash2, Eye, DollarSign, CreditCard, Receipt, TrendingUp, Share2, Printer, X, ShoppingCart, Percent, Heart, Filter, Phone } from 'lucide-react';
import SecurityModal from '../../components/admin/SecurityModal';
import Pagination from '../../components/admin/Pagination';
import InvoiceTemplate from '../../components/admin/InvoiceTemplate';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';

const SalesHistory = () => {
    const { addToast } = useToast();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPeriod, setFilterPeriod] = useState('all'); // day, week, month, all
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterMethod, setFilterMethod] = useState('all'); // Contado, Crédito, all

    // Server-side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 15;

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Modal States
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [securityAction, setSecurityAction] = useState(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [isProfitOpen, setIsProfitOpen] = useState(false);
    const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ total: 0, discount: 0, payment_method: '', is_paid: false });
    const [paymentForm, setPaymentForm] = useState({ amount: '', notes: '' });
    const [payments, setPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [deleteConfirmSale, setDeleteConfirmSale] = useState(null); // sale waiting for delete confirmation

    const invoiceRef = useRef(null);
    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: `Factura_Luxessence_${selectedSale?.id.slice(0, 8)}`,
    });

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset to first page on search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch sales with server-side pagination and filtering
    useEffect(() => {
        fetchSales();
    }, [currentPage, filterPeriod, filterMethod, selectedDate, debouncedSearch]);

    const buildDateRange = () => {
        let startDate = new Date(selectedDate);
        let endDate = new Date(selectedDate);

        if (filterPeriod === 'day') {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else if (filterPeriod === 'week') {
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else if (filterPeriod === 'month') {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // 'all' - no date filter
            return null;
        }

        return { start: startDate.toISOString(), end: endDate.toISOString() };
    };

    const fetchSales = async () => {
        setLoading(true);
        try {
            const dateRange = buildDateRange();
            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            // Build query with filters
            let query = supabase
                .from('sales')
                .select('*, orders(*, items), customers(*)', { count: 'exact' })
                .order('created_at', { ascending: false });

            // Apply date filter
            if (dateRange) {
                query = query
                    .gte('created_at', dateRange.start)
                    .lte('created_at', dateRange.end);
            }

            // Apply payment method filter
            if (filterMethod !== 'all') {
                query = query.eq('payment_method', filterMethod);
            }

            // Get paginated data
            const { data: salesData, error: salesError, count } = await query
                .range(from, to);

            if (salesError) throw salesError;
            setTotalCount(count || 0);

            if (salesData && salesData.length > 0) {
                const saleIds = salesData.map(s => s.id);

                // Fetch payments for these sales (if table exists)
                let paymentsMap = {};
                try {
                    const { data: paymentsData } = await supabase
                        .from('payments')
                        .select('*')
                        .in('sale_id', saleIds);

                    paymentsMap = (paymentsData || []).reduce((acc, p) => {
                        if (!acc[p.sale_id]) acc[p.sale_id] = [];
                        acc[p.sale_id].push(p);
                        return acc;
                    }, {});
                } catch (paymentsError) {
                    // Table might not exist yet, continue without payments
                    console.warn('Payments table not available:', paymentsError.message);
                }

                // If there's a search term, we need to filter client-side since 
                // Supabase doesn't support full-text search on joined tables easily
                let filteredData = salesData;
                if (debouncedSearch) {
                    filteredData = salesData.filter(s => {
                        const fullName = `${s.customers?.first_name} ${s.customers?.last_name}`.toLowerCase();
                        return fullName.includes(debouncedSearch.toLowerCase()) ||
                            s.id.toLowerCase().includes(debouncedSearch.toLowerCase());
                    });
                }

                // Merge payments into sales
                const mergedSales = filteredData.map(s => ({
                    ...s,
                    payments: paymentsMap[s.id] || []
                }));

                setSales(mergedSales);
            } else {
                setSales([]);
            }
        } catch (err) {
            console.error("Error fetching sales/payments:", err);
            addToast('Error al cargar datos. Verifique si la tabla de pagos fue creada.', 'error');
        } finally {
            setLoading(false);
        }
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
        // Show custom warning: this will also delete the linked order
        const sale = sales.find(s => s.id === id);
        setDeleteConfirmSale(sale);
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
        try {
            const saleToDelete = sales.find(s => s.id === id);
            const items = saleToDelete?.orders?.items || [];

            // 1. Revert stock ONCE (only here, not when deleting the linked order below)
            for (const item of items) {
                const { data: prod } = await supabase.from('products').select('stock').eq('id', item.id || item.product_id).single();
                if (prod) {
                    const revertQty = item.is_combo ? (item.quantity * (item.combo_jibbitz_count || 1)) : item.quantity;
                    await supabase.from('products').update({ stock: prod.stock + revertQty }).eq('id', item.id || item.product_id);
                }
            }

            // 2. Delete related payments
            await supabase.from('payments').delete().eq('sale_id', id);

            // 3. Delete the sale record
            const { error: saleError } = await supabase.from('sales').delete().eq('id', id);
            if (saleError) throw saleError;

            // 4. Delete the linked order WITHOUT restocking again (already done above)
            const orderId = saleToDelete?.order_id || saleToDelete?.orders?.id;
            if (orderId) {
                // Just delete the order record — no restock here
                await supabase.from('orders').delete().eq('id', orderId);
            }

            setSales(prev => prev.filter(s => s.id !== id));
            addToast('Factura anulada. Pedido y stock revertidos correctamente.');
            setDeleteConfirmSale(null);
            fetchSales();
        } catch (err) {
            console.error(err);
            addToast('Error al eliminar registro', 'error');
        }
    };

    const executeEdit = (id) => {
        setIsEditModalOpen(true);
    };

    const handleOpenPayments = async (sale) => {
        setSelectedSale(sale);
        setIsPaymentsModalOpen(true);
        setLoadingPayments(true);
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('sale_id', sale.id)
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setPayments(data || []);
        setLoadingPayments(false);
    };

    const handleAddPayment = async () => {
        if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
            addToast('Ingrese un monto válido', 'error');
            return;
        }

        try {
            const { error } = await supabase
                .from('payments')
                .insert([{
                    sale_id: selectedSale.id,
                    amount: Number(paymentForm.amount),
                    notes: paymentForm.notes
                }]);

            if (error) throw error;

            addToast('Cuota registrada exitosamente');

            // Check if fully paid
            const newTotalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0) + Number(paymentForm.amount);
            const isNowFullyPaid = newTotalPaid >= selectedSale.total;
            if (isNowFullyPaid) {
                await supabase.from('sales').update({ is_paid: true }).eq('id', selectedSale.id);
                // Also update state locally so dashboard refreshes immediately
                setSales(prev => prev.map(s => s.id === selectedSale.id ? { ...s, is_paid: true } : s));
                addToast('¡Venta cancelada en su totalidad!', 'success');
            }

            setPaymentForm({ amount: '', notes: '' });
            handleOpenPayments(selectedSale);
            fetchSales();
        } catch (err) {
            console.error(err);
            addToast('Error al registrar cuota', 'error');
        }
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

    const filteredSales = sales; // Server-side filtered already

    const paginatedSales = filteredSales;

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, filterPeriod, filterMethod, selectedDate]);

    const calculateSaleMetrics = (sale) => {
        const cost = sale.total_cost || sale.orders?.items?.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0) || 0;
        const profit = sale.total_profit || (sale.total - cost);
        return { cost, profit };
    };

    // For credit sales, pending = total - already paid; for contado unpaid = full total
    const getPendingBalance = (sale) => {
        if (sale.is_paid) return 0;
        const paid = (sale.payments || []).reduce((acc, p) => acc + Number(p.amount), 0);
        return Math.max(0, sale.total - paid);
    };

    const metrics = {
        total: filteredSales.reduce((acc, curr) => acc + curr.total, 0),
        pending: filteredSales.reduce((acc, curr) => acc + getPendingBalance(curr), 0),
        cost: filteredSales.reduce((acc, curr) => acc + calculateSaleMetrics(curr).cost, 0),
        profit: filteredSales.reduce((acc, curr) => acc + calculateSaleMetrics(curr).profit, 0),
        count: filteredSales.length
    };

    return (
        <div className="space-y-6 md:space-y-12 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-serif font-black italic text-primary leading-tight">Libro de Ventas</h1>
                    <p className="text-primary/40 font-medium italic">Historial oficial de transacciones y análisis de rentabilidad.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleExport} className="glass-panel p-3 md:p-5 rounded-xl md:rounded-2xl hover:bg-primary/5 text-primary/60 transition-colors shadow-sm">
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="space-y-5 md:space-y-8">
                {/* Main Content - Full Width */}
                <div className="space-y-5 md:space-y-8">
                    {/* Filters Bar */}
                    <div className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border-primary/10 bg-white/40 space-y-4 md:space-y-6">
                        <div className="flex flex-col xl:flex-row gap-4 md:gap-6 items-center justify-between">
                            <div className="relative w-full xl:w-96 group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente o ID..."
                                    className="w-full bg-primary/5 border border-primary/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-14 md:pl-16 pr-4 md:pr-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner text-sm md:text-base"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full xl:w-auto">
                                <div className="flex bg-primary/10 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-primary/5 overflow-hidden">
                                    {['all', 'day', 'week', 'month'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setFilterPeriod(p)}
                                            className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] uppercase font-black tracking-wider md:tracking-widest transition-all ${filterPeriod === p ? 'bg-primary text-secondary-light shadow-lg' : 'text-primary/40 hover:text-primary'
                                                }`}
                                        >
                                            {p === 'all' ? 'Todo' : p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
                                        </button>
                                    ))}
                                </div>

                                {filterPeriod !== 'all' && (
                                    <div className="flex items-center gap-2 md:gap-3 bg-white px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-primary/5 shadow-sm transition-all animate-in fade-in slide-in-from-right-2">
                                        <Calendar className="w-4 h-4 text-primary/30" />
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-primary focus:ring-0 outline-none cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:gap-4 border-t border-primary/5 pt-4 md:pt-6">
                            <span className="text-[9px] md:text-[10px] uppercase font-black text-primary/20 tracking-widest mr-1 md:mr-2">Método:</span>
                            {['all', 'Contado', 'Crédito'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setFilterMethod(m)}
                                    className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider md:tracking-widest border transition-all ${filterMethod === m
                                        ? 'bg-primary/5 border-primary text-primary'
                                        : 'border-primary/5 text-primary/40 hover:border-primary/20'}`}
                                >
                                    {m === 'all' ? 'Todos' : m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Card/List View */}
                    <div className="glass-panel rounded-2xl md:rounded-[3rem] overflow-hidden border-primary/10 shadow-sm bg-white/40">
                        {loading ? (
                            <div className="p-10 md:p-20 text-center animate-pulse italic text-primary/20 text-sm md:text-base">Cargando registros históricos...</div>
                        ) : paginatedSales.length === 0 ? (
                            <div className="p-16 md:p-32 text-center italic text-primary/20 flex flex-col items-center gap-4 md:gap-6">
                                <Receipt className="w-16 h-16 opacity-10" />
                                <p className="text-xl font-serif">No se encontraron ventas para este periodo</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-primary/5">
                                {paginatedSales.map((sale) => (
                                    <div key={sale.id} className="p-5 md:p-8 space-y-4 md:space-y-6 hover:bg-primary/[0.02] transition-all">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-primary uppercase">{sale.customers?.first_name} {sale.customers?.last_name}</p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[10px] text-primary/30 font-bold italic">{new Date(sale.created_at).toLocaleDateString()}</p>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${sale.payment_method === 'Contado' ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                                        {sale.payment_method}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-2xl font-sans font-black text-primary tracking-tighter">L. {sale.total.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-primary/5 pt-4 md:pt-6">
                                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                                <button onClick={() => { setSelectedSale(sale); setIsInvoiceOpen(true); }} className="p-4 bg-primary/5 rounded-2xl text-primary/40 active:bg-primary active:text-white transition-all" title="Ver Factura"><Receipt className="w-5 h-5" /></button>
                                                {sale.payment_method === 'Crédito' && (
                                                    <button onClick={() => handleOpenPayments(sale)} className="p-4 bg-orange-500/5 rounded-2xl text-orange-500/40 active:bg-orange-600 active:text-white transition-all" title="Cuotas"><CreditCard className="w-5 h-5" /></button>
                                                )}
                                                <button onClick={() => { setSelectedSale(sale); setIsProfitOpen(true); }} className="p-4 bg-green-500/5 rounded-2xl text-green-600/40 active:bg-green-600 active:text-white transition-all" title="Rentabilidad"><TrendingUp className="w-5 h-5" /></button>
                                                <button onClick={() => handleDeleteSale(sale.id)} className="p-4 bg-red-500/5 rounded-2xl text-red-500/40 active:bg-red-500 active:text-white transition-all" title="Anular"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                            <span className="text-[9px] font-mono font-bold text-primary/20 uppercase tracking-[0.3em]">#{sale.id.slice(0, 6)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalCount}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            <SecurityModal
                isOpen={isSecurityOpen}
                onClose={() => { setIsSecurityOpen(false); setSecurityAction(null); }}
                onConfirm={handleSecurityConfirm}
            />

            {/* Custom Delete Warning Modal for Sales */}
            <AnimatePresence>
                {deleteConfirmSale && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmSale(null)}
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
                                <h3 className="text-2xl font-serif font-bold italic text-primary">¿Anular Factura?</h3>
                                <p className="text-sm text-primary/50 leading-relaxed">
                                    Esta acción eliminará permanentemente la factura de{' '}
                                    <span className="font-bold text-primary">
                                        {deleteConfirmSale.customers?.first_name} {deleteConfirmSale.customers?.last_name}
                                    </span>{' '}
                                    por <span className="font-bold text-primary">L. {deleteConfirmSale.total?.toLocaleString()}</span>.
                                </p>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">⚠ Esto también hará:</p>
                                <ul className="text-xs text-amber-700 space-y-1 mt-2">
                                    <li>• Eliminará el pedido del historial del cliente ("Mis Pedidos")</li>
                                    <li>• Revertirá el stock de los productos <span className="font-bold">una sola vez</span></li>
                                    <li>• Borrará todos los abonos/cuotas registrados</li>
                                </ul>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmSale(null)}
                                    className="flex-1 py-4 bg-primary/5 text-primary rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-primary/10 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setSecurityAction({ type: 'delete', id: deleteConfirmSale.id });
                                        setIsSecurityOpen(true);
                                        setDeleteConfirmSale(null);
                                    }}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-200"
                                >
                                    Sí, Anular
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {isDetailsModalOpen && selectedSale && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailsModalOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl">
                            <div className="p-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-serif font-bold italic text-primary">Detalle de Productos</h3>
                                        <p className="text-[10px] text-primary/30 uppercase font-black tracking-widest">Garantía de Autenticidad Luxessence</p>
                                    </div>
                                    <button onClick={() => setIsDetailsModalOpen(false)} className="p-4 hover:bg-primary/5 rounded-2xl transition-colors"><X className="w-6 h-6 text-primary/20" /></button>
                                </div>

                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                                    {selectedSale.orders?.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-primary/5 rounded-2xl border border-primary/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-serif italic text-primary font-bold shadow-sm">{idx + 1}</div>
                                                <div>
                                                    <p className="font-bold text-primary">{item.name}</p>
                                                    <p className="text-[10px] text-primary/40 uppercase font-black">Cant: {item.quantity} × L. {item.price}</p>
                                                </div>
                                            </div>
                                            <p className="font-sans font-bold text-primary">L. {(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-8 border-t border-primary/5 flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-primary/30 uppercase font-black">Monto Transaccionado</p>
                                        <p className="text-4xl font-sans font-black text-primary tracking-tighter italic">L. {selectedSale.total.toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => setIsDetailsModalOpen(false)} className="btn-primary !py-4 !px-8">Cerrar Detalle</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isInvoiceOpen && selectedSale && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsInvoiceOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-primary/5 flex justify-between items-center bg-primary/5">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Factura Digital</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => shareInvoicePNG(invoiceRef.current, selectedSale)}
                                        className="p-3 bg-white hover:bg-green-500 hover:text-white rounded-xl transition-all shadow-sm text-primary"
                                        title="Enviar por WhatsApp/Compartir"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => downloadInvoicePNG(invoiceRef.current, selectedSale)}
                                        className="p-3 bg-white hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm text-primary"
                                        title="Descargar Foto"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button onClick={handlePrint} className="p-3 bg-white hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm text-primary" title="Imprimir"><Printer className="w-4 h-4" /></button>
                                    <button onClick={() => setIsInvoiceOpen(false)} className="p-3 bg-white hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm text-primary" title="Cerrar"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <InvoiceTemplate ref={invoiceRef} saleData={selectedSale} />
                            </div>
                        </motion.div>
                    </div>
                )}

                {isProfitOpen && selectedSale && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-luxury-black">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProfitOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="p-10 space-y-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-serif font-bold italic text-primary">Análisis de Rentabilidad</h3>
                                    <p className="text-[10px] text-primary/30 uppercase font-black">ID: #{selectedSale.id.slice(0, 8)}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-6 bg-primary/5 rounded-2xl flex justify-between items-center border border-primary/5">
                                        <span className="text-xs font-bold text-primary/60 italic">Venta Bruta</span>
                                        <span className="text-xl font-sans font-black text-primary">L. {selectedSale.total.toLocaleString()}</span>
                                    </div>
                                    <div className="p-6 bg-red-500/5 rounded-2xl flex justify-between items-center border border-red-500/5">
                                        <span className="text-xs font-bold text-red-500/60 italic">Costo de Mercancía</span>
                                        <span className="text-xl font-sans font-black text-red-500">L. {calculateSaleMetrics(selectedSale).cost.toLocaleString()}</span>
                                    </div>
                                    <div className="p-8 bg-green-500/10 rounded-3xl flex flex-col items-center gap-2 border-2 border-green-500/20 shadow-inner">
                                        <span className="text-[10px] font-black uppercase text-green-600 tracking-widest">Utilidad Real Generada</span>
                                        <span className="text-4xl font-sans font-black text-green-600 italic">L. {calculateSaleMetrics(selectedSale).profit.toLocaleString()}</span>
                                        <span className="text-[8px] text-green-600/40 font-black uppercase">
                                            +{calculateSaleMetrics(selectedSale).cost > 0
                                                ? ((calculateSaleMetrics(selectedSale).profit / calculateSaleMetrics(selectedSale).cost) * 100).toFixed(1)
                                                : '0.0'}% ROI
                                        </span>
                                    </div>
                                </div>

                                <button onClick={() => setIsProfitOpen(false)} className="w-full btn-primary !py-4">Entendido</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isPaymentsModalOpen && selectedSale && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-luxury-black">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPaymentsModalOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl">
                            <div className="p-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-serif font-bold italic text-primary">Control de Cuotas</h3>
                                        <p className="text-[10px] text-primary/30 uppercase font-black tracking-widest">Saldo Pendiente: L. {(selectedSale.total - payments.reduce((acc, p) => acc + Number(p.amount), 0)).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => setIsPaymentsModalOpen(false)} className="p-4 hover:bg-primary/5 rounded-2xl transition-colors"><X className="w-6 h-6 text-primary/20" /></button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Register Payment Form */}
                                    <div className="space-y-6 bg-primary/5 p-8 rounded-[2rem]">
                                        <h4 className="text-[10px] uppercase font-black text-primary/40 tracking-widest">Registrar Nuevo Pago</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-primary/30 ml-2">Monto a Abonar (L.)</label>
                                                <input
                                                    type="number"
                                                    className="w-full p-4 rounded-xl border border-primary/10 focus:ring-1 focus:ring-primary outline-none font-bold"
                                                    value={paymentForm.amount}
                                                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-primary/30 ml-2">Notas / Observaciones</label>
                                                <textarea
                                                    className="w-full p-4 rounded-xl border border-primary/10 focus:ring-1 focus:ring-primary outline-none text-sm min-h-[100px]"
                                                    value={paymentForm.notes}
                                                    onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                                    placeholder="Ejem: Pago parcial en efectivo..."
                                                />
                                            </div>
                                            <button
                                                onClick={handleAddPayment}
                                                className="w-full btn-primary !py-4"
                                            >
                                                Registrar Cuota
                                            </button>
                                        </div>
                                    </div>

                                    {/* Payments History */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] uppercase font-black text-primary/40 tracking-widest">Historial de Abonos</h4>
                                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                            {loadingPayments ? (
                                                <div className="text-center py-10 italic text-primary/20">Cargando abonos...</div>
                                            ) : payments.length === 0 ? (
                                                <div className="text-center py-10 italic text-primary/20 border-2 border-dashed border-primary/5 rounded-[2rem]">No se han registrado cuotas aún</div>
                                            ) : payments.map((p, idx) => (
                                                <div key={idx} className="p-4 bg-white border border-primary/5 rounded-2xl flex justify-between items-center shadow-sm">
                                                    <div>
                                                        <p className="text-xs font-bold text-primary">{new Date(p.created_at).toLocaleDateString()}</p>
                                                        <p className="text-[9px] text-primary/40 font-black uppercase tracking-widest italic">{p.notes || 'Sin nota'}</p>
                                                    </div>
                                                    <p className="text-lg font-black text-primary">L. {Number(p.amount).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SalesHistory;
