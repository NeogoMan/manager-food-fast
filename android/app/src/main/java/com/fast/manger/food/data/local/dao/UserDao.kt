package com.fast.manger.food.data.local.dao

import androidx.room.*
import com.fast.manger.food.data.local.entity.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    /**
     * Observe current user
     */
    @Query("SELECT * FROM users LIMIT 1")
    fun observeCurrentUser(): Flow<UserEntity?>

    /**
     * Get current user (one-time)
     */
    @Query("SELECT * FROM users LIMIT 1")
    suspend fun getCurrentUser(): UserEntity?

    /**
     * Get user by ID
     */
    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getById(id: String): UserEntity?

    /**
     * Get user by username
     */
    @Query("SELECT * FROM users WHERE username = :username")
    suspend fun getByUsername(username: String): UserEntity?

    /**
     * Insert user (replace if exists)
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: UserEntity)

    /**
     * Update user
     */
    @Update
    suspend fun update(user: UserEntity)

    /**
     * Delete user
     */
    @Delete
    suspend fun delete(user: UserEntity)

    /**
     * Delete all users (for logout)
     */
    @Query("DELETE FROM users")
    suspend fun deleteAll()

    /**
     * Check if user exists
     */
    @Query("SELECT COUNT(*) > 0 FROM users WHERE id = :id")
    suspend fun exists(id: String): Boolean
}
