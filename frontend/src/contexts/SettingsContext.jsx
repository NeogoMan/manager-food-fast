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
    kitchenTicketEnabled: true,
    customerReceiptEnabled: true,
    autoPrintOnOrder: false,
    showTVA: true,
    tvaRate: 20,
    showCashierName: true,
    footerMessage: 'Merci de votre visite!',
    kitchenTicketFormat: {
      showOrderNumber: true,
      showDateTime: true,
      showNotes: true,
      fontSize: 'medium'
    },
    orderNumberFormat: 'sequential'
  },
  printer: {
    vendorId: '0x0000',
    productId: '0x0000',
    paperWidth: 48,
    encoding: 'GB18030',
    autoCut: true
  },
  kitchenDisplay: {
    fontSize: 'large',
    showCustomerNotes: true,
    groupByCategory: false,
    highlightUrgent: true
  },
  notifications: {
    soundEnabled: true,
    soundVolume: 80
  }
};

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get restaurant ID from user
  const restaurantId = user?.restaurantId;

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
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
              ticket: { ...defaultSettings.ticket, ...data.ticket },
              printer: { ...defaultSettings.printer, ...data.printer },
              kitchenDisplay: { ...defaultSettings.kitchenDisplay, ...data.kitchenDisplay },
              notifications: { ...defaultSettings.notifications, ...data.notifications }
            });
          } else {
            // Create default settings if they don't exist
            await setDoc(settingsRef, {
              ...defaultSettings,
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: user.uid
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
  }, [restaurantId, user?.uid]);

  // Update settings function
  const updateSettings = async (updates) => {
    if (!restaurantId) {
      console.error('Cannot update settings: No restaurant ID available');
      throw new Error('No restaurant ID available. Please ensure you are logged in.');
    }

    if (!user?.uid) {
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
          updatedBy: user.uid
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

  const updatePrinterSettings = async (printerUpdates) => {
    return updateSettings({ printer: { ...settings.printer, ...printerUpdates } });
  };

  const updateKitchenDisplaySettings = async (kitchenDisplayUpdates) => {
    return updateSettings({ kitchenDisplay: { ...settings.kitchenDisplay, ...kitchenDisplayUpdates } });
  };

  const updateNotificationSettings = async (notificationUpdates) => {
    return updateSettings({ notifications: { ...settings.notifications, ...notificationUpdates } });
  };

  const value = {
    settings,
    loading,
    error,
    updateSettings,
    updateTicketSettings,
    updatePrinterSettings,
    updateKitchenDisplaySettings,
    updateNotificationSettings,
    defaultSettings
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
