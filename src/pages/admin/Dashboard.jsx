import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, Users, Package, ShoppingBag, TrendingUp, ArrowRight, Clock, DollarSign, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalSales: 0,
        ordersCount: 0,
        customersCount: 0,
        productsCount: 0,
        pendingCredits: 0
    });
    const [pendingOrders, setPendingOrders] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact' });
            const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact' });
            const { count: ordCount } = await supabase.from('orders').select('*', { count: 'exact' });
            const { data: salesData } = await supabase.from('sales').select('total, payment_method, is_paid');
            const { data: recentOrders } = await supabase.from('orders').select('*, customers(*)').eq('status', 'pending').limit(5);

            const totalValue = salesData?.reduce((acc, curr) => acc + curr.total, 0) || 0;
            const pendingValue = salesData?.filter(s => !s.is_paid).reduce((acc, curr) => acc + curr.total, 0) || 0;

            setStats({
                totalSales: totalValue,
                ordersCount: ordCount || 0,
                customersCount: custCount || 0,
                productsCount: prodCount || 0,
                pendingCredits: pendingValue
            });

            setPendingOrders(recentOrders || []);

            // Improved Chart Data: Revenue vs Product Cost (Mocking realistic trend)
            setChartData([
                { name: 'Lun', revenue: 4500, cost: 2800 },
                { name: 'Mar', revenue: 5200, cost: 3100 },
                { name: 'Mié', revenue: 3800, cost: 2400 },
                { name: 'Jue', revenue: 6100, cost: 3900 },
                { name: 'Vie', revenue: 4900, cost: 2900 },
                { name: 'Sáb', revenue: 7200, cost: 4500 },
                { name: 'Dom', revenue: 6800, cost: 4200 },
            ]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Volumen Histórico', value: `L. ${stats.totalSales}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Cuentas x Cobrar', value: `L. ${stats.pendingCredits}`, icon: CreditCard, color: 'text-red-600', bg: 'bg-red-500/10' },
        { label: 'Cartera de Clientes', value: stats.customersCount, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Unidades en Catálogo', value: stats.productsCount, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
    ];

    return (
        <div className="space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-serif font-bold italic text-primary">Control de Mando</h1>
                    <p className="text-primary/40 tracking-widest uppercase text-xs font-black">Inteligencia de Negocio Luxessence</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={fetchStats} className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-primary/5 transition-colors text-primary font-bold text-xs uppercase tracking-widest">
                        <Clock className="w-4 h-4" /> Recargar Datos
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group border-primary/10 bg-white shadow-sm"
                    >
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 border border-primary/5`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <p className="text-primary/30 uppercase tracking-[0.2em] text-[10px] font-black mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-serif font-bold italic text-primary">{stat.value}</h3>
                        <div className={`absolute bottom-0 right-0 w-24 h-24 ${stat.bg} rounded-tl-[100px] opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500`} />
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart */}
                <div className="lg:col-span-2 glass-panel p-10 rounded-[3rem] space-y-8 border-primary/10 bg-white shadow-sm">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-serif italic text-primary">Margen de Utilidad</h3>
                            <p className="text-[10px] text-primary/40 uppercase tracking-widest font-bold">Ingresos Semanales vs Costos de Producto</p>
                        </div>
                        <div className="flex gap-4 text-[10px] uppercase tracking-widest font-black text-primary/30">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Ingresos</span>
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-secondary-dark" /> Costos</span>
                        </div>
                    </div>
                    <div className="h-[350px] min-h-[350px] w-full mt-4">
                        <ResponsiveContainer width="99%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#711116" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#711116" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,17,22,0.05)" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'rgba(113,17,22,0.3)' }} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'rgba(113,17,22,0.3)' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#FFF', borderColor: 'rgba(113,17,22,0.1)', borderRadius: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(113,17,22,0.1)' }}
                                    cursor={{ stroke: 'rgba(113,17,22,0.1)', strokeWidth: 2 }}
                                    formatter={(value) => [`L. ${value}`, '']}
                                />
                                <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="#711116" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="cost" name="Costos" stroke="#ead6c2" strokeWidth={2} fillOpacity={0.3} fill="#ead6c2" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="glass-panel p-10 rounded-[3rem] space-y-8 border-primary/10 bg-white shadow-sm">
                    <h3 className="text-2xl font-serif italic text-primary">Próximos Despachos</h3>
                    <div className="space-y-6">
                        {pendingOrders.length === 0 ? (
                            <p className="text-primary/20 text-center py-12 italic text-sm">Sin tareas de despacho pendientes</p>
                        ) : (
                            pendingOrders.map(order => (
                                <div key={order.id} className="flex items-center justify-between border-b border-primary/5 pb-4 group">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-luxury-black group-hover:text-primary transition-colors">{order.customers?.first_name} {order.customers?.last_name}</p>
                                        <p className="text-[10px] text-primary/30 uppercase tracking-widest font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-serif font-bold text-primary italic">L. {order.total}</p>
                                        <button onClick={() => navigate('/admin/orders')} className="text-[9px] uppercase tracking-widest font-black text-primary/40 hover:text-primary">Validar x{order.items.length}</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button onClick={() => navigate('/admin/orders')} className="w-full py-5 border border-primary/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] font-black text-primary hover:bg-primary hover:text-secondary-light transition-all shadow-lg hover:shadow-primary/20">
                        GESTIONAR PEDIDOS <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
