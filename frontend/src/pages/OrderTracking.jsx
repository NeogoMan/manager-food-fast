import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import styles from './OrderTracking.module.css';

export default function OrderTracking() {
  const { orderId, secret } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId || !secret) {
      setError('URL de suivi invalide');
      setLoading(false);
      return;
    }

    // Real-time listener for order updates
    const orderRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError('Commande introuvable');
          setLoading(false);
          return;
        }

        const orderData = { id: snapshot.id, ...snapshot.data() };

        // Validate tracking secret
        if (orderData.trackingSecret !== secret) {
          setError('Lien de suivi invalide');
          setLoading(false);
          return;
        }

        // Validate it's a guest order
        if (!orderData.isGuestOrder) {
          setError('Cette commande n\'est pas une commande self-service');
          setLoading(false);
          return;
        }

        setOrder(orderData);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading order:', err);
        setError('Erreur de chargement de la commande');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId, secret]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'awaiting_approval':
        return '⏳';
      case 'pending':
        return '📝';
      case 'preparing':
        return '👨‍🍳';
      case 'ready':
        return '✅';
      case 'completed':
        return '🎉';
      case 'cancelled':
        return '❌';
      case 'rejected':
        return '🚫';
      default:
        return '📦';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'awaiting_approval':
        return 'En attente d\'approbation';
      case 'pending':
        return 'Approuvée';
      case 'preparing':
        return 'En préparation';
      case 'ready':
        return 'Prêt !';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulée';
      case 'rejected':
        return 'Rejetée';
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'ready':
        return styles.statusReady;
      case 'completed':
        return styles.statusCompleted;
      case 'cancelled':
      case 'rejected':
        return styles.statusCancelled;
      case 'preparing':
        return styles.statusPreparing;
      default:
        return styles.statusPending;
    }
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'awaiting_approval':
        return 10;
      case 'pending':
        return 25;
      case 'preparing':
        return 60;
      case 'ready':
        return 90;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>❌ {error}</h2>
          <p>Veuillez vérifier votre lien de suivi</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const isActive = !['completed', 'cancelled', 'rejected'].includes(order.status);
  const isReady = order.status === 'ready';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1>🔍 Suivi de commande</h1>
          <p className={styles.orderId}>#{order.orderNumber || order.id.slice(-6).toUpperCase()}</p>
        </div>

        {/* Ready Alert */}
        {isReady && (
          <div className={styles.readyAlert}>
            <div className={styles.readyIcon}>✅</div>
            <h2>Votre commande est prête !</h2>
            {order.tableNumber && (
              <p>Table {order.tableNumber}</p>
            )}
            {order.orderType === 'takeout' && (
              <p>Veuillez récupérer votre commande au comptoir</p>
            )}
          </div>
        )}

        {/* Status Progress */}
        {isActive && (
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${getProgressPercentage(order.status)}%` }}
              ></div>
            </div>
            <div className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
              {getStatusIcon(order.status)} {getStatusText(order.status)}
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {order.status === 'rejected' && order.rejectionReason && (
          <div className={styles.rejectionBox}>
            <h3>❌ Commande rejetée</h3>
            <p>{order.rejectionReason}</p>
          </div>
        )}

        {/* Guest Info */}
        <div className={styles.section}>
          <h3>👤 Informations client</h3>
          <p><strong>Nom:</strong> {order.guestName}</p>
          {order.guestPhone && <p><strong>Téléphone:</strong> {order.guestPhone}</p>}
          <p><strong>Type:</strong> {
            order.orderType === 'dine-in' ? '🍽️ Sur place' :
            order.orderType === 'takeout' ? '📦 À emporter' :
            '🚶 Enlèvement'
          }</p>
          {order.tableNumber && <p><strong>Table:</strong> {order.tableNumber}</p>}
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div className={styles.section}>
            <h3>📝 Instructions</h3>
            <p className={styles.notesText}>{order.notes}</p>
          </div>
        )}

        {/* Order Items */}
        <div className={styles.section}>
          <h3>📋 Articles commandés</h3>
          <div className={styles.items}>
            {order.items.map((item, index) => (
              <div key={index} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemQuantity}>x{item.quantity}</span>
                </div>
                <span className={styles.itemPrice}>{item.subtotal.toFixed(2)} DH</span>
              </div>
            ))}
          </div>
          <div className={styles.total}>
            <strong>Total:</strong>
            <strong>{order.totalAmount.toFixed(2)} DH</strong>
          </div>
        </div>

        {/* Order Date */}
        <div className={styles.footer}>
          <p className={styles.date}>
            Commandé le {new Date(order.createdAt.seconds * 1000).toLocaleString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Refresh Notice */}
      {isActive && (
        <p className={styles.notice}>
          ℹ️ Cette page se met à jour automatiquement
        </p>
      )}
    </div>
  );
}
