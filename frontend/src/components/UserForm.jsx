import { useState, useEffect } from 'react';
import { users, actions, messages } from '../utils/translations';
import Button from './Button';

const ROLES = [
  { value: 'manager', label: users.manager },
  { value: 'cashier', label: users.cashier },
  { value: 'cook', label: users.cook },
  { value: 'client', label: users.client },
];

const STATUSES = [
  { value: 'active', label: users.active },
  { value: 'inactive', label: users.inactive },
  { value: 'suspended', label: users.suspended },
];

export default function UserForm({ user, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    email: '',
    role: 'cashier',
    status: 'active',
  });
  const [errors, setErrors] = useState({});

  // Populate form if editing existing user
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '',
        confirmPassword: '',
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        role: user.role || 'cashier',
        status: user.status || 'active',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }

    // Password validation (required for new users, optional for edit)
    if (!user && !formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (formData.password && !/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une lettre majuscule';
    } else if (formData.password && !/[0-9]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins un chiffre';
    }

    // Confirm password validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    // Phone validation (optional)
    if (formData.phone && !/^(\+212|0)[5-7][0-9]{8}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Format de téléphone invalide (ex: 0612345678)';
    }

    // Email validation (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Le rôle est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data for submission
    const submitData = {
      username: formData.username.trim(),
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      role: formData.role,
      status: formData.status,
    };

    // Include password only if provided
    if (formData.password) {
      submitData.password = formData.password;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {users.name} d'utilisateur *
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          disabled={!!user} // Disable username editing for existing users
          className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
          style={{
            backgroundColor: user ? 'var(--bg-secondary)' : 'var(--bg-primary)',
            borderColor: errors.username ? '#ef4444' : 'var(--border)',
            color: 'var(--text-primary)',
            opacity: user ? 0.6 : 1
          }}
          placeholder="ex: jdupont"
        />
        {errors.username && (
          <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.username}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Mot de passe {!user && '*'}
          {user && <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
            (Laisser vide pour ne pas modifier)
          </span>}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: errors.password ? '#ef4444' : 'var(--border)',
            color: 'var(--text-primary)'
          }}
          placeholder="Min 8 caractères, 1 majuscule, 1 chiffre"
        />
        {errors.password && (
          <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      {formData.password && (
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Confirmer le mot de passe *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: errors.confirmPassword ? '#ef4444' : 'var(--border)',
              color: 'var(--text-primary)'
            }}
            placeholder="Retapez le mot de passe"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.confirmPassword}</p>
          )}
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {users.fullName} *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: errors.name ? '#ef4444' : 'var(--border)',
            color: 'var(--text-primary)'
          }}
          placeholder="ex: Jean Dupont"
        />
        {errors.name && (
          <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.name}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {users.phoneNumber}
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: errors.phone ? '#ef4444' : 'var(--border)',
            color: 'var(--text-primary)'
          }}
          placeholder="ex: 0612345678"
        />
        {errors.phone && (
          <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.phone}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {users.email}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: errors.email ? '#ef4444' : 'var(--border)',
            color: 'var(--text-primary)'
          }}
          placeholder="ex: jean.dupont@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.email}</p>
        )}
      </div>

      {/* Role */}
      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {users.role} *
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: errors.role ? '#ef4444' : 'var(--border)',
            color: 'var(--text-primary)'
          }}
        >
          {ROLES.map(role => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        {errors.role && (
          <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.role}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {users.status} *
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)'
          }}
        >
          {STATUSES.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {actions.cancel}
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'En cours...' : (user ? actions.update : actions.create)}
        </Button>
      </div>
    </form>
  );
}
