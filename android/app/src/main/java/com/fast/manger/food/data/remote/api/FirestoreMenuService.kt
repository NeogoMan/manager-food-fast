package com.fast.manger.food.data.remote.api

import com.fast.manger.food.data.remote.dto.MenuItemDto
import com.fast.manger.food.domain.model.MenuItem
import com.fast.manger.food.domain.model.Result
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Firestore Menu Service
 * Handles menu items CRUD operations and real-time updates
 */
@Singleton
class FirestoreMenuService @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    companion object {
        private const val COLLECTION_MENU = "menu"
    }

    /**
     * Get all menu items (one-time fetch)
     */
    suspend fun getMenuItems(): Result<List<MenuItem>> {
        return try {
            val snapshot = firestore.collection(COLLECTION_MENU)
                .orderBy("name", Query.Direction.ASCENDING)
                .get()
                .await()

            val menuItems = snapshot.documents.mapNotNull { doc ->
                MenuItemDto.fromDocument(doc)?.toDomainModel(doc.id)
            }

            Result.Success(menuItems)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to fetch menu: ${e.message}"))
        }
    }

    /**
     * Get menu items by category
     */
    suspend fun getMenuItemsByCategory(category: String): Result<List<MenuItem>> {
        return try {
            val snapshot = firestore.collection(COLLECTION_MENU)
                .whereEqualTo("category", category)
                .orderBy("name", Query.Direction.ASCENDING)
                .get()
                .await()

            val menuItems = snapshot.documents.mapNotNull { doc ->
                MenuItemDto.fromDocument(doc)?.toDomainModel(doc.id)
            }

            Result.Success(menuItems)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to fetch menu by category: ${e.message}"))
        }
    }

    /**
     * Get only available menu items
     */
    suspend fun getAvailableMenuItems(): Result<List<MenuItem>> {
        return try {
            val snapshot = firestore.collection(COLLECTION_MENU)
                .whereEqualTo("isAvailable", true)
                .orderBy("name", Query.Direction.ASCENDING)
                .get()
                .await()

            val menuItems = snapshot.documents.mapNotNull { doc ->
                MenuItemDto.fromDocument(doc)?.toDomainModel(doc.id)
            }

            Result.Success(menuItems)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to fetch available menu: ${e.message}"))
        }
    }

    /**
     * Get menu item by ID
     */
    suspend fun getMenuItemById(id: String): Result<MenuItem> {
        return try {
            val document = firestore.collection(COLLECTION_MENU)
                .document(id)
                .get()
                .await()

            val menuItem = MenuItemDto.fromDocument(document)?.toDomainModel(document.id)
                ?: return Result.Error(Exception("Menu item not found"))

            Result.Success(menuItem)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to fetch menu item: ${e.message}"))
        }
    }

    /**
     * Observe menu items in real-time (Flow)
     */
    fun observeMenuItems(): Flow<Result<List<MenuItem>>> = callbackFlow {
        val listenerRegistration = firestore.collection(COLLECTION_MENU)
            .orderBy("name", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.Error(Exception("Real-time menu error: ${error.message}")))
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val menuItems = snapshot.documents.mapNotNull { doc ->
                        MenuItemDto.fromDocument(doc)?.toDomainModel(doc.id)
                    }
                    trySend(Result.Success(menuItems))
                }
            }

        awaitClose { listenerRegistration.remove() }
    }

    /**
     * Observe available menu items in real-time (Flow)
     */
    fun observeAvailableMenuItems(): Flow<Result<List<MenuItem>>> = callbackFlow {
        val listenerRegistration = firestore.collection(COLLECTION_MENU)
            .whereEqualTo("isAvailable", true)
            .orderBy("name", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.Error(Exception("Real-time menu error: ${error.message}")))
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val menuItems = snapshot.documents.mapNotNull { doc ->
                        MenuItemDto.fromDocument(doc)?.toDomainModel(doc.id)
                    }
                    trySend(Result.Success(menuItems))
                }
            }

        awaitClose { listenerRegistration.remove() }
    }

    /**
     * Observe menu items by category in real-time (Flow)
     */
    fun observeMenuItemsByCategory(category: String): Flow<Result<List<MenuItem>>> = callbackFlow {
        val listenerRegistration = firestore.collection(COLLECTION_MENU)
            .whereEqualTo("category", category)
            .orderBy("name", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(Result.Error(Exception("Real-time menu error: ${error.message}")))
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val menuItems = snapshot.documents.mapNotNull { doc ->
                        MenuItemDto.fromDocument(doc)?.toDomainModel(doc.id)
                    }
                    trySend(Result.Success(menuItems))
                }
            }

        awaitClose { listenerRegistration.remove() }
    }

    /**
     * Search menu items by name
     */
    suspend fun searchMenuItems(query: String): Result<List<MenuItem>> {
        return try {
            // Firestore doesn't support full-text search, so we fetch all and filter client-side
            val snapshot = firestore.collection(COLLECTION_MENU)
                .get()
                .await()

            val menuItems = snapshot.documents.mapNotNull { doc ->
                MenuItemDto.fromDocument(doc)?.toDomainModel(doc.id)
            }.filter { it.name.contains(query, ignoreCase = true) }

            Result.Success(menuItems)
        } catch (e: Exception) {
            Result.Error(Exception("Failed to search menu: ${e.message}"))
        }
    }
}
