package com.fast.manger.food.presentation.cart

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fast.manger.food.domain.model.CartItem
import com.fast.manger.food.presentation.components.EmptyStateScreen
import com.fast.manger.food.presentation.components.FastFoodTopAppBar
import com.fast.manger.food.presentation.components.LoadingScreen
import com.fast.manger.food.presentation.components.PrimaryButton

/**
 * Cart Screen - Review cart and place order
 * Shows cart items with quantity controls and order placement
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartScreen(
    onNavigateBack: () -> Unit,
    onOrderPlaced: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: CartViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    var showClearDialog by remember { mutableStateOf(false) }

    // Navigate to orders on successful order placement
    LaunchedEffect(uiState.orderPlacedSuccessfully) {
        if (uiState.orderPlacedSuccessfully) {
            snackbarHostState.showSnackbar("Commande passée avec succès!")
            viewModel.resetOrderPlacedState()
            onOrderPlaced()
        }
    }

    // Show error message
    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            FastFoodTopAppBar(
                title = "Panier",
                onNavigateBack = onNavigateBack
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        modifier = modifier
    ) { paddingValues ->
        if (uiState.isLoading) {
            LoadingScreen(message = "Chargement du panier...")
        } else if (uiState.cartItems.isEmpty()) {
            EmptyStateScreen(
                message = "Votre panier est vide",
                icon = Icons.Default.ShoppingBag
            )
        } else {
            CartContent(
                cartItems = uiState.cartItems,
                totalAmount = uiState.totalAmount,
                orderNotes = uiState.orderNotes,
                isPlacingOrder = uiState.isPlacingOrder,
                onQuantityIncrease = { item ->
                    viewModel.updateQuantity(item.menuItem.id, item.notes, item.quantity + 1)
                },
                onQuantityDecrease = { item ->
                    viewModel.updateQuantity(item.menuItem.id, item.notes, item.quantity - 1)
                },
                onRemoveItem = { item ->
                    viewModel.removeItem(item.menuItem.id, item.notes)
                },
                onOrderNotesChange = viewModel::onOrderNotesChange,
                onPlaceOrder = viewModel::placeOrder,
                onClearCart = { showClearDialog = true },
                modifier = Modifier.padding(paddingValues)
            )
        }
    }

    // Clear cart confirmation dialog
    if (showClearDialog) {
        AlertDialog(
            onDismissRequest = { showClearDialog = false },
            title = { Text("Vider le panier") },
            text = { Text("Êtes-vous sûr de vouloir vider votre panier?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.clearCart()
                        showClearDialog = false
                    }
                ) {
                    Text("Confirmer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearDialog = false }) {
                    Text("Annuler")
                }
            }
        )
    }
}

@Composable
private fun CartContent(
    cartItems: List<CartItem>,
    totalAmount: Double,
    orderNotes: String,
    isPlacingOrder: Boolean,
    onQuantityIncrease: (CartItem) -> Unit,
    onQuantityDecrease: (CartItem) -> Unit,
    onRemoveItem: (CartItem) -> Unit,
    onOrderNotesChange: (String) -> Unit,
    onPlaceOrder: () -> Unit,
    onClearCart: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize()
    ) {
        // Cart items list
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(
                items = cartItems,
                key = { "${it.menuItem.id}_${it.notes}" }
            ) { cartItem ->
                CartItemCard(
                    cartItem = cartItem,
                    onQuantityIncrease = { onQuantityIncrease(cartItem) },
                    onQuantityDecrease = { onQuantityDecrease(cartItem) },
                    onRemove = { onRemoveItem(cartItem) }
                )
            }

            // Order notes
            item {
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = orderNotes,
                    onValueChange = onOrderNotesChange,
                    label = { Text("Notes pour la commande (optionnel)") },
                    placeholder = { Text("Ajoutez des instructions spéciales...") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Clear cart button
            item {
                TextButton(
                    onClick = onClearCart,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Vider le panier",
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }

        // Bottom section with total and place order button
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Total
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Total",
                    style = MaterialTheme.typography.titleLarge
                )
                Text(
                    text = "${String.format("%.2f", totalAmount)} MAD",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Place order button
            PrimaryButton(
                text = "Passer la commande (${cartItems.size} items)",
                onClick = onPlaceOrder,
                isLoading = isPlacingOrder,
                enabled = cartItems.isNotEmpty() && !isPlacingOrder
            )
        }
    }
}

@Composable
private fun CartItemCard(
    cartItem: CartItem,
    onQuantityIncrease: () -> Unit,
    onQuantityDecrease: () -> Unit,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = cartItem.menuItem.name,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (!cartItem.notes.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Note: ${cartItem.notes}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                IconButton(onClick = onRemove) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Supprimer",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Quantity controls
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onQuantityDecrease,
                        enabled = cartItem.quantity > 1
                    ) {
                        Icon(
                            imageVector = Icons.Default.Remove,
                            contentDescription = "Diminuer"
                        )
                    }
                    Text(
                        text = cartItem.quantity.toString(),
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(horizontal = 8.dp)
                    )
                    IconButton(onClick = onQuantityIncrease) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Augmenter"
                        )
                    }
                }

                // Price
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "${String.format("%.2f", cartItem.subtotal)} MAD",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    if (cartItem.quantity > 1) {
                        Text(
                            text = "${String.format("%.2f", cartItem.menuItem.price)} MAD × ${cartItem.quantity}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}
