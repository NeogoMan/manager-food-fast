/**
 * French translations for the Fast Food Restaurant Management System
 */

export const translations = {
  // Application Title
  appName: 'Gestionnaire Fast Food',

  // Navigation
  nav: {
    dashboard: 'Tableau de bord',
    orders: 'Commandes',
    menu: 'Menu',
    kitchen: 'Cuisine',
  },

  // Common Actions
  actions: {
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    search: 'Rechercher',
    filter: 'Filtrer',
    view: 'Voir',
    details: 'Détails',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    submit: 'Soumettre',
    close: 'Fermer',
    refresh: 'Actualiser',
    update: 'Mettre à jour',
    create: 'Créer',
  },

  // Menu Management
  menu: {
    title: 'Gestion du Menu',
    items: 'Articles du Menu',
    addItem: 'Ajouter un article',
    editItem: 'Modifier l\'article',
    deleteItem: 'Supprimer l\'article',
    noItems: 'Aucun article trouvé. Ajoutez votre premier article pour commencer !',
    categories: 'Catégories',
    all: 'Tous',
  },

  // Form Labels
  form: {
    name: 'Nom',
    description: 'Description',
    price: 'Prix',
    category: 'Catégorie',
    availability: 'Disponibilité',
    available: 'Disponible',
    unavailable: 'Indisponible',
    required: 'Requis',
    optional: 'Optionnel',
    quantity: 'Quantité',
    customerName: 'Nom du client',
    notes: 'Notes',
    specialInstructions: 'Instructions spéciales',
  },

  // Categories
  categories: {
    burgers: 'Burgers',
    sides: 'Accompagnements',
    drinks: 'Boissons',
    desserts: 'Desserts',
    salads: 'Salades',
    appetizers: 'Entrées',
  },

  // Order Management
  orders: {
    title: 'Commandes',
    newOrder: 'Nouvelle commande',
    createOrder: 'Créer une commande',
    orderNumber: 'Numéro de commande',
    orderDetails: 'Détails de la commande',
    activeOrders: 'Commandes actives',
    recentOrders: 'Commandes récentes',
    orderHistory: 'Historique des commandes',
    noActiveOrders: 'Aucune commande active',
    noOrders: 'Aucune commande trouvée',
    menuItems: 'Articles du menu',
    orderItems: 'Articles de la commande',
    clickToAdd: 'Cliquez sur les articles du menu pour les ajouter',
    customer: 'Client',
    items: 'Articles',
    item: 'Article',
    total: 'Total',
    subtotal: 'Sous-total',
    status: 'Statut',
  },

  // Order Status
  status: {
    awaiting_approval: 'En attente d\'approbation',
    rejected: 'Refusé',
    pending: 'En attente',
    preparing: 'En préparation',
    ready: 'Prêt',
    completed: 'Terminé',
    cancelled: 'Annulé',
    delivered: 'Livré',
  },

  // Kitchen Display
  kitchen: {
    title: 'Affichage Cuisine',
    display: 'Tableau de la cuisine',
    startPreparing: 'Commencer la préparation',
    markAsReady: 'Marquer comme prêt',
    completeOrder: 'Terminer la commande',
    createdAt: 'Créé le',
    noPendingOrders: 'Aucune commande en attente',
    noPreparingOrders: 'Aucune commande en préparation',
    noReadyOrders: 'Aucune commande prête',
  },

  // Messages
  messages: {
    success: 'Succès',
    error: 'Erreur',
    warning: 'Attention',
    info: 'Information',
    confirm: 'Confirmer',
    areYouSure: 'Êtes-vous sûr ?',
    yes: 'Oui',
    no: 'Non',
    ok: 'OK',
  },

  // Success Messages
  success: {
    itemAdded: 'Article ajouté avec succès',
    itemUpdated: 'Article mis à jour avec succès',
    itemDeleted: 'Article supprimé avec succès',
    orderCreated: 'Commande créée avec succès',
    orderUpdated: 'Commande mise à jour avec succès',
    changesSaved: 'Modifications enregistrées',
  },

  // Error Messages
  errors: {
    generic: 'Une erreur s\'est produite',
    tryAgain: 'Veuillez réessayer',
    invalidInput: 'Entrée invalide',
    requiredField: 'Champ requis',
    fillAllFields: 'Veuillez remplir tous les champs',
    connectionError: 'Erreur de connexion',
    loadMenuFailed: 'Échec du chargement des articles du menu',
    saveMenuFailed: 'Échec de l\'enregistrement de l\'article du menu',
    deleteMenuFailed: 'Échec de la suppression de l\'article du menu',
    updateAvailabilityFailed: 'Échec de la mise à jour de la disponibilité',
    loadOrdersFailed: 'Échec du chargement des commandes',
    createOrderFailed: 'Échec de la création de la commande',
    updateOrderFailed: 'Échec de la mise à jour de la commande',
    orderMustHaveItems: 'La commande doit contenir au moins un article',
    itemUnavailable: 'est actuellement indisponible',
  },

  // Confirmation Messages
  confirmations: {
    deleteItem: 'Supprimer cet article ?',
    cancelOrder: 'Annuler la commande ?',
    cannotUndo: 'Cette action est irréversible',
  },

  // Loading States
  loading: {
    loading: 'Chargement...',
    pleaseWait: 'Veuillez patienter',
    loadingMenu: 'Chargement du menu...',
    loadingOrders: 'Chargement des commandes...',
    loadingKitchen: 'Chargement de l\'affichage cuisine...',
  },

  // Common UI
  ui: {
    noData: 'Aucune donnée',
    notAvailable: 'Non disponible',
    showMore: 'Afficher plus',
    showLess: 'Afficher moins',
    empty: 'Vide',
    none: 'Aucun',
    select: 'Sélectionner',
    choose: 'Choisir',
    enter: 'Entrer',
  },

  // Date & Time
  dateTime: {
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
    tomorrow: 'Demain',
    now: 'Maintenant',
    createdAt: 'Créé le',
    updatedAt: 'Mis à jour le',
    lastUpdated: 'Dernière mise à jour',
  },

  // Theme
  theme: {
    darkMode: 'Mode sombre',
    lightMode: 'Mode clair',
    switchToDark: 'Passer en mode sombre',
    switchToLight: 'Passer en mode clair',
  },

  // Placeholders
  placeholders: {
    categoryExample: 'ex: Burgers',
    priceExample: 'Ex: 45,50',
    enterName: 'Entrez le nom',
    enterDescription: 'Entrez la description',
    searchItems: 'Rechercher des articles...',
  },

  // Authentication
  auth: {
    login: 'Connexion',
    logout: 'Déconnexion',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    rememberMe: 'Se souvenir de moi',
    forgotPassword: 'Mot de passe oublié',
    signIn: 'Se connecter',
    signOut: 'Se déconnecter',
    welcome: 'Bienvenue',
    loginSuccess: 'Connexion réussie',
    logoutSuccess: 'Déconnexion réussie',
    invalidCredentials: 'Identifiants invalides',
    sessionExpired: 'Session expirée',
    pleaseLogin: 'Veuillez vous connecter',
    unauthorized: 'Non autorisé',
    accessDenied: 'Accès refusé',
    noPermission: 'Vous n\'avez pas la permission',
  },

  // User Management
  users: {
    title: 'Gestion des Utilisateurs',
    users: 'Utilisateurs',
    user: 'Utilisateur',
    addUser: 'Ajouter un utilisateur',
    editUser: 'Modifier l\'utilisateur',
    deleteUser: 'Supprimer l\'utilisateur',
    createUser: 'Créer un utilisateur',
    newUser: 'Nouvel utilisateur',
    userDetails: 'Détails de l\'utilisateur',
    userList: 'Liste des utilisateurs',
    noUsers: 'Aucun utilisateur trouvé',
    searchUsers: 'Rechercher des utilisateurs...',

    // User Fields
    name: 'Nom',
    fullName: 'Nom complet',
    phone: 'Téléphone',
    phoneNumber: 'Numéro de téléphone',
    email: 'Email',
    address: 'Adresse',
    role: 'Rôle',
    status: 'Statut',
    createdDate: 'Date de création',
    createdBy: 'Créé par',
    lastLogin: 'Dernière connexion',

    // Roles
    manager: 'Gestionnaire',
    cashier: 'Caissier / Caissière',
    cook: 'Cuisinier / Cuisinière',
    client: 'Client',
    selectRole: 'Sélectionner un rôle',

    // Status
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',

    // Permissions
    permissions: 'Permissions',
    accessLevel: 'Niveau d\'accès',
    fullAccess: 'Accès complet',
    limitedAccess: 'Accès limité',
    noAccess: 'Aucun accès',

    // Messages
    userCreated: 'Utilisateur créé avec succès',
    userUpdated: 'Utilisateur mis à jour avec succès',
    userDeleted: 'Utilisateur supprimé avec succès',
    cannotDeleteSelf: 'Vous ne pouvez pas supprimer votre propre compte',
    userHasOrders: 'Cet utilisateur a des commandes associées',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
    deleteWarning: 'Cette action est irréversible',
  },

  // Client Interface
  client: {
    myCart: 'Mon Panier',
    myOrders: 'Mes Commandes',
    myProfile: 'Mon Profil',
    trackOrder: 'Suivre la commande',
    orderHistory: 'Historique des commandes',
    addToCart: 'Ajouter au panier',
    removeFromCart: 'Retirer du panier',
    viewMenu: 'Voir le menu',
    browseProducts: 'Parcourir les produits',
    placeOrder: 'Passer la commande',
    checkout: 'Finaliser la commande',
    continueShopping: 'Continuer mes achats',
    cartEmpty: 'Votre panier est vide',
    goToCheckout: 'Aller au paiement',
    itemsInCart: 'articles dans le panier',
    orderPlaced: 'Commande passée avec succès',
    orderNumber: 'Numéro de commande',
    estimatedTime: 'Temps estimé',
    cancelOrder: 'Annuler la commande',
    reorder: 'Commander à nouveau',
  },

  // Order Approval
  approval: {
    newClientOrder: 'Nouvelle commande client',
    client: 'Client',
    order: 'Commande',
    items: 'articles',
    total: 'Total',
    minutesAgo: 'Il y a',
    minutes: 'minutes',
    pendingApproval: 'En attente d\'approbation',
    ordersAwaitingApproval: 'commandes en attente d\'approbation',
    accept: 'Accepter',
    reject: 'Refuser',
    yourOrderIsAwaitingApproval: 'Votre commande est en attente d\'approbation',
    yourOrderHasBeenAccepted: 'Votre commande a été acceptée',
    yourOrderHasBeenRejected: 'Votre commande a été refusée',
    pleaseContactRestaurant: 'Veuillez contacter le restaurant',
    orderSentSuccessfully: 'Commande envoyée avec succès',
    orderIsBeingValidated: 'Votre commande est en cours de validation par le restaurant',
    rejectionReason: 'Raison du refus',
  },

  // Dashboard
  dashboard: {
    title: 'Tableau de bord',
    subtitle: 'Vue d\'ensemble des statistiques et de l\'activité du restaurant',

    // Filters
    filters: {
      title: 'Filtres',
      dateRange: 'Plage de dates',
      caissier: 'Caissier / Caissière',
      cuisinier: 'Cuisinier / Cuisinière',
      product: 'Produit',
      status: 'Statut',
      apply: 'Appliquer les filtres',
      reset: 'Réinitialiser',
      allCaissiers: 'Tous les caissiers',
      allCuisiniers: 'Tous les cuisiniers',
      allProducts: 'Tous les produits',
      allStatuses: 'Tous les statuts',
      unassigned: 'Non assigné',
      guest: 'Invité',
    },

    // Date Range Options
    dateRange: {
      today: 'Aujourd\'hui',
      yesterday: 'Hier',
      thisWeek: 'Cette semaine',
      thisMonth: 'Ce mois',
      lastMonth: 'Mois dernier',
      custom: 'Personnalisé',
      startDate: 'Date de début',
      endDate: 'Date de fin',
    },

    // Summary Cards
    summary: {
      totalOrders: 'Commandes totales',
      totalRevenue: 'Chiffre d\'affaires',
      averageOrderValue: 'Panier moyen',
      completedOrders: 'Commandes terminées',
      pendingOrders: 'Commandes en cours',
      cancelledOrders: 'Commandes annulées',
      completedPercentage: 'Taux de réussite',
    },

    // Sections
    sections: {
      topProducts: 'Produits les plus vendus',
      ordersByStatus: 'Commandes par statut',
      ordersByCaissier: 'Commandes par caissier',
      ordersByCuisinier: 'Commandes par cuisinier',
      revenueOverTime: 'Chiffre d\'affaires dans le temps',
      recentOrders: 'Commandes récentes',
      clientTypeStats: 'Statistiques par type de client',
    },

    // Table Headers
    table: {
      productName: 'Nom du produit',
      quantity: 'Quantité',
      revenue: 'Chiffre d\'affaires',
      percentage: 'Pourcentage',
      orderCount: 'Nombre de commandes',
      orderId: 'Numéro',
      client: 'Client',
      date: 'Date',
      time: 'Heure',
      total: 'Total',
      status: 'Statut',
      actions: 'Actions',
      caissier: 'Caissier',
      cuisinier: 'Cuisinier',
      ordersPrepared: 'Commandes préparées',
      averageValue: 'Valeur moyenne',
    },

    // No Data Messages
    noData: {
      noOrders: 'Aucune commande trouvée pour les filtres sélectionnés',
      noProducts: 'Aucun produit vendu pour la période sélectionnée',
      noData: 'Aucune donnée disponible',
      loading: 'Chargement des statistiques...',
      error: 'Erreur lors du chargement des données',
    },

    // Client Types
    clientType: {
      registered: 'Clients inscrits',
      guest: 'Invités',
    },

    // Currency
    currency: 'DH',
  },
};

// Export individual sections for easier access
export const {
  appName,
  nav,
  actions,
  menu,
  form,
  categories,
  orders,
  status,
  kitchen,
  messages,
  success,
  errors,
  confirmations,
  loading,
  ui,
  dateTime,
  theme,
  placeholders,
  auth,
  users,
  client,
  approval,
  dashboard
} = translations;

export default translations;
