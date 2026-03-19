import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
    X, Search, Plus, Minus, Trash2, ShoppingCart, User, Package,
    DollarSign, CreditCard, Save, ArrowLeft, UserPlus, Tag, Camera, Minimize2, Edit
} from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import SecurityModal from './SecurityModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

const JIBBITZ_COMBOS = [
    { id: 'combo-1', name: '1 Unidad', quantity: 1, price: 25 },
    { id: 'combo-3', name: 'Pack de 3', quantity: 3, price: 70 },
    { id: 'combo-5', name: 'Pack de 5', quantity: 5, price: 105 },
];

const CONSUMIDOR_FINAL = { id: null, first_name: 'Consumidor', last_name: 'Final', phone: 'S/N' };

const NewSaleModal = ({ isOpen, onClose, onSaleComplete, isMinimized, onMinimize, onRestore, isEditing = false, saleToEdit = null }) => {
    const { addToast } = useToast();

    // Core state
    const [step, setStep] = useState(1); // 1: Products, 2: Checkout (mobile only)
    const [processing, setProcessing] = useState(false);

    // Customer state
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(CONSUMIDOR_FINAL);
    const [searchCustomer, setSearchCustomer] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // New Customer Data
    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', address: '' });

    // Products state
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchProduct, setSearchProduct] = useState('');
    const [cart, setCart] = useState([]);

    // Jibbitz Modal
    const [jibbitzModalOpen, setJibbitzModalOpen] = useState(false);
    const [selectedJibbitz, setSelectedJibbitz] = useState(null);
    const [jibbitzSelection, setJibbitzSelection] = useState({});

    // Sale Details
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percentage'
    const [paymentMethod, setPaymentMethod] = useState('Contado');
    const [useLoyaltyDiscount, setUseLoyaltyDiscount] = useState(false);
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

    // Variant Selection
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [productForVariant, setProductForVariant] = useState(null);
    const [variantQuantities, setVariantQuantities] = useState({});
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            const init = async () => {
                await Promise.all([fetchCustomers(), fetchProducts(), fetchCategories()]);
                
                if (isEditing && saleToEdit) {
                    setDiscount(saleToEdit.discount || 0);
                    setDiscountType('fixed'); 
                    setPaymentMethod(saleToEdit.payment_method || 'Contado');
                    setSaleDate(saleToEdit.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]);
                    
                    if (saleToEdit.customers) {
                        setSelectedCustomer(saleToEdit.customers);
                        setSearchCustomer(`${saleToEdit.customers.first_name} ${saleToEdit.customers.last_name}`);
                    } else {
                        setSelectedCustomer(CONSUMIDOR_FINAL);
                    }

                    // Map items to cart
                    const items = saleToEdit.orders?.items || [];
                    const initialCart = items.map(item => {
                        const uniqueId = item.is_variant ? `${item.product_id}-${item.variant_id}` : (item.is_combo ? `${item.product_id}-combo` : item.product_id);
                        return {
                            id: uniqueId,
                            baseProductId: item.product_id,
                            variantId: item.variant_id,
                            name: item.name,
                            price: item.price,
                            cost: item.cost,
                            quantity: item.quantity,
                            stock: 999, // Will be fetchable from products mapping if needed
                            isCombo: item.is_combo,
                            isVariant: item.is_variant,
                            singleJibbitzCount: item.combo_jibbitz_count || 1,
                            image: null // Products list will have it
                        };
                    });
                    setCart(initialCart);
                } else if (cart.length === 0) {
                    resetState();
                }
            };
            init();
        }
    }, [isOpen, isMinimized, isEditing, saleToEdit]);

    const resetState = () => {
        setSelectedCustomer(CONSUMIDOR_FINAL);
        setCart([]);
        setDiscount(0);
        setDiscountType('fixed');
        setPaymentMethod('Contado');
        setUseLoyaltyDiscount(false);
        setSearchCustomer('');
        setSearchProduct('');
        setSelectedCategory('all');
        setStep(1);
    };

    const fetchCustomers = async () => {
        const { data } = await supabase.from('customers').select('*').order('first_name');
        setCustomers(data || []);
    };

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*, categories(*)').eq('is_coming_soon', false).order('name');
        setProducts(data || []);
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('name');
        setCategories(data || []);
    };

    const filteredCustomers = useMemo(() => {
        if (!searchCustomer) return customers;
        return customers.filter(c =>
            c.first_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
            c.last_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
            c.phone?.includes(searchCustomer)
        );
    }, [customers, searchCustomer]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCustomerDropdown && !event.target.closest('.customer-search-container')) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCustomerDropdown]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
            const matchesSearch = p.name?.toLowerCase().includes(searchProduct.toLowerCase());
            return matchesCategory && matchesSearch && p.stock > 0;
        });
    }, [products, selectedCategory, searchProduct]);

    // Financials
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = useLoyaltyDiscount ? subtotal * 0.20 : (discountType === 'percentage' ? subtotal * (discount / 100) : discount);
    const total = Math.max(0, subtotal - discountAmount);

    const handleProductClick = (product) => {
        const isJibbitz = product.categories?.name?.toLowerCase().includes('jibbitz');
        if (isJibbitz) {
            setSelectedJibbitz(product);
            setJibbitzSelection({});
            setJibbitzModalOpen(true);
        } else if (product.variants?.length > 0) {
            setProductForVariant(product);
            setVariantQuantities({});
            setVariantModalOpen(true);
        } else {
            addToCart(product);
        }
    };

    const addVariantToCart = () => {
        let added = false;
        const newCart = [...cart];

        Object.entries(variantQuantities).forEach(([variantId, qty]) => {
            if (qty > 0) {
                const variant = productForVariant.variants.find(v => v.id === variantId);
                const uniqueId = `${productForVariant.id}-${variant.id}`;
                const existingIndex = newCart.findIndex(item => item.id === uniqueId);

                if (existingIndex >= 0) {
                    newCart[existingIndex].quantity += qty;
                } else {
                    newCart.push({
                        id: uniqueId,
                        baseProductId: productForVariant.id,
                        variantId: variant.id,
                        name: `${productForVariant.name} (${variant.name})`,
                        price: productForVariant.price,
                        cost: productForVariant.cost,
                        quantity: qty,
                        stock: variant.stock,
                        image: variant.image_url || productForVariant.image_url,
                        isVariant: true
                    });
                }
                added = true;
            }
        });

        if (added) {
            setCart(newCart);
            addToast('Opciones agregadas', 'success');
        }
        setVariantModalOpen(false);
    };

    const updateVariantSelection = (variantId, delta, maxStock) => {
        setVariantQuantities(prev => {
            const current = prev[variantId] || 0;
            const next = current + delta;
            if (next < 0) return prev;
            if (next > maxStock && delta > 0) {
                addToast(`Solo hay ${maxStock} en stock`, 'warning');
                return prev;
            }
            return { ...prev, [variantId]: next };
        });
    };

    const handleBarcodeScan = (code) => {
        setIsScannerOpen(false);
        const normalizedCode = (code || '').trim();
        let foundVariant = null;
        const product = products.find(p => {
            if (p.sku === normalizedCode) return true;
            const v = p.variants?.find(v => v.sku === normalizedCode);
            if (v) { foundVariant = v; return true; }
            return false;
        });
        
        if (product) {
            if (product.variants && product.variants.length > 0) {
                // Open variant modal for this product
                setProductForVariant(product);
                setVariantQuantities({});
                setVariantModalOpen(true);
            } else {
                addToCart(product);
                addToast(`Agregado: ${product.name}`, 'success');
            }
        } else {
            addToast(`Producto no encontrado para el código: ${code}`, 'error');
        }
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id && !item.isCombo);
        if (existing) {
            if (existing.quantity < product.stock) {
                setCart(cart.map(item => item.id === product.id && !item.isCombo ? { ...item, quantity: item.quantity + 1 } : item));
            } else {
                addToast(`Solo hay ${product.stock} disponibles`, 'warning');
            }
        } else {
            setCart([...cart, {
                id: product.id,
                name: product.name,
                price: product.price,
                cost: product.cost,
                quantity: 1,
                stock: product.stock,
                image: product.image_url,
                isCombo: false
            }]);
            addToast('Producto agregado', 'success');
        }
    };

    const updateJibbitzSelection = (comboId, delta) => {
        setJibbitzSelection(prev => {
            const current = prev[comboId] || 0;
            const next = current + delta;
            if (next < 0) return prev;
            return { ...prev, [comboId]: next };
        });
    };

    const confirmJibbitzSelection = () => {
        let addedCount = 0;
        const newCart = [...cart];

        Object.entries(jibbitzSelection).forEach(([comboId, qty]) => {
            if (qty > 0) {
                const combo = JIBBITZ_COMBOS.find(c => c.id === comboId);
                const uniqueId = `${selectedJibbitz.id}-${combo.id}`;
                const existingIndex = newCart.findIndex(item => item.id === uniqueId && item.isCombo);

                if (existingIndex >= 0) {
                    newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + qty };
                } else {
                    newCart.push({
                        id: uniqueId,
                        baseProductId: selectedJibbitz.id,
                        name: `${selectedJibbitz.name} (${combo.name})`,
                        price: combo.price,
                        cost: selectedJibbitz.cost * combo.quantity,
                        quantity: qty,
                        stock: Math.floor(selectedJibbitz.stock / combo.quantity),
                        singleJibbitzCount: combo.quantity,
                        image: selectedJibbitz.image_url,
                        isCombo: true
                    });
                }
                addedCount += qty;
            }
        });

        if (addedCount > 0) {
            setCart(newCart);
            addToast('Combos agregados al carrito', 'success');
        }
        setJibbitzModalOpen(false);
    };

    const updateQuantity = (id, isCombo, isVariant, amount) => {
        setCart(cart.map(item => {
            if (item.id === id && item.isCombo === isCombo && item.isVariant === isVariant) {
                const newQty = item.quantity + amount;
                if (newQty < 1) return null;
                if (newQty > item.stock && amount > 0) {
                    addToast(`Límite de stock alcanzado`, 'warning');
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    const removeFromCart = (id, isCombo, isVariant) => {
        setCart(cart.filter(item => !(item.id === id && item.isCombo === isCombo && item.isVariant === isVariant)));
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        try {
            const rawPhone = newCustomer.phone ? newCustomer.phone.replace('+504', '').replace(/\D/g, '') : '';
            if (rawPhone.length !== 8) {
                addToast('El número debe tener 8 dígitos', 'error');
                return;
            }

            const formattedCustomer = {
                ...newCustomer,
                phone: `+504 ${rawPhone}`
            };

            // Use upsert instead of insert to merge with existing record by phone
            const { data, error } = await supabase.from('customers')
                .upsert(formattedCustomer, { onConflict: 'phone' })
                .select()
                .single();
            if (error) throw error;

            setCustomers([...customers, data]);
            setSelectedCustomer(data);
            setIsNewCustomerModalOpen(false);
            setSearchCustomer(`${data.first_name} ${data.last_name}`);
            setNewCustomer({ first_name: '', last_name: '', phone: '', address: '' });
            addToast('Cliente guardado', 'success');
        } catch (err) {
            addToast('Error al guardar cliente', 'error');
        }
    };

    const handleProcessSale = async () => {
        if (cart.length === 0) return addToast('El carrito está vacío', 'warning');

        setProcessing(true);
        try {
            const orderItems = cart.map(item => ({
                product_id: (item.isCombo || item.isVariant) ? item.baseProductId : item.id,
                variant_id: item.variantId || null,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                cost: item.cost,
                is_combo: item.isCombo || false,
                is_variant: item.isVariant || false,
                combo_jibbitz_count: item.singleJibbitzCount || 1
            }));

            // Handle guest customer creation if needed
            let customerId = selectedCustomer?.id;
            if (customerId === 'temp') {
                try {
                    const { data: tempCust, error: tempError } = await supabase
                        .from('customers')
                        .insert({
                            first_name: selectedCustomer.first_name,
                            last_name: '(Invitado)',
                            phone: `INV-${Date.now().toString().slice(-6)}`,
                            address: 'Venta Presencial'
                        })
                        .select()
                        .single();
                    if (tempError) throw tempError;
                    customerId = tempCust.id;
                } catch (err) {
                    console.error('Error creating guest customer:', err);
                    customerId = null;
                }
            }

            const now = new Date();
            const [year, month, day] = saleDate.split('-').map(Number);
            const saleDateTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
            const isoTimestamp = saleDateTime.toISOString();
            const finalTotal = total;
            const finalDiscountAmount = discountAmount;

            if (isEditing && saleToEdit) {
                // 1. Revert Old Stock
                const oldItems = saleToEdit.orders?.items || [];
                for (const item of oldItems) {
                    const baseId = item.product_id;
                    const { data: prod } = await supabase.from('products').select('stock, variants').eq('id', baseId).single();
                    if (prod) {
                        if (item.is_variant) {
                            const updatedVariants = prod.variants.map(v =>
                                v.id === item.variant_id ? { ...v, stock: v.stock + item.quantity } : v
                            );
                            const newStockValue = updatedVariants.reduce((acc, v) => acc + v.stock, 0);
                            await supabase.from('products').update({ stock: newStockValue, variants: updatedVariants }).eq('id', baseId);
                        } else {
                            const qtyToRevert = item.is_combo ? (item.quantity * (item.combo_jibbitz_count || 1)) : item.quantity;
                            await supabase.from('products').update({ stock: prod.stock + qtyToRevert }).eq('id', baseId);
                        }
                    }
                }

                // 2. Update Order
                const { error: orderError } = await supabase.from('orders').update({
                    customer_id: customerId,
                    total: finalTotal,
                    items: orderItems,
                    created_at: isoTimestamp
                }).eq('id', saleToEdit.order_id);
                if (orderError) throw orderError;

                // 3. Update Sale
                const { error: saleError } = await supabase.from('sales').update({
                    customer_id: customerId,
                    total: finalTotal,
                    discount: finalDiscountAmount,
                    payment_method: paymentMethod,
                    is_paid: paymentMethod === 'Contado',
                    created_at: isoTimestamp
                }).eq('id', saleToEdit.id);
                if (saleError) throw saleError;

                // 4. Update Payment
                await supabase.from('payments').delete().eq('sale_id', saleToEdit.id);
                if (paymentMethod === 'Contado') {
                    await supabase.from('payments').insert({
                        sale_id: saleToEdit.id,
                        amount: finalTotal,
                        payment_method: paymentMethod,
                        notes: 'Venta modificada',
                        created_at: isoTimestamp,
                        status: 'completed'
                    });
                }
            } else {
                // Regular New Sale
                const { data: order, error: orderError } = await supabase.from('orders').insert({
                    customer_id: customerId,
                    status: 'processed',
                    total: finalTotal,
                    items: orderItems,
                    delivery_mode: 'mostrador',
                    created_at: isoTimestamp
                }).select().single();

                if (orderError) throw orderError;

                // Create Sale
                const { data: sale, error: saleError } = await supabase.from('sales').insert({
                    order_id: order.id,
                    customer_id: customerId,
                    total: finalTotal,
                    discount: finalDiscountAmount,
                    payment_method: paymentMethod,
                    is_paid: paymentMethod === 'Contado',
                    created_at: isoTimestamp
                }).select().single();

                if (saleError) throw saleError;

                // Record Payment if Contado
                if (paymentMethod === 'Contado') {
                    await supabase.from('payments').insert({
                        sale_id: sale.id,
                        amount: finalTotal,
                        payment_method: paymentMethod,
                        notes: 'Venta presencial',
                        created_at: isoTimestamp,
                        status: 'completed'
                    });
                }
            }

            // 5. Apply New Stock (for both new and edited sales)
            for (const item of cart) {
                const baseId = (item.isCombo || item.isVariant) ? item.baseProductId : item.id;
                const { data: prod } = await supabase.from('products').select('stock, variants').eq('id', baseId).single();

                if (prod) {
                    if (item.isVariant) {
                        const updatedVariants = prod.variants.map(v =>
                            v.id === item.variantId ? { ...v, stock: v.stock - item.quantity } : v
                        );
                        const newStockValue = updatedVariants.reduce((acc, v) => acc + v.stock, 0);
                        await supabase.from('products').update({ stock: newStockValue, variants: updatedVariants }).eq('id', baseId);
                    } else {
                        const qtyToDeduct = item.isCombo ? (item.quantity * (item.singleJibbitzCount || 1)) : item.quantity;
                        const finalStock = prod.stock - qtyToDeduct;
                        await supabase.from('products').update({ stock: finalStock }).eq('id', baseId);
                        
                        if (finalStock <= 5) {
                            supabase.functions.invoke('notify-admins', {
                                body: {
                                    title: '⚠️ Stock Bajo',
                                    body: `El producto "${item.name}" tiene solo ${finalStock} unidades.`,
                                    url: '/admin/products',
                                    target_role: 'admin'
                                }
                            }).catch(console.error);
                        }
                    }
                }
            }

            // Loyalty update
            if (customerId && !isEditing) {
                const { data: currentCust } = await supabase.from('customers').select('loyalty_stamps').eq('id', customerId).single();
                let currentStamps = currentCust?.loyalty_stamps || 0;
                let newStamps = useLoyaltyDiscount ? 0 : Math.min(currentStamps + 1, 5);
                await supabase.from('customers').update({ loyalty_stamps: newStamps }).eq('id', customerId);
            }

            addToast(isEditing ? '¡Venta actualizada con éxito!' : '¡Venta realizada con éxito! 🎉', 'success');
            if (onSaleComplete) onSaleComplete();
            onClose();

        } catch (err) {
            console.error(err);
            addToast('Error al procesar: ' + err.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {!isMinimized && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-50 flex justify-center items-center md:py-8 px-0 md:px-4"
                >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

                <div className="relative bg-white w-full max-w-6xl h-[100dvh] md:h-[90vh] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="bg-primary text-secondary-light px-6 py-4 pt-[calc(env(safe-area-inset-top)+1rem)] md:pt-4 flex justify-between items-center shrink-0">
                        <div>
                            <h2 className="text-xl font-serif font-bold italic h-6">{isEditing ? 'Modificar Venta' : 'Nueva Venta'}</h2>
                            <p className="text-xs opacity-70">Terminal Luxessence {isEditing && ` - Sale #${saleToEdit?.id.slice(0, 6)}`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={onMinimize} className="p-2 hover:bg-white/10 rounded-lg transition-colors group flex items-center gap-2" title="Minimizar" >
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline">Minimizar</span>
                                <Minimize2 className="w-5 h-5" />
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-gray-50/50">

                        {/* Catalog */}
                        <div className={`flex-[2] flex flex-col min-h-0 min-w-0 border-r border-gray-200 bg-white ${step === 2 ? 'hidden lg:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-gray-100 space-y-3 shrink-0">
                                <div className="relative group">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/20 group-focus-within:text-primary transition-colors" />
                                    <input type="text" placeholder="Buscar producto..." value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} className="w-full bg-white border border-primary/5 rounded-3xl py-6 pl-16 pr-16 focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all text-lg" />
                                    <button onClick={() => setIsScannerOpen(true)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gold text-primary rounded-2xl hover:bg-gold-light transition-all shadow-lg shadow-gold/10 active:scale-95" >
                                        <Camera className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    <button onClick={() => setSelectedCategory('all')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${selectedCategory === 'all' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'}`} > Todos </button>
                                    {categories.map(cat => (
                                        <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${selectedCategory === cat.id ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'}`} > {cat.name} </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredProducts.map(product => (
                                        <button key={product.id} onClick={() => handleProductClick(product)} className="bg-white border border-gray-100 rounded-xl p-3 text-left hover:border-primary/40 hover:shadow-md transition-all flex flex-col group relative" >
                                            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3 relative">
                                                {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="w-8 h-8" /></div>}
                                                <div className="absolute top-2 right-2 bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-700 shadow-sm border border-gray-100">Stock: {product.stock}</div>
                                            </div>
                                            <div className="flex-1 flex flex-col">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5 truncate">{product.categories?.name}</p>
                                                <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-2 flex-1">{product.name}</h4>
                                                <div className="flex justify-between items-center mt-auto">
                                                    <span className="text-base font-bold text-primary">L{product.price}</span>
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors"> <Plus className="w-4 h-4" /> </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className={`flex-[1] lg:w-[400px] flex flex-col bg-white shrink-0 overflow-y-auto lg:overflow-visible pb-safe ${step === 2 ? 'flex' : 'hidden lg:flex'}`}>
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-gray-700" />
                                    <h3 className="font-semibold text-gray-900">Carrito ({cart.length})</h3>
                                </div>
                                {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Vaciar</button>}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar border-b border-gray-100">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                        <ShoppingCart className="w-12 h-12 mb-2" />
                                        <p className="text-sm">Agrega productos</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="flex gap-3 bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm">
                                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                                                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 m-auto text-gray-300 mt-3" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h5 className="text-xs font-semibold text-gray-900 truncate pr-2" title={item.name}>{item.name}</h5>
                                                    <button onClick={() => removeFromCart(item.id, item.isCombo, item.isVariant)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded">
                                                        <button onClick={() => updateQuantity(item.id, item.isCombo, item.isVariant, -1)} className="px-2 py-1 hover:text-primary"><Minus className="w-3 h-3" /></button>
                                                        <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, item.isCombo, item.isVariant, 1)} className="px-2 py-1 hover:text-primary"><Plus className="w-3 h-3" /></button>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">L{item.price * item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 space-y-4 bg-white">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Fecha de Venta</label>
                                    <div className="flex gap-2">
                                        <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
                                        <button onClick={() => setSaleDate(new Date().toISOString().split('T')[0])} className="px-3 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors" > Hoy </button>
                                    </div>
                                </div>

                                <div className="customer-search-container">
                                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Cliente</label>
                                    <div className="flex gap-2 relative">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="text" placeholder="Buscar o Consumidor Final..." value={searchCustomer} onChange={(e) => { setSearchCustomer(e.target.value); setShowCustomerDropdown(true); }} onFocus={() => setShowCustomerDropdown(true)} className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary transition-all" />
                                            {selectedCustomer.id && (
                                                <button onClick={() => { setSelectedCustomer(CONSUMIDOR_FINAL); setSearchCustomer(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"> <X className="w-4 h-4" /> </button>
                                            )}
                                            {showCustomerDropdown && (
                                                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                                    {filteredCustomers.length > 0 ? (
                                                        filteredCustomers.map(c => (
                                                            <button key={c.id} onClick={() => { setSelectedCustomer(c); setSearchCustomer(`${c.first_name} ${c.last_name}`); setShowCustomerDropdown(false); setUseLoyaltyDiscount(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0 flex justify-between items-center" >
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{c.first_name} {c.last_name}</div>
                                                                    <div className="text-xs text-gray-500">{c.phone}</div>
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">Sellos {c.loyalty_stamps || 0}/5</span>
                                                            </button>
                                                        ))
                                                    ) : searchCustomer.trim() ? (
                                                        <div className="p-2 space-y-2">
                                                            <p className="text-[10px] uppercase font-black text-gray-400 text-center">No hay coincidencias</p>
                                                            <button onClick={() => { setSelectedCustomer({ id: 'temp', first_name: searchCustomer, last_name: '(Invitado)' }); setShowCustomerDropdown(false); }} className="w-full px-4 py-3 bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-black uppercase rounded-xl border border-secondary/20 flex flex-col items-center gap-1 transition-all" >
                                                                <span>USAR "{searchCustomer}"</span>
                                                                <span className="text-[9px] opacity-60">Como Invitado (Venta de una sola vez)</span>
                                                            </button>
                                                            <button onClick={() => { setIsNewCustomerModalOpen(true); setShowCustomerDropdown(false); }} className="w-full px-4 py-3 bg-primary text-secondary-light text-[10px] font-black uppercase rounded-xl shadow-lg" > Registrar Nuevo Perfil Real </button>
                                                        </div>
                                                    ) : (
                                                        <div className="p-3 text-center">
                                                            <button onClick={() => { setIsNewCustomerModalOpen(true); setShowCustomerDropdown(false); }} className="text-xs bg-primary text-white px-3 py-1.5 rounded-md w-full" > Crear Cliente </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => setIsNewCustomerModalOpen(true)} className="p-2.5 bg-primary text-secondary-light rounded-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-sm" title="Registrar Cliente" > <UserPlus className="w-4 h-4" /> </button>
                                    </div>
                                    {selectedCustomer.id && (
                                        <div className="mt-2 p-2 bg-secondary/5 rounded-lg border border-secondary/20 flex justify-between items-center">
                                            <span className="text-xs font-semibold text-secondary-dark flex items-center gap-1"> <Tag className="w-3 h-3" /> Sellos: {selectedCustomer.loyalty_stamps || 0}/5 </span>
                                            {(selectedCustomer.loyalty_stamps || 0) >= 5 && (
                                                <button onClick={() => setUseLoyaltyDiscount(!useLoyaltyDiscount)} className={`text-[10px] uppercase font-black px-2 py-1 rounded transition-colors ${useLoyaltyDiscount ? 'bg-secondary text-primary' : 'bg-white text-secondary border border-secondary hover:bg-secondary/10'}`} > {useLoyaltyDiscount ? 'Descuento Aplicado' : 'Canjear 20%'} </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3" style={useLoyaltyDiscount ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Descuento</label>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden h-9">
                                            <div className="flex bg-gray-100 border-r border-gray-200">
                                                <button onClick={() => setDiscountType('fixed')} className={`px-2 text-xs font-bold ${discountType === 'fixed' ? 'bg-white text-primary' : 'text-gray-500 hover:bg-gray-200'}`}>L</button>
                                                <button onClick={() => setDiscountType('percentage')} className={`px-2 text-xs font-bold border-l border-gray-200 ${discountType === 'percentage' ? 'bg-white text-primary' : 'text-gray-500 hover:bg-gray-200'}`}>%</button>
                                            </div>
                                            <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full px-2 text-right text-sm focus:outline-none" placeholder="0" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Pago</label>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden h-9 bg-gray-50">
                                            <button onClick={() => setPaymentMethod('Contado')} className={`flex-1 text-xs font-semibold flex items-center justify-center gap-1 ${paymentMethod === 'Contado' ? 'bg-primary text-white shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`} > Contado </button>
                                            <button onClick={() => setPaymentMethod('Crédito')} className={`flex-1 text-xs font-semibold flex items-center justify-center gap-1 border-l border-gray-200 ${paymentMethod === 'Crédito' ? 'bg-primary text-white shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`} > Crédito </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-3 space-y-1">
                                    <div className="flex justify-between text-xs text-gray-500"> <span>Subtotal</span> <span>L{subtotal.toFixed(2)}</span> </div>
                                    {discount > 0 && <div className="flex justify-between text-xs text-green-600"> <span>Descuento</span> <span>-L{discountAmount.toFixed(2)}</span> </div>}
                                    <div className="flex justify-between items-end pt-1"> <span className="text-sm font-bold text-gray-900">Total</span> <span className="text-2xl font-black text-primary leading-none">L{total.toFixed(2)}</span> </div>
                                </div>

                                <button onClick={isEditing ? () => setIsSecurityOpen(true) : handleProcessSale} disabled={processing || cart.length === 0} className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${processing || cart.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : isEditing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-green-600 text-white hover:bg-green-700'}`} >
                                    {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isEditing ? <Edit className="w-5 h-5" /> : <Save className="w-5 h-5" />)}
                                    {isEditing ? 'Guardar Cambios' : 'Confirmar Venta'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {step === 1 && cart.length > 0 && (
                        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 pb-safe bg-white border-t border-gray-200 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] flex items-center justify-between z-40">
                            <div> <p className="text-xs text-gray-500 font-medium">Total ({cart.length} art.)</p> <p className="text-lg font-bold text-primary">L{total}</p> </div>
                            <button onClick={() => setStep(2)} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-md active:scale-95 transition-transform" > Continuar al pago </button>
                        </div>
                    )}
                </div>

                {/* Modals: Jibbitz, New Customer, Variant, Scanner */}
                <AnimatePresence>
                    {jibbitzModalOpen && selectedJibbitz && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pt-safe">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setJibbitzModalOpen(false)} />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative z-10" >
                                <h4 className="font-bold text-lg text-gray-900">{selectedJibbitz.name}</h4>
                                <div className="space-y-3 my-4">
                                    {JIBBITZ_COMBOS.map(combo => (
                                        <div key={combo.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50" >
                                            <div><p className="font-semibold text-sm">{combo.name}</p><p className="text-xs text-primary font-bold">L{combo.price}</p></div>
                                            <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                                                <button onClick={() => updateJibbitzSelection(combo.id, -1)} className="px-3 py-1.5 hover:text-primary"><Minus className="w-4 h-4" /></button>
                                                <span className="w-6 text-center text-sm">{jibbitzSelection[combo.id] || 0}</span>
                                                <button onClick={() => updateJibbitzSelection(combo.id, 1)} className="px-3 py-1.5 hover:text-primary"><Plus className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={confirmJibbitzSelection} disabled={Object.values(jibbitzSelection).every(q => !q)} className="w-full py-3 bg-primary text-white rounded-lg disabled:bg-gray-200">Confirmar</button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isNewCustomerModalOpen && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pt-safe">
                            <div className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsNewCustomerModalOpen(false)} />
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-[3rem] shadow-3xl w-full max-w-md p-10 relative z-10 border border-primary/10" >
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-serif font-bold italic text-primary">Nuevo Cliente</h3>
                                    <button onClick={() => setIsNewCustomerModalOpen(false)} className="text-primary/30"><X className="w-5 h-5" /></button>
                                </div>
                                <form onSubmit={handleCreateCustomer} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" placeholder="Nombre" value={newCustomer.first_name} onChange={e => setNewCustomer({ ...newCustomer, first_name: e.target.value })} className="w-full px-5 py-3 border border-primary/10 rounded-xl bg-gray-50/50" required />
                                        <input type="text" placeholder="Apellido" value={newCustomer.last_name} onChange={e => setNewCustomer({ ...newCustomer, last_name: e.target.value })} className="w-full px-5 py-3 border border-primary/10 rounded-xl bg-gray-50/50" required />
                                    </div>
                                    <input type="tel" placeholder="Teléfono" value={newCustomer.phone.replace('+504', '')} onChange={e => setNewCustomer({ ...newCustomer, phone: `+504 ${e.target.value.replace(/\D/g, '').slice(0, 8)}` })} className="w-full px-5 py-3 border border-primary/10 rounded-xl bg-gray-50/50" required />
                                    <textarea placeholder="Dirección" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} rows="2" className="w-full px-5 py-3 border border-primary/10 rounded-xl bg-gray-50/50 resize-none" />
                                    <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Guardar</button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {variantModalOpen && productForVariant && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pt-safe">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setVariantModalOpen(false)} />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative z-10 max-h-[80vh] flex flex-col" >
                                <h4 className="font-bold text-xl mb-4">{productForVariant.name}</h4>
                                <div className="flex-1 overflow-y-auto space-y-3 mb-6 no-scrollbar">
                                    {productForVariant.variants.map(variant => (
                                        <div key={variant.id} className="flex gap-4 items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white transition-all" >
                                            <div className="w-14 h-14 bg-white rounded-lg overflow-hidden shrink-0">
                                                {variant.image_url ? <img src={variant.image_url} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 m-auto mt-4 text-gray-200" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm">{variant.name}</p>
                                                <p className="text-[10px] text-primary/40">Stock: {variant.stock}</p>
                                            </div>
                                            <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                                                <button onClick={() => updateVariantSelection(variant.id, -1, variant.stock)} className="px-3 py-1.5"><Minus className="w-4 h-4" /></button>
                                                <span className="w-8 text-center text-sm font-bold">{variantQuantities[variant.id] || 0}</span>
                                                <button onClick={() => updateVariantSelection(variant.id, 1, variant.stock)} className="px-3 py-1.5"><Plus className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addVariantToCart} disabled={Object.values(variantQuantities).every(q => !q)} className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg">Confirmar</button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {isScannerOpen && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setIsScannerOpen(false)} />}
                </motion.div>
            )}
            <SecurityModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} onConfirm={handleProcessSale} title="Confirmar Modificación" />
        </AnimatePresence>
    );
};

export default NewSaleModal;
