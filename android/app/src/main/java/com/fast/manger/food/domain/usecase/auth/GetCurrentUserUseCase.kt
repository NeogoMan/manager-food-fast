package com.fast.manger.food.domain.usecase.auth

import com.fast.manger.food.domain.model.Result
import com.fast.manger.food.domain.model.User
import com.fast.manger.food.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * Use Case: Get Current User
 * Retrieves the currently authenticated user
 */
class GetCurrentUserUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    /**
     * Get current user (one-time)
     */
    suspend operator fun invoke(): Result<User?> {
        return authRepository.getCurrentUser()
    }

    /**
     * Observe current user (reactive)
     */
    fun observe(): Flow<User?> {
        return authRepository.observeCurrentUser()
    }
}
