package com.fast.manger.food.domain.model

/**
 * Domain model for Restaurant
 */
data class Restaurant(
    val id: String,
    val name: String,
    val shortCode: String,
    val email: String?,
    val phone: String?,
    val status: String,
    val plan: String,
    val acceptingOrders: Boolean = true
)
