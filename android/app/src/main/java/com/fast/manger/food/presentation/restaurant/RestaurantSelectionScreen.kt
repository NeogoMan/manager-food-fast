package com.fast.manger.food.presentation.restaurant

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fast.manger.food.domain.model.Restaurant
import com.fast.manger.food.presentation.components.FastFoodTopAppBar
import com.fast.manger.food.presentation.components.LoadingScreen

/**
 * Restaurant Selection Screen
 * Allows user to select which restaurant to access from their list
 * Users with multiple restaurant access will see this screen after login
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RestaurantSelectionScreen(
    onRestaurantSelected: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: RestaurantSelectionViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    // Navigate to menu when selection is successful
    LaunchedEffect(uiState.selectionSuccessful) {
        if (uiState.selectionSuccessful) {
            viewModel.resetSelectionState()
            onRestaurantSelected()
        }
    }

    // Show error messages
    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }

    // Show success messages
    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearSuccessMessage()
        }
    }

    Scaffold(
        topBar = {
            FastFoodTopAppBar(
                title = "Sélectionner un Restaurant"
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.showAddRestaurantDialog() }
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Ajouter un restaurant"
                )
            }
        },
        modifier = modifier
    ) { paddingValues ->
        if (uiState.isLoading) {
            LoadingScreen(message = "Chargement des restaurants...")
        } else {
            RestaurantListContent(
                restaurants = uiState.restaurants,
                activeRestaurantId = uiState.activeRestaurantId,
                isSettingActive = uiState.isSettingActive,
                onRestaurantClick = { restaurant ->
                    viewModel.selectRestaurant(restaurant.id)
                },
                modifier = Modifier.padding(paddingValues)
            )
        }
    }

    // Add restaurant dialog
    if (uiState.showAddRestaurantDialog) {
        AddRestaurantDialog(
            restaurantCode = uiState.addRestaurantCode,
            isAdding = uiState.isAddingRestaurant,
            onCodeChange = { viewModel.updateRestaurantCode(it) },
            onConfirm = { viewModel.addRestaurant() },
            onDismiss = { viewModel.hideAddRestaurantDialog() }
        )
    }
}

@Composable
private fun RestaurantListContent(
    restaurants: List<Restaurant>,
    activeRestaurantId: String?,
    isSettingActive: Boolean,
    onRestaurantClick: (Restaurant) -> Unit,
    modifier: Modifier = Modifier
) {
    if (restaurants.isEmpty()) {
        EmptyRestaurantsView(modifier = modifier)
    } else {
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text(
                    text = "Choisissez le restaurant à gérer :",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            items(restaurants) { restaurant ->
                RestaurantCard(
                    restaurant = restaurant,
                    isActive = restaurant.id == activeRestaurantId,
                    isLoading = isSettingActive && restaurant.id != activeRestaurantId,
                    onClick = { onRestaurantClick(restaurant) }
                )
            }

            item {
                Spacer(modifier = Modifier.height(72.dp)) // FAB padding
            }
        }
    }
}

@Composable
private fun RestaurantCard(
    restaurant: Restaurant,
    isActive: Boolean,
    isLoading: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isActive) {
                MaterialTheme.colorScheme.primaryContainer
            } else {
                MaterialTheme.colorScheme.surface
            }
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isActive) 4.dp else 2.dp
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Restaurant,
                contentDescription = null,
                tint = if (isActive) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                }
            )

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = restaurant.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                    color = if (isActive) {
                        MaterialTheme.colorScheme.onPrimaryContainer
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    }
                )
                Text(
                    text = "Code: ${restaurant.shortCode}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (isActive) {
                        MaterialTheme.colorScheme.onPrimaryContainer
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    }
                )
            }

            if (isActive) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Restaurant actif",
                    tint = MaterialTheme.colorScheme.primary
                )
            } else {
                RadioButton(
                    selected = false,
                    onClick = onClick,
                    enabled = !isLoading
                )
            }
        }
    }
}

@Composable
private fun EmptyRestaurantsView(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.Restaurant,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.height(80.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Aucun restaurant",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Ajoutez un restaurant en utilisant le bouton + ci-dessous",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun AddRestaurantDialog(
    restaurantCode: String,
    isAdding: Boolean,
    onCodeChange: (String) -> Unit,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = { if (!isAdding) onDismiss() },
        icon = {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = "Ajouter un restaurant"
            )
        },
        title = {
            Text("Ajouter un Restaurant")
        },
        text = {
            Column {
                Text(
                    text = "Entrez le code du restaurant que vous souhaitez ajouter",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                OutlinedTextField(
                    value = restaurantCode,
                    onValueChange = onCodeChange,
                    label = { Text("Code Restaurant") },
                    placeholder = { Text("Ex: MN0UTJ") },
                    singleLine = true,
                    enabled = !isAdding,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !isAdding && restaurantCode.isNotBlank()
            ) {
                Text(if (isAdding) "Ajout..." else "Ajouter")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isAdding
            ) {
                Text("Annuler")
            }
        }
    )
}
