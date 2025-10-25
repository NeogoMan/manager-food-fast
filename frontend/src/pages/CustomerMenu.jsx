import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuService } from '../services/firestore';
import { useCart } from '../contexts/CartContext';
import { menu, categories, client, form, actions } from '../utils/translations';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

export default function CustomerMenu() {
  const navigate = useNavigate();
  const { addToCart, getCartItemsCount } = useCart();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
      // Get only available menu items
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

  // Filter items based on category and search
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div style={{ color: 'var(--text-primary)' }}>Chargement du menu...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="heading-1" style={{ color: 'var(--text-primary)' }}>
              {menu.title}
            </h1>
            <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
              Parcourez notre menu et ajoutez vos articles préférés au panier
            </p>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="hidden md:flex w-full md:w-auto px-6 py-3 rounded-lg font-semibold transition-all duration-200 relative touch-target active:scale-95"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              minHeight: '48px',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🛒</span>
              <span>{client.myCart}</span>
            </span>
            {getCartItemsCount() > 0 && (
              <span
                className="absolute -top-2 -right-2 min-w-[28px] h-7 px-2 rounded-full flex items-center justify-center text-sm font-bold animate-pulse"
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                }}
              >
                {getCartItemsCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher dans le menu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 text-base transition-shadow"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
            minHeight: '48px',
          }}
        />
      </div>

      {/* Category Filter - Horizontal Scrollable Tabs (Text Only) */}
      <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { value: 'all', label: menu.all },
            { value: 'burgers', label: categories.burgers },
            { value: 'sides', label: categories.sides },
            { value: 'drinks', label: categories.drinks },
            { value: 'desserts', label: categories.desserts },
            { value: 'salads', label: categories.salads },
            { value: 'appetizers', label: categories.appetizers },
          ].map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className="px-5 py-3 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 touch-target text-sm md:text-base"
              style={{
                backgroundColor: selectedCategory === category.value ? 'var(--primary)' : 'var(--bg-primary)',
                color: selectedCategory === category.value ? 'white' : 'var(--text-primary)',
                border: selectedCategory === category.value ? 'none' : '2px solid var(--border)',
                minHeight: '44px',
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      {filteredItems.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="text-6xl mb-4">📦</div>
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Rupture de stock
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            {selectedCategory === 'all'
              ? 'Aucun article disponible pour le moment'
              : `Aucun article disponible dans la catégorie ${getCategoryLabel(selectedCategory)}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {Object.keys(itemsByCategory).map((category) => (
            <div key={category}>
              <h2
                className="heading-2 mb-3 md:mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                {getCategoryLabel(category)}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {itemsByCategory[category].map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl transition-all duration-200 active:scale-98 md:hover:scale-102 md:hover:shadow-lg cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '2px solid var(--border)',
                    }}
                    onClick={() => openAddModal(item)}
                  >
                    {/* Item Details - Text Only */}
                    <div className="p-4">
                      <h3
                        className="text-base sm:text-lg font-bold mb-2 leading-tight"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.name}
                      </h3>
                      {item.description && (
                        <p
                          className="text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-col gap-3 mt-4">
                        <span
                          className="text-lg sm:text-xl font-bold"
                          style={{ color: 'var(--primary)' }}
                        >
                          {(typeof item.price === 'number' ? item.price : parseFloat(item.price)).toFixed(2)} MAD
                        </span>
                        <button
                          className="w-full px-4 py-4 rounded-lg font-bold transition-all duration-200 touch-target text-base shadow-md active:scale-95"
                          style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            minHeight: '52px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddModal(item);
                          }}
                        >
                          + {client.addToCart}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add to Cart Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedItem(null);
        }}
        title={client.addToCart}
      >
        {selectedItem && (
          <div className="space-y-4">
            {/* Item Info */}
            <div className="text-center pb-4 border-b-2" style={{ borderColor: 'var(--border)' }}>
              <h3
                className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {selectedItem.name}
              </h3>
              {selectedItem.description && (
                <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {selectedItem.description}
                </p>
              )}
              <p
                className="text-xl sm:text-2xl md:text-3xl font-bold"
                style={{ color: 'var(--primary)' }}
              >
                {(typeof selectedItem.price === 'number' ? selectedItem.price : parseFloat(selectedItem.price)).toFixed(2)} MAD
              </p>
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm md:text-base font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {form.quantity}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-bold transition-all duration-200 touch-target text-xl sm:text-2xl active:scale-90"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border)',
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="flex-1 px-3 py-3 sm:px-4 sm:py-4 rounded-xl border text-center focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg sm:text-xl font-bold"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    minHeight: '48px',
                  }}
                  readOnly
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-bold transition-all duration-200 touch-target text-xl sm:text-2xl active:scale-90"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border)',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm md:text-base font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {form.specialInstructions}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Instructions spéciales (optionnel)"
              />
            </div>

            {/* Total */}
            <div
              className="p-4 sm:p-5 rounded-xl border-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Total:</span>
                <span
                  className="text-xl sm:text-2xl font-bold"
                  style={{ color: 'var(--primary)' }}
                >
                  {((typeof selectedItem.price === 'number' ? selectedItem.price : parseFloat(selectedItem.price)) * quantity).toFixed(2)} MAD
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedItem(null);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold transition-all duration-200 touch-target active:scale-95 border-2"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                  minHeight: '52px',
                }}
              >
                {actions.cancel}
              </button>
              <button
                onClick={handleAddToCart}
                className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition-all duration-200 touch-target active:scale-95 text-lg"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  minHeight: '52px',
                }}
              >
                + {client.addToCart}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Floating Cart Button (Mobile Only) */}
      <button
        onClick={() => navigate('/cart')}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl transition-all duration-200 active:scale-90 flex items-center justify-center md:hidden z-50"
        style={{
          backgroundColor: 'var(--primary)',
          color: 'white',
        }}
        aria-label="Voir le panier"
      >
        <span className="text-3xl">🛒</span>
        {getCartItemsCount() > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center text-xs font-bold animate-pulse"
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
            }}
          >
            {getCartItemsCount()}
          </span>
        )}
      </button>

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
