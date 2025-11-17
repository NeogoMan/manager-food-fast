import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserPreferencesContext = createContext(null);

// Default preferences
const DEFAULT_PREFERENCES = {
  printer: {
    autoPrintKitchenOnApproval: true,
    kitchenTicketEnabled: true,
  },
};

export function UserPreferencesProvider({ children }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences from localStorage when user changes
  useEffect(() => {
    if (user?.id) {
      loadPreferences(user.id);
    } else {
      // No user, use defaults
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
    }
  }, [user?.id]);

  // Load preferences from localStorage
  const loadPreferences = (userId) => {
    try {
      const storageKey = `user_preferences_${userId}`;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all keys exist
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsed,
          printer: {
            ...DEFAULT_PREFERENCES.printer,
            ...parsed.printer,
          },
        });
      } else {
        // No saved preferences, use defaults
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  };

  // Save preferences to localStorage
  const savePreferences = (newPreferences) => {
    if (!user?.id) {
      console.warn('Cannot save preferences: No user logged in');
      return;
    }

    try {
      const storageKey = `user_preferences_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  };

  // Update printer preferences
  const updatePrinterPreferences = (printerPrefs) => {
    const newPreferences = {
      ...preferences,
      printer: {
        ...preferences.printer,
        ...printerPrefs,
      },
    };
    savePreferences(newPreferences);
  };

  // Get printer preferences
  const getPrinterPreferences = () => {
    return preferences.printer;
  };

  const value = {
    preferences,
    loading,
    updatePrinterPreferences,
    getPrinterPreferences,
    savePreferences,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return context;
}
