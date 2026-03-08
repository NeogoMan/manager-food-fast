import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as sessionManager from '../utils/sessionManager';
import { formatMAD } from '../utils/currency';

// MUI components
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Dialog,
  DialogContent,
  CircularProgress,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Divider,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// MUI icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import TableBarIcon from '@mui/icons-material/TableBar';
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import NotesIcon from '@mui/icons-material/Notes';
import CelebrationIcon from '@mui/icons-material/Celebration';

// M3 components
import { M3Card, CardContent, M3Chip, M3ThemeToggle } from '../components/M3';

// Custom Stepper Connector
const M3StepConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.divider,
    borderTopWidth: 3,
    borderRadius: 1,
    minHeight: 0,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: theme.palette.primary.main,
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: theme.palette.success.main,
  },
}));

// Custom Step Icon
function M3StepIcon({ active, completed, icon, error }) {
  const theme = useTheme();

  const icons = {
    1: <AccessTimeIcon />,
    2: <RestaurantIcon />,
    3: <LocalDiningIcon />,
    4: <DoneAllIcon />,
  };

  const bgColor = error
    ? theme.palette.error.main
    : completed
      ? theme.palette.success.main
      : active
        ? theme.palette.primary.main
        : theme.palette.surface?.containerHigh || theme.palette.action?.disabledBackground;

  const color = error || completed || active
    ? '#fff'
    : theme.palette.text.disabled;

  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        transition: 'all 0.3s ease',
        ...(active && {
          boxShadow: `0 0 0 4px ${theme.palette.primary.main}30`,
        }),
      }}
    >
      {completed ? <CheckCircleIcon sx={{ fontSize: 20 }} /> : icons[String(icon)] || icons[1]}
    </Box>
  );
}

