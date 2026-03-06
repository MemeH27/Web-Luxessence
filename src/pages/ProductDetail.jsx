import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Minus, Plus, ChevronLeft, ChevronRight, Share2, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, cart } = useCart();
    const { addToast } = useToast();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const variantsRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const scrollThumbnails = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 250;
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        // Guard against invalid/undefined IDs during route transitions
        if (!id || !UUID_PATTERN.test(id)) return;
        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            if (!UUID_PATTERN.test(id)) {
                throw new Error('ID de producto no válido');
            }

            const { data, error } = await supabase
                .from('products')
                .select('*, categories(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setProduct(data);
            setSelectedVariant(data.variants?.length > 0 ? data.variants[0] : null);
            setQuantity(data.variants?.length > 0 ? 0 : 1);

            // Fetch Recommended Products (Same Category)
            if (data.category_id) {
                const { data: recs } = await supabase
                    .from('products')
                    .select('*, categories(name)')
                    .eq('category_id', data.category_id)
                    .neq('id', id)
                    .limit(4);
                setRecommendedProducts(recs || []);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            if (!error.message?.includes('ID de producto no válido')) {
                addToast('No se pudo encontrar el producto', 'error');
            }
            navigate('/catalog');
        } finally {
            setLoading(false);
        }
    };

    // Get quantity already in cart for this product
    const getCartQty = (productId, variantId = null) => {
        const cartItemId = variantId ? `${productId}-${variantId}` : productId;
        return cart.find(item => item.cartItemId === cartItemId)?.quantity || 0;
    };

    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = async () => {
        setIsAdding(true);
        if (!product) {
            setIsAdding(false);
            return;
        }

        if (quantity < 1) {
            addToast('Selecciona la cantidad que deseas agregar.', 'warning');
            setIsAdding(false);
            return;
        }

        if (product.variants && product.variants.length > 0) {
            if (!selectedVariant) {
                addToast('Selecciona una fragancia.', 'warning');
                setIsAdding(false);
                return;
            }

            const config = {
                id: selectedVariant.id,
                label: selectedVariant.name,
                image_url: selectedVariant.image_url,
                price: product.price
            };

            const result = await addToCart(product, config, quantity);
            if (result.success) {
                addToast('Producto agregado al carrito', 'success');
                setQuantity(0); // Vuelve a 0 después de agregar
            } else {
                addToast(result.message, 'error');
            }
        } else {
            const result = await addToCart(product, null, quantity);
            if (result.success) {
                addToast(`Producto agregado al carrito`, 'success');
                setQuantity(1); // Standard product resets to 1
            } else {
                addToast(result.message, 'error');
            }
        }
        setIsAdding(false);
    };

    const updateQty = (delta) => {
        if (selectedVariant) {
            if (delta > 0 && quantity >= selectedVariant.stock) {
                addToast(`Solo hay ${selectedVariant.stock} unidad${selectedVariant.stock === 1 ? '' : 'es'} de "${selectedVariant.name}" disponibles`, 'warning');
                return;
            }
            setQuantity(prev => Math.max(0, Math.min(selectedVariant.stock, prev + delta)));
        } else {
            if (delta > 0 && quantity >= product.stock) {
                addToast(`Solo hay ${product.stock} unidad${product.stock === 1 ? '' : 'es'} disponibles`, 'warning');
                return;
            }
            setQuantity(prev => Math.max(1, Math.min(product.stock, prev + delta)));
        }
    };

    const handleManualQuantityInput = (val) => {
        const num = parseInt(val);
        if (isNaN(num) || num < 1) {
            setQuantity(selectedVariant ? 0 : 1);
            return;
        }

        const stock = selectedVariant ? selectedVariant.stock : product.stock;

        if (num > stock) {
            addToast(`Solo hay ${stock} en stock`, 'warning');
            setQuantity(stock);
            return;
        }

        setQuantity(num);
    };

    const handleShare = async () => {
        const url = window.location.href;
        const textToShare = `🔥 ¡Mira este increíble producto de Luxessence!\n\n${product.name}\n${url}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Luxessence - ${product.name}`,
                    text: `🔥 ¡Mira este increíble producto de Luxessence!\n\n${product.name}`,
                    url: url
                });
            } else {
                await navigator.clipboard.writeText(textToShare);
                addToast('¡Enlace y mensaje copiados al portapapeles!', 'success');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                await navigator.clipboard.writeText(textToShare);
                addToast('¡Enlace y mensaje copiados al portapapeles!', 'success');
            }
        }
    };

    if (loading) {
        return (
            <div className="pt-40 px-4 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
                <Skeleton className="w-full md:w-1/2 aspect-square rounded-[3rem]" />
                <div className="flex-1 space-y-8">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        );
    }

    if (!product) return null;

    return (
        <>
            <div className="relative">
                <div className="relative pt-24 pb-12 md:pt-40 md:pb-20 px-4 max-w-7xl mx-auto">
                    {/* Back Link */}
                    <button
                        onClick={() => navigate('/catalog')}
                        className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 hover:text-primary transition-colors group"
                    >
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Volver al Catálogo
                    </button>

                    <div className="flex flex-col lg:flex-row gap-16 md:gap-24">
                        {/* Image Section */}
                        <div className="w-full lg:w-[50%]">
                            <div className="lg:sticky lg:top-32 space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="aspect-square bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-premium border border-primary/5 relative overflow-hidden group"
                                >
                                    <img
                                        src={selectedVariant?.image_url || product.image_url || '/img/logo.svg'}
                                        alt={product.name}
                                        className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105"
                                    />

                                    {/* Badges */}
                                    <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
                                        {product.is_new_arrival && (
                                            <span className="bg-primary text-secondary-light text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" /> New Arrival
                                            </span>
                                        )}
                                        {product.promo_badge && (
                                            <span className="bg-secondary text-primary text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                                                {product.promo_badge}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleShare}
                                        className="absolute top-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-full text-primary shadow-xl hover:bg-primary hover:text-white transition-all duration-500 border border-primary/5"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </motion.div>

                                {/* Variant Thumbnails */}
                                {product.variants?.length > 0 && (
                                    <div className="space-y-4 pt-6 border-t border-primary/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/40 font-sans">Selecciona una Fragancia</h4>
                                        </div>

                                        <div className="relative group/slider">
                                            <button
                                                onClick={() => scrollThumbnails('left')}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white shadow-md border border-primary/5 text-primary w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all hidden md:flex hover:bg-primary/5 cursor-pointer"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>

                                            <div
                                                ref={scrollContainerRef}
                                                className="flex gap-3 overflow-x-auto pb-4 px-2 scrollbar-hide snap-x relative items-center scroll-smooth"
                                            >
                                                {product.variants.map(v => {
                                                    const isSelected = selectedVariant?.id === v.id;
                                                    return (
                                                        <div
                                                            key={v.id}
                                                            onClick={() => {
                                                                setSelectedVariant(v);
                                                                setQuantity(0);
                                                            }}
                                                            className={`relative w-[84px] h-[84px] md:w-[96px] md:h-[96px] rounded-[1rem] border-2 transition-all cursor-pointer p-1.5 bg-white flex-shrink-0 snap-start select-none
                                                                ${isSelected ? 'border-primary shadow-lg ring-4 ring-primary/5 scale-[1.03]' : 'border-primary/5 opacity-70 hover:opacity-100 hover:border-primary/30'}
                                                                ${v.stock <= 0 ? 'opacity-40 grayscale-[50%]' : ''}`}
                                                        >
                                                            <img src={v.image_url || product.image_url || '/img/logo.svg'} className="w-full h-full object-contain rounded-lg" alt={v.name} />
                                                            {v.stock <= 0 && (
                                                                <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-[1rem] backdrop-blur-[1px]">
                                                                    <span className="text-red-500 font-black text-[10px] transform -rotate-12 outline-1">N/A</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                onClick={() => scrollThumbnails('right')}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white shadow-md border border-primary/5 text-primary w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all hidden md:flex hover:bg-primary/5 cursor-pointer"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.4em] italic block">
                                        {product.categories?.name}
                                    </span>
                                    <h1 className="text-4xl md:text-6xl font-serif font-black italic text-primary leading-tight">
                                        {product.name}
                                    </h1>
                                </div>

                                <div className="flex items-center gap-6 pt-2">
                                    <p className="text-3xl md:text-4xl font-black text-primary font-sans">
                                        L. {Number(product.price).toLocaleString()}
                                    </p>
                                    {product.original_price && (
                                        <span className="text-xl text-primary/20 line-through font-bold">
                                            L. {Number(product.original_price).toLocaleString()}
                                        </span>
                                    )}
                                    <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-primary/30 border border-primary/10 px-3 py-1 rounded-full">
                                        {product.stock > 0 ? `${product.stock} DISPONIBLES` : 'SIN STOCK'}
                                    </span>
                                </div>

                                <div className="h-px bg-primary/10 w-full" />

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">La Esencia</h3>
                                    <p className="text-primary/70 text-lg md:text-xl font-medium italic leading-relaxed">
                                        {product.description || 'Una expresión curada de distinción Luxessence, diseñada para elevar tu estilo personal con elegancia atemporal y un aroma inconfundible.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4">
                                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/5">
                                        <ShieldCheck className="w-5 h-5 text-primary opacity-60" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">100% Original</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/5">
                                        <Sparkles className="w-5 h-5 text-primary opacity-60" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Envío Premium</span>
                                    </div>
                                </div>

                                {/* The giant variant section has been removed in favor of the thumbnails on the left */}

                                {/* Desktop controls only */}
                                <div className="hidden md:flex pt-12 flex-col gap-4 border-t border-primary/10">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between px-2">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/40 font-sans">
                                                {product.variants?.length > 0 ? (selectedVariant?.name || 'SELECCIONA UNA FRAGANCIA') : 'CANTIDAD'}
                                            </h4>
                                            {product.variants?.length > 0 && selectedVariant && (
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/30">
                                                    {selectedVariant.stock} Disponibles
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-row items-stretch gap-4">
                                            <div className="flex items-center bg-white border border-primary/10 p-1.5 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
                                                <button
                                                    onClick={() => updateQty(-1)}
                                                    disabled={selectedVariant ? selectedVariant.stock <= 0 : product.stock <= 0}
                                                    className="w-14 h-14 flex items-center justify-center text-primary/30 hover:text-primary hover:bg-primary/5 rounded-full transition-all disabled:opacity-30"
                                                >
                                                    <Minus className="w-5 h-5" />
                                                </button>
                                                <span className="w-14 text-center text-xl font-black text-primary font-sans">
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQty(1)}
                                                    disabled={selectedVariant ? selectedVariant.stock <= 0 : product.stock <= 0}
                                                    className="w-14 h-14 flex items-center justify-center text-primary/30 hover:text-primary hover:bg-primary/5 rounded-full transition-all disabled:opacity-30"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={handleAddToCart}
                                                disabled={isAdding || quantity === 0 || (selectedVariant && selectedVariant.stock <= 0) || (!selectedVariant && product.variants?.length > 0) || (product.variants?.length === 0 && product.stock <= 0)}
                                                className="flex-1 btn-primary !py-5 rounded-[2.5rem] flex items-center justify-center gap-4 text-xs shadow-premium relative overflow-hidden group disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110 relative z-10" />
                                                <span className="relative z-10 font-black tracking-widest uppercase items-center flex">
                                                    {isAdding ? 'RESERVANDO...' : 'AÑADIR A MI COLECCIÓN'}
                                                </span>
                                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Recommended Products */}
                    <div className="mt-24 md:mt-32 space-y-12 pb-20">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl md:text-5xl font-serif font-bold italic text-primary leading-tight">Recomendado para Usted</h2>
                            <div className="w-20 h-1 bg-primary/20 rounded-full mx-auto" />
                            <p className="text-[10px] text-primary/30 uppercase tracking-[0.4em] font-black italic">Descubra más tesoros de nuestra colección</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="aspect-[4/5] rounded-[2.5rem]" />
                                ))
                            ) : recommendedProducts.length > 0 ? (
                                recommendedProducts.map((p) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        className="glass-panel p-6 rounded-[2.5rem] bg-white border border-primary/5 hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 cursor-pointer group"
                                        onClick={() => navigate(`/product/${p.id}`)}
                                    >
                                        <div className="aspect-square bg-primary/2 rounded-2xl mb-6 overflow-hidden relative">
                                            <img
                                                src={p.image_url || '/img/logo.svg'}
                                                alt={p.name}
                                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-primary/30 italic">{p.categories?.name}</p>
                                            <h4 className="text-lg font-serif font-bold italic text-primary truncate">{p.name}</h4>
                                            <p className="text-sm font-black text-primary/60">L. {Number(p.price).toLocaleString()}</p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center">
                                    <p className="text-primary/20 text-sm italic font-serif">No hay más productos en esta categoría.</p>
                                </div>
                            )}
                        </div>

                        <div className="text-center pt-8 pb-36 md:pb-8">
                            <button
                                onClick={() => navigate('/catalog')}
                                className="text-primary/40 hover:text-primary text-[10px] font-black uppercase tracking-[0.3em] border-b border-primary/10 hover:border-primary transition-all pb-2"
                            >
                                Ver toda la colección
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Bottom Bar */}
            <div className="fixed bottom-[136px] left-0 right-0 z-[100] px-4 md:hidden">
                <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
                    className="bg-white/95 backdrop-blur-2xl border border-primary/10 rounded-[2.5rem] shadow-2xl shadow-primary/10 px-4 py-4 flex flex-col gap-3"
                >
                    {product?.variants?.length > 0 && selectedVariant && (
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] md:text-xs font-black tracking-widest uppercase text-primary truncate max-w-[65%]">
                                {selectedVariant.name}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 whitespace-nowrap">
                                {selectedVariant.stock} Disp.
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        {/* Quantity Container */}
                        <div className="flex items-center bg-primary/5 rounded-[1.5rem] border border-primary/5 p-0.5 shrink-0">
                            <button
                                onClick={() => updateQty(-1)}
                                disabled={selectedVariant ? selectedVariant.stock <= 0 : product.stock <= 0}
                                className="w-12 h-12 flex items-center justify-center text-primary/40 hover:text-primary transition-colors active:scale-90 disabled:opacity-30"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <span className="w-10 text-center text-[22px] font-black text-primary font-sans">
                                {quantity}
                            </span>
                            <button
                                onClick={() => updateQty(1)}
                                disabled={selectedVariant ? selectedVariant.stock <= 0 : product.stock <= 0}
                                className="w-12 h-12 flex items-center justify-center text-primary/40 hover:text-primary transition-colors active:scale-90 disabled:opacity-30"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={isAdding || quantity === 0 || (selectedVariant && selectedVariant.stock <= 0) || (!selectedVariant && product.variants?.length > 0) || (product.variants?.length === 0 && product.stock <= 0)}
                            className="flex-1 bg-primary text-secondary-light h-14 rounded-[1.5rem] flex items-center justify-center gap-3 relative overflow-hidden active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                        >
                            <ShoppingCart className="w-[18px] h-[18px]" />
                            <span className="text-[11px] font-black uppercase tracking-widest mt-0.5">
                                {isAdding ? 'RESERVANDO...' : 'AÑADIR'}
                            </span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default ProductDetail;
