/**
 * Client-Only Session Manager for Guest Self-Service
 * No Firebase Authentication - Simple localStorage-based sessions
 */

const SESSION_DURATION = 60 * 60 * 1000; // 60 minutes in milliseconds
const SESSION_KEY = 'guest_session';
const CART_KEY_PREFIX = 'guest_cart_';

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create a new guest session
 */
export function createSession(restaurantCode) {
  const session = {
    sessionId: generateSessionId(),
    restaurantCode: restaurantCode.toUpperCase(),
    startTime: Date.now(),
    guestInfo: null
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  console.log('✅ Guest session created:', session.sessionId);
  return session;
}

/**
 * Get current session
 */
export function getSession() {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) return null;

  try {
    return JSON.parse(sessionData);
  } catch (error) {
    console.error('Failed to parse session:', error);
    return null;
  }
}

/**
 * Check if session is valid (not expired)
 */
export function isSessionValid() {
  const session = getSession();
  if (!session) return false;

  const elapsed = Date.now() - session.startTime;
  return elapsed < SESSION_DURATION;
}

/**
 * Get time remaining in session (milliseconds)
 */
export function getTimeRemaining() {
  const session = getSession();
  if (!session) return 0;

  const elapsed = Date.now() - session.startTime;
  const remaining = SESSION_DURATION - elapsed;
  return Math.max(0, remaining);
}

/**
 * Format time remaining for display
 */
export function getFormattedTimeRemaining() {
  const remaining = getTimeRemaining();
  if (remaining === 0) return '0m';

  const minutes = Math.floor(remaining / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Check if session is expiring soon (less than 5 minutes)
 */
export function isSessionExpiringSoon() {
  const remaining = getTimeRemaining();
  return remaining > 0 && remaining < 5 * 60 * 1000;
}

/**
 * Update guest info in session
 */
export function updateGuestInfo(guestInfo) {
  const session = getSession();
  if (!session) {
    console.error('No session found');
    return false;
  }

  session.guestInfo = guestInfo;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  console.log('✅ Guest info updated');
  return true;
}

/**
 * Get guest info from session
 */
export function getGuestInfo() {
  const session = getSession();
  return session?.guestInfo || null;
}

/**
 * Clear session and cart
 */
export function clearSession() {
  const session = getSession();

  // Clear session
  localStorage.removeItem(SESSION_KEY);

  // Clear cart if session exists
  if (session) {
    const cartKey = `${CART_KEY_PREFIX}${session.sessionId}`;
    localStorage.removeItem(cartKey);

    // Clear order placed flag
    localStorage.removeItem(`order_placed_${session.sessionId}`);
  }

  console.log('✅ Guest session cleared');
}

/**
 * Get cart for current session
 */
export function getCart() {
  const session = getSession();
  if (!session) return [];

  const cartKey = `${CART_KEY_PREFIX}${session.sessionId}`;
  const cartData = localStorage.getItem(cartKey);

  if (!cartData) return [];

  try {
    return JSON.parse(cartData);
  } catch (error) {
    console.error('Failed to parse cart:', error);
    return [];
  }
}

/**
 * Save cart for current session
 */
export function saveCart(cart) {
  const session = getSession();
  if (!session) {
    console.error('No session found');
    return false;
  }

  const cartKey = `${CART_KEY_PREFIX}${session.sessionId}`;
  localStorage.setItem(cartKey, JSON.stringify(cart));
  return true;
}

/**
 * Generate a secure random tracking secret
 */
export function generateTrackingSecret() {
  // Generate a random UUID-like string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Store tracking URL after order placement
 * Prevents duplicate orders by marking session as used
 */
export function setOrderPlaced(trackingUrl) {
  const session = getSession();
  if (!session) {
    console.error('No session found');
    return false;
  }

  localStorage.setItem(`order_placed_${session.sessionId}`, trackingUrl);
  console.log('✅ Order placed, tracking URL stored');
  return true;
}

/**
 * Get tracking URL if order was already placed
 * Returns null if no order placed for this session
 */
export function getOrderPlacedUrl() {
  const session = getSession();
  if (!session) return null;

  return localStorage.getItem(`order_placed_${session.sessionId}`);
}

/**
 * Clear order placed flag for current session
 */
export function clearOrderPlaced() {
  const session = getSession();
  if (session) {
    localStorage.removeItem(`order_placed_${session.sessionId}`);
  }
}
