import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { Search, Plus, Minus, ShoppingCart, Grid, List, Filter, Tag, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/ui/Skeleton';

const Catalog = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [viewMode, setViewMode] = useState('grid');
    const [activePromos, setActivePromos] = useState([]);
    const [isViewToggleOpen, setIsViewToggleOpen] = useState(false);
    const location = useLocation();
    const { addToCart } = useCart();
    const [productQuantities, setProductQuantities] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data: catData } = await supabase.from('categories').select('*').order('name');
            const { data: prodData } = await supabase.from('products').select('*, categories(*)').order('created_at', { ascending: false });
            const { data: promoData } = await supabase.from('promotions')
                .select('*')
                .eq('is_active', true)
                .lte('start_date', today)
                .or(`end_date.is.null,end_date.gte.${today}`);

            setCategories(catData || []);
            setProducts(prodData || []);
            setActivePromos(promoData || []);

            // Check if we have a promo filter in URL
            const params = new URLSearchParams(location.search);
            if (params.get('promo') === 'true') {
                setSelectedCategory('Promo');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.map(p => {
        // Enforce promo price if active
        const relevantPromo = activePromos.find(promo => promo.product_ids.includes(p.id));
        if (relevantPromo) {
            if (relevantPromo.promo_type === 'bogo') {
                return {
                    ...p,
                    promo_badge: relevantPromo.discount_badge || '2x1',
                    is_bogo: true
                };
            }
            if (relevantPromo.new_prices[p.id]) {
                return {
                    ...p,
                    original_price: p.price,
                    price: relevantPromo.new_prices[p.id],
                    promo_badge: relevantPromo.discount_badge
                };
            }
        }
        return p;
    }).filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = selectedCategory === 'All'
            || (selectedCategory === 'Promo' && p.promo_badge)
            || p.category_id === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const [isComboModalOpen, setIsComboModalOpen] = useState(false);
    const [selectedJibbitz, setSelectedJibbitz] = useState(null);

    const jibbitzCombos = [
        { id: '1x25', label: '1 x L. 25', price: 25 },
        { id: '3x70', label: '3 x L. 70', price: 70 },
        { id: '5x105', label: '5 x L. 105', price: 105 },
    ];

    const { addToast } = useToast();
    const [comboQuantities, setComboQuantities] = useState({});

    const handleAddToCart = (product) => {
        const qty = productQuantities[product.id] || 1;

        if (product.stock <= 0) {
            addToast('No hay stock disponible. Pronto tendremos restock.', 'error');
            return;
        }

        if (qty > product.stock) {
            addToast(`Solo hay ${product.stock} unidades disponibles`, 'error');
            return;
        }

        const isJibbitz = product.categories?.name?.toLowerCase().includes('jibbitz');
        if (isJibbitz) {
            setSelectedJibbitz(product);
            setComboQuantities({});
            setIsComboModalOpen(true);
        } else {
            addToCart(product, null, qty);
            addToast(`${qty} x ${product.name} añadido al carrito`);
        }
    };

    const updateProductQty = (productId, delta, stock) => {
        setProductQuantities(prev => {
            const current = prev[productId] || 1;
            const next = Math.max(1, Math.min(stock, current + delta));
            return { ...prev, [productId]: next };
        });
    };

    const confirmJibbitzCombos = () => {
        let addedCount = 0;
        Object.entries(comboQuantities).forEach(([comboId, qty]) => {
            if (qty > 0) {
                const combo = jibbitzCombos.find(c => c.id === comboId);
                for (let i = 0; i < qty; i++) {
                    addToCart(selectedJibbitz, combo);
                }
                addedCount += qty;
            }
        });

        if (addedCount > 0) {
            addToast(`${addedCount} combos de Jibbitz añadidos`);
            setIsComboModalOpen(false);
        } else {
            addToast('Seleccione al menos un combo', 'error');
        }
    };

    const updateComboQty = (comboId, delta) => {
        setComboQuantities(prev => ({
            ...prev,
            [comboId]: Math.max(0, (prev[comboId] || 0) + delta)
        }));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8 md:space-y-16">
            {/* Page Header */}
            <div className="space-y-4 max-w-2xl px-2 md:px-0">
                <h1 className="text-4xl md:text-6xl font-serif font-bold italic text-primary">Nuestra Selección</h1>
                <p className="text-luxury-black/40 tracking-[0.3em] uppercase text-[9px] md:text-xs font-black">Excelencia en cada detalle</p>
                <div className="w-16 md:w-20 h-1 bg-primary/20 rounded-full" />
            </div>

            {/* Filters & Tools */}
            <div className="flex flex-col xl:flex-row gap-6 md:gap-8 justify-between items-center glass-panel p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-primary/10 bg-white/50 shadow-sm relative overflow-hidden">
                <div className="relative w-full xl:w-96 group z-10">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/30 w-5 h-5 md:w-6 h-6 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar pieza..."
                        className="w-full bg-white border border-primary/5 rounded-xl md:rounded-[1.5rem] py-3 md:py-4 pl-12 md:pl-14 pr-6 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-primary/20 text-primary font-medium shadow-inner"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full xl:w-auto overflow-x-auto no-scrollbar pb-1 xl:pb-0 z-10">
                    <button
                        onClick={() => setSelectedCategory('All')}
                        className={`px-6 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl whitespace-nowrap text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === 'All'
                            ? 'bg-primary text-secondary-light shadow-lg scale-105'
                            : 'bg-white text-primary/40 border border-primary/5'
                            }`}
                    >
                        Todos
                    </button>
                    {activePromos.length > 0 && (
                        <button
                            onClick={() => setSelectedCategory('Promo')}
                            className={`px-6 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl whitespace-nowrap text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === 'Promo'
                                ? 'bg-primary text-secondary-light shadow-lg scale-105'
                                : 'bg-white text-primary/40 border border-primary/5'
                                } flex items-center gap-2`}
                        >
                            <Tag className="w-3 h-3 md:w-3.5 h-3.5" /> Promo
                        </button>
                    )}
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-6 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl whitespace-nowrap text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.id
                                ? 'bg-primary text-secondary-light shadow-lg scale-105'
                                : 'bg-white text-primary/40 border border-primary/5'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Decorative Filters Ambient */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/3 rounded-full blur-3xl" />
            </div>

            {/* Fixed View Toggle (Drawer on Mobile) */}
            <div className={`fixed right-0 bottom-32 md:bottom-10 z-[100] flex items-center transition-transform duration-500 ${isViewToggleOpen ? 'translate-x-0' : 'translate-x-[calc(100%-32px)] md:translate-x-0'} pointer-events-none`}>
                <button
                    onClick={() => setIsViewToggleOpen(!isViewToggleOpen)}
                    className="md:hidden w-8 h-12 bg-primary text-secondary-light rounded-l-2xl flex items-center justify-center shadow-2xl pointer-events-auto active:scale-95 transition-all"
                >
                    <div className={`transition-transform duration-300 ${isViewToggleOpen ? 'rotate-180' : ''}`}>
                        <ChevronLeft className="w-5 h-5" />
                    </div>
                </button>
                <div className="flex flex-col gap-2 p-2 bg-white/90 backdrop-blur-2xl border-l md:border border-primary/10 rounded-l-3xl md:rounded-2xl shadow-3xl pointer-events-auto">
                    <button
                        onClick={() => { setViewMode('grid'); setIsViewToggleOpen(false); }}
                        className={`p-4 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-primary text-secondary-light shadow-xl translate-x-1 md:translate-x-0' : 'text-primary/30 hover:bg-primary/5'}`}
                    >
                        <Grid className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => { setViewMode('list'); setIsViewToggleOpen(false); }}
                        className={`p-4 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-primary text-secondary-light shadow-xl translate-x-1 md:translate-x-0' : 'text-primary/30 hover:bg-primary/5'}`}
                    >
                        <List className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Product Results */}
            {selectedCategory === 'Promo' && activePromos.length > 0 && (
                <div className="bg-primary p-12 rounded-[3.5rem] text-center space-y-4 shadow-2xl relative overflow-hidden">
                    <Tag className="w-12 h-12 text-secondary-light/20 mx-auto mb-4" />
                    <h2 className="text-4xl md:text-5xl font-serif font-bold italic text-secondary-light">{activePromos[0].title}</h2>
                    <div className="flex items-center justify-center gap-4">
                        <span className="px-5 py-2 bg-secondary-light text-primary text-sm font-black uppercase tracking-widest rounded-full">{activePromos[0].discount_badge}</span>
                    </div>
                    {activePromos[0].restrictions && (
                        <p className="text-secondary-light/40 text-[10px] uppercase tracking-[0.3em] font-black italic max-w-xl mx-auto pt-4 border-t border-secondary-light/5">{activePromos[0].restrictions}</p>
                    )}
                    {/* Ambient Background for Promo */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary-light/5 rounded-full blur-3xl" />
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="glass-card rounded-[2rem] md:rounded-[3rem] p-4 md:p-6 space-y-4">
                            <Skeleton className="aspect-square rounded-[1.5rem] md:rounded-[2.5rem]" />
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <motion.div
                        layout
                        className={viewMode === 'grid'
                            ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-10 px-1 md:px-0"
                            : "flex flex-col gap-6"
                        }
                    >
                        {filteredProducts.map((product) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={product.id}
                                className={`glass-card rounded-[2rem] md:rounded-[3rem] overflow-hidden group p-3 md:p-6 bg-white shadow-lg shadow-primary/2 hover:shadow-primary/5 transition-all duration-500 ${viewMode === 'list' ? 'flex gap-6 items-center md:h-64' : ''}`}
                            >
                                <div className={`${viewMode === 'list' ? 'w-24 h-24 md:w-56 md:h-56 shrink-0' : 'aspect-square'} rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden relative group/img`}>
                                    <img
                                        src={product.image_url || '/img/logo.svg'}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                    />

                                    {/* Badges */}
                                    <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 flex flex-col gap-1 md:gap-2">
                                        {product.promo_badge && (
                                            <span className="bg-secondary text-primary text-[7px] md:text-[10px] font-black px-2 md:px-4 py-1 md:py-2 rounded-full shadow-lg border border-primary/5">
                                                {product.promo_badge}
                                            </span>
                                        )}
                                        {product.stock <= 0 && (
                                            <span className="bg-red-600 text-white text-[7px] md:text-[8px] font-black px-2 md:px-4 py-1 md:py-2 rounded-full shadow-lg">
                                                AGOTADO
                                            </span>
                                        )}
                                    </div>

                                    {/* Desktop Hover Action */}
                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/img:opacity-100 transition-opacity hidden md:flex items-center justify-center backdrop-blur-[2px]">
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="p-5 bg-secondary-light text-primary rounded-[1.5rem] shadow-2xl scale-75 group-hover/img:scale-100 transition-all duration-500 hover:bg-primary hover:text-secondary-light"
                                        >
                                            <ShoppingCart className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className={`flex-1 flex flex-col justify-between ${viewMode === 'list' ? '' : 'mt-4 md:mt-6 px-1 md:px-2 space-y-2 md:space-y-4'}`}>
                                    <div className="space-y-1 md:space-y-1.5">
                                        <h3 className="text-sm md:text-2xl font-serif font-black italic text-primary leading-tight tracking-tight line-clamp-2 md:line-clamp-none">
                                            {product.name}
                                        </h3>
                                        <p className="text-[8px] md:text-[11px] uppercase tracking-[0.2em] text-primary/30 font-black italic truncate">
                                            {product.categories?.name || 'Curada'}
                                        </p>
                                    </div>

                                    {viewMode === 'list' && (
                                        <p className="text-luxury-black/40 text-[9px] md:text-sm font-medium line-clamp-1 md:line-clamp-2 italic hidden sm:block">
                                            {product.description || 'Una expresión curada de distinción Luxessence.'}
                                        </p>
                                    )}

                                    <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between pt-2 md:pt-4 border-t border-primary/5 mt-auto">
                                        <div className="flex flex-col text-primary">
                                            {product.original_price && (
                                                <span className="text-[8px] md:text-xs text-primary/20 line-through font-bold">L. {product.original_price}</span>
                                            )}
                                            <p className="text-xs md:text-3xl font-black tracking-tighter">
                                                {product.categories?.name?.toLowerCase().includes('jibbitz') ? 'Dsd L.25' : `L. ${product.price}`}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="flex items-center bg-primary/5 p-1 rounded-xl md:rounded-2xl border border-primary/5">
                                                <button
                                                    onClick={(e) => { e.preventDefault(); updateProductQty(product.id, -1, product.stock); }}
                                                    className="p-1.5 md:p-2 hover:bg-white rounded-lg md:rounded-xl text-primary/40 hover:text-primary transition-all disabled:opacity-20"
                                                    disabled={product.stock <= 0 || (productQuantities[product.id] || 1) <= 1}
                                                >
                                                    <Minus className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                                <span className="w-4 md:w-8 text-center text-xs md:text-sm font-black text-primary">
                                                    {product.stock <= 0 ? 0 : (productQuantities[product.id] || 1)}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.preventDefault(); updateProductQty(product.id, 1, product.stock); }}
                                                    className="p-1.5 md:p-2 hover:bg-white rounded-lg md:rounded-xl text-primary/40 hover:text-primary transition-all disabled:opacity-20"
                                                    disabled={product.stock <= 0 || (productQuantities[product.id] || 1) >= product.stock}
                                                >
                                                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                                                className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-95 ${product.stock <= 0 ? 'bg-primary/5 text-primary/10' : 'bg-primary text-secondary-light hover:shadow-primary/20 hover:-translate-y-1'}`}
                                                disabled={product.stock <= 0}
                                            >
                                                <ShoppingCart className="w-4 h-4 md:w-6 md:h-6" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            )}

            {!loading && filteredProducts.length === 0 && (
                <div className="text-center py-40 space-y-6">
                    <p className="text-primary/20 text-3xl font-serif italic">Sin resultados.</p>
                    <button onClick={() => { setSearch(''); setSelectedCategory('All'); }} className="text-primary font-black uppercase tracking-widest text-xs border-b border-primary/20 pb-1">Limpiar filtros</button>
                </div>
            )}

            {/* Jibbitz Combo Modal */}
            <AnimatePresence>
                {isComboModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsComboModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[3rem] p-10 relative z-10 shadow-2xl border border-primary/10">
                            <div className="text-center space-y-4 mb-8">
                                <h3 className="text-3xl font-serif font-bold italic text-primary">{selectedJibbitz?.name}</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/40">Seleccione combos</p>
                            </div>

                            <div className="space-y-3">
                                {jibbitzCombos.map(combo => (
                                    <div
                                        key={combo.id}
                                        className="w-full p-6 bg-primary/5 text-primary rounded-2xl flex justify-between items-center transition-all border border-primary/5"
                                    >
                                        <span className="font-bold text-lg uppercase">{combo.label}</span>
                                        <div className="flex items-center gap-4 bg-white p-1 rounded-xl shadow-inner border border-primary/10">
                                            <button
                                                onClick={() => updateComboQty(combo.id, -1)}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-primary/5 rounded-lg text-primary/40 hover:text-primary transition-colors"
                                            >
                                                <span className="text-xl font-bold">-</span>
                                            </button>
                                            <span className="w-6 text-center font-bold font-sans">{comboQuantities[combo.id] || 0}</span>
                                            <button
                                                onClick={() => updateComboQty(combo.id, 1)}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-primary/5 rounded-lg text-primary/40 hover:text-primary transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 mt-10">
                                <button
                                    onClick={confirmJibbitzCombos}
                                    className="w-full btn-primary !py-5 shadow-2xl"
                                >
                                    Confirmar Selección
                                </button>
                                <button onClick={() => setIsComboModalOpen(false)} className="w-full py-2 text-[10px] font-black uppercase text-primary/30">Cancelar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Catalog;
