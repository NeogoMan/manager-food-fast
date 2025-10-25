import { useState } from 'react';
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
  useTheme,
  Divider,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../contexts/AuthContext';
import { M3Card, CardContent, M3Chip, M3ThemeToggle } from '../components/M3';
import { client, auth } from '../utils/translations';
import Toast from '../components/Toast';

export default function ClientProfile() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useAuth();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleCloseToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      showToast(auth.logoutSuccess, 'success');
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (error) {
      showToast('Erreur lors de la déconnexion', 'error');
    } finally {
      setShowLogoutDialog(false);
    }
  };

  return (
    <Box sx={{ pb: '96px' }}> {/* Padding bottom for bottom nav space */}
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
            {client.myProfile}
          </Typography>
          <M3ThemeToggle />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3, mb: 2 }}>
        {/* Profile Header */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 3,
            px: { xs: 1, sm: 0 },
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.main,
              mb: 2,
            }}
          >
            <AccountCircleIcon sx={{ fontSize: '48px', color: 'white' }} />
          </Box>
          <Typography
            variant="headlineSmall"
            sx={{ mb: 0.5, color: theme.palette.text.primary }}
          >
            {user?.name || 'Utilisateur'}
          </Typography>
          <M3Chip
            label={user?.role === 'client' ? 'Client' : user?.role}
            variant="assist"
            size="small"
            sx={{
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.08)',
            }}
          />
        </Box>

        {/* User Information Card */}
        <M3Card variant="elevated" sx={{ mb: 3, mx: { xs: 1, sm: 0 } }}>
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="titleMedium"
              sx={{ mb: 2, color: theme.palette.text.primary }}
            >
              Informations du profil
            </Typography>

            {/* Username */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                  mr: 2,
                }}
              >
                <PersonIcon sx={{ fontSize: '20px', color: theme.palette.text.secondary }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="bodySmall"
                  sx={{ color: theme.palette.text.secondary, mb: 0.5 }}
                >
                  Nom d'utilisateur
                </Typography>
                <Typography variant="bodyLarge" sx={{ color: theme.palette.text.primary }}>
                  {user?.username || 'Non disponible'}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Full Name */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                  mr: 2,
                }}
              >
                <BadgeIcon sx={{ fontSize: '20px', color: theme.palette.text.secondary }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="bodySmall"
                  sx={{ color: theme.palette.text.secondary, mb: 0.5 }}
                >
                  Nom complet
                </Typography>
                <Typography variant="bodyLarge" sx={{ color: theme.palette.text.primary }}>
                  {user?.name || 'Non disponible'}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Phone Number */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                  mr: 2,
                }}
              >
                <PhoneIcon sx={{ fontSize: '20px', color: theme.palette.text.secondary }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="bodySmall"
                  sx={{ color: theme.palette.text.secondary, mb: 0.5 }}
                >
                  Téléphone
                </Typography>
                <Typography variant="bodyLarge" sx={{ color: theme.palette.text.primary }}>
                  {user?.phone || 'Non disponible'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </M3Card>

        {/* Logout Section */}
        <M3Card variant="filled" sx={{ mx: { xs: 1, sm: 0 } }}>
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="titleMedium"
              sx={{ mb: 1, color: theme.palette.text.primary }}
            >
              Session
            </Typography>
            <Typography
              variant="bodyMedium"
              sx={{ mb: 3, color: theme.palette.text.secondary }}
            >
              Déconnectez-vous de votre compte en toute sécurité
            </Typography>
            <Button
              variant="contained"
              color="error"
              fullWidth
              startIcon={<LogoutIcon />}
              onClick={handleLogoutClick}
              sx={{
                minHeight: '48px',
                textTransform: 'none',
                fontSize: '16px',
              }}
            >
              {auth.logout}
            </Button>
          </CardContent>
        </M3Card>
      </Container>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        maxWidth="xs"
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
            Confirmer la déconnexion
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 3 }}>
          <Typography variant="bodyMedium" sx={{ color: theme.palette.text.secondary }}>
            Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setShowLogoutDialog(false)}
            variant="outlined"
            sx={{ minHeight: '40px', textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            sx={{ minHeight: '40px', textTransform: 'none' }}
          >
            {auth.logout}
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
