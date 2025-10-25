package com.fast.manger.food.presentation.profile

import com.fast.manger.food.domain.model.User

/**
 * UI State for Profile Screen
 */
data class ProfileUiState(
    val user: User? = null,
    val isLoading: Boolean = false,
    val isLoggingOut: Boolean = false,
    val logoutSuccessful: Boolean = false,
    val error: String? = null
)
