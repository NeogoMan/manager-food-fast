package com.fast.manger.food.domain.usecase.auth

import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.model.User
import com.fast.manger.food.domain.repository.AuthRepository
import com.fast.manger.food.domain.usecase.notifications.RegisterFCMTokenUseCase
import javax.inject.Inject

/**
 * Use case to sign up a new client user
 * Handles validation and auto-registration of FCM token
 */
class SignUpClientUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val registerFCMTokenUseCase: RegisterFCMTokenUseCase
) {
    suspend operator fun invoke(
        restaurantId: String,
        name: String,
        phone: String,
        password: String,
        confirmPassword: String
    ): Result<User> {
        // Validate inputs
        if (name.isBlank()) {
            return Result.Error(Exception("Name is required"))
        }

        if (name.length < 2) {
            return Result.Error(Exception("Name must be at least 2 characters"))
        }

        if (phone.isBlank()) {
            return Result.Error(Exception("Phone number is required"))
        }

        // Basic phone validation (adjust regex for your country)
        val phoneRegex = """^\+?[0-9]{10,15}$""".toRegex()
        if (!phone.replace(Regex("[\\s-]"), "").matches(phoneRegex)) {
            return Result.Error(Exception("Invalid phone number format"))
        }

        if (password.isBlank()) {
            return Result.Error(Exception("Password is required"))
        }

        if (password.length < 6) {
            return Result.Error(Exception("Password must be at least 6 characters"))
        }

        if (password != confirmPassword) {
            return Result.Error(Exception("Passwords do not match"))
        }

        // Sign up user
        val result = authRepository.signUpClient(restaurantId, name, phone, password)

        // Register FCM token after successful signup
        if (result is Result.Success) {
            // Don't fail signup if FCM registration fails
            try {
                registerFCMTokenUseCase()
            } catch (e: Exception) {
                // Log error but don't propagate
                println("FCM token registration failed after signup: ${e.message}")
            }
        }

        return result
    }
}
