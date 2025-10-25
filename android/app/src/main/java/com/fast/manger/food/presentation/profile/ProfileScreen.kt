package com.fast.manger.food.presentation.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fast.manger.food.domain.model.User
import com.fast.manger.food.presentation.components.FastFoodTopAppBar
import com.fast.manger.food.presentation.components.LoadingScreen

/**
 * Profile Screen - User profile and logout
 * Shows user information and allows logout
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onLogoutSuccess: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    var showLogoutDialog by remember { mutableStateOf(false) }

    // Navigate to login on successful logout
    LaunchedEffect(uiState.logoutSuccessful) {
        if (uiState.logoutSuccessful) {
            viewModel.resetLogoutState()
            onLogoutSuccess()
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
            FastFoodTopAppBar(title = "Profil")
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        modifier = modifier
    ) { paddingValues ->
        if (uiState.isLoading || uiState.isLoggingOut) {
            LoadingScreen(
                message = if (uiState.isLoggingOut) "Déconnexion..." else "Chargement..."
            )
        } else {
            ProfileContent(
                user = uiState.user,
                onLogoutClick = { showLogoutDialog = true },
                modifier = Modifier.padding(paddingValues)
            )
        }
    }

    // Logout confirmation dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            icon = {
                Icon(
                    imageVector = Icons.Default.ExitToApp,
                    contentDescription = "Logout"
                )
            },
            title = { Text("Déconnexion") },
            text = { Text("Êtes-vous sûr de vouloir vous déconnecter?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.logout()
                        showLogoutDialog = false
                    }
                ) {
                    Text("Confirmer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Annuler")
                }
            }
        )
    }
}

@Composable
private fun ProfileContent(
    user: User?,
    onLogoutClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(32.dp))

        // User avatar
        Icon(
            imageVector = Icons.Default.AccountCircle,
            contentDescription = "Profile",
            modifier = Modifier.size(120.dp),
            tint = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(24.dp))

        if (user != null) {
            // User info card
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Name
                    ProfileInfoRow(
                        label = "Nom",
                        value = user.name,
                        icon = Icons.Default.AccountCircle
                    )

                    // Username
                    ProfileInfoRow(
                        label = "Nom d'utilisateur",
                        value = user.username,
                        icon = Icons.Default.Info
                    )

                    // Phone
                    if (!user.phone.isNullOrBlank()) {
                        ProfileInfoRow(
                            label = "Téléphone",
                            value = user.phone,
                            icon = Icons.Default.Phone
                        )
                    }

                    // Role
                    ProfileInfoRow(
                        label = "Rôle",
                        value = user.role.getDisplayName(),
                        icon = Icons.Default.Info
                    )

                    // Status
                    ProfileInfoRow(
                        label = "Statut",
                        value = if (user.isActive) "Actif" else "Inactif",
                        icon = Icons.Default.Info
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Logout button
            OutlinedButton(
                onClick = onLogoutClick,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = Icons.Default.ExitToApp,
                    contentDescription = "Logout"
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = "Se déconnecter")
            }
        } else {
            Text(
                text = "Aucune information utilisateur disponible",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        // App version
        Text(
            text = "Version 1.0.0",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun ProfileInfoRow(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}
