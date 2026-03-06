import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const CART_VERSION = 'v2';
const RESERVATION_TIME_MINS = 3; // Tiempo en minutos para la reserva
const EXTENSION_TIME_MINS = 5;    // Tiempo extra al dar clic en extender

export const CartProvider = ({ children }) => {
    // Session ID for Stock Reservations
    const [sessionId] = useState(() => {
        const saved = localStorage.getItem('luxessence_cart_session');
        if (saved) return saved;
        const newId = crypto.randomUUID();
        localStorage.setItem('luxessence_cart_session', newId);
        return newId;
    });

    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('luxessence_cart');
            const savedVersion = localStorage.getItem('luxessence_cart_version');
            if (savedVersion !== CART_VERSION) {
                localStorage.removeItem('luxessence_cart');
                localStorage.setItem('luxessence_cart_version', CART_VERSION);
                return [];
            }
            if (!savedCart) return [];
            const parsed = JSON.parse(savedCart);
            if (!Array.isArray(parsed) || parsed.some(item => !item.cartItemId)) {
                localStorage.removeItem('luxessence_cart');
                return [];
            }
            return parsed;
        } catch {
            return [];
        }
    });
    const [lastAdded, setLastAdded] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isExtending, setIsExtending] = useState(false);
    const [expirationWarning, setExpirationWarning] = useState(null);
    const [earliestExpiry, setEarliestExpiry] = useState(() => {
        const saved = localStorage.getItem('luxessence_earliest_expiry');
        return saved ? parseInt(saved, 10) : null;
    });

    useEffect(() => {
        if (earliestExpiry) {
            localStorage.setItem('luxessence_earliest_expiry', earliestExpiry.toString());
        } else {
            localStorage.removeItem('luxessence_earliest_expiry');
        }
    }, [earliestExpiry]);

    useEffect(() => {
        localStorage.setItem('luxessence_cart', JSON.stringify(cart));
        localStorage.setItem('luxessence_cart_version', CART_VERSION);
    }, [cart]);

    // Reset timer when cart is empty
    useEffect(() => {
        if (cart.length === 0) {
            setEarliestExpiry(null);
            setExpirationWarning(null);
        }
    }, [cart.length]);

    // Periodically clean up expired local reservations or verify with server
    const syncStockWithServer = useCallback(async () => {
        if (isSyncing) return;
        if (cart.length === 0) {
            setEarliestExpiry(null);
            setExpirationWarning(null);
            return;
        }
        setIsSyncing(true);
        try {
            const { data: reservations, error } = await supabase
                .from('cart_reservations')
                .select('product_id, variant_id, expires_at')
                .eq('session_id', sessionId);

            if (error) throw error;

            const now = new Date();
            let anyRemoved = false;
            let warningItem = null;

            const updatedCart = cart.filter(item => {
                const variantId = item.comboConfig?.id || '';
                const res = reservations?.find(r => r.product_id === item.id && r.variant_id === variantId);

                if (!res || new Date(res.expires_at) <= now) {
                    anyRemoved = true;
                    return false; // Remove from cart
                }

                // Check for 1 minute warning
                const timeDiff = new Date(res.expires_at).getTime() - now.getTime();
                if (timeDiff > 0 && timeDiff <= 60000) {
                    warningItem = { ...item, timeLeft: Math.round(timeDiff / 1000) };
                }

                return true;
            });

            // Track earliest expiry for the UI timer
            if (reservations && reservations.length > 0) {
                const minExpiry = reservations.reduce((min, r) => {
                    const expiry = new Date(r.expires_at).getTime();
                    return expiry < min ? expiry : min;
                }, new Date(reservations[0].expires_at).getTime());
                setEarliestExpiry(minExpiry);
            } else {
                setEarliestExpiry(null);
            }

            if (anyRemoved) {
                setCart(updatedCart);
                setExpirationWarning(null);
            } else {
                setExpirationWarning(warningItem);
            }
        } catch (err) {
            console.error('Error syncing stock:', err);
        } finally {
            setIsSyncing(false);
        }
    }, [cart, isSyncing, sessionId]);

    useEffect(() => {
        // Initial sync on mount
        if (cart.length > 0) {
            syncStockWithServer();
        }

        const interval = setInterval(syncStockWithServer, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [syncStockWithServer]); // syncStockWithServer already depends on cart.length through its definition

    const addToCart = async (product, config = null, quantity = 1) => {
        const variantId = config?.id || '';
        const cartItemId = config ? `${product.id}-${config.id}` : product.id;

        try {
            // 1. Check Available Stock on Server (Real Stock - Other Reservations)
            // Using RPC for atomicity
            const { data: available, error: stockError } = await supabase
                .rpc('get_available_stock', { p_id: product.id, v_id: variantId === '' ? null : variantId });

            if (stockError) throw stockError;

            // Calculate what we need (existing in cart + new)
            const existingInCart = cart.find(i => i.cartItemId === cartItemId)?.quantity || 0;
            const totalNeeded = existingInCart + quantity;

            if (available < quantity) {
                return { success: false, available, message: `Solo quedan ${available} unidades disponibles.` };
            }

            // 2. Create/Update ALL Reservations to refresh the session
            const newExpiry = new Date(Date.now() + RESERVATION_TIME_MINS * 60000);
            const newExpiryStr = newExpiry.toISOString();

            // Update current item
            const { error: resError } = await supabase
                .from('cart_reservations')
                .upsert({
                    product_id: product.id,
                    variant_id: variantId,
                    quantity: totalNeeded,
                    session_id: sessionId,
                    expires_at: newExpiryStr
                }, { onConflict: 'product_id, variant_id, session_id' });

            if (resError) throw resError;

            // Refresh other items in cart to match the new expiry
            if (cart.length > 0) {
                for (const item of cart) {
                    if (item.cartItemId === cartItemId) continue; // Already updated
                    const vId = item.comboConfig?.id || '';
                    await supabase.from('cart_reservations').upsert({
                        product_id: item.id,
                        variant_id: vId,
                        quantity: item.quantity,
                        session_id: sessionId,
                        expires_at: newExpiryStr
                    }, { onConflict: 'product_id, variant_id, session_id' });
                }
            }

            // 3. Update Local State
            setEarliestExpiry(newExpiry.getTime());
            setLastAdded({ ...product, config, quantity, timestamp: Date.now() });
            setCart((prev) => {
                const existing = prev.find((item) => item.cartItemId === cartItemId);
                if (existing) {
                    return prev.map((item) =>
                        item.cartItemId === cartItemId
                            ? {
                                ...item,
                                quantity: totalNeeded,
                                reservationExpired: false,
                                ...(config?.image_url ? { image_url: config.image_url } : {})
                            }
                            : item
                    );
                }

                const newItem = {
                    ...product,
                    cartItemId,
                    quantity,
                    reservationExpired: false,
                    ...(config ? {
                        price: config.price,
                        name: `${product.name} (${config.label})`,
                        image_url: config.image_url || product.image_url,
                        isCombo: true,
                        comboConfig: config
                    } : {})
                };
                return [...prev, newItem];
            });

            return { success: true };
        } catch (err) {
            console.error('Reservation error:', err);
            return { success: false, message: 'No se pudo reservar el stock. Intenta de nuevo.' };
        }
    };

    const removeFromCart = async (cartItemId) => {
        const item = cart.find(i => i.cartItemId === cartItemId);
        if (item) {
            const variantId = item.comboConfig?.id || '';
            await supabase
                .from('cart_reservations')
                .delete()
                .match({
                    product_id: item.id,
                    variant_id: variantId,
                    session_id: sessionId
                });
        }
        setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    };

    const updateQuantity = async (cartItemId, quantity) => {
        if (quantity < 1) return removeFromCart(cartItemId);

        const item = cart.find(i => i.cartItemId === cartItemId);
        if (!item) return;

        try {
            const variantId = item.comboConfig?.id || '';
            const diff = quantity - item.quantity;

            if (diff > 0) {
                const { data: available } = await supabase.rpc('get_available_stock', {
                    p_id: item.id,
                    v_id: variantId === '' ? null : variantId
                });
                if (available < diff) return false;
            }

            const newExpiry = new Date(Date.now() + RESERVATION_TIME_MINS * 60000);
            const newExpiryStr = newExpiry.toISOString();

            // Refresh ALL items to the same expiry
            for (const i of cart) {
                const vId = i.comboConfig?.id || '';
                const qty = i.cartItemId === cartItemId ? quantity : i.quantity;
                await supabase.from('cart_reservations').upsert({
                    product_id: i.id,
                    variant_id: vId,
                    quantity: qty,
                    session_id: sessionId,
                    expires_at: newExpiryStr
                }, { onConflict: 'product_id, variant_id, session_id' });
            }

            setEarliestExpiry(newExpiry.getTime());
            setCart((prev) =>
                prev.map((i) =>
                    i.cartItemId === cartItemId ? { ...i, quantity, reservationExpired: false } : i
                )
            );
            return true;
        } catch (err) {
            return false;
        }
    };

    const extendReservation = async () => {
        if (cart.length === 0 || isExtending) return;
        setIsExtending(true);
        try {
            const newExpiryDate = new Date(Date.now() + EXTENSION_TIME_MINS * 60000);
            const newExpiry = newExpiryDate.toISOString();

            for (const item of cart) {
                const variantId = item.comboConfig?.id || '';
                await supabase.from('cart_reservations').upsert({
                    product_id: item.id,
                    variant_id: variantId,
                    quantity: item.quantity,
                    session_id: sessionId,
                    expires_at: newExpiry
                }, { onConflict: 'product_id, variant_id, session_id' });
            }

            setEarliestExpiry(newExpiryDate.getTime());
            setExpirationWarning(null);
            return true;
        } catch (err) {
            console.error('Error extending reservation:', err);
            return false;
        } finally {
            setIsExtending(false);
        }
    };

    const clearCart = () => setCart([]);

    const subtotal = cart.reduce((acc, item) => {
        if (item.is_bogo) {
            // "Buy 1 Get 1 Free" -> Pay for pairs
            const paidQuantity = Math.ceil(item.quantity / 2);
            return acc + item.price * paidQuantity;
        }
        return acc + item.price * item.quantity;
    }, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            subtotal,
            lastAdded,
            sessionId,
            syncStockWithServer,
            isSyncing,
            expirationWarning,
            setExpirationWarning,
            extendReservation,
            isExtending,
            earliestExpiry
        }}>
            {children}
        </CartContext.Provider>
    );
};
