package com.fast.manger.food.di

import com.fast.manger.food.data.repository.AuthRepositoryImpl
import com.fast.manger.food.data.repository.CartRepositoryImpl
import com.fast.manger.food.data.repository.MenuRepositoryImpl
import com.fast.manger.food.data.repository.OrderRepositoryImpl
import com.fast.manger.food.data.repository.RestaurantRepositoryImpl
import com.fast.manger.food.domain.repository.AuthRepository
import com.fast.manger.food.domain.repository.CartRepository
import com.fast.manger.food.domain.repository.MenuRepository
import com.fast.manger.food.domain.repository.OrderRepository
import com.fast.manger.food.domain.repository.RestaurantRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Repository Module - Binds repository implementations to interfaces
 * Using @Binds for better performance than @Provides
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    /**
     * Binds AuthRepositoryImpl to AuthRepository interface
     */
    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        authRepositoryImpl: AuthRepositoryImpl
    ): AuthRepository

    /**
     * Binds MenuRepositoryImpl to MenuRepository interface
     */
    @Binds
    @Singleton
    abstract fun bindMenuRepository(
        menuRepositoryImpl: MenuRepositoryImpl
    ): MenuRepository

    /**
     * Binds OrderRepositoryImpl to OrderRepository interface
     */
    @Binds
    @Singleton
    abstract fun bindOrderRepository(
        orderRepositoryImpl: OrderRepositoryImpl
    ): OrderRepository

    /**
     * Binds CartRepositoryImpl to CartRepository interface
     */
    @Binds
    @Singleton
    abstract fun bindCartRepository(
        cartRepositoryImpl: CartRepositoryImpl
    ): CartRepository

    /**
     * Binds RestaurantRepositoryImpl to RestaurantRepository interface
     */
    @Binds
    @Singleton
    abstract fun bindRestaurantRepository(
        restaurantRepositoryImpl: RestaurantRepositoryImpl
    ): RestaurantRepository
}
