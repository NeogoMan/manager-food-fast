package com.fast.manger.food.domain.usecase.auth

import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.model.User
import com.fast.manger.food.domain.repository.AuthRepository
import javax.inject.Inject

/**
 * Use Case: Login User
 * Validates credentials and authenticates user
 */
class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    /**
     * Execute login
     * @param username User's username
     * @param password User's password
     * @return Result with authenticated User or error
     */
    suspend operator fun invoke(username: String, password: String): Result<User> {
        // Validate input
        if (username.isBlank()) {
            return Result.Error(Exception("Le nom d'utilisateur est requis"))
        }

        if (password.isBlank()) {
            return Result.Error(Exception("Le mot de passe est requis"))
        }

        if (username.length < 3) {
            return Result.Error(Exception("Le nom d'utilisateur doit contenir au moins 3 caractères"))
        }

        if (password.length < 6) {
            return Result.Error(Exception("Le mot de passe doit contenir au moins 6 caractères"))
        }

        // Perform login
        return authRepository.login(username, password)
    }
}
