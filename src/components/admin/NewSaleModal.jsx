import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
    X, Search, Plus, Minus, Trash2, ShoppingCart, User, Package,
    DollarSign, CreditCard, Save, ArrowLeft, UserPlus, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

const JIBBITZ_COMBOS = [
    { id: 'combo-1', name: '1 Unidad', quantity: 1, price: 25 },
    { id: 'combo-3', name: 'Pack de 3', quantity: 3, price: 70 },
    { id: 'combo-5', name: 'Pack de 5', quantity: 5, price: 105 },
];

const CONSUMIDOR_FINAL = { id: null, first_name: 'Consumidor', last_name: 'Final', phone: '0000-0000' };

const NewSaleModal = ({ isOpen, onClose, onSaleComplete }) => {
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

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            fetchProducts();
            fetchCategories();
            resetState();
            setSaleDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

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
    const discountAmount = useLoyaltyDiscount ? subtotal * 0.10 : (discountType === 'percentage' ? subtotal * (discount / 100) : discount);
    const total = Math.max(0, subtotal - discountAmount);

    const handleProductClick = (product) => {
        const isJibbitz = product.categories?.name?.toLowerCase().includes('jibbitz');
        if (isJibbitz) {
            setSelectedJibbitz(product);
            setJibbitzSelection({});
            setJibbitzModalOpen(true);
        } else {
            addToCart(product);
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

    const updateQuantity = (id, isCombo, amount) => {
        setCart(cart.map(item => {
            if (item.id === id && item.isCombo === isCombo) {
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

    const removeFromCart = (id, isCombo) => {
        setCart(cart.filter(item => !(item.id === id && item.isCombo === isCombo)));
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

            const { data, error } = await supabase.from('customers').insert(formattedCustomer).select().single();
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
                product_id: item.isCombo ? item.baseProductId : item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                is_combo: item.isCombo || false,
                combo_jibbitz_count: item.singleJibbitzCount || 1
            }));

            const customerId = selectedCustomer.id === null ? null : selectedCustomer.id;

            // Create Order
            const { data: order, error: orderError } = await supabase.from('orders').insert({
                customer_id: customerId,
                status: 'processed',
                total: total,
                items: orderItems,
                delivery_mode: 'mostrador',
                created_at: new Date(saleDate).toISOString()
            }).select().single();

            if (orderError) throw orderError;

            // Create Sale
            const { data: sale, error: saleError } = await supabase.from('sales').insert({
                order_id: order.id,
                customer_id: customerId,
                total: total,
                discount: discountAmount,
                payment_method: paymentMethod,
                is_paid: paymentMethod === 'Contado',
                created_at: new Date(saleDate).toISOString()
            }).select().single();

            if (saleError) throw saleError;

            // Deduct Stock
            for (const item of cart) {
                const baseId = item.isCombo ? item.baseProductId : item.id;
                const qtyToDeduct = item.isCombo ? (item.quantity * item.singleJibbitzCount) : item.quantity;
                const { data: prod } = await supabase.from('products').select('stock').eq('id', baseId).single();
                if (prod) {
                    await supabase.from('products').update({ stock: prod.stock - qtyToDeduct }).eq('id', baseId);
                }
            }

            // Record Payment if Contado
            if (paymentMethod === 'Contado') {
                await supabase.from('payments').insert({
                    sale_id: sale.id,
                    amount: total,
                    payment_method: paymentMethod,
                    notes: 'Venta presencial',
                    created_at: new Date(saleDate).toISOString()
                });
            }

            // Update Loyalty Stamps
            if (customerId) {
                let newStamps = selectedCustomer.loyalty_stamps || 0;
                if (useLoyaltyDiscount) {
                    newStamps = 0; // Reset after using
                } else {
                    newStamps = Math.min(newStamps + 1, 5); // Add 1 stamp, max 5
                }
                await supabase.from('customers').update({ loyalty_stamps: newStamps }).eq('id', customerId);
            }

            addToast('Venta registrada', 'success');
            if (onSaleComplete) onSaleComplete(sale);
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
        <div className="fixed inset-0 z-50 flex justify-center items-center md:py-8 px-0 md:px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-6xl h-full md:h-[90vh] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header (Compact) */}
                <div className="bg-primary text-secondary-light px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-serif font-bold italic h-6">Nueva Venta</h2>
                        <p className="text-xs opacity-70">Terminal Luxessence</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-gray-50/50">

                    {/* Left: Product Catalog */}
                    <div className={`flex-[2] flex flex-col min-w-0 border-r border-gray-200 bg-white ${step === 2 ? 'hidden lg:flex' : 'flex'}`}>

                        {/* Search & Categories */}
                        <div className="p-4 border-b border-gray-100 space-y-3 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    value={searchProduct}
                                    onChange={(e) => setSearchProduct(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>

                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${selectedCategory === 'all' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'}`}
                                >
                                    Todos
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${selectedCategory === cat.id ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'}`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleProductClick(product)}
                                        className="bg-white border border-gray-100 rounded-xl p-3 text-left hover:border-primary/40 hover:shadow-md transition-all flex flex-col group relative"
                                    >
                                        <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3 relative">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="w-8 h-8" /></div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-700 shadow-sm border border-gray-100">
                                                Stock: {product.stock}
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5 truncate">{product.categories?.name}</p>
                                            <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-2 flex-1">{product.name}</h4>
                                            <div className="flex justify-between items-center mt-auto">
                                                <span className="text-base font-bold text-primary">L{product.price}</span>
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Checkout Sidebar */}
                    <div className={`flex-[1] lg:w-[400px] flex flex-col bg-white shrink-0 ${step === 2 ? 'flex' : 'hidden lg:flex'}`}>

                        {/* Cart Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-gray-700" />
                                <h3 className="font-semibold text-gray-900">Carrito ({cart.length})</h3>
                            </div>
                            {cart.length > 0 && (
                                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Vaciar</button>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar border-b border-gray-100">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <ShoppingCart className="w-12 h-12 mb-2" />
                                    <p className="text-sm">Agrega productos</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-3 bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm">
                                        <div className="w-12 h-12 bg-gray-50 rounded bg-gray-100 overflow-hidden shrink-0">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 m-auto text-gray-300 mt-3" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-xs font-semibold text-gray-900 truncate pr-2" title={item.name}>{item.name}</h5>
                                                <button onClick={() => removeFromCart(item.id, item.isCombo)} className="text-gray-400 hover:text-red-500">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded">
                                                    <button onClick={() => updateQuantity(item.id, item.isCombo, -1)} className="px-2 py-1 hover:text-primary"><Minus className="w-3 h-3" /></button>
                                                    <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.isCombo, 1)} className="px-2 py-1 hover:text-primary"><Plus className="w-3 h-3" /></button>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">L{item.price * item.quantity}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Billing Controls */}
                        <div className="p-4 space-y-4 bg-white">

                            {/* Sale Date Picker */}
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Fecha de Venta</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={saleDate}
                                        onChange={(e) => setSaleDate(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        onClick={() => setSaleDate(new Date().toISOString().split('T')[0])}
                                        className="px-3 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
                                    >
                                        Hoy
                                    </button>
                                </div>
                            </div>

                            {/* Customer Select */}
                            <div className="customer-search-container">
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Cliente</label>
                                <div className="flex gap-2 relative">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar o Consumidor Final..."
                                            value={searchCustomer}
                                            onChange={(e) => { setSearchCustomer(e.target.value); setShowCustomerDropdown(true); }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary transition-all"
                                        />
                                        {selectedCustomer.id && (
                                            <button onClick={() => { setSelectedCustomer(CONSUMIDOR_FINAL); setSearchCustomer(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                <X className="w-4 h-4" />
                                            </button>
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
                                                ) : (
                                                    <div className="p-3 text-center">
                                                        <p className="text-xs text-gray-500 mb-2">No encontrado</p>
                                                        <button onClick={() => { setIsNewCustomerModalOpen(true); setShowCustomerDropdown(false); }} className="text-xs bg-primary text-white px-3 py-1.5 rounded-md w-full" > Crear Cliente </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsNewCustomerModalOpen(true)}
                                        className="p-2.5 bg-primary text-secondary-light rounded-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                        title="Registrar Nuevo Cliente"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                    </button>
                                </div>
                                {selectedCustomer.id && (
                                    <div className="mt-2 p-2 bg-secondary/5 rounded-lg border border-secondary/20 flex justify-between items-center">
                                        <span className="text-xs font-semibold text-secondary-dark flex items-center gap-1">
                                            <Tag className="w-3 h-3" /> Sellos: {selectedCustomer.loyalty_stamps || 0}/5
                                        </span>
                                        {(selectedCustomer.loyalty_stamps || 0) >= 5 && (
                                            <button
                                                onClick={() => setUseLoyaltyDiscount(!useLoyaltyDiscount)}
                                                className={`text-[10px] uppercase font-black px-2 py-1 rounded transition-colors ${useLoyaltyDiscount ? 'bg-secondary text-primary' : 'bg-white text-secondary border border-secondary hover:bg-secondary/10'}`}
                                            >
                                                {useLoyaltyDiscount ? 'Descuento Aplicado' : 'Canjear 10%'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Options: Discount & Payment */}
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

                            {/* Totals */}
                            <div className="border-t border-gray-200 pt-3 space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Subtotal</span>
                                    <span>L{subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-xs text-green-600">
                                        <span>Descuento</span>
                                        <span>-L{discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-end pt-1">
                                    <span className="text-sm font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-black text-primary leading-none">L{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleProcessSale}
                                disabled={processing || cart.length === 0}
                                className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${processing || cart.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                                Confirmar Venta
                            </button>

                            {step === 2 && (
                                <button onClick={() => setStep(1)} className="lg:hidden w-full py-2.5 mt-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg">
                                    Volver al catálogo
                                </button>
                            )}

                        </div>
                    </div>
                </div>

                {/* Mobile Floating Cart Trigger */}
                {step === 1 && cart.length > 0 && (
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] flex items-center justify-between z-40">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Total ({cart.length} art.)</p>
                            <p className="text-lg font-bold text-primary">L{total}</p>
                        </div>
                        <button onClick={() => setStep(2)} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-md active:scale-95 transition-transform" > Continuar al pago </button>
                    </div>
                )}
            </div>

            {/* Jibbitz Modal */}
            <AnimatePresence>
                {jibbitzModalOpen && selectedJibbitz && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setJibbitzModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative z-10" >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-lg text-gray-900">{selectedJibbitz.name}</h4>
                                    <p className="text-xs text-gray-500">Agrega las cantidades deseadas</p>
                                </div>
                                <button onClick={() => setJibbitzModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-3 mb-5">
                                {JIBBITZ_COMBOS.map(combo => {
                                    const qty = jibbitzSelection[combo.id] || 0;
                                    return (
                                        <div key={combo.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50" >
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900">{combo.name}</p>
                                                <p className="text-xs text-primary font-bold">L{combo.price}</p>
                                            </div>
                                            <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                                                <button onClick={() => updateJibbitzSelection(combo.id, -1)} className="px-3 py-1.5 hover:text-primary text-gray-400"><Minus className="w-4 h-4" /></button>
                                                <span className="w-6 text-center text-sm font-medium">{qty}</span>
                                                <button onClick={() => updateJibbitzSelection(combo.id, 1)} className="px-3 py-1.5 hover:text-primary text-gray-400"><Plus className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={confirmJibbitzSelection}
                                disabled={Object.values(jibbitzSelection).every(q => !q || q === 0)}
                                className={`w-full py-3 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${Object.values(jibbitzSelection).every(q => !q || q === 0)
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-primary text-white hover:bg-primary/90'
                                    }`}
                            >
                                Confirmar selección
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Customer Sub-Modal */}
            <AnimatePresence>
                {isNewCustomerModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsNewCustomerModalOpen(false)} />
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-[3rem] shadow-3xl w-full max-w-md p-10 relative z-10 border border-primary/10" >
                            <div className="flex justify-between items-center mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-serif font-bold italic text-primary">Nuevo Cliente</h3>
                                    <p className="text-[10px] text-primary/30 uppercase tracking-[0.2em] font-black italic">Registro Rápido</p>
                                </div>
                                <button onClick={() => setIsNewCustomerModalOpen(false)} className="p-2 hover:bg-primary/5 rounded-full text-primary/30 transition-all"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleCreateCustomer} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-widest text-primary/40 font-black ml-2">Nombre</label>
                                        <input type="text" placeholder="Ej. Ana" value={newCustomer.first_name} onChange={e => setNewCustomer({ ...newCustomer, first_name: e.target.value })} className="w-full px-5 py-3 border border-primary/10 rounded-xl text-sm focus:border-primary focus:outline-none bg-gray-50/50" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase tracking-widest text-primary/40 font-black ml-2">Apellido</label>
                                        <input type="text" placeholder="Ej. Pérez" value={newCustomer.last_name} onChange={e => setNewCustomer({ ...newCustomer, last_name: e.target.value })} className="w-full px-5 py-3 border border-primary/10 rounded-xl text-sm focus:border-primary focus:outline-none bg-gray-50/50" required />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-widest text-primary/40 font-black ml-2">Teléfono</label>
                                    <div className="flex bg-gray-50/50 border border-primary/10 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-primary transition-all">
                                        <div className="bg-primary/5 px-4 flex items-center justify-center border-r border-primary/10">
                                            <span className="text-primary/40 font-bold text-xs">+504</span>
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="0000 0000"
                                            value={newCustomer.phone ? newCustomer.phone.replace('+504', '').trim() : ''}
                                            onChange={e => {
                                                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                setNewCustomer({ ...newCustomer, phone: `+504 ${digitsOnly}` });
                                            }}
                                            className="w-full bg-transparent py-3 px-4 outline-none text-sm font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] uppercase tracking-widest text-primary/40 font-black ml-2">Dirección (Opcional)</label>
                                    <textarea placeholder="Dirección de entrega..." value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} rows="2" className="w-full px-5 py-3 border border-primary/10 rounded-xl text-sm focus:border-primary focus:outline-none bg-gray-50/50 resize-none italic" />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsNewCustomerModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-primary/40 border border-primary/5 rounded-2xl hover:bg-gray-50 transition-all">Cancelar</button>
                                    <button type="submit" className="flex-[1.5] py-4 text-[10px] font-black uppercase tracking-widest text-white bg-primary rounded-2xl hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all">Guardar Cliente</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NewSaleModal;
