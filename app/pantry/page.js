<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon garde-manger vivant</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #fef9e7 0%, #f5f5dc 100%);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }

        /* Formes organiques en arrière-plan */
        .organic-bg {
            position: fixed;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: -1;
            overflow: hidden;
        }

        .organic-shape {
            position: absolute;
            border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
            animation: float 20s ease-in-out infinite;
            opacity: 0.5;
        }

        .shape1 {
            width: 300px;
            height: 300px;
            background: linear-gradient(135deg, #daa520 0%, #ffd700 100%);
            top: -150px;
            left: -100px;
            animation-duration: 25s;
        }

        .shape2 {
            width: 400px;
            height: 400px;
            background: linear-gradient(135deg, #a0d468 0%, #6ba644 100%);
            bottom: -200px;
            right: -150px;
            animation-duration: 30s;
            animation-delay: 5s;
        }

        .shape3 {
            width: 250px;
            height: 250px;
            background: linear-gradient(135deg, #d4a574 0%, #b8956a 100%);
            top: 50%;
            left: -125px;
            animation-duration: 22s;
            animation-delay: 10s;
        }

        .shape4 {
            width: 350px;
            height: 350px;
            background: linear-gradient(135deg, #e6d5b8 0%, #d4c4a8 100%);
            bottom: 20%;
            right: 10%;
            animation-duration: 28s;
            animation-delay: 15s;
        }

        @keyframes float {
            0%, 100% {
                transform: translate(0, 0) rotate(0deg) scale(1);
            }
            25% {
                transform: translate(30px, -30px) rotate(90deg) scale(1.05);
            }
            50% {
                transform: translate(-20px, 20px) rotate(180deg) scale(0.95);
            }
            75% {
                transform: translate(40px, 10px) rotate(270deg) scale(1.02);
            }
        }

        /* Navigation */
        nav {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 15px 30px;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: center;
            gap: 20px;
        }

        .nav-btn {
            padding: 10px 20px;
            background: transparent;
            border: none;
            color: #666;
            font-size: 15px;
            cursor: pointer;
            border-radius: 25px;
            transition: all 0.3s ease;
            font-weight: 500;
        }

        .nav-btn:hover {
            background: #f0f0f0;
            color: #333;
        }

        .nav-btn.active {
            background: linear-gradient(135deg, #6ba644 0%, #8bc34a 100%);
            color: white;
        }

        /* Container principal */
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        /* Header avec titre et stats */
        .header-section {
            background: white;
            border-radius: 30px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
        }

        .header-section::before {
            content: "🌿";
            position: absolute;
            top: -20px;
            right: -20px;
            font-size: 100px;
            opacity: 0.1;
            transform: rotate(-15deg);
        }

        .header-title {
            font-size: 32px;
            color: #2c3e50;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .header-subtitle {
            color: #7f8c8d;
            font-size: 16px;
            margin-bottom: 30px;
        }

        .stats-container {
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
        }

        .stat-card {
            flex: 1;
            min-width: 150px;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 20px;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .stat-number {
            font-size: 36px;
            font-weight: bold;
            background: linear-gradient(135deg, #6ba644 0%, #8bc34a 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .stat-label {
            color: #7f8c8d;
            font-size: 14px;
            margin-top: 5px;
        }

        /* Actions buttons */
        .actions-container {
            display: flex;
            gap: 15px;
            margin: 30px 0;
        }

        .action-btn {
            padding: 12px 25px;
            border-radius: 25px;
            border: none;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn-refresh {
            background: white;
            color: #666;
            border: 2px solid #e0e0e0;
        }

        .btn-refresh:hover {
            border-color: #6ba644;
            color: #6ba644;
            transform: rotate(-5deg);
        }

        .btn-add {
            background: linear-gradient(135deg, #6ba644 0%, #8bc34a 100%);
            color: white;
            box-shadow: 0 5px 15px rgba(107, 166, 68, 0.3);
        }

        .btn-add:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(107, 166, 68, 0.4);
        }

        /* Barre de recherche et filtres */
        .search-section {
            background: white;
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
        }

        .search-bar {
            position: relative;
            margin-bottom: 20px;
        }

        .search-input {
            width: 100%;
            padding: 15px 20px 15px 50px;
            border: 2px solid #e0e0e0;
            border-radius: 15px;
            font-size: 16px;
            transition: all 0.3s ease;
        }

        .search-input:focus {
            outline: none;
            border-color: #6ba644;
            box-shadow: 0 0 0 3px rgba(107, 166, 68, 0.1);
        }

        .search-icon {
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            color: #999;
        }

        /* Filtres */
        .filters-container {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .filter-btn {
            padding: 8px 16px;
            border: 2px solid #e0e0e0;
            background: white;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .filter-btn:hover {
            border-color: #6ba644;
            background: #f0f9e8;
        }

        .filter-btn.active {
            background: linear-gradient(135deg, #6ba644 0%, #8bc34a 100%);
            color: white;
            border-color: transparent;
        }

        .filter-icon {
            font-size: 18px;
        }

        /* Grille de produits */
        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }

        /* Carte produit améliorée */
        .product-card {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
        }

        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .product-header {
            padding: 20px 20px 15px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .product-info {
            flex: 1;
        }

        .product-category-icon {
            width: 50px;
            height: 50px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            margin-left: 15px;
        }

        .category-fruits { background: linear-gradient(135deg, #ff6b6b 0%, #ff8c8c 100%); }
        .category-legumes { background: linear-gradient(135deg, #6ba644 0%, #8bc34a 100%); }
        .category-produits-laitiers { background: linear-gradient(135deg, #4ecdc4 0%, #6ee2d9 100%); }
        .category-cereales { background: linear-gradient(135deg, #daa520 0%, #ffd700 100%); }
        .category-viandes { background: linear-gradient(135deg, #e74c3c 0%, #ff6b5b 100%); }

        .product-name {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
        }

        .product-details {
            display: flex;
            gap: 15px;
            color: #7f8c8d;
            font-size: 14px;
        }

        .product-detail {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        /* Barre de péremption organique */
        .expiry-container {
            padding: 0 20px 20px;
        }

        .expiry-visual {
            position: relative;
            height: 40px;
            background: #f0f0f0;
            border-radius: 20px;
            overflow: hidden;
        }

        .expiry-fill {
            height: 100%;
            border-radius: 20px;
            position: relative;
            display: flex;
            align-items: center;
            padding: 0 15px;
            transition: width 0.5s ease;
        }

        /* Effet organique pour la barre */
        .expiry-fill::after {
            content: '';
            position: absolute;
            top: 0;
            right: -20px;
            bottom: 0;
            width: 40px;
            background: inherit;
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 0.6; }
        }

        .expiry-fresh {
            background: linear-gradient(135deg, #6ba644 0%, #8bc34a 100%);
        }

        .expiry-soon {
            background: linear-gradient(135deg, #f39c12 0%, #f1c40f 100%);
        }

        .expiry-urgent {
            background: linear-gradient(135deg, #e74c3c 0%, #ff6b5b 100%);
        }

        .expiry-text {
            color: white;
            font-size: 13px;
            font-weight: 500;
            z-index: 1;
            position: relative;
        }

        .expiry-icon {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 20px;
        }

        /* Animation d'apparition */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .product-card {
            animation: slideIn 0.5s ease;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .products-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-container {
                flex-direction: column;
            }
            
            .nav-container {
                overflow-x: auto;
                justify-content: flex-start;
            }
        }
    </style>
</head>
<body>
    <!-- Formes organiques en arrière-plan -->
    <div class="organic-bg">
        <div class="organic-shape shape1"></div>
        <div class="organic-shape shape2"></div>
        <div class="organic-shape shape3"></div>
        <div class="organic-shape shape4"></div>
    </div>

    <!-- Navigation -->
    <nav>
        <div class="nav-container">
            <button class="nav-btn">Accueil</button>
            <button class="nav-btn active">Garde-manger</button>
            <button class="nav-btn">Recettes</button>
            <button class="nav-btn">Potager</button>
            <button class="nav-btn">Planning</button>
            <button class="nav-btn">Courses</button>
            <button class="nav-btn">Déconnexion</button>
        </div>
    </nav>

    <!-- Container principal -->
    <div class="container">
        <!-- Header avec stats -->
        <div class="header-section">
            <h1 class="header-title">
                <span>🌿</span> Mon garde-manger vivant
            </h1>
            <p class="header-subtitle">Cultivez l'harmonie entre vos réserves et la nature</p>
            
            <div class="stats-container">
                <div class="stat-card" onclick="filterByFreshness('fresh')">
                    <div class="stat-number">8</div>
                    <div class="stat-label">Frais</div>
                </div>
                <div class="stat-card" onclick="filterByFreshness('soon')">
                    <div class="stat-number">5</div>
                    <div class="stat-label">À consommer</div>
                </div>
                <div class="stat-card" onclick="filterByFreshness('all')">
                    <div class="stat-number">24</div>
                    <div class="stat-label">Produits</div>
                </div>
            </div>

            <div class="actions-container">
                <button class="action-btn btn-refresh" onclick="refreshPantry()">
                    <span>🔄</span> Actualiser
                </button>
                <button class="action-btn btn-add" onclick="addProduct()">
                    <span>➕</span> Ajouter
                </button>
            </div>
        </div>

        <!-- Recherche et filtres -->
        <div class="search-section">
            <div class="search-bar">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" placeholder="Rechercher dans le garde-manger..." onkeyup="searchProducts(this.value)">
            </div>
            
            <div class="filters-container">
                <button class="filter-btn active" onclick="filterByCategory('all')">
                    <span class="filter-icon">📦</span> Tous
                </button>
                <button class="filter-btn" onclick="filterByCategory('fruits')">
                    <span class="filter-icon">🍎</span> Fruits
                </button>
                <button class="filter-btn" onclick="filterByCategory('legumes')">
                    <span class="filter-icon">🥕</span> Légumes
                </button>
                <button class="filter-btn" onclick="filterByCategory('produits-laitiers')">
                    <span class="filter-icon">🥛</span> Produits laitiers
                </button>
                <button class="filter-btn" onclick="filterByCategory('cereales')">
                    <span class="filter-icon">🌾</span> Céréales
                </button>
                <button class="filter-btn" onclick="filterByCategory('viandes')">
                    <span class="filter-icon">🥩</span> Viandes
                </button>
                <button class="filter-btn" onclick="filterByStorage('long')">
                    <span class="filter-icon">⏳</span> Longue conservation
                </button>
            </div>
        </div>

        <!-- Grille de produits -->
        <div class="products-grid" id="productsGrid">
            <!-- Les cartes produits seront générées dynamiquement -->
        </div>
    </div>

    <script>
        // Base de données simulée des produits
        const products = [
            { id: 1, name: "Tomates", category: "legumes", categoryIcon: "🍅", quantity: "1.5kg", storage: "Frigo", daysLeft: 4, maxDays: 7 },
            { id: 2, name: "Pommes Gala", category: "fruits", categoryIcon: "🍎", quantity: "2kg", storage: "Garde-manger", daysLeft: 12, maxDays: 21 },
            { id: 3, name: "Lait demi-écrémé", category: "produits-laitiers", categoryIcon: "🥛", quantity: "1L", storage: "Frigo", daysLeft: 3, maxDays: 5 },
            { id: 4, name: "Carottes", category: "legumes", categoryIcon: "🥕", quantity: "800g", storage: "Frigo", daysLeft: 14, maxDays: 21 },
            { id: 5, name: "Yaourt nature", category: "produits-laitiers", categoryIcon: "🥛", quantity: "4x125g", storage: "Frigo", daysLeft: 7, maxDays: 10 },
            { id: 6, name: "Pain complet", category: "cereales", categoryIcon: "🍞", quantity: "500g", storage: "Garde-manger", daysLeft: 2, maxDays: 4 },
            { id: 7, name: "Bananes", category: "fruits", categoryIcon: "🍌", quantity: "1.2kg", storage: "Garde-manger", daysLeft: 3, maxDays: 5 },
            { id: 8, name: "Poulet fermier", category: "viandes", categoryIcon: "🍗", quantity: "1.5kg", storage: "Frigo", daysLeft: 2, maxDays: 3 },
            { id: 9, name: "Pâtes penne", category: "cereales", categoryIcon: "🍝", quantity: "500g", storage: "Garde-manger", daysLeft: 450, maxDays: 730 },
            { id: 10, name: "Courgettes", category: "legumes", categoryIcon: "🥒", quantity: "600g", storage: "Frigo", daysLeft: 5, maxDays: 7 },
            { id: 11, name: "Fromage comté", category: "produits-laitiers", categoryIcon: "🧀", quantity: "250g", storage: "Frigo", daysLeft: 30, maxDays: 45 },
            { id: 12, name: "Riz basmati", category: "cereales", categoryIcon: "🍚", quantity: "1kg", storage: "Garde-manger", daysLeft: 365, maxDays: 730 },
            { id: 13, name: "Oranges", category: "fruits", categoryIcon: "🍊", quantity: "2kg", storage: "Frigo", daysLeft: 10, maxDays: 14 },
            { id: 14, name: "Brocoli", category: "legumes", categoryIcon: "🥦", quantity: "400g", storage: "Frigo", daysLeft: 4, maxDays: 5 },
            { id: 15, name: "Oeufs bio", category: "produits-laitiers", categoryIcon: "🥚", quantity: "12 unités", storage: "Frigo", daysLeft: 21, maxDays: 28 },
            { id: 16, name: "Haricots verts", category: "legumes", categoryIcon: "🫘", quantity: "500g", storage: "Frigo", daysLeft: 5, maxDays: 7 },
            { id: 17, name: "Fraises", category: "fruits", categoryIcon: "🍓", quantity: "250g", storage: "Frigo", daysLeft: 2, maxDays: 3 },
            { id: 18, name: "Saumon frais", category: "viandes", categoryIcon: "🐟", quantity: "400g", storage: "Frigo", daysLeft: 1, maxDays: 2 },
            { id: 19, name: "Farine T55", category: "cereales", categoryIcon: "🌾", quantity: "1kg", storage: "Garde-manger", daysLeft: 180, maxDays: 365 },
            { id: 20, name: "Poivrons rouges", category: "legumes", categoryIcon: "🫑", quantity: "3 pièces", storage: "Frigo", daysLeft: 7, maxDays: 10 },
            { id: 21, name: "Crème fraîche", category: "produits-laitiers", categoryIcon: "🥛", quantity: "200ml", storage: "Frigo", daysLeft: 5, maxDays: 7 },
            { id: 22, name: "Poires", category: "fruits", categoryIcon: "🍐", quantity: "1kg", storage: "Garde-manger", daysLeft: 5, maxDays: 7 },
            { id: 23, name: "Jambon blanc", category: "viandes", categoryIcon: "🥓", quantity: "200g", storage: "Frigo", daysLeft: 3, maxDays: 4 },
            { id: 24, name: "Lentilles vertes", category: "cereales", categoryIcon: "🫘", quantity: "500g", storage: "Garde-manger", daysLeft: 540, maxDays: 730 }
        ];

        // État actuel des filtres
        let currentFilter = 'all';
        let currentSearch = '';

        // Fonction pour générer les cartes produits
        function generateProductCard(product) {
            const percentage = (product.daysLeft / product.maxDays) * 100;
            let expiryClass = 'expiry-fresh';
            let expiryText = `${product.daysLeft} jours restants`;
            let expiryIcon = '✨';
            
            if (percentage <= 20) {
                expiryClass = 'expiry-urgent';
                expiryText = `À consommer rapidement (${product.daysLeft}j)`;
                expiryIcon = '⚠️';
            } else if (percentage <= 40) {
                expiryClass = 'expiry-soon';
                expiryText = `À consommer bientôt (${product.daysLeft}j)`;
                expiryIcon = '⏰';
            }
            
            if (product.daysLeft > 365) {
                expiryText = 'Longue conservation';
                expiryIcon = '🌟';
            }

            return `
                <div class="product-card" onclick="openProductDetails(${product.id})">
                    <div class="product-header">
                        <div class="product-info">
                            <h3 class="product-name">${product.name}</h3>
                            <div class="product-details">
                                <span class="product-detail">
                                    <span>📦</span> ${product.quantity}
                                </span>
                                <span class="product-detail">
                                    <span>📍</span> ${product.storage}
                                </span>
                            </div>
                        </div>
                        <div class="product-category-icon category-${product.category}">
                            <span>${product.categoryIcon}</span>
                        </div>
                    </div>
                    <div class="expiry-container">
                        <div class="expiry-visual">
                            <div class="expiry-fill ${expiryClass}" style="width: ${Math.max(10, Math.min(100, percentage))}%">
                                <span class="expiry-text">${expiryText}</span>
                            </div>
                            <span class="expiry-icon">${expiryIcon}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Fonction pour afficher les produits
        function displayProducts(productsToShow = products) {
            const grid = document.getElementById('productsGrid');
            grid.innerHTML = productsToShow.map(product => generateProductCard(product)).join('');
            
            // Mettre à jour les statistiques
            updateStats(productsToShow);
        }

        // Fonction pour mettre à jour les statistiques
        function updateStats(productsToShow) {
            const fresh = productsToShow.filter(p => (p.daysLeft / p.maxDays) > 0.4).length;
            const soon = productsToShow.filter(p => (p.daysLeft / p.maxDays) <= 0.4).length;
            const total = productsToShow.length;
            
            document.querySelectorAll('.stat-number')[0].textContent = fresh;
            document.querySelectorAll('.stat-number')[1].textContent = soon;
            document.querySelectorAll('.stat-number')[2].textContent = total;
        }

        // Fonction de filtrage par catégorie
        function filterByCategory(category) {
            currentFilter = category;
            
            // Mettre à jour les boutons actifs
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.closest('.filter-btn').classList.add('active');
            
            // Filtrer les produits
            let filtered = products;
            if (category !== 'all') {
                filtered = products.filter(p => p.category === category);
            }
            
            // Appliquer aussi la recherche si elle existe
            if (currentSearch) {
                filtered = filtered.filter(p => 
                    p.name.toLowerCase().includes(currentSearch.toLowerCase())
                );
            }
            
            displayProducts(filtered);
        }

        // Fonction de filtrage par fraîcheur
        function filterByFreshness(freshness) {
            let filtered = products;
            
            if (freshness === 'fresh') {
                filtered = products.filter(p => (p.daysLeft / p.maxDays) > 0.4);
            } else if (freshness === 'soon') {
                filtered = products.filter(p => (p.daysLeft / p.maxDays) <= 0.4);
            }
            
            displayProducts(filtered);
        }

        // Fonction de filtrage par stockage
        function filterByStorage(storage) {
            let filtered = products;
            
            if (storage === 'long') {
                filtered = products.filter(p => p.daysLeft > 30);
            }
            
            displayProducts(filtered);
        }

        // Fonction de recherche
        function searchProducts(searchTerm) {
            currentSearch = searchTerm;
            
            let filtered = products.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            // Appliquer aussi le filtre de catégorie si actif
            if (currentFilter !== 'all') {
                filtered = filtered.filter(p => p.category === currentFilter);
            }
            
            displayProducts(filtered);
        }

        // Fonction pour actualiser le garde-manger
        function refreshPantry() {
            // Animation de rotation sur le bouton
            event.target.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                event.target.style.transform = 'rotate(0deg)';
            }, 500);
            
            // Simuler un rechargement des données
            displayProducts();
        }

        // Fonction pour ajouter un produit
        function addProduct() {
            alert('Fonctionnalité d\'ajout de produit à implémenter');
        }

        // Fonction pour ouvrir les détails d'un produit
        function openProductDetails(productId) {
            const product = products.find(p => p.id === productId);
            if (product) {
                alert(`Détails de ${product.name}\nQuantité: ${product.quantity}\nStockage: ${product.storage}\nJours restants: ${product.daysLeft}`);
            }
        }

        // Initialisation au chargement
        document.addEventListener('DOMContentLoaded', () => {
            displayProducts();
        });
    </script>
</body>
</html>
