package com.fast.manger.food.data.remote.dto

import com.fast.manger.food.domain.model.Restaurant

/**
 * Data Transfer Object for Restaurant from Firebase
 */
data class RestaurantDto(
    val id: String = "",
    val name: String = "",
    val shortCode: String = "",
    val email: String? = null,
    val phone: String? = null,
    val status: String = "",
    val plan: String = "",
    val branding: BrandingDto? = null
)

/**
 * Restaurant branding information
 */
data class BrandingDto(
    val logoUrl: String? = null,
    val primaryColor: String? = null,
    val secondaryColor: String? = null,
    val accentColor: String? = null
)

/**
 * Extension function to convert RestaurantDto to Domain Model
 */
fun RestaurantDto.toDomain(): Restaurant {
    return Restaurant(
        id = id,
        name = name,
        shortCode = shortCode,
        email = email,
        phone = phone,
        status = status,
        plan = plan
    )
}
