import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { usePrinter } from '../../hooks/usePrinter';
import SettingsSection from './SettingsSection';
import ToggleSwitch from './ToggleSwitch';
import SelectInput from './SelectInput';
import NumberInput from './NumberInput';

const TicketSettings = ({ disabled = false }) => {
  const { settings, updateTicketSettings } = useSettings();
  const { printTestTicket } = usePrinter();
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (key, value) => {
    try {
      setIsSaving(true);
      await updateTicketSettings({ [key]: value });
    } catch (error) {
      console.error('Error updating ticket settings:', error);
      alert(error.message || 'Erreur lors de la mise à jour des paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormatToggle = async (key, value) => {
    try {
      setIsSaving(true);
      await updateTicketSettings({
        kitchenTicketFormat: {
          ...settings.ticket.kitchenTicketFormat,
          [key]: value
        }
      });
    } catch (error) {
      console.error('Error updating ticket format:', error);
      alert(error.message || 'Erreur lors de la mise à jour du format de ticket');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTVAChange = async (tvaRate) => {
    try {
      setIsSaving(true);
      await updateTicketSettings({ tvaRate });
    } catch (error) {
      console.error('Error updating TVA rate:', error);
      alert(error.message || 'Erreur lors de la mise à jour du taux de TVA');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrderNumberFormatChange = async (format) => {
    try {
      setIsSaving(true);
      await updateTicketSettings({ orderNumberFormat: format });
    } catch (error) {
      console.error('Error updating order number format:', error);
      alert(error.message || 'Erreur lors de la mise à jour du format de numéro');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFooterMessageChange = async (e) => {
    const message = e.target.value;
    try {
      setIsSaving(true);
      await updateTicketSettings({ footerMessage: message });
    } catch (error) {
      console.error('Error updating footer message:', error);
      alert(error.message || 'Erreur lors de la mise à jour du message');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFontSizeChange = async (fontSize) => {
    try {
      setIsSaving(true);
      await updateTicketSettings({
        kitchenTicketFormat: {
          ...settings.ticket.kitchenTicketFormat,
          fontSize
        }
      });
    } catch (error) {
      console.error('Error updating font size:', error);
      alert(error.message || 'Erreur lors de la mise à jour de la taille de police');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrint = async (type) => {
    try {
      await printTestTicket(type);
    } catch (error) {
      console.error('Error printing test ticket:', error);
      alert('Erreur lors de l\'impression de test. Vérifiez que l\'imprimante est connectée.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Printing Options */}
      <SettingsSection
        title="Options d'impression"
        description="Contrôlez quels tickets sont imprimés automatiquement"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        }
      >
        <ToggleSwitch
          label="Ticket de cuisine"
          description="Imprimer les tickets de cuisine pour la préparation des commandes"
          checked={settings.ticket.kitchenTicketEnabled}
          onChange={(value) => handleToggle('kitchenTicketEnabled', value)}
          disabled={disabled || isSaving}
        />
        <ToggleSwitch
          label="Reçu client"
          description="Imprimer les reçus pour les clients"
          checked={settings.ticket.customerReceiptEnabled}
          onChange={(value) => handleToggle('customerReceiptEnabled', value)}
          disabled={disabled || isSaving}
        />
        <ToggleSwitch
          label="Impression automatique"
          description="Imprimer automatiquement lors de la création d'une commande"
          checked={settings.ticket.autoPrintOnOrder}
          onChange={(value) => handleToggle('autoPrintOnOrder', value)}
          disabled={disabled || isSaving}
        />
      </SettingsSection>

      {/* Kitchen Ticket Format */}
      {settings.ticket.kitchenTicketEnabled && (
        <SettingsSection
          title="Format du ticket de cuisine"
          description="Personnalisez les informations affichées sur les tickets de cuisine"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          <ToggleSwitch
            label="Afficher le numéro de commande"
            description="Afficher l'ID de commande sur le ticket de cuisine"
            checked={settings.ticket.kitchenTicketFormat.showOrderNumber}
            onChange={(value) => handleFormatToggle('showOrderNumber', value)}
            disabled={disabled || isSaving}
          />
          <ToggleSwitch
            label="Afficher la date et l'heure"
            description="Afficher l'horodatage de la commande"
            checked={settings.ticket.kitchenTicketFormat.showDateTime}
            onChange={(value) => handleFormatToggle('showDateTime', value)}
            disabled={disabled || isSaving}
          />
          <ToggleSwitch
            label="Afficher les notes"
            description="Afficher les notes et instructions spéciales du client"
            checked={settings.ticket.kitchenTicketFormat.showNotes}
            onChange={(value) => handleFormatToggle('showNotes', value)}
            disabled={disabled || isSaving}
          />
          <SelectInput
            label="Taille de police"
            description="Taille du texte sur le ticket de cuisine"
            value={settings.ticket.kitchenTicketFormat.fontSize}
            onChange={handleFontSizeChange}
            disabled={disabled || isSaving}
            options={[
              { value: 'small', label: 'Petite' },
              { value: 'medium', label: 'Moyenne' },
              { value: 'large', label: 'Grande' }
            ]}
          />
        </SettingsSection>
      )}

      {/* TVA Settings */}
      <SettingsSection
        title="TVA et taxes"
        description="Configuration de la taxe sur la valeur ajoutée"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
      >
        <ToggleSwitch
          label="Afficher la TVA"
          description="Afficher la TVA sur les tickets et reçus"
          checked={settings.ticket.showTVA}
          onChange={(value) => handleToggle('showTVA', value)}
          disabled={disabled || isSaving}
        />
        {settings.ticket.showTVA && (
          <NumberInput
            label="Taux de TVA"
            description="Taux de TVA appliqué (en pourcentage)"
            value={settings.ticket.tvaRate}
            onChange={handleTVAChange}
            min={0}
            max={100}
            step={1}
            suffix="%"
            disabled={disabled || isSaving}
          />
        )}
      </SettingsSection>

      {/* Order Numbering */}
      <SettingsSection
        title="Numérotation des commandes"
        description="Format de numérotation des commandes"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        }
      >
        <SelectInput
          label="Format du numéro de commande"
          description="Choisir le format de numérotation"
          value={settings.ticket.orderNumberFormat}
          onChange={handleOrderNumberFormatChange}
          disabled={disabled || isSaving}
          options={[
            { value: 'sequential', label: 'Séquentiel (1, 2, 3...)' },
            { value: 'date-based', label: 'Basé sur la date (20250108-001)' },
            { value: 'custom', label: 'Personnalisé' }
          ]}
        />
      </SettingsSection>

      {/* Receipt Customization */}
      <SettingsSection
        title="Personnalisation du reçu"
        description="Personnalisez les informations sur les reçus clients"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        }
      >
        <ToggleSwitch
          label="Afficher le nom du caissier"
          description="Afficher le nom du caissier sur les reçus"
          checked={settings.ticket.showCashierName}
          onChange={(value) => handleToggle('showCashierName', value)}
          disabled={disabled || isSaving}
        />
        <div className="py-3">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Message de pied de page
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Message affiché en bas des reçus clients
          </p>
          <input
            type="text"
            value={settings.ticket.footerMessage}
            onChange={handleFooterMessageChange}
            disabled={disabled || isSaving}
            placeholder="Merci de votre visite!"
            className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </SettingsSection>

      {/* Test Print Buttons */}
      <SettingsSection
        title="Test d'impression"
        description="Testez vos paramètres d'impression"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        }
      >
        <div className="py-3 flex space-x-3">
          {settings.ticket.kitchenTicketEnabled && (
            <button
              onClick={() => handleTestPrint('kitchen')}
              disabled={disabled}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Imprimer ticket de cuisine
            </button>
          )}
          {settings.ticket.customerReceiptEnabled && (
            <button
              onClick={() => handleTestPrint('receipt')}
              disabled={disabled}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Imprimer reçu client
            </button>
          )}
        </div>
      </SettingsSection>

      {isSaving && (
        <div className="text-sm text-orange-600 dark:text-orange-500 text-center">
          Enregistrement en cours...
        </div>
      )}
    </div>
  );
};

export default TicketSettings;
