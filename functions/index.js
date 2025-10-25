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
