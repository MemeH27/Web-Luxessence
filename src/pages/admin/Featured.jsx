import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, Search, Plus, Trash2, CheckCircle2, Circle, Package, Tag, Layers, ChevronRight, Activity, Zap, Star } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/admin/Pagination';

const Featured = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState('arrivals'); // 'arrivals' | 'gifts'
    const [selectedTier, setSelectedTier] = useState(500);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const priceTiers = [200, 500, 800, 1000];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data } = await supabase.from('products').select('*, categories(name)').order('name');
        setProducts(data || []);
        setLoading(false);
    };

    const toggleFeature = async (id, field, value) => {
        try {
            const { error } = await supabase.from('products').update({ [field]: !value }).eq('id', id);
            if (error) throw error;

            setProducts(products.map(p => p.id === id ? { ...p, [field]: !value } : p));
            addToast('Actualizado correctamente');
        } catch (error) {
            addToast('Error al actualizar', 'error');
        }
    };

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedProducts = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const giftProducts = products.filter(p => p.is_gift_option);
    const arrivalProducts = products.filter(p => p.is_new_arrival);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="space-y-6 md:space-y-12 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-serif font-black italic text-primary">Curation Suite</h1>
                    <p className="text-primary/40 font-medium italic">Selecciona los productos que definirán la narrativa visual de Luxessence.</p>
                </div>
            </header>

            {/* Premium Tab System */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-2 sm:p-3 bg-white/40 border border-primary/5 rounded-2xl sm:rounded-[2.5rem] w-full sm:w-fit shadow-sm backdrop-blur-sm">
                <button
                    onClick={() => setActiveTab('arrivals')}
                    className={`flex items-center gap-3 sm:gap-4 px-6 sm:px-10 py-3.5 sm:py-5 rounded-xl sm:rounded-[2rem] transition-all duration-500 ${activeTab === 'arrivals' ? 'bg-primary text-secondary-light shadow-2xl shadow-primary/20 scale-105' : 'text-primary/40 hover:text-primary hover:bg-primary/5'}`}
                >
                    <Sparkles className={`w-5 h-5 ${activeTab === 'arrivals' ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">New Arrivals</span>
                    <span className={`text-[9px] px-3 py-1 rounded-full font-black ${activeTab === 'arrivals' ? 'bg-secondary text-primary' : 'bg-primary/5 text-primary/40'}`}>{arrivalProducts.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('gifts')}
                    className={`flex items-center gap-3 sm:gap-4 px-6 sm:px-10 py-3.5 sm:py-5 rounded-xl sm:rounded-[2rem] transition-all duration-500 ${activeTab === 'gifts' ? 'bg-primary text-secondary-light shadow-2xl shadow-primary/20 scale-105' : 'text-primary/40 hover:text-primary hover:bg-primary/5'}`}
                >
                    <Gift className={`w-5 h-5 ${activeTab === 'gifts' ? 'animate-bounce' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Gift Collections</span>
                    <span className={`text-[9px] px-3 py-1 rounded-full font-black ${activeTab === 'gifts' ? 'bg-secondary text-primary' : 'bg-primary/5 text-primary/40'}`}>{giftProducts.length}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
                {/* Product Selection List */}
                <div className="lg:col-span-2 space-y-5 md:space-y-8">
                    <div className="relative group glass-panel p-2 rounded-2xl md:rounded-[2.5rem] bg-white/40 border-primary/10 transition-all focus-within:shadow-2xl focus-within:shadow-primary/5">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-primary/20 w-6 h-6 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Filtrar catálogo por nombre o fragancia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none py-4 md:py-6 pl-16 md:pl-20 pr-6 md:pr-10 outline-none font-serif italic text-base md:text-xl text-primary placeholder:text-primary/10"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 content-start min-h-[600px]">
                        {loading ? (
                            [1, 2, 3, 4].map(i => <div key={i} className="h-24 md:h-28 glass-panel animate-pulse rounded-2xl md:rounded-[2.5rem] bg-white/40" />)
                        ) : paginatedProducts.length === 0 ? (
                            <div className="py-20 md:py-40 text-center italic text-primary/20 text-sm md:text-base bg-white/40 rounded-2xl md:rounded-[3rem] border border-dashed border-primary/10">No se encontraron productos coincidentes</div>
                        ) : (
                            paginatedProducts.map(product => (
                                <motion.div
                                    layout
                                    key={product.id}
                                    className="group p-4 md:p-6 bg-white hover:bg-primary/[0.02] rounded-2xl md:rounded-[2.5rem] border border-primary/5 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6"
                                >
                                    <div className="flex items-center gap-6 flex-1 min-w-0 w-full">
                                        <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-primary/5 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                            <img src={product.image_url || '/img/logo.svg'} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xl font-serif font-bold italic text-primary truncate leading-tight">{product.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/30">{product.categories?.name}</span>
                                                <span className="w-1 h-1 rounded-full bg-primary/10" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">L. {product.price}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-primary/5">
                                        <button
                                            onClick={() => toggleFeature(product.id, 'is_new_arrival', product.is_new_arrival)}
                                            className={`flex-1 md:flex-none flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-300 ${product.is_new_arrival ? 'bg-primary text-secondary-light border-primary shadow-xl shadow-primary/20' : 'bg-white text-primary/20 border-primary/5 hover:border-primary/20'}`}
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">NUEVO</span>
                                        </button>
                                        <button
                                            onClick={() => toggleFeature(product.id, 'is_gift_option', product.is_gift_option)}
                                            className={`flex-1 md:flex-none flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-300 ${product.is_gift_option ? 'bg-secondary text-primary border-secondary shadow-xl shadow-secondary/20' : 'bg-white text-primary/20 border-primary/5 hover:border-primary/20'}`}
                                        >
                                            <Gift className="w-4 h-4" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">REGALO</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalItems={filtered.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Sidebar Context & Preview */}
                <div className="space-y-5 md:space-y-8">
                    <div className="bg-primary p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] text-secondary-light space-y-6 md:space-y-10 shadow-3xl relative overflow-hidden">
                        <div className="space-y-2 md:space-y-4 relative z-10">
                            <h2 className="text-2xl md:text-3xl font-serif font-bold italic">Status Curatorial</h2>
                            <p className="text-secondary-light/40 text-xs font-medium uppercase tracking-[0.2em]">Métrica de Atracción</p>
                        </div>

                        {activeTab === 'arrivals' ? (
                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/10 group hover:bg-white/10 transition-colors">
                                    <Zap className="w-8 h-8 text-secondary" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary-light/40 mb-1">Impacto Visual</p>
                                        <p className="text-2xl font-serif font-bold italic">Nivel Premium</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {arrivalProducts.slice(0, 4).map(p => (
                                        <div key={p.id} className="aspect-square rounded-3xl overflow-hidden bg-white/5 p-2 group">
                                            <img src={p.image_url} className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 relative z-10">
                                <div className="flex flex-wrap gap-2">
                                    {priceTiers.map(tier => (
                                        <button
                                            key={tier}
                                            onClick={() => setSelectedTier(tier)}
                                            className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedTier === tier ? 'bg-secondary text-primary shadow-xl scale-110' : 'bg-white/5 text-secondary-light hover:bg-white/10'}`}
                                        >
                                            L. {tier}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4 bg-white/5 p-8 rounded-[3rem] border border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-light/20 flex items-center gap-2">
                                        <Star className="w-3 h-3 text-secondary" /> Selección de Regalo
                                    </p>
                                    <div className="space-y-4">
                                        {giftProducts.filter(p => p.price <= selectedTier).length === 0 ? (
                                            <p className="text-xs italic text-secondary-light/40">Sin candidatos...</p>
                                        ) : (
                                            giftProducts.filter(p => p.price <= selectedTier).slice(0, 3).map(p => (
                                                <div key={p.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl group hover:bg-white/10 transition-all cursor-default">
                                                    <div className="w-2 h-2 rounded-full bg-secondary group-hover:shadow-[0_0_8px_white]" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold truncate">{p.name}</p>
                                                        <p className="text-[9px] text-secondary-light/40">L. {p.price}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-5 md:p-8 bg-secondary/10 rounded-2xl md:rounded-[2.5rem] border border-secondary/20 relative z-10">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Recomendación Lux
                            </p>
                            <p className="text-xs italic leading-relaxed">
                                Mantener entre 4 y 8 <span className="text-secondary font-bold">New Arrivals</span> garantiza que la tienda siempre se sienta fresca y exclusiva para clientes recurrentes.
                            </p>
                        </div>

                        {/* Ambient Decoration */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full blur-3xl opacity-50" />
                    </div>

                    <div className="bg-white border border-secondary/20 p-5 md:p-8 rounded-2xl md:rounded-[3rem] space-y-4 md:space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 text-primary">
                            <Layers className="w-5 h-5" />
                            <h4 className="font-serif font-bold italic">Integridad Ecommerce</h4>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest group">
                                <span className="text-primary/40 group-hover:text-primary transition-colors">Catalog Sync:</span>
                                <span className="text-green-500">Perfecta</span>
                            </li>
                            <li className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest group">
                                <span className="text-primary/40 group-hover:text-primary transition-colors">Badges Activos:</span>
                                <span className="text-primary font-bold">{arrivalProducts.length + giftProducts.length}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Featured;
