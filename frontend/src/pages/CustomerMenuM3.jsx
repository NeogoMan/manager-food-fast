import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery,
  TextField,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import { menuService } from '../services/firestore';
import { useCart } from '../contexts/CartContext';
import { menu, categories, client, form, actions } from '../utils/translations';
import { M3Card, CardContent, M3Chip, M3FAB, M3ThemeToggle } from '../components/M3';
import Toast from '../components/Toast';

export default function CustomerMenuM3() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { addToCart, getCartItemsCount } = useCart();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const data = await menuService.getAvailable();
      setMenuItems(data);
    } catch (error) {
      showToast('Erreur lors du chargement du menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleCloseToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  const openAddModal = (item) => {
    setSelectedItem(item);
    setQuantity(1);
    setNotes('');
    setShowAddModal(true);
  };

  const handleAddToCart = () => {
    if (selectedItem && quantity > 0) {
      addToCart(selectedItem, quantity, notes);
      showToast(`${selectedItem.name} ajouté au panier`, 'success');
      setShowAddModal(false);
      setSelectedItem(null);
      setQuantity(1);
      setNotes('');
    }
  };

  // Filter items based on category
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesCategory;
  });

  // Get category label
  const getCategoryLabel = (category) => {
    return categories[category] || category;
  };

  // Group items by category
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // Category list for chips
  const categoryList = [
    { value: 'all', label: menu.all },
    { value: 'burgers', label: categories.burgers },
    { value: 'sides', label: categories.sides },
    { value: 'drinks', label: categories.drinks },
    { value: 'desserts', label: categories.desserts },
    { value: 'salads', label: categories.salads },
    { value: 'appetizers', label: categories.appetizers },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: '96px' }}> {/* Padding bottom for FAB + bottom nav space */}
      {/* M3 App Bar - Small (64dp) */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: theme.palette.surface?.container || theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ minHeight: '64px' }}>
          <Typography
            variant="titleLarge"
            sx={{
              flexGrow: 1,
              color: theme.palette.text.primary,
              fontSize: { xs: '20px', sm: '22px' },
            }}
          >
            {menu.title}
          </Typography>
          <M3ThemeToggle />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
        {/* Description */}
        <Typography
          variant="bodyMedium"
          sx={{ mb: 3, color: theme.palette.text.secondary, px: { xs: 1, sm: 0 } }}
        >
          Parcourez notre menu et ajoutez vos articles préférés au panier
        </Typography>

        {/* M3 Category Filter Chips */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 1,
            mb: 3,
            px: { xs: 1, sm: 0 },
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {categoryList.map((category) => (
            <M3Chip
              key={category.value}
              label={category.label}
              variant="filter"
              selected={selectedCategory === category.value}
              onClick={() => setSelectedCategory(category.value)}
              sx={{ flexShrink: 0 }}
            />
          ))}
        </Box>

        {/* Menu Items */}
        {filteredItems.length === 0 ? (
          <M3Card variant="filled" sx={{ p: 4, textAlign: 'center', mx: { xs: 1, sm: 0 } }}>
            <Typography variant="displaySmall" sx={{ fontSize: '64px', mb: 2 }}>
              📦
            </Typography>
            <Typography
              variant="titleLarge"
              sx={{ mb: 1, color: theme.palette.text.primary }}
            >
              Rupture de stock
            </Typography>
            <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
              {selectedCategory === 'all'
                ? 'Aucun article disponible pour le moment'
                : `Aucun article disponible dans la catégorie ${getCategoryLabel(selectedCategory)}`}
            </Typography>
          </M3Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Object.keys(itemsByCategory).map((category) => (
              <Box key={category}>
                <Typography
                  variant="headlineSmall"
                  sx={{ mb: 2, color: theme.palette.text.primary, px: { xs: 1, sm: 0 } }}
                >
                  {getCategoryLabel(category)}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                    },
                    gap: 2,
                    px: { xs: 1, sm: 0 },
                  }}
                >
                  {itemsByCategory[category].map((item) => (
                    <M3Card key={item.id} variant="elevated" interactive>
                      <CardContent sx={{ p: 2 }}>
                        {/* Product Name - Title Large */}
                        <Typography
                          variant="titleLarge"
                          sx={{
                            mb: 1,
                            color: theme.palette.text.primary,
                            fontSize: { xs: '18px', sm: '22px' },
                          }}
                        >
                          {item.name}
                        </Typography>

                        {/* Product Description - Body Medium */}
                        {item.description && (
                          <Typography
                            variant="bodyMedium"
                            sx={{
                              mb: 2,
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

                        {/* Price - Title Medium */}
                        <Typography
                          variant="titleMedium"
                          sx={{
                            mb: 2,
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            fontSize: { xs: '16px', sm: '18px' },
                          }}
                        >
                          {(typeof item.price === 'number' ? item.price : parseFloat(item.price)).toFixed(2)} MAD
                        </Typography>

                        {/* M3 Filled Button */}
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<AddIcon />}
                          onClick={() => openAddModal(item)}
                          sx={{
                            minHeight: '40px',
                            textTransform: 'none',
                          }}
                        >
                          {client.addToCart}
                        </Button>
                      </CardContent>
                    </M3Card>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Container>

      {/* M3 Large FAB with Badge */}
      <M3FAB
        variant="large"
        color="primary"
        badgeCount={getCartItemsCount()}
        icon={<ShoppingCartIcon />}
        onClick={() => navigate('/cart')}
        style={{
          position: 'fixed',
          bottom: isMobile ? '96px' : '24px', // Above bottom nav on mobile
          right: '16px',
          zIndex: 1100,
        }}
        aria-label="Voir le panier"
      />

      {/* M3 Add to Cart Dialog */}
      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            m: 2,
          },
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
            sx={{
              fontWeight: 500,
              color: theme.palette.text.primary,
              fontSize: { xs: '20px', sm: '24px' },
            }}
          >
            {client.addToCart}
          </Typography>
          <IconButton
            onClick={() => setShowAddModal(false)}
            size="medium"
            sx={{
              ml: 2,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {selectedItem && (
            <Box>
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
                <Typography variant="headlineMedium" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                  {(typeof selectedItem.price === 'number' ? selectedItem.price : parseFloat(selectedItem.price)).toFixed(2)} MAD
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
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                    }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography variant="titleLarge" sx={{ minWidth: '60px', textAlign: 'center' }}>
                    {quantity}
                  </Typography>
                  <IconButton
                    onClick={() => setQuantity(quantity + 1)}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Notes */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="titleSmall" sx={{ mb: 1 }}>
                  {form.specialInstructions}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions spéciales (optionnel)"
                />
              </Box>

              {/* Total */}
              <M3Card variant="filled" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="titleMedium">Total:</Typography>
                  <Typography variant="titleLarge" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                    {((typeof selectedItem.price === 'number' ? selectedItem.price : parseFloat(selectedItem.price)) * quantity).toFixed(2)} MAD
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
          <Button onClick={handleAddToCart} variant="contained" startIcon={<AddIcon />} sx={{ minHeight: '40px' }}>
            {client.addToCart}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={handleCloseToast}
      />
    </Box>
  );
}
