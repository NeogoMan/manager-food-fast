package com.fast.manger.food.data.remote.dto

import com.fast.manger.food.domain.model.User
import com.fast.manger.food.domain.model.UserRole
import com.google.gson.annotations.SerializedName

/**
 * Data Transfer Object for Authentication Response from Cloud Function
 * Matches the response from 'authenticateUser' Cloud Function
 */
data class AuthResponseDto(
    @SerializedName("success")
    val success: Boolean = false,

    @SerializedName("token")
    val token: String? = null,

    @SerializedName("user")
    val user: UserDataDto? = null,

    @SerializedName("message")
    val message: String? = null,

    @SerializedName("error")
    val error: String? = null
)

/**
 * User data within auth response
 */
data class UserDataDto(
    @SerializedName("id")
    val id: String = "",

    @SerializedName("username")
    val username: String = "",

    @SerializedName("name")
    val name: String = "",

    @SerializedName("phone")
    val phone: String? = null,

    @SerializedName("role")
    val role: String = "client"
) {
    /**
     * Convert to Domain User model
     */
    fun toDomainModel(): User {
        return User(
            id = id,
            username = username,
            name = name,
            phone = phone,
            role = UserRole.fromString(role),
            isActive = true,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
    }
}
