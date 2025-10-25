package com.fast.manger.food.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.fast.manger.food.domain.model.User
import com.fast.manger.food.domain.model.UserRole

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey
    val id: String,
    val username: String,
    val name: String,
    val phone: String? = null,
    val role: String,
    val isActive: Boolean = true,
    val fcmToken: String? = null,
    val fcmTokenUpdatedAt: Long? = null,
    val createdAt: Long,
    val updatedAt: Long
) {
    fun toDomainModel(): User {
        return User(
            id = id,
            username = username,
            name = name,
            phone = phone,
            role = UserRole.fromString(role),
            isActive = isActive,
            fcmToken = fcmToken,
            fcmTokenUpdatedAt = fcmTokenUpdatedAt,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }

    companion object {
        fun fromDomainModel(user: User): UserEntity {
            return UserEntity(
                id = user.id,
                username = user.username,
                name = user.name,
                phone = user.phone,
                role = user.role.toApiString(),
                isActive = user.isActive,
                fcmToken = user.fcmToken,
                fcmTokenUpdatedAt = user.fcmTokenUpdatedAt,
                createdAt = user.createdAt,
                updatedAt = user.updatedAt
            )
        }
    }
}
