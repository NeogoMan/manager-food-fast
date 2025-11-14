import { createContext, useContext, useState, useEffect } from 'react';
import { auth, functions } from '../config/firebase';
import { signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get ID token result to access custom claims
          const idTokenResult = await firebaseUser.getIdTokenResult();

          // Debug: Log token claims to verify restaurantIds
          console.log('🔐 Token Claims:', {
            restaurantId: idTokenResult.claims.restaurantId,
            restaurantIds: idTokenResult.claims.restaurantIds,
            role: idTokenResult.claims.role,
            isSuperAdmin: idTokenResult.claims.isSuperAdmin
          });

          // Extract user info from token claims
          setFirebaseUser(firebaseUser);
          setUser({
            id: firebaseUser.uid,
            username: idTokenResult.claims.username || null,
            name: idTokenResult.claims.name || 'User',
            role: idTokenResult.claims.role || 'client',
            phone: idTokenResult.claims.phone || null,
            restaurantId: idTokenResult.claims.restaurantId || null,
            isSuperAdmin: idTokenResult.claims.isSuperAdmin || false,
          });
        } else {
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Login for super admins - calls authenticateSuperAdmin Cloud Function
  const loginSuperAdmin = async (username, password) => {
    setLoading(true);
    setError('');

    try {
      const authenticateSuperAdmin = httpsCallable(functions, 'authenticateSuperAdmin');
      const result = await authenticateSuperAdmin({ username, password });

      const { token, user: userData } = result.data;

      // Sign in to Firebase with custom token
      await signInWithCustomToken(auth, token);

      // Force token refresh to ensure claims are up-to-date
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
        console.log('✅ Token refreshed after super admin login');
      }

      // User state will be set by onAuthStateChanged listener
      setUser({
        id: userData.id,
        username: userData.username,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        restaurantId: null,
        isSuperAdmin: true,
      });

      return { user: userData };
    } catch (error) {
      // Extract error message
      let errorMessage = 'Super admin login failed. Please try again.';

      if (error.code === 'functions/not-found') {
        errorMessage = 'Invalid super admin credentials';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = 'Account is inactive. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Login for restaurant users - calls authenticateUser Cloud Function
  const loginRestaurant = async (username, password) => {
    setLoading(true);
    setError('');

    try {
      const authenticateUser = httpsCallable(functions, 'authenticateUser');
      const result = await authenticateUser({ username, password });

      const { token, user: userData } = result.data;

      // Sign in to Firebase with custom token
      await signInWithCustomToken(auth, token);

      // Force token refresh to ensure claims are up-to-date
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
        console.log('✅ Token refreshed after restaurant login');
      }

      // User state will be set by onAuthStateChanged listener
      setUser({
        id: userData.id,
        username: userData.username,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        restaurantId: userData.restaurantId,
        isSuperAdmin: false,
      });

      return { user: userData };
    } catch (error) {
      // Extract error message
      let errorMessage = 'Login failed. Please try again.';

      if (error.code === 'functions/not-found') {
        errorMessage = 'Invalid username or password';
      } else if (error.code === 'functions/permission-denied') {
        // Check if it's the "use platform admin login" error
        if (error.message && error.message.includes('platform admin')) {
          errorMessage = 'Veuillez utiliser la connexion administrateur plateforme';
        } else {
          errorMessage = 'Your account is inactive. Please contact an administrator.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Generic login (for backward compatibility) - defaults to restaurant login
  const login = async (username, password) => {
    return loginRestaurant(username, password);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      throw error;
    }
  };

  const checkAuth = async () => {
    // Firebase automatically handles auth persistence
    // This is just for compatibility with existing code
    return !!firebaseUser;
  };

  const updateUser = (updatedUser) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUser }));
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAuthenticated = () => {
    return !!user && !!firebaseUser;
  };

  // Get fresh ID token for API calls (if needed)
  const getIdToken = async () => {
    if (!firebaseUser) return null;
    return await firebaseUser.getIdToken();
  };

  const value = {
    user,
    loading,
    error,
    login,
    loginSuperAdmin,
    loginRestaurant,
    logout,
    updateUser,
    hasRole,
    isAuthenticated,
    checkAuth,
    getIdToken,
    firebaseUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
