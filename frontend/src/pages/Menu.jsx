import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { menuService } from '../services/firestore';
import { formatMAD } from '../utils/currency';
import { menu, form, actions, errors, loading, placeholders, confirmations } from '../utils/translations';

export default function Menu() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isAvailable: true,
  });

  useEffect(() => {
    // Don't load menu items if not authenticated yet
    if (!user) {
      setIsLoading(false);
      return;
    }
    loadMenuItems();
    loadCategories();
  }, [user, selectedCategory]);

  async function loadMenuItems() {
    try {
      setIsLoading(true);

      // Get restaurantId from JWT token
      const auth = await import('../config/firebase').then(m => m.auth);
      const idTokenResult = await auth.currentUser.getIdTokenResult();
      const restaurantId = idTokenResult.claims.restaurantId;

      if (!restaurantId) {
        throw new Error('No restaurantId found in user token');
      }

      let data;
      if (selectedCategory) {
        data = await menuService.getByCategory(selectedCategory, restaurantId);
      } else {
        data = await menuService.getAll(restaurantId);
      }
      setMenuItems(data);

      // Extract unique categories from menu items
      const uniqueCategories = [...new Set(data.map(item => item.category))].filter(Boolean);
      setCategories(uniqueCategories);
    } catch (error) {
      alert(errors.loadMenuFailed + ': ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCategories() {
    // Categories are now extracted from menu items in loadMenuItems()
    // This function can be removed but kept for compatibility
  }

  function openAddModal() {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      isAvailable: true,
    });
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        isAvailable: formData.isAvailable,
      };

      if (editingItem) {
        await menuService.update(editingItem.id, data);
      } else {
        // Get restaurantId from JWT token for new menu items
        const auth = await import('../config/firebase').then(m => m.auth);
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        const restaurantId = idTokenResult.claims.restaurantId;

        if (!restaurantId) {
          throw new Error('No restaurantId found in auth token');
        }

        await menuService.create(data, restaurantId);
      }

      setIsModalOpen(false);
      loadMenuItems();
    } catch (error) {
      alert(errors.saveMenuFailed + ': ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm(confirmations.deleteItem)) return;

    try {
      await menuService.delete(id);
      loadMenuItems();
    } catch (error) {
      alert(errors.deleteMenuFailed + ': ' + error.message);
    }
  }

  async function toggleAvailability(item) {
    try {
      await menuService.update(item.id, {
        isAvailable: !item.isAvailable,
      });
      loadMenuItems();
    } catch (error) {
      alert(errors.updateAvailabilityFailed + ': ' + error.message);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl" style={{ color: 'var(--text-secondary)' }}>
          {loading.loadingMenu}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {menu.title}
        </h1>
        <Button onClick={openAddModal}>+ {menu.addItem}</Button>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={!selectedCategory ? 'primary' : 'secondary'}
          onClick={() => setSelectedCategory('')}
        >
          {menu.all}
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'primary' : 'secondary'}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card key={item.id}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {item.name}
                </h3>
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {item.category}
                </span>
              </div>
              <span className="text-xl font-bold text-primary-600">
                {formatMAD(item.price)}
              </span>
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {item.description || form.description}
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleAvailability(item)}
                className={`text-sm font-medium ${
                  item.isAvailable
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {item.isAvailable ? `✓ ${form.available}` : `✗ ${form.unavailable}`}
              </button>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => openEditModal(item)}>
                  {actions.edit}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(item.id)}
                >
                  {actions.delete}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg" style={{ color: 'var(--text-tertiary)' }}>
            {menu.noItems}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? menu.editItem : menu.addItem}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{form.name} *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="label">{form.description}</label>
            <textarea
              className="input"
              rows="3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{form.price} *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder={placeholders.priceExample}
                required
              />
            </div>

            <div>
              <label className="label">{form.category} *</label>
              <input
                type="text"
                className="input"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder={placeholders.categoryExample}
                list="categories"
                required
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="label">{form.availability}</label>
            <select
              className="input"
              value={formData.isAvailable ? '1' : '0'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isAvailable: e.target.value === '1',
                })
              }
            >
              <option value="1">{form.available}</option>
              <option value="0">{form.unavailable}</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              {actions.cancel}
            </Button>
            <Button type="submit">
              {editingItem ? actions.update : actions.add} {form.item}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
