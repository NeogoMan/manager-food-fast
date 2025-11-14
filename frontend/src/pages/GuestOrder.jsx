import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { menuService } from '../services/firestore';
import * as sessionManager from '../utils/sessionManager';
import { generateUniqueOrderNumber } from '../utils/orderNumberGenerator';
import styles from './GuestOrder.module.css';

export default function GuestOrder() {
  const { restaurantCode, tableNumber } = useParams();
  const navigate = useNavigate();

  // Step management
  const [currentStep, setCurrentStep] = useState('loading'); // loading, info, menu, closed, error, expired

  // Restaurant state
  const [restaurant, setRestaurant] = useState(null);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [restaurantError, setRestaurantError] = useState(null);

  // Guest info state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [orderType, setOrderType] = useState(tableNumber ? 'dine-in' : 'takeout');
  const [tableNum, setTableNum] = useState(tableNumber || '');

  // Menu state
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  // Cart state
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Session state
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Error/success messages
  const [message, setMessage] = useState(null);

  // Initialize session and load restaurant
  useEffect(() => {
    initializeSession();
  }, [restaurantCode]);

  // Session expiration check
  useEffect(() => {
    const checkSession = () => {
      if (!sessionManager.isSessionValid()) {
        setIsSessionExpired(true);
        setCurrentStep('expired');
      } else {
        setTimeRemaining(sessionManager.getTimeRemaining());
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Check for existing order and redirect to tracking page
  useEffect(() => {
    const trackingUrl = sessionManager.getOrderPlacedUrl();
    if (trackingUrl) {
      console.log('⚠️ Order already placed, redirecting to tracking page');
      navigate(trackingUrl, { replace: true });
    }
  }, [navigate]);

  // Load cart from session
  useEffect(() => {
    if (currentStep === 'menu') {
      const savedCart = sessionManager.getCart();
      setCart(savedCart);
    }
  }, [currentStep]);

  const initializeSession = async () => {
    try {
      // Validate restaurant code
      if (!restaurantCode) {
        setRestaurantError('Code restaurant invalide');
        setCurrentStep('error');
        return;
      }

      // Check or create session
      let session = sessionManager.getSession();
      if (!session || session.restaurantCode !== restaurantCode.toUpperCase() || !sessionManager.isSessionValid()) {
        // Clear old/expired session and create new one
        sessionManager.clearSession();
        session = sessionManager.createSession(restaurantCode);
      }

      // Check if session is expired
      if (!sessionManager.isSessionValid()) {
        setIsSessionExpired(true);
        setCurrentStep('expired');
        setRestaurantLoading(false);
        return;
      }

      // Load restaurant by code
      const restaurantsRef = collection(db, 'restaurants');
      const q = query(
        restaurantsRef,
        where('shortCode', '==', restaurantCode.toUpperCase())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setRestaurantError('Restaurant non trouvé');
        setCurrentStep('error');
        setRestaurantLoading(false);
        return;
      }

      const restaurantDoc = querySnapshot.docs[0];
      const restaurantData = { id: restaurantDoc.id, ...restaurantDoc.data() };
      setRestaurant(restaurantData);

      // Check if restaurant is accepting orders
      if (!restaurantData.acceptingOrders) {
        setCurrentStep('closed');
        setRestaurantLoading(false);
        return;
      }

      // Load saved guest info if exists
      const savedGuestInfo = sessionManager.getGuestInfo();
      if (savedGuestInfo) {
        setGuestName(savedGuestInfo.name);
        setGuestPhone(savedGuestInfo.phone || '');
        setOrderType(savedGuestInfo.orderType);
        setTableNum(savedGuestInfo.tableNumber || '');
      }

      setRestaurantLoading(false);
      setCurrentStep('info');
    } catch (error) {
      console.error('Error initializing session:', error);
      setRestaurantError('Erreur de connexion au restaurant');
      setCurrentStep('error');
      setRestaurantLoading(false);
    }
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();

    if (!guestName.trim()) {
      setMessage({ type: 'error', text: 'Le nom est requis' });
      return;
    }

    if (orderType === 'dine-in' && !tableNum.trim()) {
      setMessage({ type: 'error', text: 'Le numéro de table est requis pour dîner sur place' });
      return;
    }

    // Save guest info to session
    sessionManager.updateGuestInfo({
      name: guestName.trim(),
      phone: guestPhone.trim(),
      orderType,
      tableNumber: tableNum.trim()
    });

    setMessage(null);

    // Load menu items
    await loadMenu();
    setCurrentStep('menu');
  };

  const loadMenu = async () => {
    try {
      setMenuLoading(true);
      const items = await menuService.getAvailable(restaurant.id);
      setMenuItems(items);
    } catch (error) {
      console.error('Error loading menu:', error);
      setMessage({ type: 'error', text: 'Erreur de chargement du menu' });
    } finally {
      setMenuLoading(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    let newCart;

    if (existingItem) {
      newCart = cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      newCart = [...cart, { ...item, quantity: 1 }];
    }

    setCart(newCart);
    sessionManager.saveCart(newCart);
    setMessage({ type: 'success', text: `${item.name} ajouté au panier` });
    setTimeout(() => setMessage(null), 2000);
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter(item => item.id !== itemId);
    setCart(newCart);
    sessionManager.saveCart(newCart);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    const newCart = cart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCart(newCart);
    sessionManager.saveCart(newCart);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const placeOrder = async () => {
    // Check if order was already placed for this session
    const existingOrderUrl = sessionManager.getOrderPlacedUrl();
    if (existingOrderUrl) {
      console.log('⚠️ Order already placed for this session, redirecting...');
      navigate(existingOrderUrl, { replace: true });
      return;
    }

    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'Votre panier est vide' });
      return;
    }

    // Check if session is expired
    if (!sessionManager.isSessionValid()) {
      setMessage({ type: 'error', text: 'Votre session a expiré.' });
      setCurrentStep('expired');
      return;
    }

    try {
      setMenuLoading(true);

      // Generate unique order number
      const orderNumber = await generateUniqueOrderNumber(restaurant.id);

      // Generate tracking secret
      const trackingSecret = sessionManager.generateTrackingSecret();

      // Create order in Firestore
      const orderData = {
        restaurantId: restaurant.id,
        orderNumber,
        isGuestOrder: true,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || null,
        orderType,
        tableNumber: orderType === 'dine-in' ? tableNum.trim() : null,
        notes: orderNotes.trim() || null,
        items: cart.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        totalAmount: calculateTotal(),
        itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
        status: 'awaiting_approval',
        paymentStatus: 'unpaid',
        trackingSecret,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const ordersRef = collection(db, 'orders');
      const orderRef = await addDoc(ordersRef, orderData);

      console.log('✅ Order created:', orderRef.id);

      // Build tracking URL
      const trackingUrl = `/track/${orderRef.id}/${trackingSecret}`;

      // Store tracking URL to prevent duplicate orders
      sessionManager.setOrderPlaced(trackingUrl);

      // Clear cart
      setCart([]);
      sessionManager.saveCart([]);

      // Redirect to tracking page with replace to prevent back button
      navigate(trackingUrl, { replace: true });

    } catch (error) {
      console.error('Error placing order:', error);
      setMessage({ type: 'error', text: 'Échec de la création de la commande: ' + error.message });
    } finally {
      setMenuLoading(false);
    }
  };

  const getFormattedTimeRemaining = () => {
    return sessionManager.getFormattedTimeRemaining();
  };

  const isSessionExpiringSoon = () => {
    return sessionManager.isSessionExpiringSoon();
  };

  // Render different steps
  const renderContent = () => {
    if (restaurantLoading) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Chargement...</p>
        </div>
      );
    }

    if (currentStep === 'error') {
      return (
        <div className={styles.error}>
          <h2>❌ Erreur</h2>
          <p>{restaurantError}</p>
          <button onClick={() => navigate('/')} className={styles.button}>
            Retour
          </button>
        </div>
      );
    }

    if (currentStep === 'closed') {
      return (
        <div className={styles.closed}>
          <h2>🚫 Restaurant fermé</h2>
          <p>Le restaurant n'accepte pas de commandes pour le moment.</p>
          <p>Veuillez réessayer plus tard.</p>
        </div>
      );
    }

    if (currentStep === 'expired') {
      return (
        <div className={styles.expired}>
          <h2>⏰ Session expirée</h2>
          <p>Votre session a expiré après 60 minutes.</p>
          <p>Veuillez scanner le code QR à nouveau pour créer une nouvelle commande.</p>
          <button onClick={() => {
            sessionManager.clearSession();
            window.location.reload();
          }} className={styles.primaryButton}>
            Nouvelle session
          </button>
        </div>
      );
    }

    if (currentStep === 'info') {
      return (
        <div className={styles.infoForm}>
          <h1>Bienvenue chez {restaurant?.name}</h1>
          <p className={styles.subtitle}>Veuillez fournir vos informations pour continuer</p>

          <form onSubmit={handleInfoSubmit}>
            <div className={styles.formGroup}>
              <label>Votre nom *</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ex: Mohammed"
                required
                minLength={2}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Téléphone (optionnel)</label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="Ex: +212 6XX XXX XXX"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Type de commande *</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className={styles.select}
              >
                <option value="dine-in">Sur place</option>
                <option value="takeout">À emporter</option>
                <option value="pickup">Enlèvement</option>
              </select>
            </div>

            {orderType === 'dine-in' && (
              <div className={styles.formGroup}>
                <label>Numéro de table *</label>
                <input
                  type="text"
                  value={tableNum}
                  onChange={(e) => setTableNum(e.target.value)}
                  placeholder="Ex: 5"
                  required
                  className={styles.input}
                />
              </div>
            )}

            <button type="submit" className={styles.primaryButton}>
              Commencer ma commande →
            </button>
          </form>
        </div>
      );
    }

    if (currentStep === 'menu') {
      return (
        <div className={styles.menuView}>
          <div className={styles.menuHeader}>
            <h2>Menu</h2>
            <button
              onClick={() => setShowCart(true)}
              className={styles.cartButton}
            >
              🛒 Panier ({cart.length})
            </button>
          </div>

          {menuLoading ? (
            <div className={styles.loading}>Chargement du menu...</div>
          ) : (
            <div className={styles.menuItems}>
              {menuItems.map(item => (
                <div key={item.id} className={styles.menuItem}>
                  <div className={styles.itemInfo}>
                    <h3>{item.name}</h3>
                    {item.description && <p>{item.description}</p>}
                    <span className={styles.price}>{item.price} DH</span>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className={styles.addButton}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className={styles.guestOrder}>
      {/* Session Timer Header */}
      {restaurant && currentStep !== 'error' && currentStep !== 'closed' && currentStep !== 'expired' && (
        <div className={`${styles.sessionHeader} ${isSessionExpiringSoon() ? styles.expiringSoon : ''}`}>
          <span>{restaurant.name}</span>
          <span>⏱ Session expire dans: {getFormattedTimeRemaining()}</span>
        </div>
      )}

      {/* Message Toast */}
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Main Content */}
      {renderContent()}

      {/* Cart Modal */}
      {showCart && (
        <div className={styles.cartModal}>
          <div className={styles.cartContent}>
            <div className={styles.cartHeader}>
              <h2>🛒 Votre panier</h2>
              <button onClick={() => setShowCart(false)} className={styles.closeButton}>
                ✕
              </button>
            </div>

            {/* Session Expiration Warning */}
            {isSessionExpiringSoon() && (
              <div className={styles.warningBanner}>
                ⚠️ Votre session expire bientôt ({getFormattedTimeRemaining()}). Veuillez passer votre commande maintenant.
              </div>
            )}
            {isSessionExpired && (
              <div className={styles.errorBanner}>
                ❌ Votre session a expiré. Veuillez scanner le code QR à nouveau.
              </div>
            )}

            {cart.length === 0 ? (
              <p className={styles.emptyCart}>Votre panier est vide</p>
            ) : (
              <>
                <div className={styles.cartItems}>
                  {cart.map(item => (
                    <div key={item.id} className={styles.cartItem}>
                      <div className={styles.cartItemInfo}>
                        <h4>{item.name}</h4>
                        <span>{item.price} DH</span>
                      </div>
                      <div className={styles.cartItemActions}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.cartTotal}>
                  <h3>Total: {calculateTotal().toFixed(2)} DH</h3>
                </div>

                {/* Order Notes */}
                <div className={styles.notesSection}>
                  <label>Instructions pour le restaurant (optionnel)</label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value.slice(0, 50))}
                    placeholder="Ex: Sans oignons, bien cuit..."
                    maxLength={50}
                    rows={2}
                    className={styles.notesInput}
                  />
                  <span className={styles.charCounter}>
                    {orderNotes.length}/50 caractères
                  </span>
                </div>

                <div className={styles.cartActions}>
                  <button onClick={() => setShowCart(false)} className={styles.secondaryButton}>
                    Continuer mes achats
                  </button>
                  <button onClick={placeOrder} className={styles.primaryButton} disabled={menuLoading || isSessionExpired}>
                    {menuLoading ? 'Commande en cours...' : 'Passer la commande'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
