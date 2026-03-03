import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, Users, Package, ShoppingBag, TrendingUp, ArrowRight, Clock, DollarSign, CreditCard, Calendar, CheckCircle2, ChevronRight, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
    const navigate = useNavigate();
    const { setIsNewSaleOpen } = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('month');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [stats, setStats] = useState({
        revenue: 0,
        cost: 0,
        profit: 0,
        ordersCount: 0,
        customersCount: 0,
        productsCount: 0,
        pendingCredits: 0,
        inventoryValue: 0
    });

    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, [timeFilter, selectedDate]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: allProducts } = await supabase.from('products').select('cost, stock, price');
            const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
            const { count: ordCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });

            const totalInventoryValue = allProducts?.reduce((acc, p) => acc + ((p.cost || p.price * 0.6) * p.stock), 0) || 0;

            let startDate = new Date(selectedDate);
            let endDate = new Date(selectedDate);

            if (timeFilter === 'day') {
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            } else if (timeFilter === 'week') {
                startDate.setDate(startDate.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            } else if (timeFilter === 'month') {
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
            }

            const { data: salesData } = await supabase
                .from('sales')
                .select('*, order_id(*)')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            const { data: allSalesForCredits } = await supabase
                .from('sales')
                .select('id, total, is_paid, payments(amount)')
                .eq('is_paid', false);

            const realPending = allSalesForCredits?.reduce((acc, sale) => {
                const paid = (sale.payments || []).reduce((s, p) => s + Number(p.amount), 0);
                return acc + Math.max(0, sale.total - paid);
            }, 0) || 0;

            let totalRevenue = 0;
            let totalCost = 0;
            const dataPoints = {};

            salesData?.forEach(sale => {
                totalRevenue += sale.total;
                let saleCost = 0;
                const items = sale.order_id?.items || [];
                items.forEach(item => {
                    saleCost += (item.cost || item.price * 0.6) * item.quantity;
                });
                totalCost += saleCost;

                const dateKey = sale.created_at.split('T')[0];
                if (!dataPoints[dateKey]) dataPoints[dateKey] = { name: dateKey, revenue: 0, cost: 0, profit: 0 };
                dataPoints[dateKey].revenue += sale.total;
                dataPoints[dateKey].cost += saleCost;
                dataPoints[dateKey].profit += (sale.total - saleCost);
            });

            const formattedChartData = Object.values(dataPoints).sort((a, b) => new Date(a.name) - new Date(b.name));

            setStats({
                revenue: totalRevenue,
                cost: totalCost,
                profit: totalRevenue - totalCost,
                ordersCount: ordCount || 0,
                customersCount: custCount || 0,
                productsCount: allProducts?.length || 0,
                pendingCredits: realPending,
                inventoryValue: totalInventoryValue
            });

            setChartData(formattedChartData.length > 0 ? formattedChartData : [{ name: 'Sin datos', revenue: 0, cost: 0, profit: 0 }]);

        } catch (err) {
            console.error('Dashboard Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-12">
            {/* Header Luxury Presidential */}
            <header className="relative p-12 lg:p-20 rounded-[4rem] overflow-hidden bg-primary text-secondary mb-12 shadow-[0_60px_100px_-20px_rgba(113,17,22,0.4)]">
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center lg:items-end gap-12">
                    <div className="space-y-6 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-3 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full"
                        >
                            <Sparkles className="w-4 h-4 text-gold" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-light">LuxOS V2.0 - Central Intelligence</span>
                        </motion.div>
                        <h1 className="text-6xl md:text-9xl font-serif font-black italic text-white leading-none tracking-tighter">
                            LuxOS <br /> <span className="text-gold-gradient">Command</span>
                        </h1>
                        <p className="text-white/60 italic font-medium text-xl max-w-2xl leading-relaxed">Gestión estratégica de activos, monitoreo de rendimientos y control total del ecosistema Luxessence.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 w-full lg:w-auto">
                        <div className="bg-white/5 backdrop-blur-2xl p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-white/10 flex flex-col gap-2 min-w-[160px] lg:min-w-[200px] shadow-2xl">
                            <span className="text-[9px] lg:text-[10px] uppercase font-black tracking-[0.3em] text-gold/60">Patrimonio Neto</span>
                            <span className="text-2xl lg:text-3xl font-black text-white tabular-nums">L. {stats.revenue.toLocaleString()}</span>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                                <motion.div initial={{ width: 0 }} animate={{ width: "70%" }} className="h-full bg-gold" />
                            </div>
                        </div>
                        <div className="bg-gold p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] flex flex-col gap-2 min-w-[160px] lg:min-w-[200px] shadow-[0_20px_40px_rgba(212,175,55,0.3)]">
                            <span className="text-[9px] lg:text-[10px] uppercase font-black tracking-[0.3em] text-primary/60">Flujo Pendiente</span>
                            <span className="text-2xl lg:text-3xl font-black text-primary tabular-nums">L. {stats.pendingCredits.toLocaleString()}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-primary/40">Cuentas por Recibir</span>
                        </div>
                    </div>
                </div>

                {/* Decorations */}
                <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-gold/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[50rem] h-[50rem] bg-white/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Analytics - Left Column */}
                <div className="lg:col-span-8 space-y-12">
                    <div className="glass-card-premium p-12 rounded-[4.5rem] relative overflow-hidden bg-white border-primary/5 shadow-2xl group">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-16 gap-6">
                            <div className="space-y-2">
                                <h3 className="text-4xl font-serif font-bold italic text-primary">Inteligencia Comercial</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] uppercase tracking-[0.4em] text-primary/30 font-black">Métrica de Rendimiento en Tiempo Real</p>
                                </div>
                            </div>
                            <div className="flex bg-primary/5 p-1 rounded-2xl border border-primary/5">
                                {['day', 'week', 'month'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setTimeFilter(f)}
                                        className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${timeFilter === f ? 'bg-primary text-white shadow-xl' : 'text-primary/40 hover:text-primary'}`}
                                    >
                                        {f === 'day' ? 'Día' : f === 'week' ? 'Semana' : 'Mes'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[450px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#711116" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#711116" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#711116" strokeOpacity={0.03} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#711116', opacity: 0.2, fontSize: 10, fontWeight: 900 }}
                                        dy={15}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#711116', opacity: 0.2, fontSize: 10, fontWeight: 900 }}
                                        tickFormatter={(val) => `L.${(val / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(30px)',
                                            borderRadius: '2.5rem',
                                            border: '1px solid rgba(113, 17, 22, 0.08)',
                                            boxShadow: '0 40px 80px -15px rgba(113, 17, 22, 0.2)',
                                            padding: '24px'
                                        }}
                                        itemStyle={{ color: '#711116', fontWeight: 900, textTransform: 'uppercase', fontSize: '11px' }}
                                        labelStyle={{ fontFamily: 'serif', fontStyle: 'italic', fontWeight: 900, color: '#D4AF37', fontSize: '1.2rem', marginBottom: '10px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#711116"
                                        strokeWidth={6}
                                        fillOpacity={1}
                                        fill="url(#colorPrimary)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="profit"
                                        stroke="#D4AF37"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorSales)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Interactive Modules */}
                        <div
                            onClick={() => navigate('/admin/sales')}
                            className="group relative overflow-hidden bg-primary p-12 rounded-[4rem] text-left transition-all hover:-translate-y-3 cursor-pointer shadow-2xl"
                        >
                            <div className="relative z-10 flex flex-col gap-10">
                                <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center group-hover:bg-gold transition-all duration-500 shadow-2xl ring-1 ring-white/20">
                                    <ShoppingBag className="w-10 h-10 text-white group-hover:text-primary transition-colors" />
                                </div>
                                <div>
                                    <h4 className="text-3xl font-serif italic text-white flex items-center gap-4">
                                        Libro de Ventas <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                    </h4>
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-3">{stats.ordersCount} Operaciones Registradas</p>
                                </div>
                            </div>
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-gold/10 transition-all duration-1000" />
                        </div>

                        <div
                            onClick={() => navigate('/admin/products')}
                            className="group glass-card-premium p-12 rounded-[4rem] text-left transition-all hover:-translate-y-3 cursor-pointer border-primary/5 bg-white shadow-2xl"
                        >
                            <div className="flex flex-col gap-10">
                                <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center group-hover:bg-primary transition-all duration-500 shadow-inner">
                                    <Package className="w-10 h-10 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <h4 className="text-3xl font-serif italic text-primary flex items-center gap-4">
                                        Bóveda Activos <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform opacity-30" />
                                    </h4>
                                    <p className="text-primary/30 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Sincronización de Stock {stats.productsCount} SKUs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Sidebar - Right Column */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="glass-card-premium p-12 rounded-[4.5rem] space-y-12 border-primary/5 bg-white shadow-2xl">
                        <div className="space-y-3 border-b border-primary/5 pb-10">
                            <div className="flex justify-between items-center">
                                <h3 className="text-3xl font-serif font-bold italic text-primary">Indicadores</h3>
                                <div className="p-3 bg-primary/5 rounded-2xl text-primary animate-pulse">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-primary/30 font-black">Métricas de Salud del Capital</p>
                        </div>

                        <div className="space-y-8">
                            {[
                                { label: 'Valor en Inventario', val: `L. ${stats.inventoryValue.toLocaleString()}`, color: 'bg-emerald-500/10 text-emerald-600', sub: 'Capital Inmovilizado' },
                                { label: 'Comunidad VIP', val: stats.customersCount, color: 'bg-blue-500/10 text-blue-600', sub: 'Clientes Fidelizados' },
                                { label: 'Utilidad Neta Est.', val: `L. ${stats.profit.toLocaleString()}`, color: 'bg-gold/10 text-gold', sub: 'Margen de Ganancia' }
                            ].map((kpi, idx) => (
                                <div key={idx} className="group/item flex flex-col gap-4 p-6 hover:bg-primary/[0.02] rounded-3xl transition-all duration-500 border border-transparent hover:border-primary/5">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/30">{kpi.label}</p>
                                            <p className="text-3xl font-bold text-primary font-sans tracking-tighter">{kpi.val}</p>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${kpi.color}`}>
                                            Premium
                                        </div>
                                    </div>
                                    <div className="w-full h-1 bg-primary/5 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: "65%" }} className="h-full bg-primary/30" />
                                    </div>
                                    <p className="text-[9px] text-primary/20 italic font-medium">{kpi.sub}</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8">
                            <button
                                onClick={() => navigate('/admin/settings')}
                                className="w-full relative overflow-hidden bg-primary text-white p-7 rounded-[2.5rem] flex items-center justify-between group shadow-2xl hover:shadow-primary/30 transition-all"
                            >
                                <div className="z-10 flex flex-col items-start gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 leading-none">Ajustes Globales</span>
                                    <span className="text-xl font-serif italic text-gold leading-none">LuxOS Engine</span>
                                </div>
                                <div className="z-10 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-gold transition-all">
                                    <RefreshCw className="w-5 h-5 text-white group-hover:text-primary transition-all group-hover:rotate-180" />
                                </div>
                                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                            </button>
                        </div>
                    </div>

                    <div
                        onClick={() => setIsNewSaleOpen(true)}
                        className="glass-card-premium p-10 rounded-[3.5rem] bg-gold flex flex-col items-center text-center gap-8 group cursor-pointer hover:shadow-gold/30 hover:-translate-y-2 transition-all duration-700 shadow-2xl"
                    >
                        <div className="relative">
                            <div className="w-20 h-20 bg-white border-[6px] border-primary/5 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                <Plus className="w-10 h-10 text-primary" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full animate-ping" />
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-serif font-black italic text-3xl text-primary leading-none">LuxEntry</h4>
                            <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.4em] max-w-[150px]">Registrar Nueva Operación de Valor</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sync Overlay Luxury */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-primary/20 backdrop-blur-[40px] z-[500] flex flex-col items-center justify-center gap-12"
                    >
                        <div className="relative">
                            <div className="w-40 h-40 border-[16px] border-gold/10 border-t-gold rounded-full animate-[spin_1.5s_linear_infinite]" />
                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-gold animate-pulse" />
                        </div>
                        <div className="text-center space-y-6">
                            <motion.p
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-lg font-black uppercase tracking-[1em] text-primary drop-shadow-2xl ml-6"
                            >
                                LuxOS v2.0
                            </motion.p>
                            <p className="text-xs text-primary/40 italic font-black uppercase tracking-[0.4em]">Sincronizando Libro de Patrimonio...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
