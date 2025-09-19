<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Garde-Manger - Nature & Glass</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #c2e9fb 75%, #a8edea 100%);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
            overflow-x: hidden;
            position: relative;
        }

        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* Nature overlay pattern */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                radial-gradient(circle at 20% 50%, rgba(120, 255, 154, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255, 182, 193, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 40% 20%, rgba(173, 216, 230, 0.3) 0%, transparent 50%);
            pointer-events: none;
            z-index: 1;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
            position: relative;
            z-index: 2;
        }

        /* Header glassmorphism */
        .header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 25px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
            animation: slideDown 0.6s ease-out;
        }

        @keyframes slideDown {
            from {
                transform: translateY(-30px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        h1 {
            color: white;
            font-size: 2.5rem;
            font-weight: 300;
            letter-spacing: 2px;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
        }

        .leaf-icon {
            width: 40px;
            height: 40px;
            fill: rgba(144, 238, 144, 0.9);
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            animation: sway 3s ease-in-out infinite;
        }

        @keyframes sway {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
        }

        /* Filter Section */
        .filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }

        .filter-group {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 0.5rem 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
        }

        .filter-group:hover {
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.25);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .filter-group label {
            color: white;
            font-size: 0.9rem;
            font-weight: 500;
        }

        .filter-group select,
        .filter-group input {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 0.3rem 0.8rem;
            color: white;
            outline: none;
            transition: all 0.3s ease;
        }

        .filter-group select option {
            background: rgba(70, 70, 70, 0.95);
        }

        .filter-group input::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }

        .filter-group select:focus,
        .filter-group input:focus {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
        }

        /* Stats Cards */
        .stats-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .stat-card:hover {
            transform: translateY(-5px) scale(1.02);
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: white;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .stat-label {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }

        /* Grid Layout */
        .pantry-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }

        /* Product Cards */
        .product-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 1.5rem;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            animation: fadeInUp 0.6s ease-out;
            position: relative;
            overflow: hidden;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .product-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        .product-card:hover::before {
            opacity: 1;
        }

        .product-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 
                0 15px 35px rgba(0, 0, 0, 0.2),
                0 5px 15px rgba(255, 255, 255, 0.1) inset;
            border-color: rgba(255, 255, 255, 0.3);
        }

        .product-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }

        .product-name {
            font-size: 1.3rem;
            color: white;
            font-weight: 600;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
            flex: 1;
        }

        .category-badge {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .product-info {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
        }

        .info-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.95rem;
        }

        .info-icon {
            width: 20px;
            height: 20px;
            fill: rgba(255, 255, 255, 0.7);
        }

        .quantity-badge {
            background: rgba(144, 238, 144, 0.2);
            color: white;
            padding: 0.4rem 0.8rem;
            border-radius: 10px;
            font-weight: 500;
            border: 1px solid rgba(144, 238, 144, 0.4);
            display: inline-block;
        }

        .location-badge {
            background: rgba(135, 206, 235, 0.2);
            color: white;
            padding: 0.4rem 0.8rem;
            border-radius: 10px;
            font-weight: 500;
            border: 1px solid rgba(135, 206, 235, 0.4);
            display: inline-block;
        }

        /* Expiration Status */
        .expiration-status {
            margin-top: 1rem;
            padding: 0.8rem;
            border-radius: 12px;
            text-align: center;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .status-good {
            background: rgba(144, 238, 144, 0.2);
            border: 1px solid rgba(144, 238, 144, 0.4);
            color: #90EE90;
        }

        .status-expiring-soon {
            background: rgba(255, 165, 0, 0.2);
            border: 1px solid rgba(255, 165, 0, 0.4);
            color: #FFB347;
            animation: pulse 2s infinite;
        }

        .status-expired {
            background: rgba(255, 69, 0, 0.2);
            border: 1px solid rgba(255, 69, 0, 0.4);
            color: #FF6B6B;
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        /* Action Buttons */
        .card-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
        }

        .action-btn {
            flex: 1;
            padding: 0.6rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9rem;
            font-weight: 500;
            backdrop-filter: blur(10px);
        }

        .action-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        /* Loading Animation */
        .loading {
            text-align: center;
            padding: 3rem;
            color: white;
        }

        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 3rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
        }

        .empty-state h2 {
            font-size: 1.8rem;
            margin-bottom: 1rem;
            opacity: 0.9;
        }

        .empty-state p {
            opacity: 0.7;
            font-size: 1.1rem;
        }

        /* Floating Action Button */
        .fab {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            z-index: 100;
        }

        .fab:hover {
            transform: scale(1.1) rotate(90deg);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }

            h1 {
                font-size: 1.8rem;
            }

            .pantry-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }

            .filters {
                flex-direction: column;
            }

            .filter-group {
                width: 100%;
            }

            .stats-container {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>
                <svg class="leaf-icon" viewBox="0 0 24 24">
                    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                </svg>
                Mon Garde-Manger Nature
                <svg class="leaf-icon" viewBox="0 0 24 24" style="transform: scaleX(-1);">
                    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
                </svg>
            </h1>
        </div>

        <!-- Statistics -->
        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-number" id="totalItems">0</div>
                <div class="stat-label">Articles Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="expiringCount">0</div>
                <div class="stat-label">Expirent Bientôt</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="categoryCount">0</div>
                <div class="stat-label">Catégories</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="locationCount">0</div>
                <div class="stat-label">Emplacements</div>
            </div>
        </div>

        <!-- Filters -->
        <div class="filters">
            <div class="filter-group">
                <label for="searchFilter">🔍</label>
                <input type="text" id="searchFilter" placeholder="Rechercher...">
            </div>
            <div class="filter-group">
                <label for="categoryFilter">📁</label>
                <select id="categoryFilter">
                    <option value="">Toutes les catégories</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="locationFilter">📍</label>
                <select id="locationFilter">
                    <option value="">Tous les emplacements</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="statusFilter">⏰</label>
                <select id="statusFilter">
                    <option value="">Tous les statuts</option>
                    <option value="good">En bon état</option>
                    <option value="expiring_soon">Expire bientôt</option>
                    <option value="expired">Expiré</option>
                </select>
            </div>
        </div>

        <!-- Product Grid -->
        <div id="pantryGrid" class="pantry-grid">
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Chargement de votre garde-manger...</p>
            </div>
        </div>
    </div>

    <!-- Floating Action Button -->
    <div class="fab" onclick="addNewItem()">
        +
    </div>

    <script>
        // Supabase configuration
        const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Remplacez par votre URL
        const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Remplacez par votre clé

        let pantryItems = [];
        let filteredItems = [];

        // Initialize the page
        document.addEventListener('DOMContentLoaded', async () => {
            await loadPantryItems();
            setupFilters();
            setupSearch();
        });

        // Load pantry items from Supabase
        async function loadPantryItems() {
            try {
                // Simulation de données pour la démo
                // Remplacez ceci par un vrai appel à Supabase
                pantryItems = generateDemoData();
                filteredItems = [...pantryItems];
                
                updateStatistics();
                populateFilters();
                renderPantryGrid();
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                showEmptyState('Erreur de chargement des données');
            }
        }

        // Generate demo data (remplacez par de vraies données Supabase)
        function generateDemoData() {
            return [
                {
                    id: 1,
                    product_name: 'Tomates Cerises Bio',
                    category_name: 'Légumes',
                    qty_remaining: 500,
                    unit: 'g',
                    storage_place: 'Frigo',
                    expiration_date: '2025-09-25',
                    expiration_status: 'expiring_soon',
                    days_until_expiration: 6
                },
                {
                    id: 2,
                    product_name: 'Farine de Blé T55',
                    category_name: 'Céréales',
                    qty_remaining: 2,
                    unit: 'kg',
                    storage_place: 'Garde-manger',
                    expiration_date: '2026-03-15',
                    expiration_status: 'good',
                    days_until_expiration: 177
                },
                {
                    id: 3,
                    product_name: 'Haricots Verts',
                    category_name: 'Légumes',
                    qty_remaining: 300,
                    unit: 'g',
                    storage_place: 'Congélateur',
                    expiration_date: '2026-01-15',
                    expiration_status: 'good',
                    days_until_expiration: 118
                },
                {
                    id: 4,
                    product_name: 'Confiture de Fraises Maison',
                    category_name: 'Conserves',
                    qty_remaining: 2,
                    unit: 'bocaux',
                    storage_place: 'Cave',
                    expiration_date: '2026-06-01',
                    expiration_status: 'good',
                    days_until_expiration: 255
                },
                {
                    id: 5,
                    product_name: 'Pommes Golden',
                    category_name: 'Fruits',
                    qty_remaining: 1.5,
                    unit: 'kg',
                    storage_place: 'Frigo',
                    expiration_date: '2025-09-30',
                    expiration_status: 'good',
                    days_until_expiration: 11
                },
                {
                    id: 6,
                    product_name: 'Yaourt Nature',
                    category_name: 'Produits Laitiers',
                    qty_remaining: 4,
                    unit: 'pots',
                    storage_place: 'Frigo',
                    expiration_date: '2025-09-22',
                    expiration_status: 'expiring_soon',
                    days_until_expiration: 3
                }
            ];
        }

        // Update statistics
        function updateStatistics() {
            document.getElementById('totalItems').textContent = filteredItems.length;
            
            const expiring = filteredItems.filter(item => 
                item.expiration_status === 'expiring_soon' || 
                item.expiration_status === 'expired'
            ).length;
            document.getElementById('expiringCount').textContent = expiring;
            
            const categories = [...new Set(filteredItems.map(item => item.category_name))].length;
            document.getElementById('categoryCount').textContent = categories;
            
            const locations = [...new Set(filteredItems.map(item => item.storage_place))].length;
            document.getElementById('locationCount').textContent = locations;
        }

        // Populate filter dropdowns
        function populateFilters() {
            // Categories
            const categories = [...new Set(pantryItems.map(item => item.category_name))].filter(Boolean);
            const categorySelect = document.getElementById('categoryFilter');
            categorySelect.innerHTML = '<option value="">Toutes les catégories</option>';
            categories.forEach(cat => {
                categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
            });

            // Locations
            const locations = [...new Set(pantryItems.map(item => item.storage_place))].filter(Boolean);
            const locationSelect = document.getElementById('locationFilter');
            locationSelect.innerHTML = '<option value="">Tous les emplacements</option>';
            locations.forEach(loc => {
                locationSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
            });
        }

        // Render the pantry grid
        function renderPantryGrid() {
            const grid = document.getElementById('pantryGrid');
            
            if (filteredItems.length === 0) {
                showEmptyState('Aucun article trouvé');
                return;
            }

            grid.innerHTML = filteredItems.map(item => createProductCard(item)).join('');
        }

        // Create a product card
        function createProductCard(item) {
            const statusClass = `status-${item.expiration_status || 'good'}`;
            const statusText = getStatusText(item.expiration_status, item.days_until_expiration);
            
            return `
                <div class="product-card">
                    <div class="product-header">
                        <div class="product-name">${item.product_name}</div>
                        ${item.category_name ? `<div class="category-badge">${item.category_name}</div>` : ''}
                    </div>
                    
                    <div class="product-info">
                        <div class="info-row">
                            <svg class="info-icon" viewBox="0 0 24 24">
                                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                            </svg>
                            <span class="quantity-badge">${item.qty_remaining} ${item.unit}</span>
                        </div>
                        
                        <div class="info-row">
                            <svg class="info-icon" viewBox="0 0 24 24">
                                <path d="M12,2C15.31,2 18,4.66 18,7.95C18,12.41 12,19 12,19C12,19 6,12.41 6,7.95C6,4.66 8.69,2 12,2Z"/>
                            </svg>
                            <span class="location-badge">${item.storage_place || 'Non spécifié'}</span>
                        </div>
                    </div>
                    
                    ${item.expiration_date ? `
                        <div class="expiration-status ${statusClass}">
                            ${statusText}
                        </div>
                    ` : ''}
                    
                    <div class="card-actions">
                        <button class="action-btn" onclick="editItem(${item.id})">✏️ Modifier</button>
                        <button class="action-btn" onclick="consumeItem(${item.id})">🍽️ Consommer</button>
                    </div>
                </div>
            `;
        }

        // Get status text
        function getStatusText(status, days) {
            if (!status || status === 'no_date') return 'Pas de date d\'expiration';
            if (status === 'expired') return `⚠️ Expiré depuis ${Math.abs(days)} jours`;
            if (status === 'expiring_soon') return `⏰ Expire dans ${days} jours`;
            return `✅ ${days} jours restants`;
        }

        // Show empty state
        function showEmptyState(message) {
            const grid = document.getElementById('pantryGrid');
            grid.innerHTML = `
                <div class="empty-state">
                    <h2>🌿</h2>
                    <h2>${message}</h2>
                    <p>Commencez par ajouter des articles à votre garde-manger</p>
                </div>
            `;
        }

        // Setup filters
        function setupFilters() {
            document.getElementById('categoryFilter').addEventListener('change', applyFilters);
            document.getElementById('locationFilter').addEventListener('change', applyFilters);
            document.getElementById('statusFilter').addEventListener('change', applyFilters);
        }

        // Setup search
        function setupSearch() {
            const searchInput = document.getElementById('searchFilter');
            searchInput.addEventListener('input', (e) => {
                applyFilters();
            });
        }

        // Apply all filters
        function applyFilters() {
            const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
            const categoryFilter = document.getElementById('categoryFilter').value;
            const locationFilter = document.getElementById('locationFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;

            filteredItems = pantryItems.filter(item => {
                const matchesSearch = !searchTerm || 
                    item.product_name.toLowerCase().includes(searchTerm);
                const matchesCategory = !categoryFilter || 
                    item.category_name === categoryFilter;
                const matchesLocation = !locationFilter || 
                    item.storage_place === locationFilter;
                const matchesStatus = !statusFilter || 
                    item.expiration_status === statusFilter;

                return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
            });

            updateStatistics();
            renderPantryGrid();
        }

        // Action functions
        function addNewItem() {
            alert('Fonction d\'ajout d\'article - À implémenter avec Supabase');
            // Rediriger vers un formulaire d'ajout ou ouvrir un modal
        }

        function editItem(id) {
            alert(`Éditer l\'article ${id} - À implémenter avec Supabase`);
            // Ouvrir un formulaire d'édition
        }

        function consumeItem(id) {
            if (confirm('Marquer cet article comme consommé ?')) {
                alert(`Article ${id} consommé - À implémenter avec Supabase`);
                // Mettre à jour la quantité dans Supabase
            }
        }

        // Fonction réelle pour charger depuis Supabase (à décommenter et configurer)
        async function loadFromSupabase() {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/pantry?select=*`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des données');
            }

            return await response.json();
        }
    </script>
</body>
</html>
