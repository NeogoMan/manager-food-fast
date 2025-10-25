import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { client, users, auth, actions, form } from '../utils/translations';
import Button from '../components/Button';
import Toast from '../components/Toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'password'

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleCloseToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  // Profile form handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfile = () => {
    const errors = {};

    if (!profileForm.name.trim()) {
      errors.name = 'Le nom est requis';
    } else if (profileForm.name.length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (profileForm.phone && !/^(\+212|0)[5-7][0-9]{8}$/.test(profileForm.phone.replace(/[\s-]/g, ''))) {
      errors.phone = 'Format de téléphone invalide (ex: 0612345678)';
    }

    if (profileForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      errors.email = 'Format d\'email invalide';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfile()) {
      return;
    }

    try {
      setProfileLoading(true);

      // Call Cloud Function to update user
      const updateUserFn = httpsCallable(functions, 'updateUser');
      await updateUserFn({
        userId: user.id,
        updates: {
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim() || null,
          email: profileForm.email.trim() || null,
        },
      });

      // Update user in context
      updateUser({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || null,
        email: profileForm.email.trim() || null,
      });

      showToast('Profil mis à jour avec succès', 'success');
    } catch (error) {
      showToast(error.message || 'Erreur lors de la mise à jour du profil', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Password form handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Le mot de passe actuel est requis';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/[A-Z]/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Le mot de passe doit contenir au moins une lettre majuscule';
    } else if (!/[0-9]/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Le mot de passe doit contenir au moins un chiffre';
    }

    if (passwordForm.newPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      setPasswordLoading(true);

      // Call Cloud Function to update password
      const updateUserFn = httpsCallable(functions, 'updateUser');
      await updateUserFn({
        userId: user.id,
        updates: {
          password: passwordForm.newPassword,
        },
      });

      showToast('Mot de passe changé avec succès', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      showToast(error.message || 'Erreur lors du changement de mot de passe', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {client.myProfile}
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Gérez vos informations personnelles et votre mot de passe
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="text-center mb-6">
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                👤
              </div>
              <h2
                className="text-xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {user?.name}
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                @{user?.username}
              </p>
              <span
                className="inline-block px-3 py-1 rounded-full text-sm font-medium mt-2"
                style={{
                  backgroundColor: '#f3e8ff',
                  color: '#6b21a8',
                }}
              >
                {users[user?.role] || user?.role}
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                  activeTab === 'info' ? 'bg-primary-600 text-white' : ''
                }`}
                style={
                  activeTab !== 'info'
                    ? {
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                      }
                    : { backgroundColor: 'var(--primary)', color: 'white' }
                }
              >
                📋 Informations personnelles
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                  activeTab === 'password' ? 'bg-primary-600 text-white' : ''
                }`}
                style={
                  activeTab !== 'password'
                    ? {
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                      }
                    : { backgroundColor: 'var(--primary)', color: 'white' }
                }
              >
                🔒 Mot de passe
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
            }}
          >
            {activeTab === 'info' ? (
              <div>
                <h2
                  className="text-xl font-bold mb-6"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Informations personnelles
                </h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {/* Username (read-only) */}
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={user?.username}
                      disabled
                      className="w-full px-3 py-2 rounded border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                        opacity: 0.6,
                      }}
                    />
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Le nom d'utilisateur ne peut pas être modifié
                    </p>
                  </div>

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
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: profileErrors.name ? '#ef4444' : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="ex: Jean Dupont"
                    />
                    {profileErrors.name && (
                      <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>
                        {profileErrors.name}
                      </p>
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
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: profileErrors.phone ? '#ef4444' : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="ex: 0612345678"
                    />
                    {profileErrors.phone && (
                      <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>
                        {profileErrors.phone}
                      </p>
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
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: profileErrors.email ? '#ef4444' : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="ex: jean.dupont@example.com"
                    />
                    {profileErrors.email && (
                      <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>
                        {profileErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button type="submit" disabled={profileLoading}>
                      {profileLoading ? 'En cours...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h2
                  className="text-xl font-bold mb-6"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Changer le mot de passe
                </h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {auth.currentPassword} *
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: passwordErrors.currentPassword
                          ? '#ef4444'
                          : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {auth.newPassword} *
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: passwordErrors.newPassword
                          ? '#ef4444'
                          : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="Min 8 caractères, 1 majuscule, 1 chiffre"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {auth.confirmPassword} *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: passwordErrors.confirmPassword
                          ? '#ef4444'
                          : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="Retapez le nouveau mot de passe"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button type="submit" disabled={passwordLoading}>
                      {passwordLoading ? 'En cours...' : 'Changer le mot de passe'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
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
