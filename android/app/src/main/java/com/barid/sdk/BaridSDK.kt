package com.barid.sdk

import android.app.Application
import android.util.Log
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await

/**
 * Barid SDK for Android
 * Wrapper around Firebase SDK for customer engagement
 */
class BaridSDK private constructor() {

    companion object {
        private const val TAG = "BaridSDK"

        @Volatile
        private var instance: BaridSDK? = null

        fun getInstance(): BaridSDK {
            return instance ?: synchronized(this) {
                instance ?: BaridSDK().also { instance = it }
            }
        }
    }

    private var userId: String? = null
    private val db = FirebaseFirestore.getInstance()
    private var inAppMessageHandler: ((BaridInAppMessage) -> Unit)? = null

    /**
     * Initialize Barid SDK
     * @param app Application context
     * @param userId Unique identifier for the user
     */
    fun initialize(app: Application, userId: String) {
        this.userId = userId

        // Get FCM token and update
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                updateToken(token)
            } else {
                Log.w(TAG, "Failed to get FCM token", task.exception)
            }
        }

        // Fetch in-app messages
        fetchInAppMessages()
    }

    /**
     * Update FCM token for the user
     * @param token FCM registration token
     */
    fun updateToken(token: String) {
        val userId = this.userId ?: return

        val userRef = db.collection("users").document(userId)

        userRef.get().addOnSuccessListener { document ->
            if (document.exists()) {
                // Update existing tokens array
                userRef.update(
                    mapOf(
                        "fcmTokens.android" to FieldValue.arrayUnion(token),
                        "lastActive" to FieldValue.serverTimestamp()
                    )
                )
            } else {
                // Create user document
                userRef.set(
                    hashMapOf(
                        "id" to userId,
                        "fcmTokens" to hashMapOf(
                            "android" to listOf(token)
                        ),
                        "customAttributes" to hashMapOf<String, Any>(),
                        "events" to listOf<Any>(),
                        "createdAt" to FieldValue.serverTimestamp(),
                        "lastActive" to FieldValue.serverTimestamp()
                    )
                )
            }
        }
    }

    /**
     * Set custom attribute for the user
     * @param key Attribute key
     * @param value Attribute value
     */
    fun setAttribute(key: String, value: Any) {
        val userId = this.userId ?: return

        db.collection("users").document(userId).update(
            mapOf(
                "customAttributes.$key" to value,
                "lastActive" to FieldValue.serverTimestamp()
            )
        )
    }

    /**
     * Set multiple custom attributes
     * @param attributes Map of attributes
     */
    fun setAttributes(attributes: Map<String, Any>) {
        val userId = this.userId ?: return

        val updates = mutableMapOf<String, Any>()
        attributes.forEach { (key, value) ->
            updates["customAttributes.$key"] = value
        }
        updates["lastActive"] = FieldValue.serverTimestamp()

        db.collection("users").document(userId).update(updates)
    }

    /**
     * Track a custom event
     * @param name Event name
     * @param properties Optional event properties
     */
    fun trackEvent(name: String, properties: Map<String, Any>? = null) {
        val userId = this.userId ?: return

        val event = hashMapOf<String, Any>(
            "name" to name,
            "properties" to (properties ?: emptyMap<String, Any>()),
            "timestamp" to FieldValue.serverTimestamp()
        )

        db.collection("users").document(userId).update(
            mapOf(
                "events" to FieldValue.arrayUnion(event),
                "lastActive" to FieldValue.serverTimestamp()
            )
        )
    }

    /**
     * Set handler for in-app messages
     * @param handler Lambda to handle in-app messages
     */
    fun setInAppMessageHandler(handler: (BaridInAppMessage) -> Unit) {
        this.inAppMessageHandler = handler
    }

    /**
     * Fetch in-app messages for the user
     */
    fun fetchInAppMessages() {
        val userId = this.userId ?: return

        db.collection("userMessages")
            .document(userId)
            .collection("inbox")
            .whereEqualTo("status", "unread")
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(10)
            .get()
            .addOnSuccessListener { documents ->
                for (document in documents) {
                    try {
                        val message = document.toObject(BaridInAppMessage::class.java)
                        inAppMessageHandler?.invoke(message)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing in-app message", e)
                    }
                }
            }
            .addOnFailureListener { exception ->
                Log.e(TAG, "Error fetching in-app messages", exception)
            }
    }

    /**
     * Mark in-app message as read
     * @param messageId Message ID
     */
    fun markMessageAsRead(messageId: String) {
        val userId = this.userId ?: return

        db.collection("userMessages")
            .document(userId)
            .collection("inbox")
            .document(messageId)
            .update(
                mapOf(
                    "status" to "read",
                    "readAt" to FieldValue.serverTimestamp()
                )
            )
    }

    /**
     * Track in-app message interaction
     * @param messageId Message ID
     * @param action Action type (opened, clicked, dismissed)
     */
    fun trackInAppInteraction(messageId: String, action: String) {
        db.collection("analytics").add(
            hashMapOf(
                "userId" to (userId ?: ""),
                "messageId" to messageId,
                "eventType" to action,
                "messageType" to "in_app",
                "timestamp" to FieldValue.serverTimestamp()
            )
        )
    }

    /**
     * Handle notification opened
     * @param campaignId Campaign ID from notification data
     */
    fun handleNotificationOpened(campaignId: String) {
        db.collection("analytics").add(
            hashMapOf(
                "userId" to (userId ?: ""),
                "campaignId" to campaignId,
                "eventType" to "opened",
                "messageType" to "push",
                "timestamp" to FieldValue.serverTimestamp()
            )
        )
    }
}

/**
 * Data classes for in-app messages
 */
data class BaridInAppMessage(
    val id: String = "",
    val campaignId: String = "",
    val type: String = "",
    val title: String = "",
    val body: String = "",
    val imageUrl: String? = null,
    val primaryButton: BaridButton? = null,
    val secondaryButton: BaridButton? = null,
    val backgroundColor: String? = null,
    val textColor: String? = null
)

data class BaridButton(
    val text: String = "",
    val action: String = "",
    val value: String? = null,
    val backgroundColor: String? = null,
    val textColor: String? = null
)
