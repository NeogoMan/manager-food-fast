import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Collapse,
  Divider,
  CircularProgress,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { useAuth } from '../contexts/AuthContext';
import { ordersService } from '../services/firestore';
import { client, orders, status, actions } from '../utils/translations';
import { M3Card, CardContent, M3Chip } from '../components/M3';
import Toast from '../components/Toast';

export default function MyOrdersM3() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // Setup real-time subscription for client's orders
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);

    const unsubscribe = ordersService.subscribe(
      (orders) => {
        // Sort orders by createdAt in descending order (most recent first)
        const sortedOrders = [...orders].sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        setOrdersList(sortedOrders);
        setLoading(false);
      },
      { userId: user.id }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleCloseToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      await ordersService.updateStatus(orderToCancel.id, 'cancelled');
      setCancelDialogOpen(false);
      setOrderToCancel(null);
      showToast('Commande annulée avec succès', 'success');
    } catch (error) {
      console.error('Cancel order error:', error);
      showToast('Erreur lors de l\'annulation', 'error');
    }
  };

  const openCancelDialog = (order) => {
    setOrderToCancel(order);
    setCancelDialogOpen(true);
  };

  const closeCancelDialog = () => {
    setCancelDialogOpen(false);
    setOrderToCancel(null);
  };

  // Get status chip configuration
  const getStatusChipConfig = (orderStatus) => {
    const configs = {
      awaiting_approval: {
        color: theme.palette.warning.main,
        backgroundColor: theme.palette.mode === 'dark' ? '#78350f' : '#fef3c7',
        label: status.awaiting_approval,
        icon: '🔔',
      },
      rejected: {
        color: theme.palette.error.main,
        backgroundColor: theme.palette.mode === 'dark' ? '#7f1d1d' : '#fee2e2',
        label: status.rejected,
        icon: '❌',
      },
      pending: {
        color: theme.palette.info.main,
        backgroundColor: theme.palette.mode === 'dark' ? '#1e3a8a' : '#dbeafe',
        label: status.pending,
        icon: '⏳',
      },
      preparing: {
        color: theme.palette.info.main,
        backgroundColor: theme.palette.mode === 'dark' ? '#1e3a8a' : '#dbeafe',
        label: status.preparing,
        icon: '👨‍🍳',
      },
      ready: {
        color: theme.palette.success.main,
        backgroundColor: theme.palette.mode === 'dark' ? '#064e3b' : '#d1fae5',
        label: status.ready,
        icon: '✅',
      },
      completed: {
        color: theme.palette.text.secondary,
        backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#e5e7eb',
        label: status.completed,
        icon: '📦',
      },
      cancelled: {
        color: theme.palette.error.main,
        backgroundColor: theme.palette.mode === 'dark' ? '#7f1d1d' : '#fee2e2',
        label: status.cancelled,
        icon: '❌',
      },
    };
    return configs[orderStatus] || configs.awaiting_approval;
  };

  // Get progression overlay content (status message)
  const getProgressionOverlay = (orderStatus) => {
    const messages = {
      awaiting_approval: {
        title: 'En attente d\'approbation',
        description: 'Votre commande attend la validation du restaurant',
      },
      rejected: {
        title: 'Refusé',
        description: 'Votre commande a été refusée',
      },
      pending: {
        title: 'En attente',
        description: 'Votre commande va bientôt être préparée',
      },
      preparing: {
        title: 'En préparation',
        description: 'Votre commande est en cours de préparation',
      },
      ready: {
        title: 'Prêt',
        description: 'Votre commande est prête à être récupérée',
      },
      completed: {
        title: 'Terminé',
        description: 'Commande livrée avec succès',
      },
      cancelled: {
        title: 'Annulé',
        description: 'Cette commande a été annulée',
      },
    };
    return messages[orderStatus] || messages.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Render timeline for active orders
  const renderTimeline = (order) => {
    if (
      ['cancelled', 'completed', 'awaiting_approval', 'rejected'].includes(order.status)
    ) {
      return null;
    }

    const steps = [
      { status: 'pending', label: 'En attente', icon: '⏳' },
      { status: 'preparing', label: 'En préparation', icon: '👨‍🍳' },
      { status: 'ready', label: 'Prête', icon: '✅' },
    ];

    const currentIndex = steps.findIndex((step) => step.status === order.status);

    return (
      <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="titleSmall" sx={{ mb: 2, color: theme.palette.text.primary }}>
          Progression de la commande
        </Typography>
        <Box sx={{ position: 'relative', pl: 4 }}>
          {/* Vertical line */}
          <Box
            sx={{
              position: 'absolute',
              left: '19px',
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: theme.palette.divider,
            }}
          />

          {steps.map((step, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <Box
                key={step.status}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: index < steps.length - 1 ? 3 : 0,
                }}
              >
                {/* Circle indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: '-32px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    backgroundColor: isCurrent
                      ? theme.palette.primary.main
                      : isComplete
                      ? theme.palette.primary.main
                      : theme.palette.surface?.containerHigh || theme.palette.background.default,
                    ...(isCurrent && {
                      boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`,
                      animation: 'pulse 2s infinite',
                    }),
                    '@keyframes pulse': {
                      '0%, 100%': {
                        transform: 'scale(1)',
                      },
                      '50%': {
                        transform: 'scale(1.05)',
                      },
                    },
                  }}
                >
                  <span style={{ filter: isFuture ? 'grayscale(100%)' : 'none' }}>
                    {step.icon}
                  </span>
                </Box>

                {/* Label */}
                <Box sx={{ flex: 1, pt: 1 }}>
                  <Typography
                    variant={isCurrent ? 'titleMedium' : 'bodyMedium'}
                    sx={{
                      color: isCurrent
                        ? theme.palette.primary.main
                        : isFuture
                        ? theme.palette.text.secondary
                        : theme.palette.text.primary,
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                  >
                    {step.label}
                  </Typography>
                  {isCurrent && (
                    <Typography variant="bodySmall" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>
                      {step.status === 'pending' && 'Votre commande est en attente de préparation'}
                      {step.status === 'preparing' && 'Votre commande est en cours de préparation'}
                      {step.status === 'ready' && 'Votre commande est prête à être récupérée'}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

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
    <Box sx={{ pb: '96px' }}>
      {/* M3 App Bar - Medium (112dp) */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: theme.palette.surface?.container || theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ minHeight: '64px', flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
          <Typography
            variant="headlineMedium"
            sx={{
              color: theme.palette.text.primary,
              fontSize: { xs: '24px', sm: '28px' },
            }}
          >
            {client.myOrders}
          </Typography>
          <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Suivez l'état de vos commandes en temps réel
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
        {/* Orders List */}
        {ordersList.length === 0 ? (
          <M3Card variant="filled" sx={{ p: 6, textAlign: 'center', mx: { xs: 1, sm: 0 } }}>
            <Typography variant="displaySmall" sx={{ fontSize: '64px', mb: 2 }}>
              📋
            </Typography>
            <Typography variant="headlineSmall" sx={{ mb: 1, color: theme.palette.text.primary }}>
              Aucune commande
            </Typography>
            <Typography variant="bodyMedium" sx={{ mb: 3, color: theme.palette.text.secondary }}>
              Vous n'avez pas encore passé de commande
            </Typography>
            <Button
              variant="contained"
              startIcon={<RestaurantMenuIcon />}
              onClick={() => navigate('/customer-menu')}
              sx={{ minHeight: '40px' }}
            >
              {client.viewMenu}
            </Button>
          </M3Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: { xs: 1, sm: 0 } }}>
            {ordersList.map((order) => {
              const statusConfig = getStatusChipConfig(order.status);
              const isExpanded = expandedOrders.has(order.id);

              return (
                <M3Card key={order.id} variant="elevated" interactive>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    {/* Order Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleOrderExpansion(order.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '32px' }}>{statusConfig.icon}</Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="titleLarge"
                            sx={{
                              color: theme.palette.text.primary,
                              fontSize: { xs: '18px', sm: '22px' },
                            }}
                          >
                            #{order.orderNumber}
                          </Typography>
                          <Typography variant="bodySmall" sx={{ color: theme.palette.text.secondary }}>
                            {formatDate(order.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <M3Chip
                          variant="assist"
                          label={statusConfig.label}
                          sx={{
                            backgroundColor: statusConfig.backgroundColor,
                            color: statusConfig.color,
                            fontWeight: 600,
                          }}
                        />
                        <Typography
                          variant="titleMedium"
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            fontSize: { xs: '16px', sm: '18px' },
                          }}
                        >
                          {order.totalAmount.toFixed(2)} MAD
                        </Typography>
                      </Box>
                    </Box>

                    {/* Order Progression Overlay */}
                    <Box
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: statusConfig.backgroundColor,
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      {/* Icon */}
                      <Box
                        sx={{
                          fontSize: '28px',
                          flexShrink: 0,
                        }}
                      >
                        {statusConfig.icon}
                      </Box>

                      {/* Text Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="titleSmall"
                          sx={{
                            color: statusConfig.color,
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        >
                          {getProgressionOverlay(order.status).title}
                        </Typography>
                        <Typography
                          variant="bodySmall"
                          sx={{
                            color: theme.palette.text.secondary,
                            lineHeight: 1.4,
                          }}
                        >
                          {getProgressionOverlay(order.status).description}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Rejection Reason (if rejected) */}
                    {order.status === 'rejected' && order.rejectionReason && (
                      <Box
                        sx={{
                          mb: 2,
                          p: 2,
                          borderRadius: '12px',
                          backgroundColor: theme.palette.mode === 'dark' ? '#7f1d1d' : '#fef2f2',
                          border: `1px solid ${theme.palette.error.main}30`,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                        }}
                      >
                        {/* Icon */}
                        <Box
                          sx={{
                            fontSize: '24px',
                            flexShrink: 0,
                            mt: 0.5,
                          }}
                        >
                          ⚠️
                        </Box>

                        {/* Text Content */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="titleSmall"
                            sx={{
                              color: theme.palette.error.main,
                              fontWeight: 600,
                              mb: 0.5,
                            }}
                          >
                            Raison du refus
                          </Typography>
                          <Typography
                            variant="bodyMedium"
                            sx={{
                              color: theme.palette.text.primary,
                              lineHeight: 1.5,
                            }}
                          >
                            {order.rejectionReason}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Order Items Preview */}
                    <Box
                      sx={{
                        mb: 2,
                        pb: 2,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleOrderExpansion(order.id)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
                          {order.items.length} article{order.items.length > 1 ? 's' : ''} •{' '}
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} unité
                          {order.items.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 's' : ''}
                        </Typography>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </Box>
                    </Box>

                    {/* Expanded Details */}
                    <Collapse in={isExpanded}>
                      <Box>
                        <Typography variant="titleSmall" sx={{ mb: 2, color: theme.palette.text.primary }}>
                          Détails de la commande
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                          {order.items.map((item, index) => (
                            <M3Card key={index} variant="filled">
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 2 }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="titleSmall" sx={{ color: theme.palette.text.primary }}>
                                      {item.quantity}x {item.name}
                                    </Typography>
                                    {item.notes && (
                                      <Box
                                        sx={{
                                          mt: 1,
                                          p: 1,
                                          borderRadius: 1,
                                          backgroundColor: theme.palette.surface?.containerLow || theme.palette.background.paper,
                                        }}
                                      >
                                        <Typography variant="bodySmall" sx={{ color: theme.palette.text.secondary }}>
                                          💬 {item.notes}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                  <Typography variant="titleSmall" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                                    {(item.price * item.quantity).toFixed(2)} MAD
                                  </Typography>
                                </Box>
                              </CardContent>
                            </M3Card>
                          ))}
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="titleMedium" sx={{ color: theme.palette.text.primary }}>
                            Total
                          </Typography>
                          <Typography
                            variant="titleLarge"
                            sx={{
                              color: theme.palette.primary.main,
                              fontWeight: 600,
                              fontSize: { xs: '20px', sm: '22px' },
                            }}
                          >
                            {order.totalAmount.toFixed(2)} MAD
                          </Typography>
                        </Box>

                        {/* Timeline */}
                        {renderTimeline(order)}

                        {/* Cancel Button for awaiting_approval or pending orders */}
                        {['awaiting_approval', 'pending'].includes(order.status) && (
                          <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Button
                              variant="outlined"
                              color="error"
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                openCancelDialog(order);
                              }}
                              sx={{ minHeight: '44px' }}
                            >
                              Annuler la commande
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </CardContent>
                </M3Card>
              );
            })}
          </Box>
        )}
      </Container>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={closeCancelDialog}
        aria-labelledby="cancel-dialog-title"
      >
        <DialogTitle id="cancel-dialog-title">
          Annuler la commande ?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir annuler la commande #{orderToCancel?.orderNumber} ?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog} color="primary">
            Non, garder
          </Button>
          <Button onClick={handleCancelOrder} color="error" variant="contained" autoFocus>
            Oui, annuler
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
