import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, Users, Package, ShoppingBag, TrendingUp, ArrowRight, Clock, DollarSign, CreditCard, Calendar, CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('month'); // 'day' | 'week' | 'month' | 'custom'
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
    const [pendingOrders, setPendingOrders] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, [timeFilter, selectedDate]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: allProducts } = await supabase.from('products').select('cost, stock, price');
            const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
            const { count: ordCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
            const { data: recentOrders } = await supabase.from('orders').select('*, customers(*)').eq('status', 'pending').limit(5);

            const totalInventoryValue = allProducts?.reduce((acc, p) => acc + ((p.cost || p.price * 0.6) * p.stock), 0) || 0;

            let startDate = new Date(selectedDate);
            let endDate = new Date(selectedDate);

            if (timeFilter === 'day') {
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            } else if (timeFilter === 'week') {
                // Last 7 days from selectedDate
                startDate.setDate(startDate.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            } else if (timeFilter === 'month') {
                // Entire month of selectedDate
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

            // Real pending balance = total - sum of payments already made
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
            setPendingOrders(recentOrders || []);

        } catch (err) {
            console.error('Dashboard Error:', err);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="space-y-6 md:space-y-12 pb-20">
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 md:gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/5">
                            <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif font-black italic text-primary">Control de Mando</h1>
                    </div>
                    <p className="text-primary/40 font-medium italic text-lg pb-2">Análisis en tiempo real de márgenes y rendimiento comercial.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4 bg-white/60 backdrop-blur-xl p-3 md:p-4 rounded-2xl md:rounded-[2.5rem] border border-primary/5 shadow-2xl w-full xl:w-auto">
                    <div className="flex bg-primary/5 p-1 md:p-1.5 rounded-xl md:rounded-[1.5rem]">
                        {['day', 'week', 'month'].map(f => (
                            <button
                                key={f}
                                onClick={() => setTimeFilter(f)}
                                className={`px-4 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider md:tracking-widest transition-all ${timeFilter === f ? 'bg-primary text-secondary-light shadow-xl' : 'text-primary/40 hover:text-primary'}`}
                            >
                                {f === 'day' ? 'Día' : f === 'week' ? 'Semana' : 'Mes'}
                            </button>
                        ))}
                    </div>

                    <div className="hidden md:block h-10 w-px bg-primary/10 mx-2" />

                    <div className="flex items-center gap-2 md:gap-4 px-1 md:px-2">
                        <Calendar className="w-5 h-5 text-primary/30" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-primary focus:ring-0 outline-none cursor-pointer"
                        />
                    </div>
                </div>
            </header>



            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                {/* Performance Chart */}
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] border border-primary/5 shadow-xl space-y-6 md:space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl md:text-3xl font-serif font-bold italic text-primary tracking-tight">Margen de Operación</h3>
                            <p className="text-[10px] text-primary/40 uppercase tracking-widest font-black flex items-center gap-2">
                                <TrendingUp className="w-3 h-3" /> Comparativa de flujo de caja según filtros
                            </p>
                        </div>
                        <div className="flex items-center gap-4 md:gap-8 bg-primary/5 px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl border border-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(113,17,22,0.4)]" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-primary/60">Ingresos</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_rgba(234,214,194,0.4)]" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-primary/60">Costos</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[450px] w-full overflow-x-auto no-scrollbar">
                        <div className={`${chartData.length > 7 ? 'min-w-[1000px]' : 'min-w-full'} h-full`}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#711116" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#711116" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ead6c2" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#ead6c2" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="5 5" stroke="#f4f4f4" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(113,17,22,0.4)', fontWeight: 'bold' }}
                                        dy={15}
                                    />
                                    <YAxis
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(113,17,22,0.4)', fontWeight: 'bold' }}
                                        tickFormatter={(val) => `L. ${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '2rem', border: '1px solid rgba(113,17,22,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.15)', padding: '20px' }}
                                        labelStyle={{ color: '#711116', fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic', marginBottom: '12px', fontSize: '1.1rem' }}
                                        formatter={(val) => [`L. ${val.toLocaleString()}`, '']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#711116"
                                        strokeWidth={5}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                        animationDuration={2500}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cost"
                                        stroke="#ead6c2"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorCost)"
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Side Panels */}
                <div className="space-y-5 md:space-y-10">
                    <div className="bg-primary rounded-[2rem] md:rounded-[4rem] p-8 md:p-12 text-secondary-light relative overflow-hidden space-y-5 md:space-y-8 shadow-2xl group">
                        <div className="relative z-10 space-y-2">
                            <span className="inline-block px-4 py-1.5 bg-secondary text-primary text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Finanzas</span>
                            <h3 className="text-3xl md:text-4xl font-serif font-bold italic leading-tight mt-2">Rendimiento de Ventas</h3>
                            <p className="text-secondary-light/40 text-[10px] font-black uppercase tracking-[0.2em] pt-2">Análisis financiero</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 relative z-10 w-full">
                            <div className="bg-white/5 p-4 md:p-6 rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition-colors col-span-2">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-secondary-light/40 mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-3.5 h-3.5" /> Ingresos Totales
                                </p>
                                <p className="text-2xl font-serif font-bold italic text-secondary">L. {stats.revenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 p-4 md:p-6 rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition-colors col-span-2 md:col-span-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-orange-400/60 mb-2 flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5" /> Cuentas por Cobrar
                                </p>
                                <p className="text-lg md:text-xl font-serif font-bold italic text-orange-400">L. {stats.pendingCredits.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 p-4 md:p-6 rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition-colors col-span-2 md:col-span-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-green-400/60 mb-2 flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5" /> Utilidad
                                </p>
                                <p className="text-lg md:text-xl font-serif font-bold italic text-green-400">L. {stats.profit.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 p-4 md:p-6 rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition-colors col-span-2">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-400/60 mb-2 flex items-center gap-2">
                                    <ShoppingBag className="w-3.5 h-3.5" /> Costo Mercancía
                                </p>
                                <p className="text-2xl font-serif font-bold italic text-red-400">L. {stats.cost.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="absolute top-[-20%] right-[-20%] w-60 h-60 bg-white/10 rounded-full blur-[80px] pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-secondary/20 rounded-full blur-[60px] pointer-events-none" />
                    </div>

                    <div className="bg-white/70 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border border-primary/5 shadow-xl space-y-5 md:space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center">
                                <BarChart3 className="text-primary w-5 h-5" />
                            </div>
                            <h4 className="font-serif font-bold italic text-xl md:text-2xl tracking-tight text-primary">Indicadores Clave</h4>
                        </div>

                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/70 mb-1">Valor del Inventario</p>
                            <p className="text-2xl md:text-3xl font-serif font-bold italic text-amber-700">L. {stats.inventoryValue.toLocaleString()}</p>
                        </div>

                        <div className="h-px bg-primary/5" />

                        <ul className="space-y-5">
                            {[
                                { label: 'Clientes Registrados', val: stats.customersCount, icon: Users },
                                { label: 'SKUs en Inventario', val: stats.productsCount, icon: Package },
                                { label: 'Volumen Histórico', val: stats.ordersCount, icon: ShoppingBag },
                            ].map(item => (
                                <li key={item.label} className="flex justify-between items-center group/row">
                                    <div className="flex items-center gap-4">
                                        <item.icon className="w-4 h-4 text-primary/20 group-hover/row:text-primary transition-colors" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 leading-none">{item.label}</span>
                                    </div>
                                    <span className="text-lg font-bold text-primary tabular-nums tracking-tight">{item.val}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>



            {loading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[500] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-primary/10 rounded-full" />
                            <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-primary animate-pulse">Sincronizando Luxessence OS...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
