import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import QRCode from 'qrcode';
import styles from './QRCodeGenerator.module.css';

export default function QRCodeGenerator() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrType, setQrType] = useState('general'); // 'general' or 'table'
  const [tableNumber, setTableNumber] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const canvasRef = useRef(null);

  // Get restaurant info from JWT
  useEffect(() => {
    loadRestaurantInfo();
  }, [user]);

  const loadRestaurantInfo = async () => {
    try {
      if (!user) return;

      const { auth, db } = await import('../config/firebase');
      const { doc, getDoc } = await import('firebase/firestore');

      const idTokenResult = await auth.currentUser.getIdTokenResult();
      const restaurantId = idTokenResult.claims.restaurantId;

      if (!restaurantId) {
        throw new Error('No restaurant associated with user');
      }

      // Load restaurant to get shortCode
      const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
      if (restaurantDoc.exists()) {
        setRestaurant({ id: restaurantDoc.id, ...restaurantDoc.data() });
      }
    } catch (error) {
      console.error('Error loading restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!restaurant || !restaurant.shortCode) {
      alert('Restaurant shortCode not found');
      return;
    }

    if (qrType === 'table' && !tableNumber.trim()) {
      alert('Please enter a table number');
      return;
    }

    try {
      // Build the guest URL
      const baseUrl = window.location.origin;
      let guestUrl;

      if (qrType === 'table') {
        guestUrl = `${baseUrl}/guest/${restaurant.shortCode}/table/${tableNumber.trim()}`;
      } else {
        guestUrl = `${baseUrl}/guest/${restaurant.shortCode}`;
      }

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(guestUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrDataUrl);
      setGeneratedUrl(guestUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = qrType === 'table'
      ? `qr-${restaurant.shortCode}-table-${tableNumber}.png`
      : `qr-${restaurant.shortCode}-general.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const printQRCode = () => {
    if (!qrCodeUrl) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${restaurant.name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              border: 2px solid #333;
              padding: 30px;
              border-radius: 10px;
            }
            h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            h2 {
              margin: 0 0 20px 0;
              font-size: 18px;
              color: #666;
            }
            img {
              max-width: 400px;
              margin: 20px 0;
            }
            p {
              margin: 10px 0;
              font-size: 14px;
              color: #333;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${restaurant.name}</h1>
            <h2>${qrType === 'table' ? `Table ${tableNumber}` : 'Commande Self-Service'}</h2>
            <img src="${qrCodeUrl}" alt="QR Code">
            <p><strong>Scannez pour commander</strong></p>
            ${qrType === 'table' ? `<p>Table ${tableNumber}</p>` : '<p>Commande générale</p>'}
            <div class="footer">
              <p>${generatedUrl}</p>
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className={styles.error}>
        <h2>❌ Erreur</h2>
        <p>Restaurant introuvable</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🔗 Générateur de QR Code</h1>
        <p className={styles.subtitle}>
          Créez des codes QR pour le service self-service
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.formSection}>
          <h2>Configuration du QR Code</h2>

          <div className={styles.formGroup}>
            <label>Type de QR Code</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="general"
                  checked={qrType === 'general'}
                  onChange={(e) => setQrType(e.target.value)}
                />
                <span>Général (tous les clients)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="table"
                  checked={qrType === 'table'}
                  onChange={(e) => setQrType(e.target.value)}
                />
                <span>Table spécifique</span>
              </label>
            </div>
          </div>

          {qrType === 'table' && (
            <div className={styles.formGroup}>
              <label>Numéro de table *</label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ex: 5"
                className={styles.input}
              />
            </div>
          )}

          <button
            onClick={generateQRCode}
            className={styles.primaryButton}
          >
            Générer le QR Code
          </button>
        </div>

        {qrCodeUrl && (
          <div className={styles.qrSection}>
            <h2>QR Code généré</h2>
            <div className={styles.qrPreview}>
              <img src={qrCodeUrl} alt="QR Code" />
            </div>

            <div className={styles.urlDisplay}>
              <p className={styles.label}>URL:</p>
              <code className={styles.url}>{generatedUrl}</code>
            </div>

            <div className={styles.actions}>
              <button
                onClick={downloadQRCode}
                className={styles.secondaryButton}
              >
                📥 Télécharger
              </button>
              <button
                onClick={printQRCode}
                className={styles.secondaryButton}
              >
                🖨️ Imprimer
              </button>
            </div>

            <div className={styles.infoBox}>
              <h3>ℹ️ Informations</h3>
              <ul>
                <li>Les clients peuvent scanner ce code pour accéder au menu</li>
                <li>Les sessions expirent après 3 heures</li>
                <li>Une seule commande par session</li>
                <li>Les commandes doivent être approuvées par le personnel</li>
                <li>Contrôlé par le toggle "Accepter les commandes"</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className={styles.restaurantInfo}>
        <h3>Restaurant: {restaurant.name}</h3>
        <p>Code: <strong>{restaurant.shortCode}</strong></p>
        <p>
          Statut des commandes:{' '}
          <span className={restaurant.acceptingOrders ? styles.statusOpen : styles.statusClosed}>
            {restaurant.acceptingOrders ? '🟢 Ouvert' : '🔴 Fermé'}
          </span>
        </p>
      </div>
    </div>
  );
}
