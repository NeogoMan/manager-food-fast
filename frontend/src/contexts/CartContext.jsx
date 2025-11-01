import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Ensure all prices are numbers (handle legacy string prices)
        const normalizedCart = parsedCart.map(item => ({
          ...item,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        }));
        setCartItems(normalizedCart);
      } catch (error) {
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (menuItem, quantity = 1, notes = '') => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        item => item.id === menuItem.id && item.notes === notes
      );

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        // Add new item to cart
        // Ensure price is always a number (handle both string and number inputs)
        return [
          ...prevItems,
          {
            id: menuItem.id,
            name: menuItem.name,
            price: typeof menuItem.price === 'string' ? parseFloat(menuItem.price) : menuItem.price,
            category: menuItem.category,
            quantity,
            notes,
          },
        ];
      }
    });
  };

  const removeFromCart = (itemId, notes = '') => {
    setCartItems(prevItems =>
      prevItems.filter(item => !(item.id === itemId && item.notes === notes))
    );
  };

  const updateQuantity = (itemId, notes, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, notes);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId && item.notes === notes
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