export default function OrderTracking() {
  const { orderId, secret } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const hasShownThankYou = useRef(false);

  useEffect(() => {
    if (!orderId || !secret) {
      setError('URL de suivi invalide');
      setLoading(false);
      return;
    }

    const orderRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError('Commande introuvable');
          setLoading(false);
          return;
        }

        const orderData = { id: snapshot.id, ...snapshot.data() };

        if (orderData.trackingSecret !== secret) {
          setError('Lien de suivi invalide');
          setLoading(false);
          return;
        }

        if (!orderData.isGuestOrder) {
          setError("Cette commande n'est pas une commande self-service");
          setLoading(false);
          return;
        }

        if (orderData.status === 'completed' && !hasShownThankYou.current) {
          hasShownThankYou.current = true;
          setShowThankYou(true);
        }

        setOrder(orderData);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading order:', err);
        setError('Erreur de chargement de la commande');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId, secret]);

  // Handle thank you countdown and session cleanup
  useEffect(() => {
    if (!showThankYou) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sessionManager.clearSession();
          sessionManager.clearOrderPlaced();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showThankYou, navigate]);

  const getStatusText = (status) => {
    switch (status) {
      case 'awaiting_approval':
        return "En attente d'approbation";
      case 'pending':
        return 'Approuvée';
      case 'preparing':
        return 'En préparation';
      case 'ready':
        return 'Prêt !';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulée';
      case 'rejected':
        return 'Rejetée';
      default:
        return status;
    }
  };

  // Map order status to stepper active step index
  const getActiveStep = (status) => {
    switch (status) {
      case 'awaiting_approval':
        return 0;
      case 'pending':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
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

  const stepLabels = ['Reçue', 'Approuvée', 'En préparation', 'Prête'];

  // ─── Loading State ───
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          gap: 2,
        }}
      >
        <CircularProgress color="primary" size={48} />
        <Typography variant="bodyLarge" sx={{ color: theme.palette.text.secondary }}>
          Chargement...
        </Typography>
      </Box>
    );
  }

  // ─── Error State ───
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          gap: 2,
          p: 3,
        }}
      >
        <CancelIcon sx={{ fontSize: 64, color: theme.palette.error.main }} />
        <Typography variant="headlineSmall" sx={{ color: theme.palette.text.primary }}>
          {error}
        </Typography>
        <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
          Veuillez vérifier votre lien de suivi
        </Typography>
      </Box>
    );
  }

  if (!order) return null;

  const isActive = !['completed', 'cancelled', 'rejected'].includes(order.status);
  const isReady = order.status === 'ready';
  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';
  const activeStep = getActiveStep(order.status);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* AppBar */}
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
              fontSize: { xs: '18px', sm: '22px' },
            }}
          >
            Suivi de commande
          </Typography>
          <M3Chip
            variant="assist"
            label={`#${order.orderNumber || order.id.slice(-6).toUpperCase()}`}
            sx={{ mr: 1 }}
          />
          <M3ThemeToggle />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 2 }}>
        {/* Ready Alert */}
        {isReady && (
          <M3Card
            variant="filled"
            sx={{
              mb: 2,
              backgroundColor: theme.palette.success.main,
              color: '#fff',
              textAlign: 'center',
              p: 3,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.85 },
              },
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 56, mb: 1 }} />
            <Typography variant="headlineSmall" sx={{ color: '#fff', mb: 0.5 }}>
              Votre commande est prête !
            </Typography>
            {order.tableNumber && (
              <Typography variant="bodyLarge" sx={{ color: '#fff' }}>
                Table {order.tableNumber}
              </Typography>
            )}
            {order.orderType === 'takeout' && (
              <Typography variant="bodyLarge" sx={{ color: '#fff' }}>
                Veuillez récupérer votre commande au comptoir
              </Typography>
            )}
          </M3Card>
        )}

        {/* Status Progress Stepper */}
        {isActive && !isCancelled && (
          <M3Card variant="elevated" sx={{ mb: 2, p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="titleMedium"
              sx={{ color: theme.palette.text.primary, mb: 2, textAlign: 'center' }}
            >
              {getStatusText(order.status)}
            </Typography>
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              connector={<M3StepConnector />}
            >
              {stepLabels.map((label, index) => (
                <Step key={label} completed={activeStep > index}>
                  <StepLabel
                    StepIconComponent={(props) => (
                      <M3StepIcon {...props} />
                    )}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '12px',
                        mt: 0.5,
                        color:
                          activeStep >= index
                            ? theme.palette.text.primary
                            : theme.palette.text.disabled,
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </M3Card>
        )}

        {/* Rejection/Cancellation Notice */}
        {isCancelled && (
          <Alert
            severity="error"
            icon={<CancelIcon />}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            <Typography variant="titleSmall" sx={{ mb: 0.5 }}>
              {order.status === 'rejected' ? 'Commande rejetée' : 'Commande annulée'}
            </Typography>
            {order.rejectionReason && (
              <Typography variant="bodySmall">{order.rejectionReason}</Typography>
            )}
          </Alert>
        )}

        {/* Guest Info */}
        <M3Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography
              variant="titleSmall"
              sx={{ color: theme.palette.text.secondary, mb: 1.5 }}
            >
              Informations client
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <PersonIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
              <Typography variant="bodyMedium">{order.guestName}</Typography>
            </Box>

            {order.guestPhone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <PhoneIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                <Typography variant="bodyMedium">{order.guestPhone}</Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              {getOrderTypeIcon(order.orderType)}
              <Typography variant="bodyMedium">{getOrderTypeLabel(order.orderType)}</Typography>
            </Box>

            {order.tableNumber && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TableBarIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                <Typography variant="bodyMedium">Table {order.tableNumber}</Typography>
              </Box>
            )}
          </CardContent>
        </M3Card>

        {/* Order Notes */}
        {order.notes && (
          <M3Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <NotesIcon sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                <Typography variant="titleSmall" sx={{ color: theme.palette.text.secondary }}>
                  Instructions
                </Typography>
              </Box>
              <Typography
                variant="bodyMedium"
                sx={{
                  color: theme.palette.text.primary,
                  fontStyle: 'italic',
                  pl: 3.5,
                }}
              >
                {order.notes}
              </Typography>
            </CardContent>
          </M3Card>
        )}

        {/* Order Items */}
        <M3Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography
              variant="titleSmall"
              sx={{ color: theme.palette.text.secondary, mb: 1.5 }}
            >
              Articles commandés
            </Typography>

            {order.items.map((item, index) => (
              <Box key={index}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.75,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                    <M3Chip
                      variant="assist"
                      label={`x${item.quantity}`}
                      sx={{
                        minWidth: 'auto',
                        height: 28,
                        '& .MuiChip-label': { px: 1, fontSize: '12px' },
                      }}
                    />
                    <Typography variant="bodyMedium" sx={{ color: theme.palette.text.primary }}>
                      {item.name}
                    </Typography>
                  </Box>
                  <Typography
                    variant="bodyMedium"
                    sx={{ color: theme.palette.primary.main, fontWeight: 500, ml: 1 }}
                  >
                    {formatMAD(item.subtotal)}
                  </Typography>
                </Box>
                {index < order.items.length - 1 && <Divider />}
              </Box>
            ))}

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="titleMedium" sx={{ fontWeight: 600 }}>
                Total
              </Typography>
              <Typography
                variant="titleMedium"
                sx={{ fontWeight: 600, color: theme.palette.primary.main }}
              >
                {formatMAD(order.totalAmount)}
              </Typography>
            </Box>
          </CardContent>
        </M3Card>

        {/* Order Date */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="bodySmall" sx={{ color: theme.palette.text.secondary }}>
            Commandé le{' '}
            {order.createdAt?.seconds
              ? new Date(order.createdAt.seconds * 1000).toLocaleString('fr-FR')
              : ''}
          </Typography>
        </Box>

        {/* Auto-refresh Notice */}
        {isActive && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="bodySmall" sx={{ color: theme.palette.text.disabled }}>
              Cette page se met à jour automatiquement
            </Typography>
          </Box>
        )}
      </Container>

      {/* Thank You Dialog */}
      <Dialog
        open={showThankYou}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            textAlign: 'center',
            p: { xs: 3, sm: 4 },
            m: 2,
          },
        }}
      >
        <DialogContent>
          <CelebrationIcon
            sx={{
              fontSize: 80,
              color: theme.palette.success.main,
              mb: 2,
              animation: 'bounce 1s ease-in-out infinite',
              '@keyframes bounce': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-10px)' },
              },
            }}
          />

          {countdown > 0 ? (
            <>
              <Typography
                variant="headlineMedium"
                sx={{ color: theme.palette.success.main, mb: 1.5 }}
              >
                Merci pour votre visite !
              </Typography>
              <Typography variant="bodyLarge" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                Votre commande est terminée. Nous espérons vous revoir bientôt !
              </Typography>

              <M3Card variant="filled" sx={{ p: 2, mb: 3 }}>
                <Typography variant="bodyMedium" sx={{ mb: 0.5 }}>
                  Commande: #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                </Typography>
                <Typography variant="titleMedium" sx={{ color: theme.palette.primary.main }}>
                  Total: {formatMAD(order.totalAmount)}
                </Typography>
              </M3Card>

              <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
                Session se terminera dans{' '}
                <Typography
                  component="span"
                  sx={{ color: theme.palette.success.main, fontWeight: 600, fontSize: '18px' }}
                >
                  {countdown}
                </Typography>{' '}
                seconde{countdown > 1 ? 's' : ''}...
              </Typography>
            </>
          ) : (
            <>
              <Typography
                variant="headlineMedium"
                sx={{ color: theme.palette.success.main, mb: 1.5 }}
              >
                Merci !
              </Typography>
              <Typography variant="bodyLarge" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                Vous pouvez fermer cette page maintenant.
              </Typography>
              <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
                Ou scanner le code QR à nouveau pour une nouvelle commande.
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
