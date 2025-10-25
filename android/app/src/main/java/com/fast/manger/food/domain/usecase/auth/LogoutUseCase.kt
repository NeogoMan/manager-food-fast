package com.fast.manger.food.domain.usecase.auth

import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.repository.AuthRepository
import com.fast.manger.food.domain.repository.CartRepository
import javax.inject.Inject

/**
 * Use Case: Logout User
 * Clears user session and all cached data
 */
class LogoutUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val cartRepository: CartRepository
) {
    /**
     * Execute logout
     * Clears authentication, cart, and all user data
     */
    suspend operator fun invoke(): Result<Unit> {
        return try {
            // Clear cart first
            cartRepository.clearCart()

            // Logout from Firebase
            authRepository.logout()
        } catch (e: Exception) {
            Result.Error(Exception("Échec de la déconnexion: ${e.message}"))
        }
    }
}
