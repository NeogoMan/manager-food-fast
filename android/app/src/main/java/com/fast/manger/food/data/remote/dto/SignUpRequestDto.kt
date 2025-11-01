package com.fast.manger.food.data.remote.dto

/**
 * Data Transfer Object for Client Sign Up Request
 */
data class SignUpRequestDto(
    val restaurantId: String,
    val name: String,
    val phone: String,
    val password: String
)

/**
 * Response from signUpClient Cloud Function
 * Note: Uses UserDataDto from AuthResponseDto.kt
 */
data class SignUpResponseDto(
    val success: Boolean = false,
    val token: String = "",
    val user: UserDataDto? = null
)
