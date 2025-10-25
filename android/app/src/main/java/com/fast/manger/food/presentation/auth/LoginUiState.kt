package com.fast.manger.food.presentation.auth

import com.fast.manger.food.domain.model.User

/**
 * UI State for Login Screen
 */
data class LoginUiState(
    val username: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val isLoggedIn: Boolean = false,
    val currentUser: User? = null,
    val error: String? = null,
    val showNotificationPermissionSheet: Boolean = false
)
