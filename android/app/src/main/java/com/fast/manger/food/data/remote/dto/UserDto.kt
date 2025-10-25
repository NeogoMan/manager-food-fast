package com.fast.manger.food.data.remote.dto

import com.fast.manger.food.domain.model.User
import com.fast.manger.food.domain.model.UserRole
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.PropertyName

/**
 * Data Transfer Object for User from Firestore
 */
data class UserDto(
    @PropertyName("username")
    val username: String = "",

    @PropertyName("name")
    val name: String = "",

    @PropertyName("phone")
    val phone: String? = null,

    @PropertyName("role")
    val role: String = "client",

    @PropertyName("isActive")
    val isActive: Boolean = true,

    @PropertyName("fcmToken")
    val fcmToken: String? = null,

    @PropertyName("fcmTokenUpdatedAt")
    val fcmTokenUpdatedAt: Timestamp? = null,

    @PropertyName("createdAt")
    val createdAt: Timestamp? = null,

    @PropertyName("updatedAt")
    val updatedAt: Timestamp? = null
) {
    /**
     * Convert DTO to Domain model
     */
    fun toDomainModel(id: String): User {
        return User(
            id = id,
            username = username,
            name = name,
            phone = phone,
            role = UserRole.fromString(role),
            isActive = isActive,
            fcmToken = fcmToken,
            fcmTokenUpdatedAt = fcmTokenUpdatedAt?.toDate()?.time,
            createdAt = createdAt?.toDate()?.time ?: System.currentTimeMillis(),
            updatedAt = updatedAt?.toDate()?.time ?: System.currentTimeMillis()
        )
    }

    companion object {
        /**
         * Create DTO from Firestore DocumentSnapshot
         */
        fun fromDocument(document: DocumentSnapshot): UserDto? {
            return try {
                document.toObject(UserDto::class.java)
            } catch (e: Exception) {
                null
            }
        }

        /**
         * Create DTO from Domain model
         */
        fun fromDomainModel(user: User): Map<String, Any> {
            return hashMapOf<String, Any>(
                "username" to user.username,
                "name" to user.name,
                "role" to user.role.toApiString(),
                "isActive" to user.isActive,
                "createdAt" to Timestamp(java.util.Date(user.createdAt)),
                "updatedAt" to Timestamp(java.util.Date(user.updatedAt))
            ).apply {
                user.phone?.let { put("phone", it) }
                user.fcmToken?.let { put("fcmToken", it) }
                user.fcmTokenUpdatedAt?.let { put("fcmTokenUpdatedAt", Timestamp(java.util.Date(it))) }
            }
        }
    }
}
