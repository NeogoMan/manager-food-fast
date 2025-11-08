import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import SettingsSection from './SettingsSection';
import ToggleSwitch from './ToggleSwitch';
import NumberInput from './NumberInput';

const NotificationSettings = ({ disabled = false }) => {
  const { settings, updateNotificationSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (key, value) => {
    try {
      setIsSaving(true);
      await updateNotificationSettings({ [key]: value });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      alert('Erreur lors de la mise à jour des paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVolumeChange = async (volume) => {
    try {
      setIsSaving(true);
      await updateNotificationSettings({ soundVolume: volume });
    } catch (error) {
      console.error('Error updating volume:', error);
      alert('Erreur lors de la mise à jour du volume');
    } finally {
      setIsSaving(false);
    }
  };

  const playTestSound = () => {
    // Play a test notification sound
    const audio = new Audio('/notification.mp3');
    audio.volume = settings.notifications.soundVolume / 100;
    audio.play().catch(err => {
      console.error('Error playing test sound:', err);
      alert('Impossible de lire le son de test');
    });
  };

  return (
    <div className="space-y-6">
      {/* Sound Settings */}
      <SettingsSection
        title="Paramètres sonores"
        description="Configuration des notifications sonores pour les nouvelles commandes"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        }
      >
        <ToggleSwitch
          label="Activer les sons"
          description="Jouer un son lors de la réception de nouvelles commandes"
          checked={settings.notifications.soundEnabled}
          onChange={(value) => handleToggle('soundEnabled', value)}
          disabled={disabled || isSaving}
        />
        {settings.notifications.soundEnabled && (
          <>
            <NumberInput
              label="Volume"
              description="Volume des notifications sonores"
              value={settings.notifications.soundVolume}
              onChange={handleVolumeChange}
              min={0}
              max={100}
              step={5}
              suffix="%"
              disabled={disabled || isSaving}
            />
            <div className="py-3">
              <button
                onClick={playTestSound}
                disabled={disabled}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span>Tester le son</span>
              </button>
            </div>
          </>
        )}
      </SettingsSection>

      {isSaving && (
        <div className="text-sm text-orange-600 dark:text-orange-500 text-center">
          Enregistrement en cours...
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
