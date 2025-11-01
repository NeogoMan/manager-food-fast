/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import bcrypt from "bcrypt";

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();
const auth = getAuth();
const messaging = getMessaging();

// ============================================================================
// MULTI-TENANT HELPER FUNCTIONS
// ============================================================================

/**
 * Get the restaurantId from the authenticated user's custom claims or Firestore
 */
async function getRestaurantIdFromAuth(request) {
  if (!request.auth) {
    return null;
  }

  // First check custom claims
  if (request.auth.token.restaurantId) {
    return request.auth.token.restaurantId;
  }

  // Fallback to Firestore lookup
  try {
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    if (userDoc.exists && userDoc.data().restaurantId) {
      return userDoc.data().restaurantId;
    }
  } catch (error) {
    console.error("Error fetching restaurantId from Firestore:", error);
  }

  return null;
}

/**
 * Validate that user has access to a specific restaurant
 */
// eslint-disable-next-line no-unused-vars
async function validateRestaurantAccess(request, restaurantId) {
  if (!request.auth) {
    return false;
  }

  const userRestaurantId = await getRestaurantIdFromAuth(request);
  return userRestaurantId === restaurantId;
}

// ============================================================================
// FCM PUSH NOTIFICATION HELPERS
// ============================================================================

/**
 * Get notification title based on order status
 */
function getNotificationTitle(status) {
  const titles = {
    "preparing": "Préparation en cours",
    "ready": "Commande prête!",
    "completed": "Merci!",
    "rejected": "Commande refusée",
  };
  return titles[status.toLowerCase()] || "Mise à jour de commande";
}

/**
 * Get notification body based on order status
 */
function getNotificationBody(orderNumber, status, rejectionReason = null) {
  const messages = {
    "preparing": `Votre commande ${orderNumber} est en cours de préparation.`,
    "ready": `Votre commande ${orderNumber} est prête! Venez la récupérer.`,
    "completed": `Votre commande ${orderNumber} est terminée. Merci de votre visite!`,
    "rejected": `Désolé, votre commande ${orderNumber} a été refusée. ${rejectionReason || ""}`,
  };
  return messages[status.toLowerCase()] || `Votre commande ${orderNumber} a été mise à jour.`;
}

/**
 * Retrieve user's FCM token from Firestore
 */
async function getUserFCMToken(userId) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      console.warn(`User ${userId} not found`);
      return null;
    }

    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) {
      console.warn(`User ${userId} does not have an FCM token`);
      return null;
    }

    return fcmToken;
  } catch (error) {
    console.error(`Error fetching FCM token for user ${userId}:`, error);
    return null;
  }
}

/**
 * Send order status notification to user via FCM
 */
async function sendOrderStatusNotification(userId, orderId, orderNumber, newStatus, rejectionReason = null) {
  try {
    // Get user's FCM token
    const fcmToken = await getUserFCMToken(userId);
    if (!fcmToken) {
      console.log(`No FCM token for user ${userId}, skipping push notification`);
      return null;
    }

    // Build notification message
    const message = {
      token: fcmToken,
      data: {
        type: "order_status_update",
        orderId: orderId,
        orderNumber: orderNumber,
        status: newStatus.toLowerCase(),
        rejectionReason: rejectionReason || "",
      },
      notification: {
        title: getNotificationTitle(newStatus),
        body: getNotificationBody(orderNumber, newStatus, rejectionReason),
      },
      android: {
        priority: "high",
      },
    };

    // Send message
    const response = await messaging.send(message);
    console.log(`Successfully sent push notification to user ${userId}:`, response);

    return response;
  } catch (error) {
    // Handle invalid or expired tokens
    if (error.code === "messaging/registration-token-not-registered" ||
        error.code === "messaging/invalid-registration-token") {
      console.warn(`FCM token for user ${userId} is invalid or expired. Removing token.`);

      // Remove invalid token from user document
      try {
        await db.collection("users").doc(userId).update({
          fcmToken: null,
        });
      } catch (updateError) {
        console.error(`Error removing invalid FCM token for user ${userId}:`, updateError);
      }
    } else {
      console.error(`Error sending push notification to user ${userId}:`, error);
    }

    return null;
  }
}

// ============================================================================
// FCM TOKEN MANAGEMENT
// ============================================================================

/**
 * Cloud Function: registerFCMToken
 * Registers or updates a user's FCM token for push notifications
 */
