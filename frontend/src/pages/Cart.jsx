import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ordersService } from '../services/firestore';
import { client, actions, orders } from '../utils/translations';
import Button from '../components/Button';
import Toast from '../components/Toast';

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [notes, setNotes] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleCloseToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      showToast('Votre panier est vide', 'error');
      return;
    }

    // Prevent double-click
    if (loading) return;

    try {
      setLoading(true);

      // Get restaurantId from JWT token
      const auth = await import('../config/firebase').then(m => m.auth);
      const idTokenResult = await auth.currentUser.getIdTokenResult();
      const restaurantId = idTokenResult.claims.restaurantId;

      if (!restaurantId) {
        throw new Error('No restaurantId found in auth token');
      }

      // Calculate total
      const totalAmount = cartItems.reduce((sum, item) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
        return sum + (price * item.quantity);
      }, 0);

      const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      // Prepare order data for Firestore
      const orderData = {
        userId: user?.id, // Client orders must have userId set
        customerName: null, // Clients don't need to provide name (it's in their user profile)
        notes: notes.trim() || null,
        items: cartItems.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price),
          quantity: item.quantity,
        })),
        totalAmount: totalAmount,
        itemCount: itemCount,
        status: 'awaiting_approval', // Client orders always need approval
      };

      await ordersService.create(orderData, restaurantId);

      // Show success message
      showToast('Votre commande est en attente d\'approbation', 'success');

      clearCart();

      // Redirect to my orders page after a short delay
      setTimeout(() => {
        navigate('/my-orders');
      }, 1500);
    } catch (error) {
      console.error('Order creation failed:', error);
      showToast(error.message || 'Erreur lors de la création de la commande', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 md:py-16">
        <div className="text-6xl md:text-8xl mb-4">🛒</div>
        <h2
          className="heading-2 mb-2 text-center"
          style={{ color: 'var(--text-primary)' }}
        >
          {client.cartEmpty}
        </h2>
        <p className="mb-6 text-center text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
          Ajoutez des articles à votre panier pour commencer
        </p>
        <Button onClick={() => navigate('/customer-menu')}>
          {client.viewMenu}
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="heading-1" style={{ color: 'var(--text-primary)' }}>
          {client.myCart}
        </h1>
        <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
          Vérifiez votre commande avant de la finaliser
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item, index) => (
            <div
              key={`${item.id}-${item.notes}-${index}`}
              className="rounded-lg p-4"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                {/* Item Info */}
                <div className="flex-1">
                  <h3
                    className="text-base md:text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.name}
                  </h3>
                  {item.notes && (
                    <p
                      className="text-sm mt-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Note: {item.notes}
                    </p>
                  )}
                  <p
                    className="text-base md:text-sm mt-2 font-medium"
                    style={{ color: 'var(--primary)' }}
                  >
                    {(typeof item.price === 'number' ? item.price : parseFloat(item.price)).toFixed(2)} MAD
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-2 ml-0 md:ml-4 mt-3 md:mt-0">
                  <button
                    onClick={() => updateQuantity(item.id, item.notes, item.quantity - 1)}
                    className="w-10 h-10 md:w-9 md:h-9 rounded-lg font-bold transition-colors touch-target"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    -
                  </button>
                  <span
                    className="w-12 text-center font-semibold text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.notes, item.quantity + 1)}
                    className="w-10 h-10 md:w-9 md:h-9 rounded-lg font-bold transition-colors touch-target"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.id, item.notes)}
                  className="ml-2 px-4 py-2 md:px-3 md:py-1 rounded-lg text-base md:text-sm font-medium transition-colors touch-target"
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    minHeight: '40px',
                  }}
                  title="Retirer du panier"
                >
                  ✕
                </button>
              </div>

              {/* Item Subtotal */}
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Sous-total
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {((typeof item.price === 'number' ? item.price : parseFloat(item.price)) * item.quantity).toFixed(2)} MAD
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div
            className="rounded-lg p-6 sticky top-4"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Résumé de la commande
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Sous-total
                </span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {(getCartTotal() || 0).toFixed(2)} MAD
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Articles
                </span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div
                className="pt-3 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex justify-between items-center">
                  <span
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Total
                  </span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: 'var(--primary)' }}
                  >
                    {(getCartTotal() || 0).toFixed(2)} MAD
                  </span>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Notes / Instructions spéciales (Optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Ex: Sans oignons, bien cuit, allergies..."
                className="w-full px-3 py-2 rounded-lg resize-none"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {notes.length}/500 caractères
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg font-medium transition-colors text-white touch-target text-base"
                style={{
                  backgroundColor: 'var(--primary)',
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  minHeight: '48px',
                }}
              >
                {loading ? '⏳ Envoi en cours...' : client.placeOrder}
              </button>
              <button
                onClick={() => navigate('/customer-menu')}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg font-medium transition-colors touch-target text-base"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  minHeight: '48px',
                }}
              >
                {client.continueShopping}
              </button>
              <button
                onClick={clearCart}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg font-medium transition-colors text-sm md:text-sm touch-target"
                style={{
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  minHeight: '44px',
                }}
              >
                Vider le panier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={handleCloseToast}
      />
    </div>
  );
}
