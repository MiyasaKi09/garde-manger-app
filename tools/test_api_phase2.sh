#!/bin/bash

# ============================================================================
# SCRIPT DE TEST API - PHASE 2 PLATS CUISINÉS
# ============================================================================
# Ce script teste tous les endpoints de l'API des plats cuisinés
# ============================================================================

# Configuration
BASE_URL="http://localhost:3000"
AUTH_TOKEN="YOUR_AUTH_TOKEN_HERE"  # ⚠️ Remplacer par votre token Supabase

# Couleurs pour les logs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TEST API - PHASE 2 : PLATS CUISINÉS                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# FONCTION : Afficher une étape
# ============================================================================
step() {
  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}▶ $1${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================================================
# FONCTION : Afficher un succès
# ============================================================================
success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# ============================================================================
# FONCTION : Afficher une erreur
# ============================================================================
error() {
  echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# Vérifier que le serveur est lancé
# ============================================================================
step "Vérification du serveur de développement"

if curl -s "$BASE_URL" > /dev/null; then
  success "Serveur accessible à $BASE_URL"
else
  error "Serveur non accessible. Lancez 'npm run dev' d'abord."
  exit 1
fi

# ============================================================================
# TEST 1 : Créer un plat cuisiné
# ============================================================================
step "TEST 1 : Créer un plat cuisiné"

# Note : Remplacer les LOT_ID par des vrais IDs de votre base
RESPONSE=$(curl -s -X POST "$BASE_URL/api/cooked-dishes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "name": "Lasagnes maison",
    "portionsCooked": 4,
    "storageMethod": "fridge",
    "notes": "Test API",
    "ingredients": [
      {
        "lotId": "LOT_ID_1",
        "quantityUsed": 250,
        "unit": "g"
      }
    ]
  }')

echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
  DISH_ID=$(echo "$RESPONSE" | jq -r '.dish.id')
  success "Plat créé avec succès ! ID: $DISH_ID"
else
  error "Échec de création du plat"
  echo "Réponse: $RESPONSE"
fi

# ============================================================================
# TEST 2 : Lister tous les plats
# ============================================================================
step "TEST 2 : Lister tous les plats"

RESPONSE=$(curl -s -X GET "$BASE_URL/api/cooked-dishes" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "$RESPONSE" | jq '.'

DISH_COUNT=$(echo "$RESPONSE" | jq '.dishes | length')
success "Nombre de plats: $DISH_COUNT"

# Sauvegarder l'ID du premier plat pour les tests suivants
if [ "$DISH_COUNT" -gt 0 ]; then
  DISH_ID=$(echo "$RESPONSE" | jq -r '.dishes[0].id')
  success "Premier plat ID: $DISH_ID"
fi

# ============================================================================
# TEST 3 : Lister les plats expirant dans 3 jours
# ============================================================================
step "TEST 3 : Lister les plats expirant dans 3 jours"

RESPONSE=$(curl -s -X GET "$BASE_URL/api/cooked-dishes?expiringInDays=3" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "$RESPONSE" | jq '.'

EXPIRING_COUNT=$(echo "$RESPONSE" | jq '.dishes | length')
success "Plats expirant dans 3 jours: $EXPIRING_COUNT"

# ============================================================================
# TEST 4 : Consommer des portions
# ============================================================================
if [ ! -z "$DISH_ID" ]; then
  step "TEST 4 : Consommer 1 portion du plat $DISH_ID"

  RESPONSE=$(curl -s -X POST "$BASE_URL/api/cooked-dishes/$DISH_ID/consume" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{
      "portions": 1
    }')

  echo "$RESPONSE" | jq '.'

  if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
    PORTIONS_REMAINING=$(echo "$RESPONSE" | jq -r '.dish.portions_remaining')
    success "Portion consommée ! Portions restantes: $PORTIONS_REMAINING"
  else
    error "Échec de consommation"
  fi
fi

# ============================================================================
# TEST 5 : Changer le stockage (congeler)
# ============================================================================
if [ ! -z "$DISH_ID" ]; then
  step "TEST 5 : Congeler le plat $DISH_ID"

  RESPONSE=$(curl -s -X POST "$BASE_URL/api/cooked-dishes/$DISH_ID/storage" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{
      "storageMethod": "freezer"
    }')

  echo "$RESPONSE" | jq '.'

  if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
    NEW_EXPIRATION=$(echo "$RESPONSE" | jq -r '.dish.expiration_date')
    success "Plat congelé ! Nouvelle expiration: $NEW_EXPIRATION"
  else
    error "Échec de congélation"
  fi
fi

# ============================================================================
# TEST 6 : Décongeler
# ============================================================================
if [ ! -z "$DISH_ID" ]; then
  step "TEST 6 : Décongeler le plat $DISH_ID"

  RESPONSE=$(curl -s -X POST "$BASE_URL/api/cooked-dishes/$DISH_ID/storage" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{
      "storageMethod": "fridge"
    }')

  echo "$RESPONSE" | jq '.'

  if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
    NEW_EXPIRATION=$(echo "$RESPONSE" | jq -r '.dish.expiration_date')
    success "Plat décongelé ! Nouvelle expiration: $NEW_EXPIRATION"
  else
    error "Échec de décongélation"
  fi
fi

# ============================================================================
# TEST 7 : Supprimer le plat
# ============================================================================
if [ ! -z "$DISH_ID" ]; then
  step "TEST 7 : Supprimer le plat $DISH_ID"

  read -p "Voulez-vous vraiment supprimer le plat de test ? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/cooked-dishes/$DISH_ID" \
      -H "Authorization: Bearer $AUTH_TOKEN")

    echo "$RESPONSE" | jq '.'

    if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
      success "Plat supprimé avec succès"
    else
      error "Échec de suppression"
    fi
  else
    echo "Suppression annulée"
  fi
fi

# ============================================================================
# RÉSUMÉ
# ============================================================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TESTS TERMINÉS                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Tous les tests API ont été exécutés${NC}"
echo ""
echo "Pour tester l'UI, ouvrez http://localhost:3000 dans votre navigateur"
echo "et allez dans Garde-Manger → Onglet 'À Risque'"
echo ""
