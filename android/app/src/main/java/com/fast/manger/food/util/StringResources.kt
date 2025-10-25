package com.fast.manger.food.util

/**
 * String resources for French translations
 * Centralized location for all app strings
 */
object StringResources {

    object Auth {
        const val LOGIN_TITLE = "Fast Food Manager"
        const val LOGIN_SUBTITLE = "Client"
        const val USERNAME_LABEL = "Nom d'utilisateur"
        const val PASSWORD_LABEL = "Mot de passe"
        const val LOGIN_BUTTON = "Se connecter"
        const val LOGGING_IN = "Connexion en cours..."
        const val LOGIN_ERROR = "Erreur de connexion"
        const val USERNAME_REQUIRED = "Le nom d'utilisateur est requis"
        const val PASSWORD_REQUIRED = "Le mot de passe doit contenir au moins 6 caractères"
        const val LOGOUT = "Se déconnecter"
        const val LOGOUT_CONFIRM_TITLE = "Déconnexion"
        const val LOGOUT_CONFIRM_MESSAGE = "Êtes-vous sûr de vouloir vous déconnecter?"
        const val LOGGING_OUT = "Déconnexion..."
    }

    object Menu {
        const val TITLE = "Menu"
        const val SEARCH_PLACEHOLDER = "Rechercher un plat..."
        const val CATEGORY_ALL = "Tout"
        const val LOADING = "Chargement du menu..."
        const val EMPTY_MESSAGE = "Aucun plat disponible"
        const val EMPTY_SEARCH = "Aucun plat trouvé pour"
        const val ADD_TO_CART = "Ajouter au panier"
        const val UNAVAILABLE = "Indisponible"
        const val ADDED_TO_CART = "Ajouté au panier"
    }

    object Cart {
        const val TITLE = "Panier"
        const val EMPTY_MESSAGE = "Votre panier est vide"
        const val LOADING = "Chargement du panier..."
        const val ORDER_NOTES_LABEL = "Notes pour la commande (optionnel)"
        const val ORDER_NOTES_PLACEHOLDER = "Ajoutez des instructions spéciales..."
        const val CLEAR_CART = "Vider le panier"
        const val CLEAR_CART_CONFIRM_TITLE = "Vider le panier"
        const val CLEAR_CART_CONFIRM_MESSAGE = "Êtes-vous sûr de vouloir vider votre panier?"
        const val TOTAL = "Total"
        const val PLACE_ORDER = "Passer la commande"
        const val PLACING_ORDER = "Commande en cours..."
        const val ORDER_SUCCESS = "Commande passée avec succès!"
        const val INCREASE = "Augmenter"
        const val DECREASE = "Diminuer"
        const val REMOVE = "Supprimer"
        const val NOTE_PREFIX = "Note:"
    }

    object Orders {
        const val TITLE = "Mes Commandes"
        const val TAB_ACTIVE = "Actives"
        const val TAB_ALL = "Historique"
        const val EMPTY_ACTIVE = "Aucune commande active"
        const val EMPTY_ALL = "Aucune commande"
        const val LOADING = "Chargement des commandes..."
        const val CANCEL_ORDER = "Annuler"
        const val CANCELLING = "Annulation..."
        const val CANCEL_CONFIRM_TITLE = "Annuler la commande"
        const val CANCEL_CONFIRM_MESSAGE = "Êtes-vous sûr de vouloir annuler cette commande?"
        const val ORDER_NUMBER = "N° de commande"
        const val NOTES_PREFIX = "Notes:"
        const val ITEMS_PREFIX = "Articles:"
    }

    object Profile {
        const val TITLE = "Profil"
        const val LOADING = "Chargement..."
        const val NAME = "Nom"
        const val USERNAME = "Nom d'utilisateur"
        const val PHONE = "Téléphone"
        const val ROLE = "Rôle"
        const val STATUS = "Statut"
        const val STATUS_ACTIVE = "Actif"
        const val STATUS_INACTIVE = "Inactif"
        const val NO_INFO = "Aucune information utilisateur disponible"
        const val VERSION = "Version"
    }

    object Common {
        const val CONFIRM = "Confirmer"
        const val CANCEL = "Annuler"
        const val BACK = "Retour"
        const val RETRY = "Réessayer"
        const val SEARCH = "Rechercher"
        const val CLEAR = "Effacer"
        const val LOADING = "Chargement..."
        const val ERROR = "Erreur"
        const val SUCCESS = "Succès"
        const val TODAY = "Aujourd'hui"
        const val YESTERDAY = "Hier"
        const val AT = "à"
    }

    object Errors {
        const val UNKNOWN = "Erreur inconnue"
        const val NETWORK = "Erreur de connexion"
        const val SERVER = "Erreur du serveur"
        const val NOT_FOUND = "Non trouvé"
        const val UNAUTHORIZED = "Non autorisé"
        const val VALIDATION = "Erreur de validation"
        const val EMPTY_CART = "Le panier est vide"
        const val ORDER_NOT_FOUND = "Commande introuvable"
        const val CANNOT_CANCEL = "Cette commande ne peut plus être annulée"
        const val ITEM_UNAVAILABLE = "Cet article n'est plus disponible"
    }

    object OrderStatus {
        const val AWAITING_APPROVAL = "En attente d'approbation"
        const val PENDING = "En attente"
        const val PREPARING = "En préparation"
        const val READY = "Prête"
        const val COMPLETED = "Terminée"
        const val REJECTED = "Rejetée"
    }

    object MenuCategory {
        const val BURGERS = "Burgers"
        const val SIDES = "Accompagnements"
        const val DRINKS = "Boissons"
        const val DESSERTS = "Desserts"
        const val SALADS = "Salades"
        const val APPETIZERS = "Entrées"
    }

    object UserRole {
        const val CLIENT = "Client"
        const val MANAGER = "Gestionnaire"
        const val CASHIER = "Caissier"
        const val COOK = "Cuisinier"
    }

    object PaymentStatus {
        const val PAID = "Payé"
        const val UNPAID = "Non payé"
        const val REFUNDED = "Remboursé"
    }
}
