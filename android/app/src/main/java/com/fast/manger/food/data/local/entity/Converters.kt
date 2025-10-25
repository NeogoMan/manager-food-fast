package com.fast.manger.food.data.local.entity

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

/**
 * Room Type Converters
 * Converts complex types to/from primitive types for database storage
 */
class Converters {
    private val gson = Gson()

    /**
     * Convert List<OrderItemEntity> to JSON string
     */
    @TypeConverter
    fun fromOrderItemList(value: List<OrderItemEntity>?): String? {
        return value?.let { gson.toJson(it) }
    }

    /**
     * Convert JSON string to List<OrderItemEntity>
     */
    @TypeConverter
    fun toOrderItemList(value: String?): List<OrderItemEntity>? {
        return value?.let {
            val type = object : TypeToken<List<OrderItemEntity>>() {}.type
            gson.fromJson(it, type)
        }
    }

    /**
     * Convert List<String> to JSON string
     */
    @TypeConverter
    fun fromStringList(value: List<String>?): String? {
        return value?.let { gson.toJson(it) }
    }

    /**
     * Convert JSON string to List<String>
     */
    @TypeConverter
    fun toStringList(value: String?): List<String>? {
        return value?.let {
            val type = object : TypeToken<List<String>>() {}.type
            gson.fromJson(it, type)
        }
    }
}
