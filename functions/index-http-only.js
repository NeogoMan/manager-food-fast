/**
 * Cloud Functions - HTTP Only (without triggers)
 * Use this temporarily to test authentication while we fix trigger permissions
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import bcrypt from "bcrypt";

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();
const auth = getAuth();

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

    // Check if user is active
    if (userData.status !== "active") {
      throw new HttpsError("permission-denied", "User account is inactive");
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);

    if (!passwordMatch) {
      throw new HttpsError("not-found", "Invalid username or password");
    }

    // Set custom claims for role
    await auth.setCustomUserClaims(userDoc.id, {
      role: userData.role,
    });

    // Generate custom auth token
    const customToken = await auth.createCustomToken(userDoc.id, {
      role: userData.role,
    });

    // Update last login
    await userDoc.ref.update({
      lastLogin: new Date(),
    });

    return {
      token: customToken,
      user: {
        id: userDoc.id,
        username: userData.username,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
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
 */
export const createUser = onCall(async (request) => {
  // Verify the caller is a manager
  if (!request.auth || request.auth.token.role !== "manager") {
    throw new HttpsError(
        "permission-denied",
        "Only managers can create users",
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

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {role});

    // Create user document in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      username,
      passwordHash,
      role,
      name,
      phone: phone || null,
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
