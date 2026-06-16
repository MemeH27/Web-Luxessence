import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToExcel } from '../../utils/export';
import { shareInvoicePNG, downloadInvoicePNG } from '../../utils/billing';
import { Search, Calendar, Download, Trash2, Eye, DollarSign, CreditCard, Receipt, TrendingUp, Share2, Printer, X, ShoppingCart, Percent, Heart, Filter, Phone, Pencil, Check, FileText } from 'lucide-react';
import SecurityModal from '../../components/admin/SecurityModal';
import { jsPDF } from 'jspdf';
import Pagination from '../../components/admin/Pagination';
import InvoiceTemplate from '../../components/admin/InvoiceTemplate';
import NewSaleModal from '../../components/admin/NewSaleModal';
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
    const [creditStatus, setCreditStatus] = useState('all'); // pending, paid, all
    const [allProducts, setAllProducts] = useState([]);

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
    const [isEditMinimized, setIsEditMinimized] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ total: 0, discount: 0, payment_method: '', is_paid: false });
    const [paymentForm, setPaymentForm] = useState({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] });
    const [payments, setPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [deleteConfirmSale, setDeleteConfirmSale] = useState(null); // sale waiting for delete confirmation
    const [selectedPaymentForAction, setSelectedPaymentForAction] = useState(null); // payment undergoing security action
    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', notes: '', date: '' });

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

    // Fetch sales and products
    useEffect(() => {
        fetchSales();
        fetchAllProducts();
    }, [currentPage, filterPeriod, filterMethod, creditStatus, selectedDate, debouncedSearch]);

    const fetchAllProducts = async () => {
        const { data } = await supabase.from('products').select('id, cost, name, price');
        setAllProducts(data || []);
    };

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
                
                // If filtering by Credit, we can also filter by payment status
                if (filterMethod === 'Crédito' && creditStatus !== 'all') {
                    query = query.eq('is_paid', creditStatus === 'paid');
                }
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
        } else if (securityAction.type === 'deletePayment') {
            executeDeletePayment(securityAction.paymentId, securityAction.payment);
        } else if (securityAction.type === 'editPayment') {
            executeEditPayment(securityAction.paymentId, securityAction.editData);
        }
        setSecurityAction(null);
    };

    const executeDeletePayment = async (paymentId, payment) => {
        try {
            const { error } = await supabase.from('payments').delete().eq('id', paymentId);
            if (error) throw error;

            addToast('Cuota eliminada correctamente');
            
            // Recalculate if still fully paid
            const remainingPayments = payments.filter(p => p.id !== paymentId);
            const newTotalPaid = remainingPayments.reduce((acc, p) => acc + Number(p.amount), 0);
            const isFullyPaid = newTotalPaid >= selectedSale.total;
            
            // Update the sale status in database and state
            await supabase.from('sales').update({ is_paid: isFullyPaid }).eq('id', selectedSale.id);
            setSales(prev => prev.map(s => s.id === selectedSale.id ? { ...s, is_paid: isFullyPaid } : s));

            handleOpenPayments(selectedSale);
            fetchSales();
        } catch (err) {
            console.error(err);
            addToast('Error al eliminar cuota', 'error');
        }
    };

    const executeEditPayment = async (paymentId, editData) => {
        try {
            const { error } = await supabase
                .from('payments')
                .update({
                    amount: Number(editData.amount),
                    notes: editData.notes,
                    created_at: editData.created_at
                })
                .eq('id', paymentId);

            if (error) throw error;

            addToast('Cuota modificada correctamente');
            
            // Recalculate if still fully paid
            const updatedPayments = payments.map(p => p.id === paymentId ? { ...p, amount: Number(editData.amount) } : p);
            const newTotalPaid = updatedPayments.reduce((acc, p) => acc + Number(p.amount), 0);
            const isFullyPaid = newTotalPaid >= selectedSale.total;

            // Update sale status
            await supabase.from('sales').update({ is_paid: isFullyPaid }).eq('id', selectedSale.id);
            setSales(prev => prev.map(s => s.id === selectedSale.id ? { ...s, is_paid: isFullyPaid } : s));

            setEditingPaymentId(null);
            handleOpenPayments(selectedSale);
            fetchSales();
        } catch (err) {
            console.error(err);
            addToast('Error al modificar cuota', 'error');
        }
    };

    const handleDeleteSale = (id) => {
        // Show custom warning: this will also delete the linked order
        const sale = sales.find(s => s.id === id);
        setDeleteConfirmSale(sale);
    };

    const handleOpenEdit = (sale) => {
        setSelectedSale(sale);
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
        setPaymentForm({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] });
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
            const paymentDate = new Date(paymentForm.date);
            const now = new Date();
            paymentDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
            const isoTimestamp = paymentDate.toISOString();

            const { error } = await supabase
                .from('payments')
                .insert([{
                    sale_id: selectedSale.id,
                    amount: Number(paymentForm.amount),
                    notes: paymentForm.notes,
                    created_at: isoTimestamp
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

            setPaymentForm({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] });
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

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const primaryColor = '#711116';
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(primaryColor);
        doc.text('REPORTE DE VENTAS - LUXESSENCE', 14, 20);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 26);
        doc.text(`Transacciones filtradas: ${filteredSales.length}`, 14, 31);
        
        // Draw elegant table header
        doc.setFillColor(113, 17, 22);
        doc.rect(14, 38, 182, 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('Cliente', 16, 43);
        doc.text('Fecha', 80, 43);
        doc.text('Método', 115, 43);
        doc.text('Estado', 145, 43);
        doc.text('Total', 175, 43);
        
        let y = 52;
        doc.setTextColor(26, 26, 26);
        doc.setFont('Helvetica', 'normal');
        
        filteredSales.forEach((s, idx) => {
            if (y > 275) {
                doc.addPage();
                // Draw header again on new page
                doc.setFillColor(113, 17, 22);
                doc.rect(14, 15, 182, 8, 'F');
                doc.setFont('Helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text('Cliente', 16, 20);
                doc.text('Fecha', 80, 20);
                doc.text('Método', 115, 20);
                doc.text('Estado', 145, 20);
                doc.text('Total', 175, 20);
                y = 29;
                doc.setTextColor(26, 26, 26);
                doc.setFont('Helvetica', 'normal');
            }
            
            const clientName = s.customers ? `${s.customers.first_name} ${s.customers.last_name}` : 
                               (s.orders?.notes?.startsWith('Invitado:') ? s.orders.notes.replace('Invitado:', '').trim() : 'Consumidor Final');
            
            const splitName = doc.splitTextToSize(clientName, 60);
            doc.text(splitName, 16, y);
            doc.text(new Date(s.created_at).toLocaleDateString(), 80, y);
            doc.text(s.payment_method, 115, y);
            doc.text(s.is_paid ? 'Pagado' : 'Pendiente', 145, y);
            doc.text(`L. ${s.total.toLocaleString()}`, 175, y);
            
            y += (splitName.length * 5) + 2;
        });
        
        doc.save(`Ventas_Luxessence_${new Date().toISOString().slice(0, 10)}.pdf`);
        addToast('Reporte PDF descargado con éxito.');
    };

    const handleExportWord = () => {
        let html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <title>Historial de Ventas</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
                th { background-color: #711116; color: white; font-weight: bold; }
                h2 { color: #711116; font-family: Georgia, serif; }
            </style>
        </head>
        <body>
            <h2>Libro de Ventas - Luxessence</h2>
            <p>Fecha de exportación: ${new Date().toLocaleDateString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>ID Factura</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Método</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredSales.map(s => `
                        <tr>
                            <td>#${s.id.slice(0, 8)}</td>
                            <td>${new Date(s.created_at).toLocaleDateString()}</td>
                            <td>${s.customers ? `${s.customers.first_name} ${s.customers.last_name}` : 
                                  (s.orders?.notes?.startsWith('Invitado:') ? s.orders.notes.replace('Invitado:', '').trim() : 'Consumidor Final')}</td>
                            <td>L. ${s.total.toLocaleString()}</td>
                            <td>${s.payment_method}</td>
                            <td>${s.is_paid ? 'Pagado' : 'Pendiente'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
        `;
        
        const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ventas_Luxessence_${new Date().toISOString().slice(0, 10)}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast('Reporte Word descargado con éxito.');
    };

    const filteredSales = sales; // Server-side filtered already

    const paginatedSales = filteredSales;

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, filterPeriod, filterMethod, selectedDate]);

    const calculateSaleMetrics = (sale) => {
        if (!sale || !sale.orders?.items) return { cost: 0, profit: 0, items: [] };

        const detailedItems = sale.orders.items.map(item => {
            // Find product in allProducts to get current cost if not in item
            const productRef = allProducts.find(p => p.id === (item.product_id || item.id));
            const cost = item.cost || productRef?.cost || 0;
            const itemTotalCost = cost * item.quantity;
            const itemTotalRevenue = item.price * item.quantity;
            const itemProfit = itemTotalRevenue - itemTotalCost;

            return {
                ...item,
                cost: cost,
                totalCost: itemTotalCost,
                totalRevenue: itemTotalRevenue,
                profit: itemProfit
            };
        });

        const totalCost = detailedItems.reduce((acc, item) => acc + item.totalCost, 0);
        // Note: profit is based on sale total (which has discount) minus costs
        const profit = sale.total - totalCost;

        return { cost: totalCost, profit, items: detailedItems };
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
                <div className="flex gap-3">
                    <button onClick={handleExport} className="glass-panel p-3 md:p-5 rounded-xl md:rounded-2xl hover:bg-primary/5 text-primary/60 transition-colors shadow-sm flex items-center gap-2" title="Exportar a Excel">
                        <Download className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Excel</span>
                    </button>
                    <button onClick={handleExportPDF} className="glass-panel p-3 md:p-5 rounded-xl md:rounded-2xl hover:bg-primary/5 text-primary/60 transition-colors shadow-sm flex items-center gap-2" title="Exportar a PDF">
                        <FileText className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">PDF</span>
                    </button>
                    <button onClick={handleExportWord} className="glass-panel p-3 md:p-5 rounded-xl md:rounded-2xl hover:bg-primary/5 text-primary/60 transition-colors shadow-sm flex items-center gap-2" title="Exportar a Word">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Word</span>
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
                            <div className="flex flex-wrap gap-2">
                                {['all', 'Contado', 'Crédito'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            setFilterMethod(m);
                                            setCurrentPage(1);
                                        }}
                                        className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider md:tracking-widest border transition-all ${filterMethod === m
                                            ? 'bg-primary/5 border-primary text-primary'
                                            : 'border-primary/5 text-primary/40 hover:border-primary/20'}`}
                                    >
                                        {m === 'all' ? 'Todos' : m}
                                    </button>
                                ))}
                            </div>

                            {filterMethod === 'Crédito' && (
                                <div className="flex items-center gap-2 pl-4 border-l border-primary/10 ml-2">
                                    <span className="text-[8px] uppercase font-black text-primary/20 tracking-widest mr-2">Estado:</span>
                                    {[
                                        { id: 'all', label: 'Todos' },
                                        { id: 'pending', label: 'Pendientes' },
                                        { id: 'paid', label: 'Cancelados' }
                                    ].map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setCreditStatus(s.id);
                                                setCurrentPage(1);
                                            }}
                                            className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${creditStatus === s.id
                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                                : 'text-primary/40 hover:text-primary bg-primary/5'}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            )}
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
                                                <p className="text-sm font-black text-primary uppercase">
                                                    {sale.customers ? `${sale.customers.first_name} ${sale.customers.last_name}` : 
                                                     (sale.orders?.notes?.startsWith('Invitado:') ? sale.orders.notes.replace('Invitado:', '').trim() : 'Consumidor Final')}
                                                </p>
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
                                                <button onClick={() => handleOpenEdit(sale)} className="p-4 bg-blue-500/5 rounded-2xl text-blue-500/40 active:bg-blue-600 active:text-white transition-all" title="Modificar"><Pencil className="w-5 h-5" /></button>
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
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="p-10 space-y-8 pt-safe">
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
                    <div className="fixed inset-0 z-[200] flex items-center justify-center md:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsInvoiceOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative bg-white md:rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh]">
                            <div className="p-6 pt-[calc(env(safe-area-inset-top)+1rem)] md:pt-6 border-b border-primary/5 flex justify-between items-center bg-primary/5">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 hidden sm:block">Factura Digital</p>
                                <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
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
                                    </div>
                                    <button onClick={() => setIsInvoiceOpen(false)} className="p-3 bg-white hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm text-primary" title="Cerrar"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto no-scrollbar pb-safe">
                                <InvoiceTemplate ref={invoiceRef} saleData={selectedSale} />
                            </div>
                        </motion.div>
                    </div>
                )}

                {isProfitOpen && selectedSale && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-luxury-black">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProfitOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh]">
                            <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar pt-[calc(env(safe-area-inset-top)+2rem)] md:pt-10">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-serif font-bold italic text-primary">Análisis de Rentabilidad</h3>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-primary/30 uppercase font-black">ID: #{selectedSale.id.slice(0, 8)}</p>
                                        <p className="text-[10px] text-primary/30 uppercase font-black">{new Date(selectedSale.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Detailed Breakdown Table */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-primary/40 tracking-widest border-b border-primary/5 pb-2">Desglose por Producto</h4>
                                    <div className="space-y-3">
                                        {calculateSaleMetrics(selectedSale).items.map((item, idx) => (
                                            <div key={idx} className="bg-primary/5 p-4 rounded-2xl border border-primary/5 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-primary text-sm">{item.name}</p>
                                                        <p className="text-[10px] text-primary/40 uppercase font-black">Cantidad: {item.quantity}</p>
                                                    </div>
                                                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${item.profit >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                                        Ganancia: L. {item.profit.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 border-t border-primary/5 pt-3">
                                                    <div>
                                                        <p className="text-[8px] uppercase font-black text-primary/30">Costo Total</p>
                                                        <p className="text-xs font-bold text-red-500">L. {item.totalCost.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] uppercase font-black text-primary/30">Venta Total</p>
                                                        <p className="text-xs font-bold text-primary">L. {item.totalRevenue.toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] uppercase font-black text-primary/30">Márgen</p>
                                                        <p className="text-xs font-bold text-green-600">
                                                            {item.totalCost > 0 ? (((item.totalRevenue - item.totalCost) / item.totalCost) * 100).toFixed(1) : '100'}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Global Discount */}
                                    {selectedSale.discount > 0 && (
                                        <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/10 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-orange-600">Descuento Global Aplicado</span>
                                            <span className="text-sm font-bold text-orange-600">- L. {selectedSale.discount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Final Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                    <div className="p-6 bg-red-500/5 rounded-2xl flex flex-col gap-1 border border-red-500/5">
                                        <span className="text-[9px] font-black uppercase text-red-500/40">Inversión (Total Costo)</span>
                                        <span className="text-2xl font-sans font-black text-red-500">L. {calculateSaleMetrics(selectedSale).cost.toLocaleString()}</span>
                                    </div>
                                    <div className="p-6 bg-green-500/10 rounded-2xl flex flex-col gap-1 border-2 border-green-500/20 shadow-inner">
                                        <span className="text-[9px] font-black uppercase text-green-600">Ganancia Total (Utilidad)</span>
                                        <span className="text-3xl font-sans font-black text-green-600 italic">L. {calculateSaleMetrics(selectedSale).profit.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-primary/5 border-t border-primary/5">
                                <button onClick={() => setIsProfitOpen(false)} className="w-full btn-primary !py-5 uppercase tracking-[0.3em] font-black text-xs">Cerrar Análisis de Rentabilidad</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isPaymentsModalOpen && selectedSale && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-luxury-black">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPaymentsModalOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl">
                            <div className="p-10 space-y-8 pt-safe">
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
                                                <label className="text-[10px] font-black uppercase text-primary/30 ml-2">Fecha de Pago</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="date"
                                                        className="flex-1 p-4 rounded-xl border border-primary/10 focus:ring-1 focus:ring-primary outline-none font-bold text-sm"
                                                        value={paymentForm.date}
                                                        onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                                    />
                                                    <button
                                                        onClick={() => setPaymentForm({ ...paymentForm, date: new Date().toISOString().split('T')[0] })}
                                                        className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-xl hover:bg-primary/20 transition-colors"
                                                    >
                                                        Hoy
                                                    </button>
                                                </div>
                                            </div>
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
                                                <div key={idx} className="p-4 bg-white border border-primary/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm group">
                                                    {editingPaymentId === p.id ? (
                                                        <div className="w-full space-y-3 p-2 bg-primary/5 rounded-xl">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] font-black uppercase text-primary/40">Fecha</label>
                                                                    <input
                                                                        type="date"
                                                                        className="w-full p-2 text-xs rounded-lg border border-primary/10 bg-white font-bold"
                                                                        value={editPaymentForm.date}
                                                                        onChange={e => setEditPaymentForm({ ...editPaymentForm, date: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] font-black uppercase text-primary/40">Monto (L.)</label>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full p-2 text-xs rounded-lg border border-primary/10 bg-white font-bold"
                                                                        value={editPaymentForm.amount}
                                                                        onChange={e => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase text-primary/40">Notas</label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full p-2 text-xs rounded-lg border border-primary/10 bg-white"
                                                                    value={editPaymentForm.notes}
                                                                    onChange={e => setEditPaymentForm({ ...editPaymentForm, notes: e.target.value })}
                                                                    placeholder="Notas de abono..."
                                                                />
                                                            </div>
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={() => setEditingPaymentId(null)}
                                                                    className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary/60 text-[9px] font-black uppercase rounded-lg transition-all"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (!editPaymentForm.amount || Number(editPaymentForm.amount) <= 0) {
                                                                            addToast('Ingrese un monto válido', 'error');
                                                                            return;
                                                                        }
                                                                        const paymentDate = new Date(editPaymentForm.date);
                                                                        const now = new Date();
                                                                        paymentDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                                                                        
                                                                        setSecurityAction({
                                                                            type: 'editPayment',
                                                                            paymentId: p.id,
                                                                            editData: {
                                                                                amount: editPaymentForm.amount,
                                                                                notes: editPaymentForm.notes,
                                                                                created_at: paymentDate.toISOString()
                                                                            }
                                                                        });
                                                                        setIsSecurityOpen(true);
                                                                    }}
                                                                    className="px-3 py-1.5 bg-primary text-secondary-light hover:bg-primary/90 text-[9px] font-black uppercase rounded-lg shadow-sm transition-all"
                                                                >
                                                                    Guardar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div>
                                                                <p className="text-xs font-bold text-primary">{new Date(p.created_at).toLocaleDateString()}</p>
                                                                <p className="text-[9px] text-primary/40 font-black uppercase tracking-widest italic">{p.notes || 'Sin nota'}</p>
                                                            </div>
                                                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                                                <p className="text-lg font-black text-primary">L. {Number(p.amount).toLocaleString()}</p>
                                                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingPaymentId(p.id);
                                                                            setEditPaymentForm({
                                                                                amount: p.amount,
                                                                                notes: p.notes || '',
                                                                                date: new Date(p.created_at).toISOString().split('T')[0]
                                                                            });
                                                                        }}
                                                                        className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                                                                        title="Editar abono"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setSecurityAction({ type: 'deletePayment', paymentId: p.id, payment: p });
                                                                            setIsSecurityOpen(true);
                                                                        }}
                                                                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                                                                        title="Eliminar abono"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
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

            <NewSaleModal 
                isOpen={isEditModalOpen}
                isMinimized={isEditMinimized}
                onMinimize={() => setIsEditMinimized(true)}
                onRestore={() => setIsEditMinimized(false)}
                onClose={() => { setIsEditModalOpen(false); setIsEditMinimized(false); }}
                onSaleComplete={() => {
                    setIsEditModalOpen(false);
                    fetchSales();
                }}
                isEditing={true}
                saleToEdit={selectedSale}
            />
        </div>
    );
};

export default SalesHistory;
