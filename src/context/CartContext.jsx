import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const CART_VERSION = 'v2';

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('luxessence_cart');
            const savedVersion = localStorage.getItem('luxessence_cart_version');
            // Clear old cart data if version mismatch
            if (savedVersion !== CART_VERSION) {
                localStorage.removeItem('luxessence_cart');
                localStorage.setItem('luxessence_cart_version', CART_VERSION);
                return [];
            }
            if (!savedCart) return [];
            const parsed = JSON.parse(savedCart);
            // Validate: every item must have a cartItemId
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

    useEffect(() => {
        localStorage.setItem('luxessence_cart', JSON.stringify(cart));
        localStorage.setItem('luxessence_cart_version', CART_VERSION);
    }, [cart]);

    const addToCart = (product, config = null, quantity = 1) => {
        setLastAdded({ ...product, config, quantity, timestamp: Date.now() });
        setCart((prev) => {
            const cartItemId = config ? `${product.id}-${config.id}` : product.id;
            const existing = prev.find((item) => item.cartItemId === cartItemId);

            if (existing) {
                return prev.map((item) =>
                    item.cartItemId === cartItemId
                        ? {
                            ...item,
                            quantity: item.quantity + quantity,
                            ...(config?.image_url ? { image_url: config.image_url } : {})
                        }
                        : item
                );
            }

            const newItem = {
                ...product,
                cartItemId,
                quantity,
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
    };

    const removeFromCart = (cartItemId) => {
        setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId, quantity) => {
        if (quantity < 1) return removeFromCart(cartItemId);
        setCart((prev) =>
            prev.map((item) =>
                item.cartItemId === cartItemId ? { ...item, quantity } : item
            )
        );
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
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, lastAdded }}>
            {children}
        </CartContext.Provider>
    );
};
