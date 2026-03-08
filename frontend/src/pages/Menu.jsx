import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { menuService } from '../services/firestore';
import { uploadMenuImage, deleteMenuImage } from '../services/storageService';
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
  const [isSaving, setIsSaving] = useState(false);

  // Image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const fileInputRef = useRef(null);

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

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  async function getRestaurantId() {
    const auth = await import('../config/firebase').then(m => m.auth);
    const idTokenResult = await auth.currentUser.getIdTokenResult();
    const restaurantId = idTokenResult.claims.restaurantId;
    if (!restaurantId) {
      throw new Error('No restaurantId found in user token');
    }
    return restaurantId;
  }

  async function loadMenuItems() {
    try {
      setIsLoading(true);
      const restaurantId = await getRestaurantId();

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
  }

  function resetImageState() {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    resetImageState();
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
    resetImageState();
    // Show existing image as preview
    if (item.image) {
      setImagePreview(item.image);
    }
    setIsModalOpen(true);
  }

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      alert(form.imageTypeError);
      return;
    }

    // Validate size (5 MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      alert(form.imageSizeError);
      return;
    }

    setImageFile(file);
    setRemoveExistingImage(false);

    // Create local preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  function handleRemoveImage() {
    if (editingItem?.image) {
      setRemoveExistingImage(true);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const restaurantId = await getRestaurantId();

      const data = {
        ...formData,
        price: parseFloat(formData.price),
        isAvailable: formData.isAvailable,
      };

      if (editingItem) {
        // --- EDIT MODE ---
        let imageUrl = editingItem.image || null;

        // Upload new image if selected
        if (imageFile) {
          // Delete old image first if it exists
          if (editingItem.image) {
            await deleteMenuImage(editingItem.image).catch(() => {});
          }
          imageUrl = await uploadMenuImage(imageFile, restaurantId, editingItem.id);
        } else if (removeExistingImage && editingItem.image) {
          // User explicitly removed the image
          await deleteMenuImage(editingItem.image).catch(() => {});
          imageUrl = null;
        }

        data.image = imageUrl;
        await menuService.update(editingItem.id, data);
      } else {
        // --- CREATE MODE ---
        // Create the document first to get an ID, then upload the image
        const created = await menuService.create(data, restaurantId);

        if (imageFile) {
          const imageUrl = await uploadMenuImage(imageFile, restaurantId, created.id);
          await menuService.update(created.id, { image: imageUrl });
        }
      }

      setIsModalOpen(false);
      resetImageState();
      loadMenuItems();
    } catch (error) {
      if (error.message === 'TYPE_NOT_ALLOWED') {
        alert(form.imageTypeError);
      } else if (error.message === 'FILE_TOO_LARGE') {
        alert(form.imageSizeError);
      } else {
        alert(errors.saveMenuFailed + ': ' + error.message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm(confirmations.deleteItem)) return;

    try {
      // Find the item to delete its image too
      const item = menuItems.find(i => i.id === id);
      if (item?.image) {
        await deleteMenuImage(item.image).catch(() => {});
      }
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
      <div className="mb-6 flex gap-2 flex-wrap">
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
            {/* Item image */}
            {item.image ? (
              <div className="mb-3 rounded-lg overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className="mb-3 rounded-lg flex items-center justify-center"
                style={{
                  aspectRatio: '16/10',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>🍽️</span>
              </div>
            )}

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
          {/* Image Upload */}
          <div>
            <label className="label">{form.image}</label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full rounded-lg object-cover"
                  style={{ maxHeight: '200px' }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors"
                  title={form.removeImage}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors hover:border-primary-500"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-tertiary)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📷</div>
                {form.uploadImage}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm mt-2 underline"
                style={{ color: 'var(--text-secondary)' }}
              >
                {form.changeImage}
              </button>
            )}
          </div>

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
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? form.imageUploading
                : `${editingItem ? actions.update : actions.add} ${form.item}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
