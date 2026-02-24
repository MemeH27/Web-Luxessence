import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('luxessence_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('luxessence_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, config = null, quantity = 1) => {
        setCart((prev) => {
            const cartItemId = config ? `${product.id}-${config.id}` : product.id;
            const existing = prev.find((item) => item.cartItemId === cartItemId);

            if (existing) {
                return prev.map((item) =>
                    item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
                );
            }

            const newItem = {
                ...product,
                cartItemId,
                quantity,
                ...(config ? {
                    price: config.price,
                    name: `${product.name} (${config.label})`,
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
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal }}>
            {children}
        </CartContext.Provider>
    );
};
