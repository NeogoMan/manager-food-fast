package com.fast.manger.food.di

import com.fast.manger.food.data.remote.api.FirebaseAuthService
import com.fast.manger.food.data.remote.api.FirestoreMenuService
import com.fast.manger.food.data.remote.api.FirestoreOrderService
import com.fast.manger.food.data.remote.api.FirestoreUserService
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.functions.FirebaseFunctions
import com.google.firebase.messaging.FirebaseMessaging
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Firebase Module - Provides Firebase instances and services
 */
@Module
@InstallIn(SingletonComponent::class)
object FirebaseModule {

    /**
     * Provides Firebase Authentication instance
     */
    @Provides
    @Singleton
    fun provideFirebaseAuth(): FirebaseAuth {
        return FirebaseAuth.getInstance()
    }

    /**
     * Provides Firebase Firestore instance
     */
    @Provides
    @Singleton
    fun provideFirebaseFirestore(): FirebaseFirestore {
        return FirebaseFirestore.getInstance()
    }

    /**
     * Provides Firebase Functions instance
     */
    @Provides
    @Singleton
    fun provideFirebaseFunctions(): FirebaseFunctions {
        return FirebaseFunctions.getInstance()
    }

    /**
     * Provides Firebase Auth Service
     */
    @Provides
    @Singleton
    fun provideFirebaseAuthService(
        firebaseAuth: FirebaseAuth,
        firebaseFunctions: FirebaseFunctions
    ): FirebaseAuthService {
        return FirebaseAuthService(firebaseAuth, firebaseFunctions)
    }

    /**
     * Provides Firestore Menu Service
     */
    @Provides
    @Singleton
    fun provideFirestoreMenuService(firestore: FirebaseFirestore): FirestoreMenuService {
        return FirestoreMenuService(firestore)
    }

    /**
     * Provides Firestore Order Service
     */
    @Provides
    @Singleton
    fun provideFirestoreOrderService(firestore: FirebaseFirestore): FirestoreOrderService {
        return FirestoreOrderService(firestore)
    }

    /**
     * Provides Firestore User Service
     */
    @Provides
    @Singleton
    fun provideFirestoreUserService(firestore: FirebaseFirestore): FirestoreUserService {
        return FirestoreUserService(firestore)
    }

    /**
     * Provides Firebase Messaging instance
     */
    @Provides
    @Singleton
    fun provideFirebaseMessaging(): FirebaseMessaging {
        return FirebaseMessaging.getInstance()
    }
}
