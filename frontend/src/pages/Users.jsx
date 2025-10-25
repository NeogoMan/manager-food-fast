import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services/firestore';
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { users, actions, messages } from '../utils/translations';
import Button from '../components/Button';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';
import Toast from '../components/Toast';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    // Don't fetch users if not authenticated yet
    if (!currentUser) {
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Get restaurantId from JWT token
      const auth = await import('../config/firebase').then(m => m.auth);
      const idTokenResult = await auth.currentUser.getIdTokenResult();
      const restaurantId = idTokenResult.claims.restaurantId;

      if (!restaurantId) {
        throw new Error('No restaurantId found in auth token');
      }

      const data = await usersService.getAll(restaurantId);
      setUsersList(data);
    } catch (error) {
      showToast(error.message || 'Erreur lors du chargement des utilisateurs', 'error');
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

  const handleCreateUser = async (formData) => {
    try {
      setFormLoading(true);
      const createUserFn = httpsCallable(functions, 'createUser');
      await createUserFn({
        username: formData.username,
        password: formData.password,
        role: formData.role,
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
      });
      showToast(users.userCreated, 'success');
      setShowCreateModal(false);
      fetchUsers();
    } catch (error) {
      showToast(error.message || 'Erreur lors de la création de l\'utilisateur', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditUser = async (formData) => {
    try {
      setFormLoading(true);
      const updateUserFn = httpsCallable(functions, 'updateUser');
      await updateUserFn({
        userId: selectedUser.id,
        updates: {
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          role: formData.role,
          status: formData.status,
          ...(formData.password && { password: formData.password }),
        },
      });
      showToast(users.userUpdated, 'success');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      showToast(error.message || 'Erreur lors de la mise à jour de l\'utilisateur', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setFormLoading(true);
      const deleteUserFn = httpsCallable(functions, 'deleteUser');
      await deleteUserFn({
        userId: selectedUser.id,
      });
      showToast(users.userDeleted, 'success');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      showToast(error.message || 'Erreur lors de la suppression de l\'utilisateur', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      manager: users.manager,
      cashier: users.cashier,
      cook: users.cook,
      client: users.client,
    };
    return roleLabels[role] || role;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: '#dcfce7', color: '#166534', label: users.active },
      inactive: { bg: '#fee', color: '#991b1b', label: users.inactive },
      suspended: { bg: '#fef3c7', color: '#92400e', label: users.suspended },
    };
    const badge = badges[status] || badges.active;

    return (
      <span
        className="px-2 py-1 rounded text-xs font-medium"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        {badge.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const badges = {
      manager: { bg: '#dbeafe', color: '#1e40af' },
      cashier: { bg: '#fef3c7', color: '#92400e' },
      cook: { bg: '#fce7f3', color: '#9f1239' },
      client: { bg: '#f3e8ff', color: '#6b21a8' },
    };
    const badge = badges[role] || badges.client;

    return (
      <span
        className="px-2 py-1 rounded text-xs font-medium"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        {getRoleLabel(role)}
      </span>
    );
  };

  // Filter users based on search and filters
  const filteredUsers = usersList.filter(user => {
    const matchesSearch = !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = !filterStatus || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div style={{ color: 'var(--text-primary)' }}>Chargement des utilisateurs...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="heading-1" style={{ color: 'var(--text-primary)' }}>
            {users.title}
          </h1>
          <p className="mt-2 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            Gérez les utilisateurs du système ({filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''})
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <span className="hidden sm:inline">+ {users.addUser}</span>
          <span className="sm:hidden">+</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div
        className="rounded-lg p-3 md:p-4 mb-4 md:mb-6"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder={users.searchUsers}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                minHeight: '48px'
              }}
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-3 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                minHeight: '48px'
              }}
            >
              <option value="">Tous les rôles</option>
              <option value="manager">{users.manager}</option>
              <option value="cashier">{users.cashier}</option>
              <option value="cook">{users.cook}</option>
              <option value="client">{users.client}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                minHeight: '48px'
              }}
            >
              <option value="">Tous les statuts</option>
              <option value="active">{users.active}</option>
              <option value="inactive">{users.inactive}</option>
              <option value="suspended">{users.suspended}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <p style={{ color: 'var(--text-secondary)' }}>{users.noUsers}</p>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[640px]">
              <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {users.name}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Nom d'utilisateur
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {users.role}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {users.phone}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {users.status}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <td className="px-4 py-3">
                      <div style={{ color: 'var(--text-primary)' }}>
                        {user.name}
                        {user.id === currentUser.id && (
                          <span className="ml-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            (Vous)
                          </span>
                        )}
                      </div>
                      {user.email && (
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {user.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {user.username}
                    </td>
                    <td className="px-4 py-3">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {user.phone || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="px-3 md:px-4 py-2 text-sm md:text-base rounded transition-colors touch-target"
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            minHeight: '40px'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                        >
                          {actions.edit}
                        </button>
                        {user.id !== currentUser.id && (
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="px-3 md:px-4 py-2 text-sm md:text-base rounded transition-colors touch-target"
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              minHeight: '40px'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                          >
                            {actions.delete}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={users.createUser}
      >
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        title={users.editUser}
      >
        <UserForm
          user={selectedUser}
          onSubmit={handleEditUser}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          loading={formLoading}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        title={users.deleteUser}
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--text-primary)' }}>
            {users.confirmDelete}
          </p>
          {selectedUser && (
            <div
              className="p-3 rounded"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <p style={{ color: 'var(--text-primary)' }}>
                <strong>{selectedUser.name}</strong>
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {selectedUser.username} • {getRoleLabel(selectedUser.role)}
              </p>
            </div>
          )}
          <p className="text-sm" style={{ color: '#ef4444' }}>
            {users.deleteWarning}
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
              disabled={formLoading}
            >
              {actions.cancel}
            </Button>
            <button
              onClick={handleDeleteUser}
              disabled={formLoading}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: '#ef4444',
                color: 'white'
              }}
              onMouseOver={(e) => !formLoading && (e.target.style.backgroundColor = '#dc2626')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#ef4444')}
            >
              {formLoading ? 'Suppression...' : actions.delete}
            </button>
          </div>
        </div>
      </Modal>

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
