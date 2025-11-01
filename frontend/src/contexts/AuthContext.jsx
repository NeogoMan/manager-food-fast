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

          // Extract user info from token claims
          setFirebaseUser(firebaseUser);
          setUser({
            id: firebaseUser.uid,
            username: idTokenResult.claims.username || null,
            name: idTokenResult.claims.name || 'User',
            role: idTokenResult.claims.role || 'client',
            phone: idTokenResult.claims.phone || null,
            isSuperAdmin: idTokenResult.claims.isSuperAdmin || false,
          });
        } else {
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error processing auth state:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);

      // Call Cloud Function to authenticate
      const authenticateUser = httpsCallable(functions, 'authenticateUser');
      const result = await authenticateUser({ username, password });

      const { token, user: userData } = result.data;

      // Sign in with custom token
      await signInWithCustomToken(auth, token);

      // Update user state with data from Cloud Function
      setUser({
        id: userData.id,
        username: userData.username,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        isSuperAdmin: userData.isSuperAdmin || false,
      });

      return { user: userData };
    } catch (error) {
      console.error('Login error:', error);

      // Extract error message
      let errorMessage = 'Login failed. Please try again.';

      if (error.code === 'functions/not-found') {
        errorMessage = 'Invalid username or password';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = 'Your account is inactive. Please contact an administrator.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
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
