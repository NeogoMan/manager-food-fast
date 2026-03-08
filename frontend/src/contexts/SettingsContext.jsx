import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Default settings structure
const defaultSettings = {
  ticket: {
    showPrinterButtons: true,
    showTVA: true,
    tvaRate: 20,
    showCashierName: true,
    footerMessage: 'Merci de votre visite!',
    showLogo: false,
    logoUrl: '',
    logoWidth: 200,
    kitchenTicketFormat: {
      showOrderNumber: true,
      showDateTime: true,
      showNotes: true,
      fontSize: 'medium'
    }
  },
  printer: {},
  kitchenDisplay: {},
  notifications: {}
};

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get restaurant ID from user
  const restaurantId = user?.restaurantId;

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    if (!user?.id) {
      // Wait for user to be fully loaded
      setLoading(true);
      return;
    }

    // Reference to settings document
    const settingsRef = doc(db, 'restaurants', restaurantId, 'settings', 'config');

    // Real-time subscription to settings
    const unsubscribe = onSnapshot(
      settingsRef,
      async (snapshot) => {
        try {
          if (snapshot.exists()) {
            // Merge with default settings to handle missing fields
            const data = snapshot.data();
            setSettings({
              ...defaultSettings,
              ...data,
              ticket: { ...defaultSettings.ticket, ...(data.ticket || {}) },
              printer: { ...defaultSettings.printer, ...(data.printer || {}) },
              kitchenDisplay: { ...defaultSettings.kitchenDisplay, ...(data.kitchenDisplay || {}) },
              notifications: { ...defaultSettings.notifications, ...(data.notifications || {}) }
            });
          } else {
            // Create default settings if they don't exist
            console.log('Creating default settings for restaurant:', restaurantId);
            await setDoc(settingsRef, {
              ...defaultSettings,
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: user.id
            });
            setSettings(defaultSettings);
          }
          setLoading(false);
        } catch (err) {
          console.error('Error fetching settings:', err);
          setError(err.message);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error subscribing to settings:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [restaurantId, user?.id]);

  // Fetch restaurant document
  useEffect(() => {
    if (!restaurantId) {
      setRestaurant(null);
      return;
    }

    // Reference to restaurant document
    const restaurantRef = doc(db, 'restaurants', restaurantId);

    // Real-time subscription to restaurant document
    const unsubscribe = onSnapshot(
      restaurantRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setRestaurant({
            id: snapshot.id,
            name: data.name || 'Restaurant',
            address: data.address || '',
            phone: data.phone || '',
            taxRate: data.taxRate || 0.20
          });
        } else {
          console.warn('Restaurant document not found:', restaurantId);
          setRestaurant(null);
        }
      },
      (err) => {
        console.error('Error fetching restaurant data:', err);
        setRestaurant(null);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [restaurantId]);

  // Update settings function
  const updateSettings = async (updates) => {
    if (!restaurantId) {
      console.error('Cannot update settings: No restaurant ID available');
      throw new Error('No restaurant ID available. Please ensure you are logged in.');
    }

    if (!user?.id) {
      console.error('Cannot update settings: No user ID available');
      throw new Error('No user ID available. Please ensure you are logged in.');
    }

    try {
      const settingsRef = doc(db, 'restaurants', restaurantId, 'settings', 'config');

      await setDoc(
        settingsRef,
        {
          ...updates,
          updatedAt: new Date(),
          updatedBy: user.id
        },
        { merge: true }
      );

      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      throw err;
    }
  };

  // Update specific setting section
  const updateTicketSettings = async (ticketUpdates) => {
    return updateSettings({ ticket: { ...settings.ticket, ...ticketUpdates } });
  };

  const value = {
    settings,
    restaurant,
    loading,
    error,
    updateSettings,
    updateTicketSettings,
    defaultSettings
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