export const registerFCMToken = onCall(async (request) => {
  // Require authentication
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to register FCM token",
    );
  }

  const {fcmToken} = request.data;

  // Validate input
  if (!fcmToken || typeof fcmToken !== "string") {
    throw new HttpsError(
        "invalid-argument",
        "Valid FCM token is required",
    );
  }

  const userId = request.auth.uid;

  try {
    // Update user document with FCM token
    await db.collection("users").doc(userId).update({
      fcmToken: fcmToken,
      fcmTokenUpdatedAt: new Date(),
    });

    console.log(`FCM token registered for user ${userId}`);

    return {
      success: true,
      message: "FCM token registered successfully",
    };
  } catch (error) {
    console.error(`Error registering FCM token for user ${userId}:`, error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to register FCM token");
  }
});

/**
 * Cloud Function: removeFCMToken
 * Removes a user's FCM token (e.g., on logout)
 */
export const removeFCMToken = onCall(async (request) => {
  // Require authentication
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to remove FCM token",
    );
  }

  const userId = request.auth.uid;

  try {
    // Remove FCM token from user document
    await db.collection("users").doc(userId).update({
      fcmToken: null,
      fcmTokenUpdatedAt: new Date(),
    });

    console.log(`FCM token removed for user ${userId}`);

    return {
      success: true,
      message: "FCM token removed successfully",
    };
  } catch (error) {
    console.error(`Error removing FCM token for user ${userId}:`, error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to remove FCM token");
  }
});

// ============================================================================
// USER AUTHENTICATION & MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Cloud Function: authenticateUser
 * Authenticates a user with username and password
 * Returns a Firebase Custom Auth Token
 */
