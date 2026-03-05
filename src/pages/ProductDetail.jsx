import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Minus, Plus, ChevronLeft, Share2, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
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
    const [multiVariantQuantities, setMultiVariantQuantities] = useState({});
    const [recommendedProducts, setRecommendedProducts] = useState([]);

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

    const handleAddToCart = () => {
        if (!product) return;

        const hasVariants = product.variants?.length > 0;

        if (hasVariants) {
            const itemsToAdd = Object.entries(multiVariantQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([vId, qty]) => {
                    const variant = product.variants.find(v => v.id === vId);
                    return { variant, qty };
                });

            if (itemsToAdd.length === 0) {
                if (selectedVariant) {
                    const inCart = getCartQty(product.id, selectedVariant.id);
                    const totalAfter = inCart + quantity;
                    if (totalAfter > selectedVariant.stock) {
                        const remaining = selectedVariant.stock - inCart;
                        if (remaining <= 0) {
                            addToast(`Ya tienes todo el stock disponible de "${selectedVariant.name}" en tu carrito`, 'warning');
                        } else {
                            addToast(`Solo puedes agregar ${remaining} unidad${remaining === 1 ? '' : 'es'} más de "${selectedVariant.name}"`, 'warning');
                            setQuantity(remaining);
                        }
                        return;
                    }
                    itemsToAdd.push({ variant: selectedVariant, qty: quantity });
                } else {
                    addToast('Selecciona al menos una fragancia/variante.', 'warning');
                    return;
                }
            }

            itemsToAdd.forEach(({ variant, qty }) => {
                const config = {
                    id: variant.id,
                    label: variant.name,
                    image_url: variant.image_url,
                    price: product.price
                };
                addToCart(product, config, qty);
            });

            addToast(`${itemsToAdd.length > 1 ? 'Productos agregados' : 'Producto agregado'} al carrito`, 'success');
        } else {
            if (product.stock <= 0) {
                addToast(`Este producto está agotado`, 'error');
                return;
            }
            const inCart = getCartQty(product.id);
            const totalAfter = inCart + quantity;
            if (totalAfter > product.stock) {
                const remaining = product.stock - inCart;
                if (remaining <= 0) {
                    addToast(`Ya tienes todo el stock disponible en tu carrito (${product.stock} unidad${product.stock === 1 ? '' : 'es'})`, 'warning');
                } else {
                    addToast(`Solo puedes agregar ${remaining} unidad${remaining === 1 ? '' : 'es'} más`, 'warning');
                    setQuantity(remaining);
                }
                return;
            }
            addToCart(product, null, quantity);
            addToast(`Producto agregado al carrito`, 'success');
        }
    };

    const updateQty = (delta, variantId = null) => {
        if (variantId) {
            const variant = product.variants.find(v => v.id === variantId);
            setMultiVariantQuantities(prev => {
                const current = prev[variantId] || 0;
                const next = Math.max(0, Math.min(variant.stock, current + delta));
                if (delta > 0 && current >= variant.stock) {
                    addToast(`Solo hay ${variant.stock} unidad${variant.stock === 1 ? '' : 'es'} de "${variant.name}" disponibles`, 'warning');
                    return prev;
                }
                return { ...prev, [variantId]: next };
            });
            if (selectedVariant?.id === variantId) {
                setQuantity(prev => Math.max(1, (prev || 0) + delta));
            }
        } else {
            if (delta > 0 && quantity >= product.stock) {
                addToast(`Solo hay ${product.stock} unidad${product.stock === 1 ? '' : 'es'} disponibles`, 'warning');
                return;
            }
            setQuantity(prev => Math.max(1, Math.min(product.stock, prev + delta)));
        }
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
                        <div className="w-full lg:w-[55%] space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="aspect-square bg-white rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 shadow-2xl shadow-primary/5 border border-primary/5 relative overflow-hidden group"
                            >
                                <img
                                    src={selectedVariant?.image_url || product.image_url || '/img/logo.svg'}
                                    alt={product.name}
                                    className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105"
                                />

                                {/* Badges */}
                                <div className="absolute top-8 left-8 flex flex-col gap-3">
                                    {product.is_new_arrival && (
                                        <span className="bg-secondary text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl flex items-center gap-2">
                                            <Sparkles className="w-3 h-3" /> New Arrival
                                        </span>
                                    )}
                                    {product.promo_badge && (
                                        <span className="bg-primary text-secondary-light text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                                            {product.promo_badge}
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={handleShare}
                                    className="absolute top-8 right-8 p-4 bg-white/80 backdrop-blur-md rounded-full text-primary shadow-xl hover:scale-110 active:scale-95 transition-all border border-primary/5"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </motion.div>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 space-y-10">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <span className="text-[11px] font-black text-primary/30 uppercase tracking-[0.4em] italic mb-2 block font-sans">
                                        {product.categories?.name}
                                    </span>
                                    <h1 className="text-5xl md:text-7xl font-serif font-black italic text-primary leading-[0.85]">
                                        {product.name}
                                    </h1>
                                </div>

                                <div className="flex items-center gap-6 pt-4">
                                    <p className="text-4xl md:text-5xl font-black text-primary font-sans">
                                        L. {Number(product.price).toLocaleString()}
                                    </p>
                                    {product.original_price && (
                                        <span className="text-2xl text-primary/20 line-through font-bold">
                                            L. {Number(product.original_price).toLocaleString()}
                                        </span>
                                    )}
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

                                {product.variants?.length > 0 && (
                                    <div className="space-y-6 pt-8 border-t border-primary/5">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30 font-sans">Descubre tu Fragancia</h4>
                                            <span className="text-[9px] font-bold text-primary/20 italic font-sans">{product.variants.length} disponibles</span>
                                        </div>
                                        <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
                                            {product.variants.map((v) => {
                                                const isSelected = selectedVariant?.id === v.id;
                                                const currentQty = multiVariantQuantities[v.id] || 0;
                                                const isOutOfStock = v.stock <= 0;

                                                return (
                                                    <div
                                                        key={v.id}
                                                        onClick={() => !isOutOfStock && setSelectedVariant(v)}
                                                        className={`relative p-4 rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden
                                                        ${isSelected
                                                                ? 'border-primary bg-primary/[0.03] scale-[1.02] shadow-xl'
                                                                : isOutOfStock
                                                                    ? 'opacity-40 cursor-not-allowed border-primary/5'
                                                                    : 'border-primary/10 bg-white hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg'}`}
                                                    >
                                                        <div className="space-y-1 relative z-10">
                                                            <p className={`text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-primary' : 'text-primary/30'}`}>
                                                                {isOutOfStock ? 'Agotado' : `${v.stock} disp.`}
                                                            </p>
                                                            <p className={`text-[10px] font-bold leading-tight line-clamp-2 ${isSelected ? 'text-primary' : 'text-primary/70'}`}>
                                                                {v.name}
                                                            </p>
                                                        </div>
                                                        {currentQty > 0 && (
                                                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-secondary-light rounded-full flex items-center justify-center text-[9px] font-black shadow-lg">
                                                                {currentQty}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Desktop controls only */}
                                <div className="hidden md:flex pt-10 flex-row items-stretch gap-4">
                                    <div className="flex items-center bg-white border-2 border-primary/5 p-1 rounded-[2rem] shadow-xl">
                                        <button
                                            onClick={() => {
                                                if (selectedVariant) updateQty(-1, selectedVariant.id);
                                                else updateQty(-1);
                                            }}
                                            className="w-16 h-16 flex items-center justify-center text-primary/40 hover:text-primary transition-colors"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <span className="w-12 text-center text-2xl font-black text-primary font-sans">
                                            {product.variants?.length > 0
                                                ? Object.values(multiVariantQuantities).reduce((a, b) => a + b, 0) || quantity
                                                : quantity}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (selectedVariant) updateQty(1, selectedVariant.id);
                                                else updateQty(1);
                                            }}
                                            className="w-16 h-16 flex items-center justify-center text-primary/40 hover:text-primary transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleAddToCart}
                                        className="flex-1 btn-primary !py-6 rounded-[2rem] flex items-center justify-center gap-4 text-base shadow-2xl shadow-primary/20 relative overflow-hidden group"
                                    >
                                        <ShoppingCart className="w-6 h-6 transition-transform group-hover:scale-110 relative z-10" />
                                        <span className="relative z-10">AÑADIR A MI COLECCIÓN</span>
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    </button>
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
            <div className="md:hidden fixed bottom-[136px] left-0 right-0 z-[100] px-4">
                <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
                    className="bg-white/90 backdrop-blur-2xl border border-primary/10 rounded-[2.5rem] shadow-2xl shadow-primary/10 px-4 py-3 flex items-center gap-3"
                >
                    {/* Quantity */}
                    <div className="flex items-center bg-primary/5 rounded-[1.5rem] border border-primary/5 p-0.5 shrink-0">
                        <button
                            onClick={() => {
                                if (selectedVariant) updateQty(-1, selectedVariant.id);
                                else updateQty(-1);
                            }}
                            className="w-11 h-11 flex items-center justify-center text-primary/40 hover:text-primary transition-colors active:scale-90"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-9 text-center text-xl font-black text-primary font-sans">
                            {product?.variants?.length > 0
                                ? Object.values(multiVariantQuantities).reduce((a, b) => a + b, 0) || quantity
                                : quantity}
                        </span>
                        <button
                            onClick={() => {
                                if (selectedVariant) updateQty(1, selectedVariant.id);
                                else updateQty(1);
                            }}
                            className="w-11 h-11 flex items-center justify-center text-primary/40 hover:text-primary transition-colors active:scale-90"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Add to Cart */}
                    <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-primary text-secondary-light font-black text-[11px] uppercase tracking-[0.2em] py-4 rounded-[2rem] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Añadir al Carrito</span>
                    </button>
                </motion.div>
            </div>
        </>
    );
};

export default ProductDetail;
