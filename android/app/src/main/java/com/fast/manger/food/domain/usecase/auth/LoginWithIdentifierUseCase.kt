package com.fast.manger.food.domain.usecase.auth

import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.model.User
import com.fast.manger.food.domain.repository.AuthRepository
import com.fast.manger.food.domain.usecase.notifications.RegisterFCMTokenUseCase
import javax.inject.Inject

/**
 * Use case to login with username or phone number
 */
class LoginWithIdentifierUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val registerFCMTokenUseCase: RegisterFCMTokenUseCase
) {
    suspend operator fun invoke(identifier: String, password: String): Result<User> {
        // Validate inputs
        if (identifier.isBlank()) {
            return Result.Error(Exception("Username or phone number is required"))
        }

        if (password.isBlank()) {
            return Result.Error(Exception("Password is required"))
        }

        // Login user
        val result = authRepository.loginWithIdentifier(identifier, password)

        // Register FCM token after successful login
        if (result is Result.Success) {
            // Don't fail login if FCM registration fails
            try {
                registerFCMTokenUseCase()
            } catch (e: Exception) {
                // Log error but don't propagate
                println("FCM token registration failed after login: ${e.message}")
            }
        }

        return result
    }
}