export const authenticateUser = onCall(async (request) => {
  const {username, password} = request.data;

  // Validate input
  if (!username || !password) {
    throw new HttpsError(
        "invalid-argument",
        "Username and password are required",
    );
  }

  try {
    // Query Firestore for user by username
    const usersRef = db.collection("users");
    const querySnapshot = await usersRef.where("username", "==", username).limit(1).get();

    if (querySnapshot.empty) {
      throw new HttpsError("not-found", "Invalid username or password");
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Check if user is active (supports both 'status' and 'isActive' fields)
    const isActive = userData.isActive !== undefined ? userData.isActive : (userData.status === "active");
    if (!isActive) {
      throw new HttpsError("permission-denied", "User account is inactive");
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);

    if (!passwordMatch) {
      throw new HttpsError("not-found", "Invalid username or password");
    }

    // Prepare custom claims with all user info including restaurantId
    const customClaims = {
      role: userData.role,
      username: userData.username,
      name: userData.name,
      phone: userData.phone,
      restaurantId: userData.restaurantId || null, // Multi-tenant: Include restaurantId
      isSuperAdmin: userData.isSuperAdmin || false,
    };

    // Set custom claims
    await auth.setCustomUserClaims(userDoc.id, customClaims);

    // Generate custom auth token with claims
    const customToken = await auth.createCustomToken(userDoc.id, customClaims);

    // Update last login
    await userDoc.ref.update({
      lastLogin: new Date(),
    });

    return {
      success: true,
      token: customToken,
      user: {
        id: userDoc.id,
        username: userData.username,
        name: userData.name,
        role: userData.role,
        phone: userData.phone || null,
        isActive: isActive,
        restaurantId: userData.restaurantId || null, // Multi-tenant: Include restaurantId
        isSuperAdmin: userData.isSuperAdmin || false,
        createdAt: userData.createdAt || Date.now(),
        updatedAt: userData.updatedAt || Date.now(),
      },
    };
  } catch (error) {
    console.error("Authentication error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Authentication failed");
  }
});

/**
 * Cloud Function: createUser
 * Creates a new user (manager only)
 * Multi-tenant: Users are created within the manager's restaurant
 */
export const createUser = onCall(async (request) => {
  // Verify the caller is a manager
  if (!request.auth || request.auth.token.role !== "manager") {
    throw new HttpsError(
        "permission-denied",
        "Only managers can create users",
    );
  }

  // Get the manager's restaurantId
  const restaurantId = await getRestaurantIdFromAuth(request);
  if (!restaurantId && !request.auth.token.isSuperAdmin) {
    throw new HttpsError(
        "failed-precondition",
        "Manager must belong to a restaurant",
    );
  }

  const {username, password, role, name, phone} = request.data;

  // Validate input
  if (!username || !password || !role || !name) {
    throw new HttpsError(
        "invalid-argument",
        "Username, password, role, and name are required",
    );
  }

  // Validate role
  const validRoles = ["manager", "cashier", "cook", "client"];
  if (!validRoles.includes(role)) {
    throw new HttpsError("invalid-argument", "Invalid role");
  }

  // Validate password strength
  if (password.length < 6) {
    throw new HttpsError(
        "invalid-argument",
        "Password must be at least 6 characters",
    );
  }

  try {
    // Check if username already exists
    const existingUser = await db.collection("users")
        .where("username", "==", username)
        .limit(1)
        .get();

    if (!existingUser.empty) {
      throw new HttpsError("already-exists", "Username already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in Authentication
    const userRecord = await auth.createUser({
      uid: db.collection("users").doc().id,
    });

    // Set custom claims including restaurantId
    await auth.setCustomUserClaims(userRecord.uid, {
      role,
      restaurantId: restaurantId,
    });

    // Create user document in Firestore with restaurantId
    await db.collection("users").doc(userRecord.uid).set({
      username,
      passwordHash,
      role,
      name,
      phone: phone || null,
      restaurantId: restaurantId, // Multi-tenant: Assign to manager's restaurant
      isSuperAdmin: false,
      status: "active",
      createdAt: new Date(),
      createdBy: request.auth.uid,
    });

    return {
      success: true,
      userId: userRecord.uid,
      message: "User created successfully",
    };
  } catch (error) {
    console.error("Create user error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to create user");
  }
});

/**
 * Cloud Function: updateUser
 * Updates a user's information (manager only)
 */
export const updateUser = onCall(async (request) => {
  // Verify the caller is a manager
  if (!request.auth || request.auth.token.role !== "manager") {
    throw new HttpsError(
        "permission-denied",
        "Only managers can update users",
    );
  }

  const {userId, updates} = request.data;

  // Validate input
  if (!userId || !updates) {
    throw new HttpsError(
        "invalid-argument",
        "User ID and updates are required",
    );
  }

  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const updateData = {
      updatedAt: new Date(),
      updatedBy: request.auth.uid,
    };

    // Update name if provided
    if (updates.name) {
      updateData.name = updates.name;
    }

    // Update phone if provided
    if (updates.phone !== undefined) {
      updateData.phone = updates.phone || null;
    }

    // Update email if provided
    if (updates.email !== undefined) {
      updateData.email = updates.email || null;
    }

    // Update role if provided
    if (updates.role) {
      const validRoles = ["manager", "cashier", "cook", "client"];
      if (!validRoles.includes(updates.role)) {
        throw new HttpsError("invalid-argument", "Invalid role");
      }
      updateData.role = updates.role;
      // Update custom claims
      await auth.setCustomUserClaims(userId, {role: updates.role});
    }

    // Update status if provided
    if (updates.status) {
      const validStatuses = ["active", "inactive", "suspended"];
      if (!validStatuses.includes(updates.status)) {
        throw new HttpsError("invalid-argument", "Invalid status");
      }
      updateData.status = updates.status;
      // Disable/enable user in Authentication
      await auth.updateUser(userId, {
        disabled: updates.status !== "active",
      });
    }

    // Update password if provided
    if (updates.password) {
      if (updates.password.length < 6) {
        throw new HttpsError(
            "invalid-argument",
            "Password must be at least 6 characters",
        );
      }
      const passwordHash = await bcrypt.hash(updates.password, 10);
      updateData.passwordHash = passwordHash;
    }

    // Update Firestore
    await db.collection("users").doc(userId).update(updateData);

    return {
      success: true,
      message: "User updated successfully",
    };
  } catch (error) {
    console.error("Update user error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to update user");
  }
});

/**
 * Cloud Function: deleteUser
 * Deletes a user (manager only)
 */
export const deleteUser = onCall(async (request) => {
  // Verify the caller is a manager
  if (!request.auth || request.auth.token.role !== "manager") {
    throw new HttpsError(
        "permission-denied",
        "Only managers can delete users",
    );
  }

  const {userId} = request.data;

  // Validate input
  if (!userId) {
    throw new HttpsError("invalid-argument", "User ID is required");
  }

  // Prevent deleting yourself
  if (userId === request.auth.uid) {
    throw new HttpsError(
        "invalid-argument",
        "You cannot delete your own account",
    );
  }

  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    // Delete from Authentication
    await auth.deleteUser(userId);

    // Delete from Firestore
    await db.collection("users").doc(userId).delete();

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Delete user error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to delete user");
  }
});

/**
 * Cloud Function: setUserRole
 * Updates a user's role (manager only)
 */
export const setUserRole = onCall(async (request) => {
  // Verify the caller is a manager
  if (!request.auth || request.auth.token.role !== "manager") {
    throw new HttpsError(
        "permission-denied",
        "Only managers can set user roles",
    );
  }

  const {userId, role} = request.data;

  // Validate input
  if (!userId || !role) {
    throw new HttpsError(
        "invalid-argument",
        "User ID and role are required",
    );
  }

  // Validate role
  const validRoles = ["manager", "cashier", "cook", "client"];
  if (!validRoles.includes(role)) {
    throw new HttpsError("invalid-argument", "Invalid role");
  }

  try {
    // Update Firestore
    await db.collection("users").doc(userId).update({
      role,
      updatedAt: new Date(),
      updatedBy: request.auth.uid,
    });

    // Update custom claims
    await auth.setCustomUserClaims(userId, {role});

    return {
      success: true,
      message: `User role updated to ${role}`,
    };
  } catch (error) {
    console.error("Set user role error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to update user role");
  }
});

/**
 * Cloud Function: updateUserStatus
 * Activates or deactivates a user account (manager only)
 */
export const updateUserStatus = onCall(async (request) => {
  // Verify the caller is a manager
  if (!request.auth || request.auth.token.role !== "manager") {
    throw new HttpsError(
        "permission-denied",
        "Only managers can update user status",
    );
  }

  const {userId, status} = request.data;

  // Validate input
  if (!userId || !status) {
    throw new HttpsError(
        "invalid-argument",
        "User ID and status are required",
    );
  }

  // Validate status
  if (!["active", "inactive"].includes(status)) {
    throw new HttpsError("invalid-argument", "Invalid status");
  }

  try {
    // Update Firestore
    await db.collection("users").doc(userId).update({
      status,
      updatedAt: new Date(),
      updatedBy: request.auth.uid,
    });

    // Disable/enable user in Authentication
    await auth.updateUser(userId, {
      disabled: status === "inactive",
    });

    return {
      success: true,
      message: `User ${status === "active" ? "activated" : "deactivated"}`,
    };
  } catch (error) {
    console.error("Update user status error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to update user status");
  }
});

/**
 * Cloud Function: onOrderStatusChanged
 * Triggers when an order status changes - sends push notifications to users
 */
export const onOrderStatusChanged = onDocumentUpdated(
    "orders/{orderId}",
    async (event) => {
      const before = event.data.before.data();
      const after = event.data.after.data();

      // Skip if status hasn't changed
      if (before.status === after.status) {
        return null;
      }

      const orderId = event.params.orderId;
      const orderNumber = after.orderNumber;
      const newStatus = after.status;
      const userId = after.userId;

      console.log(`Order ${orderNumber} status changed: ${before.status} -> ${newStatus}`);

      // Determine if we should send a push notification
      const notifiableStatuses = ["preparing", "ready", "completed", "rejected"];
      const shouldNotify = notifiableStatuses.includes(newStatus.toLowerCase());

      if (!shouldNotify) {
        console.log(`Status ${newStatus} does not trigger push notification`);
        return null;
      }

      // Handle order approval (kitchen staff notification)
      if (before.status === "awaiting_approval" && after.status === "pending") {
        console.log(`Order ${orderNumber} was approved`);

        // Create notification document for kitchen staff
        try {
          await db.collection("notifications").add({
            type: "order_approved",
            orderId: orderId,
            orderNumber: orderNumber,
            title: "New Order Approved",
            message: `Order ${orderNumber} is ready for preparation`,
            targetRole: "cook",
            read: false,
            createdAt: new Date(),
          });

          console.log(`Kitchen notification created for order ${orderNumber}`);
        } catch (error) {
          console.error("Error creating kitchen notification:", error);
        }
      }

      // Send push notification to client if userId exists
      if (userId) {
        try {
          await sendOrderStatusNotification(
              userId,
              orderId,
              orderNumber,
              newStatus,
              after.rejectionReason || null,
          );

          // Also create notification document in Firestore
          await db.collection("notifications").add({
            type: "order_status_update",
            orderId: orderId,
            orderNumber: orderNumber,
            title: getNotificationTitle(newStatus),
            message: getNotificationBody(orderNumber, newStatus, after.rejectionReason),
            userId: userId,
            status: newStatus,
            read: false,
            createdAt: new Date(),
          });

          console.log(`Push notification and Firestore document created for order ${orderNumber}`);
        } catch (error) {
          console.error(`Error sending notification for order ${orderNumber}:`, error);
        }
      } else {
        console.warn(`Order ${orderNumber} has no userId, skipping client notification`);
      }

      return null;
    },
);

// Note: onOrderCompleted functionality has been merged into onOrderStatusChanged above
// The new function handles all order status changes and sends appropriate push notifications

// ============================================================================
// RESTAURANT VALIDATION & CLIENT SIGNUP FUNCTIONS
// ============================================================================

/**
 * Cloud Function: validateRestaurantCode
 * Validates a restaurant code and returns restaurant details
 * Public (no authentication required)
 */
export const validateRestaurantCode = onCall(async (request) => {
  const {code} = request.data;

  // Validate input
  if (!code || typeof code !== "string") {
    throw new HttpsError(
        "invalid-argument",
        "Restaurant code is required",
    );
  }

  // Normalize code to uppercase
  const normalizedCode = code.trim().toUpperCase();

  // Debug logging
  console.log(`🔍 Validating restaurant code: "${normalizedCode}"`);

  try {
    // Query Firestore for restaurant by shortCode
    const restaurantsRef = db.collection("restaurants");
    const querySnapshot = await restaurantsRef
        .where("shortCode", "==", normalizedCode)
        .where("status", "in", ["active", "trial"])
        .limit(1)
        .get();

    console.log(`📊 Query results: ${querySnapshot.size} documents found`);

    if (querySnapshot.empty) {
      console.log(`❌ No restaurant found for code: ${normalizedCode}`);
      throw new HttpsError(
          "not-found",
          "Restaurant code not found or inactive",
      );
    }

    console.log(`✅ Restaurant found: ${querySnapshot.docs[0].id}`);

    const restaurantDoc = querySnapshot.docs[0];
    const restaurantData = restaurantDoc.data();

    return {
      success: true,
      restaurant: {
        id: restaurantDoc.id,
        name: restaurantData.name,
        shortCode: restaurantData.shortCode,
        email: restaurantData.email || null,
        phone: restaurantData.phone || null,
        status: restaurantData.status,
        plan: restaurantData.plan,
        branding: restaurantData.branding || null,
      },
    };
  } catch (error) {
    console.error("Validate restaurant code error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to validate restaurant code");
  }
});

/**
 * Cloud Function: signUpClient
 * Registers a new client user with auto-generated username
 * Links user to specific restaurant
 */
export const signUpClient = onCall(async (request) => {
  const {restaurantId, name, phone, password} = request.data;

  // Validate input
  if (!restaurantId || !name || !phone || !password) {
    throw new HttpsError(
        "invalid-argument",
        "Restaurant ID, name, phone, and password are required",
    );
  }

  // Validate password strength
  if (password.length < 6) {
    throw new HttpsError(
        "invalid-argument",
        "Password must be at least 6 characters",
    );
  }

  // Validate phone format (basic validation)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
  if (!phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
    throw new HttpsError(
        "invalid-argument",
        "Invalid phone number format",
    );
  }

  try {
    // Verify restaurant exists and is active
    const restaurantDoc = await db.collection("restaurants").doc(restaurantId).get();
    if (!restaurantDoc.exists) {
      throw new HttpsError("not-found", "Restaurant not found");
    }

    const restaurantData = restaurantDoc.data();
    if (restaurantData.status !== "active" && restaurantData.status !== "trial") {
      throw new HttpsError("failed-precondition", "Restaurant is not active");
    }

    // Check if phone number already exists for this restaurant
    const existingUserByPhone = await db.collection("users")
        .where("phone", "==", phone)
        .where("restaurantId", "==", restaurantId)
        .limit(1)
        .get();

    if (!existingUserByPhone.empty) {
      throw new HttpsError(
          "already-exists",
          "Phone number already registered for this restaurant",
      );
    }

    // Generate username: client_[phone_last4]_[random3]
    const phoneLast4 = phone.replace(/\D/g, "").slice(-4);
    const random3 = Math.random().toString(36).substring(2, 5);
    let username = `client_${phoneLast4}_${random3}`;

    // Ensure username is unique
    let attempts = 0;
    while (attempts < 5) {
      const existingUsername = await db.collection("users")
          .where("username", "==", username)
          .limit(1)
          .get();

      if (existingUsername.empty) {
        break; // Username is unique
      }

      // Generate new random suffix
      const newRandom = Math.random().toString(36).substring(2, 5);
      username = `client_${phoneLast4}_${newRandom}`;
      attempts++;
    }

    if (attempts >= 5) {
      throw new HttpsError(
          "internal",
          "Failed to generate unique username. Please try again.",
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in Authentication
    const userRecord = await auth.createUser({
      uid: db.collection("users").doc().id,
    });

    console.log(`🔐 === SIGN UP CLIENT: User created in Firebase Auth ===`);
    console.log(`   User UID: ${userRecord.uid}`);
    console.log(`   Username: ${username}`);
    console.log(`   Name: ${name}`);
    console.log(`   Phone: ${phone}`);
    console.log(`   Restaurant ID: ${restaurantId} ⭐`);

    // Set custom claims
    const customClaims = {
      role: "client",
      restaurantId: restaurantId,
      username: username,
      name: name,
      phone: phone,
    };

    console.log(`📝 Setting custom claims:`, customClaims);
    await auth.setCustomUserClaims(userRecord.uid, customClaims);
    console.log(`✅ Custom claims set successfully`);

    // Create user document in Firestore with multi-restaurant support
    const userDoc = {
      username,
      passwordHash,
      role: "client",
      name,
      phone,
      restaurantId, // Legacy field - kept for backwards compatibility
      restaurantIds: [restaurantId], // NEW: Array of restaurants user has access to
      activeRestaurantId: restaurantId, // NEW: Currently selected restaurant
      isSuperAdmin: false,
      status: "active",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`💾 Creating Firestore user document with restaurantIds: [${restaurantId}]`);
    console.log(`   Active Restaurant: ${restaurantId}`);
    await db.collection("users").doc(userRecord.uid).set(userDoc);
    console.log(`✅ Firestore user document created`);

    // Generate custom auth token
    const customToken = await auth.createCustomToken(userRecord.uid, {
      role: "client",
      restaurantId: restaurantId,
      username: username,
      name: name,
      phone: phone,
    });

    console.log(`🎫 Custom token generated with restaurantId: ${restaurantId}`);
    console.log(`Client user created: ${userRecord.uid} with username: ${username}`);

    return {
      success: true,
      token: customToken,
      user: {
        id: userRecord.uid,
        username: username,
        name: name,
        phone: phone,
        role: "client",
        restaurantId: restaurantId, // Legacy field
        restaurantIds: [restaurantId], // NEW: Array of restaurants
        activeRestaurantId: restaurantId, // NEW: Current restaurant
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };
  } catch (error) {
    console.error("Sign up client error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to create client account");
  }
});

/**
 * Cloud Function: addRestaurantToUser
 * Allows an authenticated user to add a new restaurant to their account
 * @param {string} restaurantCode - Restaurant code to add
 */
export const addRestaurantToUser = onCall(async (request) => {
  const {restaurantCode} = request.data;

  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = request.auth.uid;

  // Validate input
  if (!restaurantCode) {
    throw new HttpsError("invalid-argument", "Restaurant code is required");
  }

  try {
    console.log(`🍽️ === ADD RESTAURANT TO USER ===`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Restaurant Code: ${restaurantCode}`);

    // Validate restaurant code
    const normalizedCode = restaurantCode.trim().toUpperCase();
    const restaurantsRef = db.collection("restaurants");
    const querySnapshot = await restaurantsRef
        .where("shortCode", "==", normalizedCode)
        .where("status", "in", ["active", "trial"])
        .limit(1)
        .get();

    if (querySnapshot.empty) {
      console.log(`❌ Restaurant code not found: ${normalizedCode}`);
      throw new HttpsError("not-found", "Restaurant code not found or inactive");
    }

    const restaurantDoc = querySnapshot.docs[0];
    const restaurantId = restaurantDoc.id;
    const restaurantData = restaurantDoc.data();

    console.log(`✅ Restaurant found: ${restaurantData.name} (${restaurantId})`);

    // Get user document
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data();
    const currentRestaurantIds = userData.restaurantIds || (userData.restaurantId ? [userData.restaurantId] : []);

    // Check if restaurant is already added
    if (currentRestaurantIds.includes(restaurantId)) {
      console.log(`⚠️ Restaurant already added to user`);
      return {
        success: true,
        message: "Restaurant already in your list",
        restaurant: {
          id: restaurantId,
          name: restaurantData.name,
          shortCode: restaurantData.shortCode,
        },
      };
    }

    // Add restaurant to user's list
    const updatedRestaurantIds = [...currentRestaurantIds, restaurantId];

    await userRef.update({
      restaurantIds: updatedRestaurantIds,
      updatedAt: new Date(),
    });

    console.log(`✅ Restaurant added to user. Total restaurants: ${updatedRestaurantIds.length}`);

    return {
      success: true,
      message: "Restaurant added successfully",
      restaurant: {
        id: restaurantId,
        name: restaurantData.name,
        shortCode: restaurantData.shortCode,
      },
      totalRestaurants: updatedRestaurantIds.length,
    };
  } catch (error) {
    console.error("Add restaurant error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to add restaurant");
  }
});

/**
 * Cloud Function: setActiveRestaurant
 * Sets the active restaurant for a user and updates their token claims
 * @param {string} restaurantId - Restaurant ID to set as active
 */
export const setActiveRestaurant = onCall(async (request) => {
  const {restaurantId} = request.data;

  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = request.auth.uid;

  // Validate input
  if (!restaurantId) {
    throw new HttpsError("invalid-argument", "Restaurant ID is required");
  }

  try {
    console.log(`🔄 === SET ACTIVE RESTAURANT ===`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Restaurant ID: ${restaurantId}`);

    // Get user document
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data();
    const restaurantIds = userData.restaurantIds || (userData.restaurantId ? [userData.restaurantId] : []);

    // Verify user has access to this restaurant
    if (!restaurantIds.includes(restaurantId)) {
      console.log(`❌ User doesn't have access to restaurant: ${restaurantId}`);
      throw new HttpsError(
          "permission-denied",
          "You don't have access to this restaurant",
      );
    }

    // Get restaurant details
    const restaurantDoc = await db.collection("restaurants").doc(restaurantId).get();

    if (!restaurantDoc.exists) {
      throw new HttpsError("not-found", "Restaurant not found");
    }

    const restaurantData = restaurantDoc.data();

    // Update user's active restaurant
    await userRef.update({
      activeRestaurantId: restaurantId,
      restaurantId: restaurantId, // Update legacy field too
      updatedAt: new Date(),
    });

    console.log(`✅ Active restaurant updated to: ${restaurantData.name}`);

    // Update custom claims with new active restaurant
    const customClaims = {
      role: userData.role,
      restaurantId: restaurantId, // Update token claim for security rules
      username: userData.username,
      name: userData.name,
      phone: userData.phone,
      isSuperAdmin: userData.isSuperAdmin || false,
    };

    await auth.setCustomUserClaims(userId, customClaims);

    console.log(`✅ Token claims updated with new restaurantId`);

    // Generate new token with updated claims
    const customToken = await auth.createCustomToken(userId, customClaims);

    return {
      success: true,
      message: "Active restaurant updated",
      token: customToken,
      restaurant: {
        id: restaurantId,
        name: restaurantData.name,
        shortCode: restaurantData.shortCode,
      },
    };
  } catch (error) {
    console.error("Set active restaurant error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to set active restaurant");
  }
});

// ============================================================================
// RESTAURANT MANAGEMENT FUNCTIONS (SUPER ADMIN ONLY)
// ============================================================================

/**
 * Cloud Function: createRestaurant
 * Creates a new restaurant (super admin only)
 */
export const createRestaurant = onCall(async (request) => {
  // Require super admin authentication
  if (!request.auth || !request.auth.token.isSuperAdmin) {
    throw new HttpsError(
        "permission-denied",
        "Only super admins can create restaurants",
    );
  }

  const {name, email, phone, address, plan, adminUser} = request.data;

  // Validate input
  if (!name || !email || !plan) {
    throw new HttpsError(
        "invalid-argument",
        "Restaurant name, email, and plan are required",
    );
  }

  // Validate plan
  const validPlans = ["basic", "pro", "enterprise"];
  if (!validPlans.includes(plan)) {
    throw new HttpsError("invalid-argument", "Invalid plan");
  }

  try {
    // Generate unique restaurant code
    const restaurantCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create restaurant document
    const restaurantRef = await db.collection("restaurants").add({
      name,
      email,
      phone: phone || null,
      address: address || null,
      restaurantCode,
      plan,
      status: "active",
      billing: {
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
      },
      features: getFeaturesByPlan(plan),
      branding: {
        logoUrl: null,
        primaryColor: "#FF5722",
        secondaryColor: "#FFC107",
        accentColor: "#4CAF50",
        customDomain: null,
      },
      usage: {
        totalOrders: 0,
        totalRevenue: 0,
        activeStaffUsers: 0,
        storageUsedMB: 0,
        lastActivityAt: new Date(),
      },
      createdAt: new Date(),
      createdBy: request.auth.uid,
      updatedAt: new Date(),
      onboardingCompleted: false,
      setupStep: "profile",
    });

    const restaurantId = restaurantRef.id;

    // Create admin user if provided
    if (adminUser && adminUser.username && adminUser.password && adminUser.name) {
      // Hash password
      const passwordHash = await bcrypt.hash(adminUser.password, 10);

      // Create user record
      const userRecord = await auth.createUser({
        uid: db.collection("users").doc().id,
        email: adminUser.email || email,
        emailVerified: false,
      });

      // Set custom claims
      await auth.setCustomUserClaims(userRecord.uid, {
        role: "manager",
        restaurantId: restaurantId,
        isSuperAdmin: false,
      });

      // Create user document
      await db.collection("users").doc(userRecord.uid).set({
        username: adminUser.username,
        passwordHash,
        role: "manager",
        name: adminUser.name,
        email: adminUser.email || email,
        phone: adminUser.phone || phone || null,
        restaurantId: restaurantId,
        isSuperAdmin: false,
        status: "active",
        createdAt: new Date(),
        createdBy: request.auth.uid,
      });
    }

    return {
      success: true,
      restaurantId,
      restaurantCode,
      message: "Restaurant created successfully",
    };
  } catch (error) {
    console.error("Create restaurant error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to create restaurant");
  }
});

/**
 * Cloud Function: updateRestaurant
 * Updates a restaurant's information (super admin only)
 */
export const updateRestaurant = onCall(async (request) => {
  // Require super admin authentication
  if (!request.auth || !request.auth.token.isSuperAdmin) {
    throw new HttpsError(
        "permission-denied",
        "Only super admins can update restaurants",
    );
  }

  const {restaurantId, updates} = request.data;

  // Validate input
  if (!restaurantId || !updates) {
    throw new HttpsError(
        "invalid-argument",
        "Restaurant ID and updates are required",
    );
  }

  try {
    const restaurantDoc = await db.collection("restaurants").doc(restaurantId).get();

    if (!restaurantDoc.exists) {
      throw new HttpsError("not-found", "Restaurant not found");
    }

    const updateData = {
      updatedAt: new Date(),
      updatedBy: request.auth.uid,
    };

    // Update basic info
    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.address) updateData.address = updates.address;

    // Update plan if provided
    if (updates.plan) {
      const validPlans = ["basic", "pro", "enterprise"];
      if (!validPlans.includes(updates.plan)) {
        throw new HttpsError("invalid-argument", "Invalid plan");
      }
      updateData.plan = updates.plan;
      updateData.features = getFeaturesByPlan(updates.plan);
    }

    // Update branding if provided
    if (updates.branding) {
      updateData.branding = {
        ...restaurantDoc.data().branding,
        ...updates.branding,
      };
    }

    // Update Firestore
    await db.collection("restaurants").doc(restaurantId).update(updateData);

    return {
      success: true,
      message: "Restaurant updated successfully",
    };
  } catch (error) {
    console.error("Update restaurant error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to update restaurant");
  }
});

/**
 * Cloud Function: listRestaurants
 * Lists all restaurants (super admin only)
 */
export const listRestaurants = onCall(async (request) => {
  // Require super admin authentication
  if (!request.auth || !request.auth.token.isSuperAdmin) {
    throw new HttpsError(
        "permission-denied",
        "Only super admins can list restaurants",
    );
  }

  try {
    const restaurantsSnapshot = await db.collection("restaurants")
        .orderBy("createdAt", "desc")
        .get();

    const restaurants = [];
    restaurantsSnapshot.forEach((doc) => {
      restaurants.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      restaurants,
    };
  } catch (error) {
    console.error("List restaurants error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to list restaurants");
  }
});

/**
 * Cloud Function: suspendRestaurant
 * Suspends or activates a restaurant (super admin only)
 */
export const suspendRestaurant = onCall(async (request) => {
  // Require super admin authentication
  if (!request.auth || !request.auth.token.isSuperAdmin) {
    throw new HttpsError(
        "permission-denied",
        "Only super admins can suspend restaurants",
    );
  }

  const {restaurantId, status} = request.data;

  // Validate input
  if (!restaurantId || !status) {
    throw new HttpsError(
        "invalid-argument",
        "Restaurant ID and status are required",
    );
  }

  // Validate status
  const validStatuses = ["active", "suspended", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new HttpsError("invalid-argument", "Invalid status");
  }

  try {
    const restaurantDoc = await db.collection("restaurants").doc(restaurantId).get();

    if (!restaurantDoc.exists) {
      throw new HttpsError("not-found", "Restaurant not found");
    }

    // Update restaurant status
    await db.collection("restaurants").doc(restaurantId).update({
      status,
      updatedAt: new Date(),
      updatedBy: request.auth.uid,
    });

    // If suspending, also disable all users in this restaurant
    if (status === "suspended" || status === "cancelled") {
      const usersSnapshot = await db.collection("users")
          .where("restaurantId", "==", restaurantId)
          .get();

      const batch = db.batch();
      usersSnapshot.forEach((userDoc) => {
        batch.update(userDoc.ref, {
          status: "inactive",
          updatedAt: new Date(),
        });
        // Also disable in Firebase Auth
        auth.updateUser(userDoc.id, {disabled: true}).catch((err) => {
          console.error(`Failed to disable user ${userDoc.id}:`, err);
        });
      });
      await batch.commit();
    }

    return {
      success: true,
      message: `Restaurant ${status === "active" ? "activated" : status}`,
    };
  } catch (error) {
    console.error("Suspend restaurant error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to update restaurant status");
  }
});

/**
 * Helper function: Get features by plan
 */
function getFeaturesByPlan(plan) {
  const features = {
    basic: {
      analyticsEnabled: false,
      mobileAppEnabled: false,
      multiLocationEnabled: false,
      customBrandingEnabled: false,
      apiAccessEnabled: false,
      prioritySupportEnabled: false,
      maxStaffUsers: 3,
      maxOrders: -1,
    },
    pro: {
      analyticsEnabled: true,
      mobileAppEnabled: true,
      multiLocationEnabled: false,
      customBrandingEnabled: false,
      apiAccessEnabled: false,
      prioritySupportEnabled: true,
      maxStaffUsers: -1,
      maxOrders: -1,
    },
    enterprise: {
      analyticsEnabled: true,
      mobileAppEnabled: true,
      multiLocationEnabled: true,
      customBrandingEnabled: true,
      apiAccessEnabled: true,
      prioritySupportEnabled: true,
      maxStaffUsers: -1,
      maxOrders: -1,
    },
  };

  return features[plan] || features.basic;
}
