import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import SettingsSection from './SettingsSection';
import ToggleSwitch from './ToggleSwitch';
import SelectInput from './SelectInput';

const KitchenDisplaySettings = ({ disabled = false }) => {
  const { settings, updateKitchenDisplaySettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (key, value) => {
    try {
      setIsSaving(true);
      await updateKitchenDisplaySettings({ [key]: value });
    } catch (error) {
      console.error('Error updating kitchen display settings:', error);
      alert('Erreur lors de la mise à jour des paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFontSizeChange = async (fontSize) => {
    try {
      setIsSaving(true);
      await updateKitchenDisplaySettings({ fontSize });
    } catch (error) {
      console.error('Error updating font size:', error);
      alert('Erreur lors de la mise à jour de la taille de police');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Display Options */}
      <SettingsSection
        title="Options d'affichage"
        description="Personnalisez l'affichage de l'écran de cuisine"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
      >
        <SelectInput
          label="Taille de police"
          description="Taille du texte sur l'écran de cuisine"
          value={settings.kitchenDisplay.fontSize}
          onChange={handleFontSizeChange}
          disabled={disabled || isSaving}
          options={[
            { value: 'small', label: 'Petite' },
            { value: 'medium', label: 'Moyenne' },
            { value: 'large', label: 'Grande' },
            { value: 'x-large', label: 'Très grande' }
          ]}
        />
        <ToggleSwitch
          label="Afficher les notes client"
          description="Afficher les notes et instructions spéciales des clients"
          checked={settings.kitchenDisplay.showCustomerNotes}
          onChange={(value) => handleToggle('showCustomerNotes', value)}
          disabled={disabled || isSaving}
        />
      </SettingsSection>

      {/* Organization */}
      <SettingsSection
        title="Organisation"
        description="Options d'organisation des commandes"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        }
      >
        <ToggleSwitch
          label="Grouper par catégorie"
          description="Grouper les articles par catégorie (entrées, plats, desserts, etc.)"
          checked={settings.kitchenDisplay.groupByCategory}
          onChange={(value) => handleToggle('groupByCategory', value)}
          disabled={disabled || isSaving}
        />
        <ToggleSwitch
          label="Mettre en évidence les commandes urgentes"
          description="Mettre en surbrillance les commandes qui dépassent le temps de préparation"
          checked={settings.kitchenDisplay.highlightUrgent}
          onChange={(value) => handleToggle('highlightUrgent', value)}
          disabled={disabled || isSaving}
        />
      </SettingsSection>

      {isSaving && (
        <div className="text-sm text-orange-600 dark:text-orange-500 text-center">
          Enregistrement en cours...
        </div>
      )}
    </div>
  );
};

export default KitchenDisplaySettings;
