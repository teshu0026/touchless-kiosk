/**
 * Cart and Order Logic for Touchless Kiosk
 * Manages cart state and order history using localStorage.
 */

export const CartLogic = {
    getCart: () => {
        return JSON.parse(localStorage.getItem('kiosk_cart') || '[]');
    },

    addToCart: (item) => {
        const cart = CartLogic.getCart();
        cart.push({
            id: Date.now(),
            name: item.name,
            price: item.price,
            icon: item.icon
        });
        localStorage.setItem('kiosk_cart', JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    },

    removeFromCart: (id) => {
        let cart = CartLogic.getCart();
        cart = cart.filter(item => item.id !== id);
        localStorage.setItem('kiosk_cart', JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    },

    clearCart: () => {
        localStorage.setItem('kiosk_cart', '[]');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    },

    placeOrder: () => {
        const cart = CartLogic.getCart();
        if (cart.length === 0) return false;

        const orders = JSON.parse(localStorage.getItem('kiosk_orders') || '[]');
        const newOrder = {
            id: `ORD-${Math.floor(Math.random() * 10000)}`,
            date: new Date().toLocaleString(),
            items: cart,
            total: cart.reduce((sum, item) => sum + parseFloat(item.price.replace('$', '')), 0).toFixed(2),
            status: 'Processing'
        };

        orders.unshift(newOrder);
        localStorage.setItem('kiosk_orders', JSON.stringify(orders));
        CartLogic.clearCart();
        return true;
    },

    getOrders: () => {
        return JSON.parse(localStorage.getItem('kiosk_orders') || '[]');
    }
};
