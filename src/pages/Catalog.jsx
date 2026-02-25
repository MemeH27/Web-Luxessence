import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { Search, Plus, Minus, ShoppingCart, Grid, List, Filter, Tag, ChevronLeft, X, Sparkles } from 'lucide-react';
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
    const [selectedProductDetails, setSelectedProductDetails] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [showOnlyInStock, setShowOnlyInStock] = useState(true);

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
        const relevantPromo = activePromos.find(promo => promo.product_ids?.includes(p.id));
        if (relevantPromo) {
            if (relevantPromo.promo_type === 'bogo') {
                return {
                    ...p,
                    promo_badge: relevantPromo.discount_badge || '2x1',
                    is_bogo: true
                };
            }
            if (relevantPromo.new_prices?.[p.id]) {
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
            || (selectedCategory === 'ComingSoon' && p.is_coming_soon)
            || p.categories?.id === selectedCategory;

        const matchesStock = !showOnlyInStock || p.stock > 0;

        return matchesSearch && matchesCategory && matchesStock;
    }).sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return new Date(b.created_at) - new Date(a.created_at); // newest
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

    const openProductDetails = (product) => {
        setSelectedProductDetails(product);
        if (!productQuantities[product.id]) {
            setProductQuantities(prev => ({ ...prev, [product.id]: 1 }));
        }
        setIsProductModalOpen(true);
    };

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
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-13 space-y-8 md:space-y-16">
            {/* Page Header */}
            <div className="space-y-4 max-w-2xl px-2 md:px-0">
                <h1 className="text-4xl md:text-6xl font-serif font-bold italic text-primary">Nuestra Selección</h1>
                <p className="text-luxury-black/40 tracking-[0.3em] uppercase text-[9px] md:text-xs font-black">Excelencia en cada detalle</p>
                <div className="w-16 md:w-20 h-1 bg-primary/20 rounded-full" />
            </div>

            {/* Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Sidebar Filters */}
                <aside className="hidden lg:block w-64 shrink-0 space-y-10">
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary pb-4 border-b border-primary/10">Filtros</h3>

                        <div className="space-y-8">
                            {/* Categories Filter */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Categoría</p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setSelectedCategory('All')}
                                        className={`text-sm text-left transition-colors ${selectedCategory === 'All' ? 'text-primary font-bold' : 'text-primary/60 hover:text-primary'}`}
                                    >
                                        Todos los productos
                                    </button>
                                    {activePromos.length > 0 && (
                                        <button
                                            onClick={() => setSelectedCategory('Promo')}
                                            className={`text-sm text-left transition-colors flex items-center gap-2 ${selectedCategory === 'Promo' ? 'text-secondary font-bold' : 'text-primary/60 hover:text-primary'}`}
                                        >
                                            <Tag className="w-3 h-3" /> Liquidaciones
                                        </button>
                                    )}
                                    {products.some(p => p.is_coming_soon) && (
                                        <button
                                            onClick={() => setSelectedCategory('ComingSoon')}
                                            className={`text-sm text-left transition-colors flex items-center gap-2 ${selectedCategory === 'ComingSoon' ? 'text-amber-600 font-bold' : 'text-primary/60 hover:text-primary'}`}
                                        >
                                            <Sparkles className="w-3 h-3 text-amber-500" /> Próximamente
                                        </button>
                                    )}
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`text-sm text-left transition-colors ${selectedCategory === cat.id ? 'text-primary font-bold' : 'text-primary/60 hover:text-primary'}`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Stock Filter */}
                            <div className="space-y-4 pt-4 border-t border-primary/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Disponibilidad</p>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 text-sm text-primary/60 cursor-pointer hover:text-primary">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-primary/20 accent-primary"
                                            checked={showOnlyInStock}
                                            onChange={(e) => setShowOnlyInStock(e.target.checked)}
                                        />
                                        En existencia
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Mobile Filter & Sort Buttons */}
                <div className="lg:hidden flex border-y border-primary/5 -mx-4">
                    <button
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="flex-1 py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-primary border-r border-primary/5"
                    >
                        <Filter className="w-4 h-4" />
                        Filtros
                    </button>
                    <div className="flex-1 relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full h-full appearance-none bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-primary px-4 text-center focus:ring-0"
                        >
                            <option value="newest">Ordenar por v</option>
                            <option value="price_asc">Precio: Menor a Mayor</option>
                            <option value="price_desc">Precio: Mayor a Menor</option>
                            <option value="name_asc">Nombre: A-Z</option>
                        </select>
                    </div>
                </div>

                {/* Product Area */}
                <div className="flex-1 space-y-8">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-primary/5">
                        <div className="flex items-center gap-4">
                            <p className="text-xs font-medium text-primary/40">{filteredProducts.length} productos</p>
                            <div className="h-4 w-[1px] bg-primary/10 hidden md:block" />
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-sm pl-10 w-40 md:w-64 placeholder:text-primary/20"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Ver:</p>
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-secondary-light' : 'text-primary/20 hover:text-primary'}`}><Grid className="w-4 h-4" /></button>
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-secondary-light' : 'text-primary/20 hover:text-primary'}`}><List className="w-4 h-4" /></button>
                            </div>

                            <div className="relative text-left hidden md:block">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer focus:ring-0 pr-6"
                                >
                                    <option value="newest">Más reciente</option>
                                    <option value="price_asc">Precio: Menor a Mayor</option>
                                    <option value="price_desc">Precio: Mayor a Menor</option>
                                    <option value="name_asc">Nombre: A-Z</option>
                                </select>
                                <ChevronLeft className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-primary/40 -rotate-90 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Promo Banner if applicable */}
                    {selectedCategory === 'Promo' && activePromos.length > 0 && (
                        <div className="bg-primary p-8 rounded-3xl text-center space-y-2 mb-8 relative overflow-hidden">
                            <h2 className="text-3xl font-serif font-bold italic text-secondary-light">{activePromos[0].title}</h2>
                            <p className="text-secondary-light/60 text-xs font-medium uppercase tracking-widest">{activePromos[0].discount_badge}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="space-y-4">
                                    <Skeleton className="aspect-[4/5] rounded-2xl" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                layout
                                className={viewMode === 'grid'
                                    ? "grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-12"
                                    : "flex flex-col gap-12"
                                }
                            >
                                {filteredProducts.map((product) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={product.id}
                                        className={`group overflow-hidden ${viewMode === 'list' ? 'flex gap-8 items-center border-b border-primary/5 pb-8' : 'flex flex-col h-full'}`}
                                    >
                                        <div className={`relative overflow-hidden bg-primary/5 rounded-2xl ${viewMode === 'list' ? 'w-32 h-32 md:w-64 md:h-64 shrink-0' : 'aspect-[4/5] mb-4'}`}>
                                            <img
                                                src={product.image_url || '/img/logo.svg'}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            />

                                            <div
                                                className="absolute inset-0 cursor-pointer"
                                                onClick={() => openProductDetails(product)}
                                            />

                                            {/* Badges */}
                                            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 pointer-events-none">
                                                {product.is_new_arrival && (
                                                    <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-secondary-light text-[8px] font-black uppercase tracking-widest rounded-full z-10">
                                                        Nuevo
                                                    </span>
                                                )}
                                                {product.is_coming_soon && (
                                                    <span className="absolute top-4 left-4 px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full z-10">
                                                        Próximamente
                                                    </span>
                                                )}
                                                {product.promo_badge && (
                                                    <span className="bg-secondary text-primary text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                                        {product.promo_badge}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Indicator Overlay (Desktop) */}
                                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                                                <div className="px-6 py-2 bg-secondary-light/90 text-primary text-[8px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                    Ver Detalles
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`flex flex-col cursor-pointer ${viewMode === 'list' ? 'flex-1 justify-center' : 'text-center'}`} onClick={() => openProductDetails(product)}>
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-widest text-primary/30 font-black italic">
                                                    {product.categories?.name}
                                                </p>
                                                <h3 className="text-base md:text-xl font-serif font-black italic text-primary leading-tight line-clamp-2 md:line-clamp-none group-hover:underline decoration-secondary transition-all">
                                                    {product.name}
                                                </h3>
                                            </div>

                                            {viewMode === 'list' && (
                                                <p className="text-primary/40 text-sm italic mt-3 line-clamp-2 hidden md:block">
                                                    {product.description || 'Una expresión curada de distinción Luxessence.'}
                                                </p>
                                            )}

                                            <div className={`mt-auto flex items-center gap-4 ${viewMode === 'list' ? 'pt-4' : 'justify-center pt-4'}`}>
                                                <div className="flex flex-col">
                                                    {product.original_price && (
                                                        <span className="text-[10px] text-primary/20 line-through font-bold">L. {product.original_price}</span>
                                                    )}
                                                    <p className="text-lg md:text-2xl font-black text-primary">
                                                        L. {product.price}
                                                    </p>
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

                    {/* Product Details Modal */}
                    <AnimatePresence>
                        {isProductModalOpen && selectedProductDetails && (
                            <div className="fixed inset-0 z-[300] flex items-center justify-center">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-white/40 backdrop-blur-2xl"
                                    onClick={() => setIsProductModalOpen(false)}
                                />
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    className="bg-white w-full max-w-7xl md:rounded-[3rem] overflow-hidden relative z-10 shadow-3xl flex flex-col md:flex-row h-screen md:h-fit md:max-h-[90vh]"
                                >
                                    {/* Mobile Floating Close - Only visible on scroll or fixed */}
                                    <button
                                        onClick={() => setIsProductModalOpen(false)}
                                        className="absolute top-6 right-6 z-50 p-4 bg-primary text-secondary-light rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl md:flex"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>

                                    {/* Image Section - Larger on mobile */}
                                    <div className="w-full md:w-1/2 h-[50vh] md:h-auto bg-primary/5 flex items-center justify-center shrink-0">
                                        <img
                                            src={selectedProductDetails.image_url || '/img/logo.svg'}
                                            className="w-full h-full object-contain p-4 md:p-12 transition-transform duration-700 hover:scale-105"
                                            alt={selectedProductDetails.name}
                                        />
                                    </div>

                                    {/* Info Section */}
                                    <div className="flex-1 flex flex-col relative overflow-hidden">
                                        {/* Scrollable Content */}
                                        <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-16 pb-32 md:pb-16">
                                            <div className="space-y-8">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <span className="px-4 py-1.5 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                                                            {selectedProductDetails.categories?.name}
                                                        </span>
                                                        {selectedProductDetails.is_new_arrival && (
                                                            <span className="px-4 py-1.5 bg-secondary text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                                                                New Arrival
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h2 className="text-4xl md:text-6xl font-serif font-black italic text-primary leading-[0.9]">
                                                        {selectedProductDetails.name}
                                                    </h2>
                                                    <div className="flex items-baseline gap-4 pt-2">
                                                        <p className="text-3xl md:text-5xl font-black text-primary">L. {selectedProductDetails.price}</p>
                                                        {selectedProductDetails.original_price && (
                                                            <span className="text-xl text-primary/20 line-through font-bold">L. {selectedProductDetails.original_price}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Descripción</h4>
                                                    <p className="text-primary/70 text-lg leading-relaxed font-medium italic">
                                                        {selectedProductDetails.description || 'Una expresión curada de distinción Luxessence, diseñada para elevar tu estilo personal con elegancia atemporal.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="md:relative p-6 md:p-16 md:pt-0 bg-gradient-to-t from-white via-white to-transparent md:bg-none absolute bottom-0 left-0 right-0">
                                            <div className="flex gap-4 max-w-lg mx-auto md:max-w-none">
                                                <div className="flex items-center bg-primary/5 border border-primary/10 p-1.5 rounded-2xl shadow-sm">
                                                    <button
                                                        onClick={() => updateProductQty(selectedProductDetails.id, -1, selectedProductDetails.stock)}
                                                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-primary/40 hover:text-primary transition-colors"
                                                    >
                                                        <Minus className="w-5 h-5" />
                                                    </button>
                                                    <span className="w-8 md:w-10 text-center text-lg md:text-xl font-black text-primary">
                                                        {productQuantities[selectedProductDetails.id] || 1}
                                                    </span>
                                                    <button
                                                        onClick={() => updateProductQty(selectedProductDetails.id, 1, selectedProductDetails.stock)}
                                                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-primary/40 hover:text-primary transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => { handleAddToCart(selectedProductDetails); setIsProductModalOpen(false); }}
                                                    className="flex-1 btn-primary !py-4 md:!py-5 flex items-center justify-center gap-3 text-xs md:text-sm shadow-2xl active:scale-95 transition-all"
                                                >
                                                    <ShoppingCart className="w-5 h-5" />
                                                    <span className="hidden xs:inline">AÑADIR A LA BOLSA</span>
                                                    <span className="xs:hidden">AÑADIR</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                    {/* Mobile Filters Drawer */}
                    <AnimatePresence>
                        {isMobileFiltersOpen && (
                            <div className="fixed inset-0 z-[400] flex justify-end">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-primary/20 backdrop-blur-md"
                                    onClick={() => setIsMobileFiltersOpen(false)}
                                />
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    className="bg-white w-full max-w-xs h-screen relative z-10 shadow-2xl flex flex-col"
                                >
                                    <div className="p-6 flex items-center justify-between border-b border-primary/5">
                                        <h2 className="text-lg font-serif font-black italic text-primary">Filtros</h2>
                                        <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-primary/5 text-primary rounded-full">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-10">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Categorías</p>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => setSelectedCategory('All')}
                                                    className={`text-sm text-left ${selectedCategory === 'All' ? 'text-primary font-bold' : 'text-primary/60'}`}
                                                >
                                                    Todos
                                                </button>
                                                {products.some(p => p.is_coming_soon) && (
                                                    <button
                                                        onClick={() => setSelectedCategory('ComingSoon')}
                                                        className={`text-sm text-left ${selectedCategory === 'ComingSoon' ? 'text-amber-600 font-bold' : 'text-primary/60'}`}
                                                    >
                                                        Próximamente
                                                    </button>
                                                )}
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => setSelectedCategory(cat.id)}
                                                        className={`text-sm text-left ${selectedCategory === cat.id ? 'text-primary font-bold' : 'text-primary/60'}`}
                                                    >
                                                        {cat.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Disponibilidad</p>
                                            <label className="flex items-center gap-3 text-sm text-primary/60">
                                                <input
                                                    type="checkbox"
                                                    checked={showOnlyInStock}
                                                    onChange={(e) => setShowOnlyInStock(e.target.checked)}
                                                    className="w-5 h-5 rounded border-primary/20 accent-primary"
                                                />
                                                Solo productos disponibles
                                            </label>
                                        </div>
                                    </div>

                                    <div className="p-6 border-t border-primary/5">
                                        <button
                                            onClick={() => setIsMobileFiltersOpen(false)}
                                            className="w-full btn-primary !py-4 text-xs tracking-widest"
                                        >
                                            VER RESULTADOS
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Catalog;
