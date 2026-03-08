import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { menuService } from '../services/firestore';
import * as sessionManager from '../utils/sessionManager';
import { generateSequentialOrderNumber } from '../utils/orderNumberGenerator';
import { formatMAD } from '../utils/currency';
import { categories as categoryLabels, form, actions, client, menu as menuTranslations, status as statusTranslations } from '../utils/translations';

// MUI components
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Badge,
  Snackbar,
  Alert,
  Fade,
} from '@mui/material';

// MUI icons
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import TableBarIcon from '@mui/icons-material/TableBar';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';

// M3 components
import { M3Card, CardContent, M3Chip, M3FAB, M3ThemeToggle } from '../components/M3';

export default function GuestOrder() {
  const { restaurantCode, tableNumber } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Step management: loading | info | menu | cart | confirm | closed | error | expired
  const [currentStep, setCurrentStep] = useState('loading');

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
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Cart state
  const [cart, setCart] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');

  // Item dialog state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  // Session state
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Order submission loading
  const [submitting, setSubmitting] = useState(false);

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
    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, []);

  // Check for existing order and redirect to tracking page
  useEffect(() => {
    const trackingUrl = sessionManager.getOrderPlacedUrl();
    if (trackingUrl) {
      navigate(trackingUrl, { replace: true });
    }
  }, [navigate]);

  // Load cart from session
  useEffect(() => {
    if (currentStep === 'menu' || currentStep === 'cart' || currentStep === 'confirm') {
      const savedCart = sessionManager.getCart();
      if (savedCart.length > 0 && cart.length === 0) {
        setCart(savedCart);
      }
    }
  }, [currentStep]);

  const initializeSession = async () => {
    try {
      if (!restaurantCode) {
        setRestaurantError('Code restaurant invalide');
        setCurrentStep('error');
        return;
      }

      let session = sessionManager.getSession();
      if (!session || session.restaurantCode !== restaurantCode.toUpperCase() || !sessionManager.isSessionValid()) {
        sessionManager.clearSession();
        session = sessionManager.createSession(restaurantCode);
      }

      if (!sessionManager.isSessionValid()) {
        setIsSessionExpired(true);
        setCurrentStep('expired');
        setRestaurantLoading(false);
        return;
      }

      const restaurantsRef = collection(db, 'restaurants');
      const q = query(restaurantsRef, where('shortCode', '==', restaurantCode.toUpperCase()));
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

      if (!restaurantData.acceptingOrders) {
        setCurrentStep('closed');
        setRestaurantLoading(false);
        return;
      }

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
      showSnackbar('Le nom est requis', 'error');
      return;
    }

    if (orderType === 'dine-in' && !tableNum.trim()) {
      showSnackbar('Le numéro de table est requis pour dîner sur place', 'error');
      return;
    }

    sessionManager.updateGuestInfo({
      name: guestName.trim(),
      phone: guestPhone.trim(),
      orderType,
      tableNumber: tableNum.trim(),
    });

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
      showSnackbar('Erreur de chargement du menu', 'error');
    } finally {
      setMenuLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const openAddModal = (item) => {
    setSelectedItem(item);
    setItemQuantity(1);
    setItemNotes('');
    setShowAddModal(true);
  };

  const handleAddFromDialog = () => {
    if (selectedItem && itemQuantity > 0) {
      const existingItem = cart.find((cartItem) => cartItem.id === selectedItem.id);
      let newCart;

      if (existingItem) {
        newCart = cart.map((cartItem) =>
          cartItem.id === selectedItem.id
            ? { ...cartItem, quantity: cartItem.quantity + itemQuantity }
            : cartItem
        );
      } else {
        newCart = [...cart, { ...selectedItem, quantity: itemQuantity }];
      }

      setCart(newCart);
      sessionManager.saveCart(newCart);
      showSnackbar(`${selectedItem.name} ajouté au panier`);
      setShowAddModal(false);
      setSelectedItem(null);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    let newCart;

    if (existingItem) {
      newCart = cart.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      );
    } else {
      newCart = [...cart, { ...item, quantity: 1 }];
    }

    setCart(newCart);
    sessionManager.saveCart(newCart);
    showSnackbar(`${item.name} ajouté au panier`);
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter((item) => item.id !== itemId);
    setCart(newCart);
    sessionManager.saveCart(newCart);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    const newCart = cart.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCart(newCart);
    sessionManager.saveCart(newCart);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const placeOrder = async () => {
    const existingOrderUrl = sessionManager.getOrderPlacedUrl();
    if (existingOrderUrl) {
      navigate(existingOrderUrl, { replace: true });
      return;
    }

    if (cart.length === 0) {
      showSnackbar('Votre panier est vide', 'error');
      return;
    }

    if (!sessionManager.isSessionValid()) {
      showSnackbar('Votre session a expiré.', 'error');
      setCurrentStep('expired');
      return;
    }

    try {
      setSubmitting(true);

      const orderNumber = await generateSequentialOrderNumber(restaurant.id);
      const trackingSecret = sessionManager.generateTrackingSecret();

      const orderData = {
        restaurantId: restaurant.id,
        orderNumber,
        isGuestOrder: true,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || null,
        orderType,
        tableNumber: orderType === 'dine-in' ? tableNum.trim() : null,
        notes: orderNotes.trim() || null,
        items: cart.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        totalAmount: calculateTotal(),
        itemCount: getCartItemsCount(),
        status: 'awaiting_approval',
        paymentStatus: 'unpaid',
        trackingSecret,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ordersRef = collection(db, 'orders');
      const orderRef = await addDoc(ordersRef, orderData);

      const trackingUrl = `/track/${orderRef.id}/${trackingSecret}`;
      sessionManager.setOrderPlaced(trackingUrl);

      setCart([]);
      sessionManager.saveCart([]);

      navigate(trackingUrl, { replace: true });
    } catch (error) {
      console.error('Error placing order:', error);
      showSnackbar('Échec de la création de la commande: ' + error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getOrderTypeLabel = (type) => {
    switch (type) {
      case 'dine-in':
        return 'Sur place';
      case 'takeout':
        return 'À emporter';
      case 'pickup':
        return 'Enlèvement';
      default:
        return type;
    }
  };

  const getOrderTypeIcon = (type) => {
    switch (type) {
      case 'dine-in':
        return <RestaurantIcon fontSize="small" />;
      case 'takeout':
        return <TakeoutDiningIcon fontSize="small" />;
      case 'pickup':
        return <DirectionsWalkIcon fontSize="small" />;
      default:
        return null;
    }
  };

  // Category chips from menu items
  const availableCategories = ['all', ...new Set(menuItems.map((item) => item.category))];

  const filteredItems = menuItems.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );

  const getCategoryLabel = (category) => {
    if (category === 'all') return menuTranslations.all;
    return categoryLabels[category] || category;
  };

  // ─── AppBar (shared across all steps) ───
  const renderAppBar = () => {
    const showBack = ['menu', 'cart', 'confirm'].includes(currentStep);
    const showCart = currentStep === 'menu';

    const handleBack = () => {
      switch (currentStep) {
        case 'menu':
          setCurrentStep('info');
          break;
        case 'cart':
          setCurrentStep('menu');
          break;
        case 'confirm':
          setCurrentStep('cart');
          break;
        default:
          break;
      }
    };

    const getTitle = () => {
      switch (currentStep) {
        case 'info':
          return restaurant?.name || 'Bienvenue';
        case 'menu':
          return 'Menu';
        case 'cart':
          return 'Votre panier';
        case 'confirm':
          return 'Confirmation';
        default:
          return restaurant?.name || '';
      }
    };

    return (
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: theme.palette.surface?.container || theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ minHeight: '64px' }}>
          {showBack && (
            <IconButton
              edge="start"
              onClick={handleBack}
              sx={{ mr: 1, color: theme.palette.text.primary }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}

          <Typography
            variant="titleLarge"
            sx={{
              flexGrow: 1,
              color: theme.palette.text.primary,
              fontSize: { xs: '18px', sm: '22px' },
            }}
          >
            {getTitle()}
          </Typography>

          {showCart && cart.length > 0 && (
            <IconButton
              onClick={() => setCurrentStep('cart')}
              sx={{ color: theme.palette.text.primary, mr: 0.5 }}
            >
              <Badge badgeContent={getCartItemsCount()} color="primary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          )}

          <M3ThemeToggle />
        </Toolbar>
      </AppBar>
    );
  };

  // ─── Session Timer Chip ───
  const renderSessionTimer = () => {
    if (!restaurant || ['error', 'closed', 'expired', 'loading'].includes(currentStep)) return null;

    const expiringSoon = sessionManager.isSessionExpiringSoon();

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <M3Chip
          variant="assist"
          icon={<AccessTimeIcon />}
          label={`Session: ${sessionManager.getFormattedTimeRemaining()} restant`}
          sx={{
            ...(expiringSoon && {
              backgroundColor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 },
              },
              '& .MuiChip-icon': {
                color: theme.palette.error.contrastText,
              },
            }),
          }}
        />
      </Box>
    );
  };

  // ─── Step: Loading ───
  const renderLoading = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: 2,
      }}
    >
      <CircularProgress color="primary" size={48} />
      <Typography variant="bodyLarge" sx={{ color: theme.palette.text.secondary }}>
        Chargement...
      </Typography>
    </Box>
  );

  // ─── Step: Error ───
  const renderError = () => (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <Typography variant="displaySmall" sx={{ fontSize: '64px' }}>
          &#x274C;
        </Typography>
        <Typography variant="headlineSmall" sx={{ color: theme.palette.text.primary }}>
          Erreur
        </Typography>
        <Typography variant="bodyLarge" sx={{ color: theme.palette.text.secondary }}>
          {restaurantError}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Retour
        </Button>
      </Box>
    </Container>
  );

  // ─── Step: Closed ───
  const renderClosed = () => (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <Typography variant="displaySmall" sx={{ fontSize: '64px' }}>
          &#x1F6AB;
        </Typography>
        <Typography variant="headlineSmall" sx={{ color: theme.palette.text.primary }}>
          Restaurant fermé
        </Typography>
        <Typography variant="bodyLarge" sx={{ color: theme.palette.text.secondary }}>
          Le restaurant n'accepte pas de commandes pour le moment.
        </Typography>
        <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
          Veuillez réessayer plus tard.
        </Typography>
      </Box>
    </Container>
  );

  // ─── Step: Expired ───
  const renderExpired = () => (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <Typography variant="displaySmall" sx={{ fontSize: '64px' }}>
          &#x23F0;
        </Typography>
        <Typography variant="headlineSmall" sx={{ color: theme.palette.text.primary }}>
          Session expirée
        </Typography>
        <Typography variant="bodyLarge" sx={{ color: theme.palette.text.secondary }}>
          Votre session a expiré après 60 minutes.
        </Typography>
        <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
          Veuillez scanner le code QR à nouveau pour créer une nouvelle commande.
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            sessionManager.clearSession();
            window.location.reload();
          }}
          sx={{ mt: 2 }}
        >
          Nouvelle session
        </Button>
      </Box>
    </Container>
  );

  // ─── Step: Info Form ───
  const renderInfoStep = () => (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        {restaurant?.branding?.logoUrl ? (
          <Box
            component="img"
            src={restaurant.branding.logoUrl}
            alt={restaurant.name}
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              objectFit: 'cover',
              mb: 2,
              mx: 'auto',
              display: 'block',
              border: `3px solid ${theme.palette.primary.main}`,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <RestaurantMenuIcon sx={{ fontSize: 48, color: theme.palette.primary.contrastText }} />
          </Box>
        )}

        <Typography
          variant="headlineMedium"
          sx={{ color: theme.palette.text.primary, mb: 1 }}
        >
          Bienvenue chez {restaurant?.name}
        </Typography>
        <Typography variant="bodyLarge" sx={{ color: theme.palette.text.secondary }}>
          Scannez, commandez, savourez !
        </Typography>
      </Box>

      <M3Card variant="elevated" sx={{ p: { xs: 2, sm: 3 } }}>
        <CardContent>
          <form onSubmit={handleInfoSubmit}>
            <TextField
              fullWidth
              label="Votre nom *"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ex: Mohammed"
              required
              inputProps={{ minLength: 2 }}
              sx={{ mb: 2.5 }}
            />

            <TextField
              fullWidth
              label="Téléphone (optionnel)"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="Ex: +212 6XX XXX XXX"
              sx={{ mb: 2.5 }}
            />

            <Typography
              variant="titleSmall"
              sx={{ mb: 1.5, color: theme.palette.text.primary }}
            >
              Type de commande
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
              <M3Chip
                variant="filter"
                selected={orderType === 'dine-in'}
                label="Sur place"
                icon={<RestaurantIcon />}
                onClick={() => setOrderType('dine-in')}
              />
              <M3Chip
                variant="filter"
                selected={orderType === 'takeout'}
                label="À emporter"
                icon={<TakeoutDiningIcon />}
                onClick={() => setOrderType('takeout')}
              />
              <M3Chip
                variant="filter"
                selected={orderType === 'pickup'}
                label="Enlèvement"
                icon={<DirectionsWalkIcon />}
                onClick={() => setOrderType('pickup')}
              />
            </Box>

            {orderType === 'dine-in' && (
              <TextField
                fullWidth
                label="Numéro de table *"
                value={tableNum}
                onChange={(e) => setTableNum(e.target.value)}
                placeholder="Ex: 5"
                required
                sx={{ mb: 2.5 }}
              />
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 1, minHeight: '48px' }}
            >
              Voir le menu
            </Button>
          </form>
        </CardContent>
      </M3Card>
    </Container>
  );

  // ─── Step: Menu ───
  const renderMenuStep = () => (
    <Box sx={{ pb: cart.length > 0 ? '100px' : '24px' }}>
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        {/* Category Filter Chips */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 1,
            mb: 3,
            px: { xs: 1, sm: 0 },
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {availableCategories.map((category) => (
            <M3Chip
              key={category}
              label={getCategoryLabel(category)}
              variant="filter"
              selected={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
              sx={{ flexShrink: 0 }}
            />
          ))}
        </Box>

        {/* Menu Loading */}
        {menuLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : filteredItems.length === 0 ? (
          <M3Card variant="filled" sx={{ p: 4, textAlign: 'center', mx: { xs: 1, sm: 0 } }}>
            <Typography variant="displaySmall" sx={{ fontSize: '64px', mb: 2 }}>
              &#x1F4E6;
            </Typography>
            <Typography variant="titleLarge" sx={{ mb: 1, color: theme.palette.text.primary }}>
              Aucun article disponible
            </Typography>
            <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
              {selectedCategory === 'all'
                ? 'Aucun article disponible pour le moment'
                : `Aucun article dans la catégorie ${getCategoryLabel(selectedCategory)}`}
            </Typography>
          </M3Card>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
              px: { xs: 1, sm: 0 },
            }}
          >
            {filteredItems.map((item) => (
              <M3Card key={item.id} variant="elevated" interactive onClick={() => openAddModal(item)}>
                {/* Food Image */}
                {item.image ? (
                  <Box
                    component="img"
                    src={item.image}
                    alt={item.name}
                    sx={{
                      width: '100%',
                      height: 160,
                      objectFit: 'cover',
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 120,
                      backgroundColor: theme.palette.surface?.containerHigh || theme.palette.action?.hover,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                  >
                    <RestaurantMenuIcon
                      sx={{ fontSize: 48, color: theme.palette.text.disabled }}
                    />
                  </Box>
                )}

                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="titleLarge"
                    sx={{
                      mb: 0.5,
                      color: theme.palette.text.primary,
                      fontSize: { xs: '16px', sm: '18px' },
                    }}
                  >
                    {item.name}
                  </Typography>

                  {item.description && (
                    <Typography
                      variant="bodyMedium"
                      sx={{
                        mb: 1.5,
                        color: theme.palette.text.secondary,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="titleMedium"
                      sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                    >
                      {formatMAD(item.price)}
                    </Typography>

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                      sx={{ textTransform: 'none', minHeight: '36px' }}
                    >
                      Ajouter
                    </Button>
                  </Box>
                </CardContent>
              </M3Card>
            ))}
          </Box>
        )}
      </Container>

      {/* Sticky Bottom Bar */}
      {cart.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.palette.surface?.container || theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            px: 2,
            py: 1.5,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <ShoppingCartIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="titleSmall" sx={{ color: theme.palette.text.primary }}>
              {getCartItemsCount()} article{getCartItemsCount() > 1 ? 's' : ''}
            </Typography>
            <Typography variant="titleSmall" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              {formatMAD(calculateTotal())}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setCurrentStep('cart')}
            sx={{ minHeight: '44px', px: 3 }}
          >
            Voir le panier
          </Button>
        </Box>
      )}
    </Box>
  );

  // ─── Step: Cart ───
  const renderCartStep = () => (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      {cart.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ShoppingBagIcon sx={{ fontSize: 80, color: theme.palette.text.disabled, mb: 2 }} />
          <Typography variant="headlineSmall" sx={{ color: theme.palette.text.primary, mb: 1 }}>
            Votre panier est vide
          </Typography>
          <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
            Ajoutez des articles depuis le menu pour commencer
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => setCurrentStep('menu')}
          >
            Retour au menu
          </Button>
        </Box>
      ) : (
        <>
          {/* Cart Items */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {cart.map((item) => (
              <M3Card key={item.id} variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    {/* Item thumbnail */}
                    {item.image ? (
                      <Box
                        component="img"
                        src={item.image}
                        alt={item.name}
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1.5,
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1.5,
                          backgroundColor: theme.palette.surface?.containerHigh || theme.palette.action?.hover,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <RestaurantMenuIcon sx={{ color: theme.palette.text.disabled }} />
                      </Box>
                    )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Typography
                          variant="titleMedium"
                          sx={{ color: theme.palette.text.primary }}
                        >
                          {item.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => removeFromCart(item.id)}
                          sx={{ ml: 1, color: theme.palette.error.main }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Typography
                        variant="bodySmall"
                        sx={{ color: theme.palette.text.secondary, mb: 1 }}
                      >
                        {formatMAD(item.price)} / unité
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            sx={{
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 1.5,
                              width: 32,
                              height: 32,
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography
                            variant="titleMedium"
                            sx={{ minWidth: 28, textAlign: 'center' }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            sx={{
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 1.5,
                              width: 32,
                              height: 32,
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Typography
                          variant="titleMedium"
                          sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                        >
                          {formatMAD(item.price * item.quantity)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </M3Card>
            ))}
          </Box>

          {/* Notes TextField */}
          <M3Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Instructions (optionnel)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value.slice(0, 200))}
                placeholder="Ex: Sans oignons, bien cuit..."
                inputProps={{ maxLength: 200 }}
                helperText={`${orderNotes.length}/200`}
              />
            </CardContent>
          </M3Card>

          {/* Order Summary */}
          <M3Card variant="filled" sx={{ mb: 3 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
                  Sous-total
                </Typography>
                <Typography variant="bodyMedium" sx={{ color: theme.palette.text.primary }}>
                  {formatMAD(calculateTotal())}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
                  Articles
                </Typography>
                <Typography variant="bodyMedium" sx={{ color: theme.palette.text.primary }}>
                  {getCartItemsCount()}
                </Typography>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="titleMedium" sx={{ fontWeight: 600 }}>
                  Total
                </Typography>
                <Typography
                  variant="titleMedium"
                  sx={{ fontWeight: 600, color: theme.palette.primary.main }}
                >
                  {formatMAD(calculateTotal())}
                </Typography>
              </Box>
            </CardContent>
          </M3Card>

          {/* Session Expiry Warning */}
          {sessionManager.isSessionExpiringSoon() && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Votre session expire bientôt ({sessionManager.getFormattedTimeRemaining()}).
              Veuillez finaliser votre commande.
            </Alert>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => setCurrentStep('confirm')}
              sx={{ minHeight: '48px' }}
            >
              Confirmer
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => setCurrentStep('menu')}
              sx={{ minHeight: '44px' }}
            >
              Ajouter des articles
            </Button>
          </Box>
        </>
      )}
    </Container>
  );

  // ─── Step: Confirm ───
  const renderConfirmStep = () => (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      {/* Guest Info Summary */}
      <M3Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="titleMedium" sx={{ color: theme.palette.text.primary }}>
              {guestName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getOrderTypeIcon(orderType)}
            <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
              {getOrderTypeLabel(orderType)}
              {orderType === 'dine-in' && tableNum && ` · Table ${tableNum}`}
            </Typography>
          </Box>
          {guestPhone && (
            <Typography variant="bodySmall" sx={{ color: theme.palette.text.secondary, mt: 0.5, ml: 3.5 }}>
              {guestPhone}
            </Typography>
          )}
        </CardContent>
      </M3Card>

      {/* Order Items */}
      <M3Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {cart.map((item, index) => (
            <Box key={item.id}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                <Typography variant="bodyMedium" sx={{ color: theme.palette.text.primary }}>
                  {item.quantity}x {item.name}
                </Typography>
                <Typography variant="bodyMedium" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                  {formatMAD(item.price * item.quantity)}
                </Typography>
              </Box>
              {index < cart.length - 1 && <Divider />}
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="titleMedium" sx={{ fontWeight: 600 }}>
              Total
            </Typography>
            <Typography
              variant="titleMedium"
              sx={{ fontWeight: 600, color: theme.palette.primary.main }}
            >
              {formatMAD(calculateTotal())}
            </Typography>
          </Box>
        </CardContent>
      </M3Card>

      {/* Order Notes Display */}
      {orderNotes.trim() && (
        <M3Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="titleSmall" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
              Instructions
            </Typography>
            <Typography variant="bodyMedium" sx={{ color: theme.palette.text.primary, fontStyle: 'italic' }}>
              {orderNotes}
            </Typography>
          </CardContent>
        </M3Card>
      )}

      {/* Info Notice */}
      <Alert
        severity="info"
        icon={<WarningAmberIcon />}
        sx={{ mb: 3, borderRadius: 2 }}
      >
        Après confirmation, votre commande sera envoyée au restaurant pour approbation.
      </Alert>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={placeOrder}
          disabled={submitting || isSessionExpired}
          sx={{ minHeight: '48px' }}
        >
          {submitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Passer la commande'
          )}
        </Button>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<ArrowBackIcon />}
          onClick={() => setCurrentStep('cart')}
          disabled={submitting}
          sx={{ minHeight: '44px' }}
        >
          Modifier
        </Button>
      </Box>
    </Container>
  );

  // ─── Add Item Dialog ───
  const renderAddItemDialog = () => (
    <Dialog
      open={showAddModal}
      onClose={() => setShowAddModal(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px', m: 2 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          pt: 3,
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="headlineSmall"
          sx={{ fontWeight: 500, color: theme.palette.text.primary, fontSize: { xs: '20px', sm: '24px' } }}
        >
          {client.addToCart}
        </Typography>
        <IconButton onClick={() => setShowAddModal(false)} size="medium">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {selectedItem && (
          <Box sx={{ pt: 2 }}>
            {/* Item Image */}
            {selectedItem.image && (
              <Box
                component="img"
                src={selectedItem.image}
                alt={selectedItem.name}
                sx={{
                  width: '100%',
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: 2,
                  mb: 2,
                }}
              />
            )}

            {/* Item Info */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="headlineSmall" sx={{ mb: 1 }}>
                {selectedItem.name}
              </Typography>
              {selectedItem.description && (
                <Typography variant="bodyMedium" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                  {selectedItem.description}
                </Typography>
              )}
              <Typography
                variant="headlineMedium"
                sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
              >
                {formatMAD(selectedItem.price)}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Quantity Selector */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="titleSmall" sx={{ mb: 1 }}>
                {form.quantity}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography variant="titleLarge" sx={{ minWidth: '60px', textAlign: 'center' }}>
                  {itemQuantity}
                </Typography>
                <IconButton
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Total */}
            <M3Card variant="filled" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="titleMedium">Total:</Typography>
                <Typography
                  variant="titleLarge"
                  sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
                >
                  {formatMAD(selectedItem.price * itemQuantity)}
                </Typography>
              </Box>
            </M3Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={() => setShowAddModal(false)} variant="outlined" sx={{ minHeight: '40px' }}>
          {actions.cancel}
        </Button>
        <Button
          onClick={handleAddFromDialog}
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ minHeight: '40px' }}
        >
          {client.addToCart}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ─── Main Render ───
  const renderContent = () => {
    if (restaurantLoading || currentStep === 'loading') return renderLoading();

    switch (currentStep) {
      case 'error':
        return renderError();
      case 'closed':
        return renderClosed();
      case 'expired':
        return renderExpired();
      case 'info':
        return renderInfoStep();
      case 'menu':
        return renderMenuStep();
      case 'cart':
        return renderCartStep();
      case 'confirm':
        return renderConfirmStep();
      default:
        return renderLoading();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* AppBar */}
      {!restaurantLoading && !['loading', 'error'].includes(currentStep) && renderAppBar()}

      {/* Session Timer */}
      {renderSessionTimer()}

      {/* Main Content */}
      {renderContent()}

      {/* Add Item Dialog */}
      {renderAddItemDialog()}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
