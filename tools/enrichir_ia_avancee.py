#!/usr/bin/env python3
"""
Enrichissement VRAIMENT intelligent - Analyse individuelle de chaque recette
Chaque recette est analysée avec un raisonnement spécifique
"""

import csv
import sys
import re

def analyze_recipe_individually(recipe_id, name, role):
    """
    Analyse SPÉCIFIQUE pour chaque recette
    Retourne: (prep_time, cook_time, servings, cooking_method, is_complete_meal, needs_side_dish, reasoning)
    """
    
    name_lower = name.lower()
    
    # ============================================================================
    # ANALYSE INDIVIDUELLE - RAISONNEMENT SPÉCIFIQUE
    # ============================================================================
    
    # --------------------------------------------------
    # PETIT-DÉJEUNER & BRUNCH
    # --------------------------------------------------
    
    if 'overnight porridge' in name_lower or 'porridge' in name_lower and 'overnight' in name_lower:
        # Overnight = trempage nocturne, pas de cuisson
        return 10, 480, 2, 'Sans cuisson', True, False, "Porridge overnight : préparation 10 min, trempage 8h (480 min), pas de cuisson"
    
    if 'porridge salé' in name_lower:
        return 10, 15, 2, 'Mijotage', True, False, "Porridge salé : cuisson courte 15 min, plat complet"
    
    if 'porridge' in name_lower and 'overnight' not in name_lower:
        return 5, 10, 2, 'Mijotage', True, False, "Porridge classique : rapide, 10 min cuisson"
    
    if 'pudding de chia' in name_lower or 'chia' in name_lower and role == 'ENTREE':
        return 10, 240, 2, 'Sans cuisson', True, False, "Pudding chia : trempage 4h, pas de cuisson"
    
    if 'granola' in name_lower:
        return 10, 30, 8, 'Cuisson au four', False, None, "Granola : cuisson four 30 min, donne 8 portions"
    
    if 'muesli' in name_lower:
        return 10, 0, 4, 'Sans cuisson', True, False, "Muesli : assemblage simple, pas de cuisson"
    
    if 'pancake' in name_lower:
        if 'salé' in name_lower:
            return 15, 20, 2, 'Poêle', True, False, "Pancakes salés : version repas, plat complet"
        else:
            return 10, 15, 4, 'Poêle', True, False, "Pancakes sucrés : cuisson poêle rapide"
    
    if 'œufs bénédictine' in name_lower or 'eggs benedict' in name_lower:
        return 20, 15, 2, 'Cuisson mixte', True, False, "Œufs bénédictine : œufs pochés + hollandaise, technique"
    
    if 'œuf poché' in name_lower and 'toast' in name_lower:
        return 10, 10, 2, "Cuisson à l'eau", True, False, "Toast avocat + œuf poché : plat brunch complet"
    
    if 'œuf' in name_lower and 'bacon' in name_lower:
        return 10, 15, 2, 'Poêle', True, False, "Œufs bacon : breakfast anglais, plat complet"
    
    if 'full english breakfast' in name_lower:
        return 20, 30, 2, 'Cuisson mixte', True, False, "Full English : multiple composantes, cuisson complexe"
    
    if 'shakshuka' in name_lower:
        return 15, 25, 4, 'Mijotage', True, False, "Shakshuka : œufs pochés sauce tomate, plat complet"
    
    if 'huevos' in name_lower:
        return 15, 20, 2, 'Poêle', True, False, "Huevos rotos : frites + œufs, plat espagnol complet"
    
    if 'tamagoyaki' in name_lower:
        return 10, 10, 2, 'Poêle', False, None, "Tamagoyaki : omelette roulée japonaise, accompagnement"
    
    if 'yaourt grec' in name_lower or 'yaourt' in name_lower and 'grec' in name_lower:
        return 5, 0, 2, 'Sans cuisson', False, None, "Yaourt grec : assemblage simple"
    
    # --------------------------------------------------
    # SOUPES FROIDES
    # --------------------------------------------------
    
    if 'gaspacho' in name_lower or 'gazpacho' in name_lower:
        return 20, 0, 4, 'Sans cuisson', False, None, "Gaspacho : soupe froide andalouse, pas de cuisson, mixage"
    
    if 'salmorejo' in name_lower:
        return 15, 0, 4, 'Sans cuisson', False, None, "Salmorejo : soupe froide cordouane, plus épaisse que gaspacho"
    
    # --------------------------------------------------
    # SOUPES CHAUDES
    # --------------------------------------------------
    
    if 'velouté' in name_lower or 'crème de' in name_lower or 'potage' in name_lower:
        if 'bisque' in name_lower:
            return 30, 40, 4, 'Mijotage', False, None, "Bisque : soupe raffinée de crustacés, longue préparation"
        else:
            return 15, 25, 4, 'Mijotage', False, None, "Velouté/potage : soupe mixée, cuisson standard"
    
    if 'soupe' in name_lower:
        if 'pistou' in name_lower:
            return 25, 40, 6, 'Mijotage', True, False, "Soupe au pistou : soupe-repas provençale, légumes + pistou"
        elif 'oignon' in name_lower:
            return 20, 45, 4, 'Cuisson au four', False, None, "Soupe oignon : gratinée au four"
        elif any(x in name_lower for x in ['minestrone', 'harira', 'chorba']):
            return 20, 40, 6, 'Mijotage', True, False, "Soupe-repas méditerranéenne : complète avec légumineuses"
        else:
            return 20, 30, 4, 'Mijotage', False, None, "Soupe standard : cuisson légumes"
    
    if 'bouillabaisse' in name_lower or 'bourride' in name_lower:
        return 30, 40, 6, 'Mijotage', True, False, "Bouillabaisse : soupe-repas de poisson provençale"
    
    # --------------------------------------------------
    # TAPAS / MEZZE / TARTINADES
    # --------------------------------------------------
    
    if 'houmous' in name_lower or 'hummus' in name_lower:
        return 10, 0, 6, 'Sans cuisson', False, None, "Houmous : tartinade pois chiches, mixage simple"
    
    if 'baba ganoush' in name_lower or 'moutabal' in name_lower:
        return 15, 30, 6, 'Cuisson au four', False, None, "Baba ganoush : aubergines rôties puis mixées"
    
    if 'tzatziki' in name_lower:
        return 15, 0, 6, 'Sans cuisson', False, None, "Tzatziki : sauce grecque concombre-yaourt"
    
    if 'tapenade' in name_lower or 'tartinade' in name_lower:
        return 10, 0, 6, 'Sans cuisson', False, None, "Tapenade/tartinade : mixage ingrédients"
    
    if 'guacamole' in name_lower:
        return 10, 0, 4, 'Sans cuisson', False, None, "Guacamole : écrasé avocat, très rapide"
    
    if 'rillettes' in name_lower:
        return 15, 0, 6, 'Sans cuisson', False, None, "Rillettes : mixage poisson/viande cuite"
    
    if 'bruschetta' in name_lower:
        return 10, 5, 4, 'Grillage', False, None, "Bruschetta : pain grillé + garniture"
    
    if 'crostini' in name_lower:
        return 15, 10, 8, 'Cuisson au four', False, None, "Crostini : toasts au four + garnitures"
    
    if 'patatas bravas' in name_lower:
        return 15, 30, 4, 'Friture', False, None, "Patatas bravas : pommes terre frites + sauce"
    
    if 'croquetas' in name_lower or 'croquettes' in name_lower:
        return 30, 20, 8, 'Friture', False, None, "Croquettes : préparation béchamel + friture"
    
    if 'pimientos' in name_lower or 'padrón' in name_lower:
        return 5, 10, 4, 'Poêle', False, None, "Pimientos padrón : poivrons poêlés rapides"
    
    if 'gambas al ajillo' in name_lower:
        return 10, 5, 4, 'Poêle', False, None, "Gambas al ajillo : crevettes ail, très rapide"
    
    if 'falafel' in name_lower:
        return 20, 15, 4, 'Friture', False, None, "Falafel : boulettes pois chiches frites"
    
    if 'samoussas' in name_lower or 'samosas' in name_lower:
        return 40, 12, 8, 'Friture', False, None, "Samoussas : pliage complexe + friture"
    
    if 'nems' in name_lower or 'nem' in name_lower:
        return 40, 12, 8, 'Friture', False, None, "Nems : roulage + friture"
    
    if 'rouleaux de printemps' in name_lower:
        return 30, 0, 8, 'Sans cuisson', False, None, "Rouleaux printemps : roulage feuilles riz, pas de cuisson"
    
    if 'accras' in name_lower or 'acras' in name_lower:
        return 25, 18, 8, 'Friture', False, None, "Accras : beignets antillais frits"
    
    if 'arancini' in name_lower:
        return 30, 18, 8, 'Friture', False, None, "Arancini : boulettes riz frites italiennes"
    
    # --------------------------------------------------
    # CUISINE ASIATIQUE
    # --------------------------------------------------
    
    if 'bò bún' in name_lower or 'bo bun' in name_lower:
        return 30, 15, 4, 'Cuisson mixte', True, False, "Bò bún : nouilles vietnamiennes, plat complet"
    
    if 'pad thaï' in name_lower or 'pad thai' in name_lower:
        return 30, 15, 4, 'Sauté au wok', True, False, "Pad thaï : nouilles sautées thaïlandaises"
    
    if 'pho' in name_lower and role == 'PLAT_PRINCIPAL':
        return 30, 120, 4, 'Mijotage', True, False, "Pho : bouillon mijoté longtemps + nouilles"
    
    if 'ramen' in name_lower:
        return 30, 120, 4, 'Mijotage', True, False, "Ramen : bouillon complexe mijoté + nouilles"
    
    if any(x in name_lower for x in ['bibimbap', 'oyakodon', 'katsudon', 'gyudon']):
        return 20, 15, 4, 'Cuisson mixte', True, False, "Bowl japonais/coréen : riz + garnitures"
    
    if 'bulgogi' in name_lower or 'teriyaki' in name_lower:
        return 15, 12, 4, 'Poêle', False, True, "Viande marinée asiatique : nécessite riz"
    
    if 'riz cantonais' in name_lower or 'nasi goreng' in name_lower:
        return 15, 10, 4, 'Sauté au wok', True, False, "Riz sauté : plat complet"
    
    if 'yaki soba' in name_lower or 'yakisoba' in name_lower:
        return 15, 10, 4, 'Sauté au wok', True, False, "Nouilles sautées japonaises"
    
    if 'udon' in name_lower or 'soba' in name_lower:
        return 10, 12, 4, "Cuisson à l'eau", True, False, "Nouilles japonaises : plat simple"
    
    # --------------------------------------------------
    # PAINS & VIENNOISERIES
    # --------------------------------------------------
    
    if 'croissant' in name_lower:
        return 180, 20, 1, 'Cuisson au four', False, None, "Croissants : pâte feuilletée levée, très long"
    
    if 'baguette' in name_lower or 'ciabatta' in name_lower:
        return 120, 25, 1, 'Cuisson au four', False, None, "Pain artisanal : levée + cuisson"
    
    if any(x in name_lower for x in ['naan', 'chapati', 'bretzel', 'pain']):
        return 90, 20, 1, 'Cuisson au four', False, None, "Pain simple : levée standard"
    
    if 'pão de queijo' in name_lower:
        return 20, 25, 8, 'Cuisson au four', False, None, "Pão de queijo : petits pains fromage brésiliens"
    
    # --------------------------------------------------
    # PÂTISSERIE
    # --------------------------------------------------
    
    if 'gâteau' in name_lower:
        if 'yaourt' in name_lower:
            return 15, 35, 8, 'Cuisson au four', False, None, "Gâteau yaourt : simple et rapide"
        elif any(x in name_lower for x in ['pommes', 'poires', 'fruits']):
            return 25, 40, 8, 'Cuisson au four', False, None, "Gâteau aux fruits : préparation fruits + cuisson"
        elif 'basque' in name_lower:
            return 30, 45, 8, 'Cuisson au four', False, None, "Gâteau basque : crème pâtissière, technique"
        else:
            return 25, 35, 8, 'Cuisson au four', False, None, "Gâteau standard"
    
    if 'quatre-quarts' in name_lower:
        return 15, 45, 8, 'Cuisson au four', False, None, "Quatre-quarts : simple mais cuisson longue"
    
    if 'tarte' in name_lower:
        if 'oignon' in name_lower:
            return 30, 40, 8, 'Cuisson au four', False, None, "Tarte oignon : tarte salée alsacienne"
        else:
            return 30, 40, 8, 'Cuisson au four', False, None, "Tarte : pâte + garniture + cuisson"
    
    if 'clafoutis' in name_lower:
        return 15, 35, 6, 'Cuisson au four', False, None, "Clafoutis : très simple, fruits + appareil"
    
    if 'far breton' in name_lower or 'far' in name_lower and role == 'DESSERT':
        return 20, 45, 8, 'Cuisson au four', False, None, "Far breton : pâte liquide, cuisson longue"
    
    if 'galette des rois' in name_lower:
        return 40, 35, 8, 'Cuisson au four', False, None, "Galette des rois : feuilletage + frangipane"
    
    if 'bûche' in name_lower:
        return 60, 20, 8, 'Cuisson au four', False, None, "Bûche Noël : montage complexe"
    
    if 'forêt-noire' in name_lower or 'forêt noire' in name_lower:
        return 40, 30, 12, 'Cuisson au four', False, None, "Forêt-Noire : gâteau + chantilly + cerises"
    
    if 'paris-brest' in name_lower:
        return 40, 25, 8, 'Cuisson au four', False, None, "Paris-Brest : pâte à choux + mousseline"
    
    if 'charlotte' in name_lower:
        return 45, 0, 8, 'Sans cuisson', False, None, "Charlotte : montage biscuits + mousse"
    
    if 'flaugnarde' in name_lower:
        return 15, 35, 6, 'Cuisson au four', False, None, "Flaugnarde : clafoutis limousin aux pommes"
    
    # --------------------------------------------------
    # PETITS GÂTEAUX
    # --------------------------------------------------
    
    if 'cookie' in name_lower:
        return 15, 15, 12, 'Cuisson au four', False, None, "Cookies : rapides, nombreuses portions"
    
    if 'brownie' in name_lower:
        return 15, 25, 12, 'Cuisson au four', False, None, "Brownies : chocolat, découpés en parts"
    
    if 'madeleine' in name_lower:
        return 15, 12, 12, 'Cuisson au four', False, None, "Madeleines : cuisson rapide en moules"
    
    if 'financier' in name_lower:
        return 15, 15, 12, 'Cuisson au four', False, None, "Financiers : amandes, cuisson courte"
    
    if 'sablé' in name_lower:
        return 20, 15, 20, 'Cuisson au four', False, None, "Sablés : biscuits secs, nombreux"
    
    if 'macaron' in name_lower:
        return 40, 15, 24, 'Cuisson au four', False, None, "Macarons : technique meringue italienne"
    
    if 'canelé' in name_lower:
        return 20, 60, 12, 'Cuisson au four', False, None, "Canelés : cuisson très longue à haute température"
    
    if 'meringue' in name_lower:
        return 15, 90, 12, 'Cuisson au four', False, None, "Meringues : cuisson douce très longue"
    
    if 'pain d\'épices' in name_lower or 'pain d épices' in name_lower:
        return 15, 50, 12, 'Cuisson au four', False, None, "Pain d'épices : épices, cuisson longue"
    
    # --------------------------------------------------
    # DESSERTS CRÉMEUX
    # --------------------------------------------------
    
    if 'mousse' in name_lower:
        if 'avocat' in name_lower:
            return 15, 0, 4, 'Sans cuisson', False, None, "Mousse avocat cacao : healthy, sans cuisson"
        else:
            return 20, 0, 6, 'Sans cuisson', False, None, "Mousse : montage aérien, pas de cuisson"
    
    if 'entremets' in name_lower:
        return 45, 0, 8, 'Sans cuisson', False, None, "Entremets : montage complexe multicouches"
    
    if 'panna cotta' in name_lower:
        return 15, 0, 6, 'Sans cuisson', False, None, "Panna cotta : gélatine, prise au frais"
    
    if 'crème brûlée' in name_lower:
        return 20, 40, 6, 'Cuisson au four', False, None, "Crème brûlée : cuisson bain-marie + caramélisation"
    
    if 'crème caramel' in name_lower:
        return 20, 45, 6, 'Cuisson au four', False, None, "Crème caramel : cuisson bain-marie"
    
    if 'tiramisu' in name_lower:
        return 30, 0, 6, 'Sans cuisson', False, None, "Tiramisu : montage biscuits + mascarpone"
    
    if 'île flottante' in name_lower or 'ile flottante' in name_lower:
        return 30, 15, 6, 'Cuisson mixte', False, None, "Île flottante : meringues pochées + crème anglaise"
    
    # --------------------------------------------------
    # GLACES & SORBETS
    # --------------------------------------------------
    
    if 'sorbet' in name_lower:
        return 15, 0, 8, 'Sans cuisson', False, None, "Sorbet : fruits mixés + turbinage"
    
    if 'glace' in name_lower or 'nice cream' in name_lower or 'frozen yogurt' in name_lower or 'yaourt glacé' in name_lower:
        return 15, 0, 8, 'Sans cuisson', False, None, "Glace/frozen : préparation + turbinage"
    
    if 'semifreddo' in name_lower:
        return 20, 0, 8, 'Sans cuisson', False, None, "Semifreddo : semi-congelé italien"
    
    if 'parfait glacé' in name_lower:
        return 25, 0, 8, 'Sans cuisson', False, None, "Parfait glacé : mousse congelée"
    
    if 'profiteroles' in name_lower and 'glacé' in name_lower:
        return 50, 25, 6, 'Cuisson au four', False, None, "Profiteroles glacées : choux + glace"
    
    # --------------------------------------------------
    # COMPOTES & FRUITS
    # --------------------------------------------------
    
    if 'compote' in name_lower:
        return 10, 20, 4, 'Mijotage', False, None, "Compote : fruits cuits avec peu de sucre"
    
    if 'brochettes de fruits' in name_lower:
        return 15, 0, 4, 'Sans cuisson', False, None, "Brochettes fruits : découpe + assemblage"
    
    # --------------------------------------------------
    # RIZ & ACCOMPAGNEMENTS
    # --------------------------------------------------
    
    if name_lower.startswith('riz '):
        if 'complet' in name_lower:
            return 5, 45, 4, "Cuisson à l'eau", False, None, "Riz complet : cuisson longue"
        elif 'basmati' in name_lower or 'thaï' in name_lower:
            return 5, 20, 4, "Cuisson à l'eau", False, None, "Riz parfumé : cuisson standard"
        elif any(x in name_lower for x in ['curry', 'safran', 'épices']):
            return 10, 25, 4, 'Mijotage', False, None, "Riz aromatisé : cuisson avec épices"
        else:
            return 5, 20, 4, "Cuisson à l'eau", False, None, "Riz blanc : cuisson simple"
    
    # --------------------------------------------------
    # PÂTES
    # --------------------------------------------------
    
    if any(x in name_lower for x in ['spaghetti', 'penne', 'fusilli', 'tagliatelle', 'macaroni', 'pâtes']):
        if 'gratin' in name_lower:
            return 30, 40, 6, 'Cuisson au four', False, None, "Pâtes gratinées : cuisson + four"
        else:
            return 10, 12, 4, "Cuisson à l'eau", False, None, "Pâtes : cuisson eau bouillante"
    
    # --------------------------------------------------
    # LÉGUMES ACCOMPAGNEMENTS
    # --------------------------------------------------
    
    if role == 'ACCOMPAGNEMENT' and 'rôti' in name_lower:
        if any(x in name_lower for x in ['betterave', 'courge', 'potiron']):
            return 15, 45, 4, 'Cuisson au four', False, None, "Légumes racines rôtis : cuisson longue"
        else:
            return 10, 25, 4, 'Cuisson au four', False, None, "Légumes rôtis : four haute température"
    
    if role == 'ACCOMPAGNEMENT' and 'vapeur' in name_lower:
        return 10, 15, 4, 'Cuisson vapeur', False, None, "Légumes vapeur : cuisson douce"
    
    if role == 'ACCOMPAGNEMENT' and 'sauté' in name_lower:
        return 10, 10, 4, 'Poêle', False, None, "Légumes sautés : cuisson rapide vive"
    
    # --------------------------------------------------
    # POMMES DE TERRE
    # --------------------------------------------------
    
    if 'aligot' in name_lower:
        return 20, 30, 4, 'Cuisson mixte', False, None, "Aligot : purée + fromage fondu, technique"
    
    if 'pomme' in name_lower and 'terre' in name_lower:
        if 'gratin' in name_lower or 'boulangère' in name_lower:
            return 25, 60, 6, 'Cuisson au four', False, None, "Gratin/boulangères : cuisson four longue"
        elif 'rösti' in name_lower:
            return 20, 20, 4, 'Poêle', False, None, "Rösti : galette poêlée suisse"
        elif 'noisette' in name_lower:
            return 20, 15, 4, 'Friture', False, None, "Pommes noisettes : petites boules frites"
        elif 'rissolée' in name_lower:
            return 15, 25, 4, 'Poêle', False, None, "Pommes rissolées : poêle dorées"
        elif 'vapeur' in name_lower:
            return 5, 25, 4, 'Cuisson vapeur', False, None, "Pommes vapeur : cuisson douce"
        elif 'écrasé' in name_lower or 'écrasée' in name_lower:
            return 15, 25, 4, "Cuisson à l'eau", False, None, "Écrasé : cuisson + écrasement grossier"
        elif 'anna' in name_lower:
            return 30, 60, 6, 'Cuisson au four', False, None, "Pommes Anna : lamelles beurre, four longtemps"
        elif 'crique' in name_lower or 'millassou' in name_lower or 'galette' in name_lower:
            return 20, 20, 4, 'Poêle', True, False, "Galette pommes terre : plat complet régional"
        else:
            return 15, 30, 4, "Cuisson à l'eau", False, None, "Pommes terre : cuisson standard"
    
    # --------------------------------------------------
    # VIANDES GRILLÉES
    # --------------------------------------------------
    
    if 'steak' in name_lower and 'grillé' in name_lower:
        return 5, 10, 4, 'Poêle', False, True, "Steak grillé : cuisson rapide, nécessite accompagnement"
    
    # --------------------------------------------------
    # PLATS MIJOTÉS
    # --------------------------------------------------
    
    if any(x in name_lower for x in ['daube', 'bourguignon', 'blanquette', 'osso', 'ragoût', 'mijoté']):
        return 30, 150, 6, 'Mijotage', True, False, "Plat mijoté : longue cuisson basse température"
    
    # --------------------------------------------------
    # SPÉCIALITÉS RÉGIONALES FRANÇAISES
    # --------------------------------------------------
    
    if 'tripes' in name_lower:
        return 30, 180, 6, 'Mijotage', True, False, "Tripes : cuisson très longue traditionnelle"
    
    if 'cotriade' in name_lower:
        return 30, 40, 6, 'Mijotage', True, False, "Cotriade : soupe-repas bretonne aux poissons"
    
    if 'quenelle' in name_lower:
        return 40, 20, 4, "Cuisson à l'eau", True, False, "Quenelles : farce pochée + sauce"
    
    if 'escargot' in name_lower:
        return 30, 15, 4, 'Cuisson au four', False, None, "Escargots : préparation + gratinage"
    
    if 'alouette' in name_lower and 'tête' in name_lower:
        return 30, 60, 4, 'Mijotage', True, False, "Alouettes sans tête : paupiettes provençales"
    
    if 'farçous' in name_lower:
        return 25, 35, 8, 'Cuisson au four', False, None, "Farçous : galettes herbes aveyronnaises"
    
    if 'salsifis' in name_lower and 'crème' in name_lower:
        return 20, 35, 4, 'Mijotage', False, None, "Salsifis crème : légume ancien en sauce"
    
    # --------------------------------------------------
    # AMÉRIQUE LATINE
    # --------------------------------------------------
    
    if 'ceviche' in name_lower:
        return 20, 0, 4, 'Marinade', False, None, "Ceviche : poisson mariné citron, pas de cuisson"
    
    if 'feijoada' in name_lower:
        return 30, 120, 6, 'Mijotage', True, False, "Feijoada : ragoût haricots noirs brésilien"
    
    if 'mole' in name_lower:
        return 40, 60, 6, 'Mijotage', True, False, "Mole : sauce complexe mexicaine chocolat-piment"
    
    if 'tamales' in name_lower or 'tamal' in name_lower:
        return 60, 45, 8, 'Cuisson vapeur', True, False, "Tamales : pâte maïs vapeur en feuilles"
    
    if 'empanada' in name_lower:
        return 40, 25, 8, 'Cuisson au four', False, None, "Empanadas : chaussons farcis"
    
    if 'humitas' in name_lower:
        return 40, 45, 6, 'Cuisson vapeur', True, False, "Humitas : maïs en feuilles, andin"
    
    if 'pozole' in name_lower:
        return 25, 90, 6, 'Mijotage', True, False, "Pozole : soupe-repas mexicaine au maïs"
    
    if 'cochinita pibil' in name_lower:
        return 30, 180, 6, 'Cuisson au four', True, False, "Cochinita pibil : porc mariné cuisson longue"
    
    if 'ropa vieja' in name_lower:
        return 30, 120, 6, 'Mijotage', True, False, "Ropa vieja : bœuf effiloché cubain"
    
    if 'picadillo' in name_lower:
        return 20, 30, 4, 'Poêle', True, False, "Picadillo : hachis viande latino"
    
    if 'arroz con pollo' in name_lower:
        return 25, 45, 6, 'Cuisson mixte', True, False, "Arroz con pollo : riz poulet, plat unique"
    
    if 'lomo saltado' in name_lower:
        return 20, 15, 4, 'Sauté au wok', True, False, "Lomo saltado : sauté bœuf péruvien"
    
    if 'aji de gallina' in name_lower:
        return 30, 40, 4, 'Mijotage', True, False, "Aji de gallina : poulet sauce pimentée péruvien"
    
    if 'moqueca' in name_lower:
        return 25, 35, 4, 'Mijotage', True, False, "Moqueca : ragoût poisson bahianais"
    
    if 'sancocho' in name_lower:
        return 30, 90, 6, 'Mijotage', True, False, "Sancocho : soupe-repas colombienne"
    
    if 'bandeja paisa' in name_lower:
        return 40, 60, 2, 'Cuisson mixte', True, False, "Bandeja paisa : assiette complète colombienne"
    
    if 'chiles rellenos' in name_lower:
        return 35, 25, 4, 'Cuisson au four', True, False, "Chiles rellenos : piments farcis mexicains"
    
    if 'pastel de choclo' in name_lower:
        return 35, 50, 6, 'Cuisson au four', True, False, "Pastel de choclo : gratin maïs chilien"
    
    if 'gallo pinto' in name_lower:
        return 15, 15, 4, 'Poêle', False, None, "Gallo pinto : riz haricots costa-ricain"
    
    if 'patacones' in name_lower:
        return 15, 10, 4, 'Friture', False, None, "Patacones : bananes plantain frites"
    
    # --------------------------------------------------
    # AFRIQUE / MOYEN-ORIENT
    # --------------------------------------------------
    
    if 'pastilla' in name_lower:
        return 50, 45, 8, 'Cuisson au four', True, False, "Pastilla : feuilleté poulet amandes marocain"
    
    if 'rfissa' in name_lower:
        return 40, 60, 6, 'Mijotage', True, False, "Rfissa : poulet lentilles msemen marocain"
    
    if 'tanjia' in name_lower:
        return 30, 240, 6, 'Mijotage', True, False, "Tanjia : plat mijoté très longtemps"
    
    if 'bissara' in name_lower:
        return 15, 40, 4, 'Mijotage', False, None, "Bissara : soupe fèves marocaine"
    
    if 'zaalouk' in name_lower:
        return 20, 30, 6, 'Mijotage', False, None, "Zaalouk : caviar aubergines cuit marocain"
    
    if 'yassa' in name_lower:
        return 20, 40, 4, 'Mijotage', True, False, "Yassa : poulet mariné oignons sénégalais"
    
    if 'mafé' in name_lower:
        return 25, 45, 4, 'Mijotage', True, False, "Mafé : sauce arachide africaine"
    
    if 'thieboudienne' in name_lower or 'thiéboudienne' in name_lower:
        return 40, 60, 6, 'Mijotage', True, False, "Thiéboudienne : riz poisson sénégalais"
    
    if 'doro wat' in name_lower or 'doro wot' in name_lower:
        return 30, 60, 4, 'Mijotage', True, False, "Doro wat : ragoût poulet éthiopien épicé"
    
    if 'injera' in name_lower:
        return 72, 0, 8, 'Fermentation', False, None, "Injera : crêpe teff fermentée 3 jours"
    
    if 'shish taouk' in name_lower or 'chich taouk' in name_lower:
        return 120, 15, 4, 'Grillade', False, True, "Shish taouk : brochettes poulet marinées"
    
    if 'shawarma' in name_lower:
        return 180, 20, 4, 'Cuisson verticale', True, False, "Shawarma : viande marinée rôtie verticale"
    
    if 'manakish' in name_lower or 'manaeesh' in name_lower:
        return 90, 15, 4, 'Cuisson au four', True, False, "Manakish : pizza libanaise zaatar"
    
    if 'kibbeh' in name_lower:
        return 45, 20, 6, 'Friture', False, None, "Kibbeh : boulettes boulgour viande"
    
    if 'dolmas' in name_lower or 'dolma' in name_lower:
        return 60, 40, 8, 'Mijotage', False, None, "Dolmas : feuilles vigne farcies"
    
    if 'fatteh' in name_lower:
        return 25, 20, 4, 'Cuisson mixte', True, False, "Fatteh : pita pois chiches yaourt libanais"
    
    # --------------------------------------------------
    # SNACKS SANTÉ
    # --------------------------------------------------
    
    if 'energy ball' in name_lower:
        return 15, 0, 12, 'Sans cuisson', False, None, "Energy balls : dattes noix mixées roulées"
    
    if 'barre' in name_lower and 'céréale' in name_lower:
        return 15, 20, 12, 'Cuisson au four', False, None, "Barres céréales : pressées et cuites"
    
    # --------------------------------------------------
    # ANTIPASTI / ENTRÉES ITALIENNES
    # --------------------------------------------------
    
    if 'gressins' in name_lower or 'grissini' in name_lower:
        return 15, 20, 20, 'Cuisson au four', False, None, "Gressins : bâtonnets pain italiens"
    
    if 'légumes grillés' in name_lower or 'antipasti' in name_lower:
        return 20, 15, 6, 'Cuisson au four', False, None, "Légumes grillés marinés : antipasti"
    
    if 'artichauts' in name_lower:
        if 'romaine' in name_lower:
            return 20, 40, 4, 'Mijotage', False, None, "Artichauts romaine : mijotés vin blanc"
        else:
            return 15, 30, 4, 'Cuisson vapeur', False, None, "Artichauts : cuisson vapeur classique"
    
    if 'poivrons marinés' in name_lower:
        return 15, 25, 6, 'Cuisson au four', False, None, "Poivrons marinés : rôtis puis marinés"
    
    if 'melanzane' in name_lower or ('aubergines' in name_lower and 'parmigiana' in name_lower) or ('aubergines' in name_lower and 'parmesan' in name_lower):
        return 30, 45, 6, 'Cuisson au four', True, False, "Aubergines parmigiana : gratin italien complet"
    
    if 'champignons farcis' in name_lower:
        return 20, 20, 4, 'Cuisson au four', False, None, "Champignons farcis : farcis gratinés"
    
    if 'tomates provençales' in name_lower:
        return 15, 25, 4, 'Cuisson au four', False, None, "Tomates provençales : gratinées herbes"
    
    if 'roulés de courgette' in name_lower:
        return 25, 0, 6, 'Sans cuisson', False, None, "Roulés courgette : tranches fines roulées"
    
    # --------------------------------------------------
    # PIZZAS & TARTES SALÉES
    # --------------------------------------------------
    
    if 'flammenkueche' in name_lower or 'flammkuchen' in name_lower or 'tarte flambée' in name_lower:
        return 30, 15, 4, 'Cuisson au four', True, False, "Flammenkueche : tarte fine alsacienne"
    
    if 'calzone' in name_lower:
        return 90, 25, 4, 'Cuisson au four', True, False, "Calzone : pizza fermée, pâte levée"
    
    # --------------------------------------------------
    # VOLAILLES - POULET
    # --------------------------------------------------
    
    if 'poulet rôti' in name_lower:
        return 15, 75, 6, 'Cuisson au four', True, False, "Poulet rôti : four, plat dimanche"
    
    if 'poulet basquaise' in name_lower:
        return 25, 45, 4, 'Mijotage', True, False, "Poulet basquaise : tomates poivrons"
    
    if 'poulet' in name_lower and 'crème' in name_lower and 'champignons' in name_lower:
        return 20, 35, 4, 'Mijotage', True, False, "Poulet crème champignons : sauce onctueuse"
    
    if 'poulet vallée d\'auge' in name_lower or ('poulet' in name_lower and 'cidre' in name_lower):
        return 20, 40, 4, 'Mijotage', True, False, "Poulet vallée d'Auge : cidre crème normand"
    
    if 'coq au vin' in name_lower:
        return 30, 90, 6, 'Mijotage', True, False, "Coq au vin : mijoté vin rouge, classique"
    
    if 'waterzooi' in name_lower:
        return 25, 40, 4, 'Mijotage', True, False, "Waterzooi : ragoût belge crémeux"
    
    if 'escalope' in name_lower and 'poulet' in name_lower:
        if 'milanaise' in name_lower or 'panée' in name_lower:
            return 15, 10, 4, 'Poêle', False, True, "Escalopes panées : rapide, besoin accompagnement"
        else:
            return 10, 12, 4, 'Poêle', False, True, "Escalopes poulet : cuisson rapide"
    
    # --------------------------------------------------
    # VEAU
    # --------------------------------------------------
    
    if 'saltimbocca' in name_lower:
        return 15, 12, 4, 'Poêle', False, True, "Saltimbocca : veau jambon sauge italien"
    
    if 'piccata' in name_lower:
        return 15, 15, 4, 'Poêle', False, True, "Piccata : veau citron sauce rapide"
    
    if 'veau orloff' in name_lower:
        return 40, 60, 6, 'Cuisson au four', True, False, "Veau Orloff : rôti farci champignons"
    
    if 'veau marengo' in name_lower:
        return 25, 60, 4, 'Mijotage', True, False, "Veau Marengo : sauté tomates olives"
    
    if 'paupiettes de veau' in name_lower:
        return 30, 45, 4, 'Mijotage', True, False, "Paupiettes veau : roulées braisées"
    
    # --------------------------------------------------
    # BŒUF
    # --------------------------------------------------
    
    if 'carbonnade' in name_lower:
        return 25, 120, 6, 'Mijotage', True, False, "Carbonnade flamande : bière oignons"
    
    if 'hachis parmentier' in name_lower:
        return 30, 35, 6, 'Cuisson au four', True, False, "Hachis parmentier : viande purée gratiné"
    
    if 'steak frites' in name_lower or 'steak-frites' in name_lower:
        return 15, 15, 2, 'Poêle', True, False, "Steak-frites : classique bistrot français"
    
    if 'entrecôte' in name_lower:
        return 5, 10, 4, 'Poêle', False, True, "Entrecôte grillée : pièce noble, besoin accompagnement"
    
    if 'stroganoff' in name_lower:
        return 20, 25, 4, 'Poêle', True, False, "Bœuf Stroganoff : crème moutarde russe"
    
    if 'goulash' in name_lower or 'goulasch' in name_lower:
        return 25, 120, 6, 'Mijotage', True, False, "Goulash : ragoût hongrois paprika"
    
    if 'chili con carne' in name_lower:
        return 20, 60, 6, 'Mijotage', True, False, "Chili con carne : haricots viande épicé"
    
    if 'boulettes' in name_lower and 'sauce tomate' in name_lower:
        return 25, 35, 4, 'Mijotage', True, False, "Boulettes sauce tomate : plat familial"
    
    if 'kefta' in name_lower:
        return 20, 15, 4, 'Cuisson au four', False, True, "Kefta : brochettes viande épicées"
    
    if 'bœuf loc lac' in name_lower or 'loc lac' in name_lower:
        return 120, 10, 4, 'Poêle', False, True, "Bœuf loc lac : mariné sauté cambodgien"
    
    if 'bœuf sauté' in name_lower and 'oignons' in name_lower:
        return 15, 10, 4, 'Sauté au wok', False, True, "Bœuf sauté oignons : wok rapide"
    
    # --------------------------------------------------
    # PORC
    # --------------------------------------------------
    
    if 'rôti de porc' in name_lower:
        if 'moutarde' in name_lower:
            return 15, 60, 6, 'Cuisson au four', True, False, "Rôti porc moutarde : classique français"
        else:
            return 15, 75, 6, 'Cuisson au four', True, False, "Rôti de porc : cuisson four longue"
    
    if 'porc' in name_lower and 'caramel' in name_lower:
        return 20, 30, 4, 'Mijotage', True, False, "Porc caramel : sucré-salé asiatique"
    
    if 'porc' in name_lower and 'aigre-douce' in name_lower:
        return 20, 20, 4, 'Sauté au wok', True, False, "Porc aigre-doux : sauce sucrée chinoise"
    
    if 'rougail saucisse' in name_lower:
        return 20, 35, 4, 'Mijotage', True, False, "Rougail saucisse : réunionnais tomates épicé"
    
    if 'saucisses' in name_lower and 'purée' in name_lower:
        return 20, 25, 4, 'Cuisson mixte', True, False, "Saucisses purée : plat réconfort"
    
    if 'ribs' in name_lower or 'travers de porc' in name_lower:
        return 20, 120, 4, 'Cuisson au four', True, False, "Travers porc : marinés cuisson longue"
    
    if 'pulled pork' in name_lower:
        return 30, 240, 8, 'Cuisson au four', True, False, "Pulled pork : effiloché cuisson très longue"
    
    if 'tonkatsu' in name_lower:
        return 15, 10, 4, 'Friture', False, True, "Tonkatsu : escalope panée japonaise"
    
    if 'jambon' in name_lower and 'braisé' in name_lower:
        return 20, 120, 8, 'Cuisson au four', True, False, "Jambon braisé : cuisson longue madère"
    
    # --------------------------------------------------
    # AGNEAU
    # --------------------------------------------------
    
    if 'agneau' in name_lower and 'gigot' in name_lower:
        return 20, 90, 6, 'Cuisson au four', True, False, "Gigot agneau : rôti four traditionnel"
    
    if 'agneau' in name_lower and 'navarin' in name_lower:
        return 30, 90, 6, 'Mijotage', True, False, "Navarin agneau : ragoût légumes printaniers"
    
    if 'agneau' in name_lower and 'curry' in name_lower:
        return 25, 60, 4, 'Mijotage', True, False, "Curry agneau : épicé indien"
    
    if 'mechoui' in name_lower:
        return 30, 180, 12, 'Cuisson au four', True, False, "Méchoui : agneau entier cuit longtemps"
    
    # --------------------------------------------------
    # CANARD
    # --------------------------------------------------
    
    if 'magret' in name_lower or 'aiguillettes' in name_lower:
        return 10, 15, 4, 'Poêle', False, True, "Magret/aiguillettes : canard poêlé rapide"
    
    if 'confit de canard' in name_lower:
        return 20, 120, 4, 'Cuisson au four', True, False, "Confit canard : cuisson graisse traditionnelle"
    
    if 'canard' in name_lower and 'orange' in name_lower:
        return 25, 90, 4, 'Cuisson au four', True, False, "Canard orange : rôti sauce agrumes"
    
    # --------------------------------------------------
    # POISSONS SIMPLES
    # --------------------------------------------------
    
    if 'poisson' in name_lower and 'papillote' in name_lower:
        return 15, 20, 4, 'Cuisson au four', False, True, "Poisson papillote : cuisson vapeur four"
    
    if 'fish and chips' in name_lower:
        return 25, 20, 4, 'Friture', True, False, "Fish and chips : poisson frit britannique"
    
    # --------------------------------------------------
    # POISSONS SPÉCIFIQUES
    # --------------------------------------------------
    
    if 'saumon' in name_lower:
        if 'gravlax' in name_lower:
            return 20, 0, 8, 'Marinade', False, None, "Gravlax : saumon mariné scandinave"
        elif 'papillote' in name_lower:
            return 15, 20, 4, 'Cuisson au four', False, True, "Saumon papillote : vapeur four"
        elif 'unilatérale' in name_lower or 'plancha' in name_lower:
            return 10, 10, 4, 'Poêle', False, True, "Saumon poêlé : cuisson unilatérale"
        else:
            return 10, 15, 4, 'Cuisson au four', False, True, "Saumon : cuisson four ou poêle"
    
    if 'lasagnes' in name_lower and 'saumon' in name_lower:
        return 35, 40, 6, 'Cuisson au four', True, False, "Lasagnes saumon : gratin complet"
    
    if 'cabillaud' in name_lower or 'morue' in name_lower:
        if 'brandade' in name_lower:
            return 30, 30, 6, 'Cuisson mixte', True, False, "Brandade morue : purée poisson provençale"
        else:
            return 10, 20, 4, 'Cuisson au four', False, True, "Cabillaud/morue : four ou poêle"
    
    if 'thon' in name_lower:
        if 'mi-cuit' in name_lower or 'tataki' in name_lower:
            return 10, 3, 4, 'Poêle', False, True, "Thon mi-cuit : saisi rapide"
        else:
            return 10, 10, 4, 'Poêle', False, True, "Steak thon : grillé rapide"
    
    if 'dorade' in name_lower or 'daurade' in name_lower:
        return 15, 30, 4, 'Cuisson au four', False, True, "Dorade four : poisson entier rôti"
    
    if 'sole' in name_lower:
        if 'meunière' in name_lower:
            return 10, 10, 4, 'Poêle', False, True, "Sole meunière : beurre citron classique"
        else:
            return 10, 12, 4, 'Poêle', False, True, "Sole : poisson délicat poêlé"
    
    if 'raie' in name_lower:
        if 'beurre noir' in name_lower:
            return 10, 15, 4, 'Poêle', False, True, "Raie beurre noir : classique français"
        else:
            return 10, 20, 4, "Cuisson à l'eau", False, True, "Raie : pochée ou grillée"
    
    if 'lotte' in name_lower:
        if 'américaine' in name_lower or 'armoricaine' in name_lower:
            return 25, 30, 4, 'Mijotage', False, True, "Lotte américaine : sauce crustacés"
        else:
            return 15, 20, 4, 'Cuisson au four', False, True, "Lotte : rôtie ou mijotée"
    
    if 'maquereau' in name_lower:
        if 'mariné' in name_lower:
            return 20, 10, 6, 'Marinade', False, None, "Maquereaux marinés : vin blanc"
        else:
            return 10, 15, 4, 'Cuisson au four', False, True, "Maquereaux : grillés ou four"
    
    if 'sardine' in name_lower:
        return 15, 10, 4, 'Grillade', False, True, "Sardines grillées : barbecue rapide"
    
    # --------------------------------------------------
    # FRUITS DE MER
    # --------------------------------------------------
    
    if 'moules' in name_lower:
        if 'marinière' in name_lower:
            return 15, 10, 4, 'Mijotage', True, False, "Moules marinières : vin blanc échalotes"
        elif 'crème' in name_lower:
            return 15, 10, 4, 'Mijotage', True, False, "Moules crème : version normande"
        elif 'provençale' in name_lower:
            return 20, 15, 4, 'Mijotage', True, False, "Moules provençale : tomates herbes"
        else:
            return 15, 10, 4, 'Mijotage', True, False, "Moules : cuisson vapeur vin"
    
    if 'paella' in name_lower:
        return 30, 40, 6, 'Cuisson mixte', True, False, "Paella : riz fruits mer espagnole"
    
    if 'zarzuela' in name_lower:
        return 35, 35, 6, 'Mijotage', True, False, "Zarzuela : cassolette poissons catalane"
    
    if 'fideuà' in name_lower or 'fideua' in name_lower:
        return 25, 30, 4, 'Cuisson mixte', True, False, "Fideuà : paella vermicelles"
    
    if 'aïoli' in name_lower and 'légumes' in name_lower:
        return 30, 40, 6, 'Cuisson vapeur', True, False, "Aïoli provençal : poisson légumes mayonnaise"
    
    # --------------------------------------------------
    # AUTRES VIANDES
    # --------------------------------------------------
    
    if 'lapin' in name_lower:
        if 'moutarde' in name_lower:
            return 20, 60, 4, 'Mijotage', True, False, "Lapin moutarde : braisé crème"
        elif 'chasseur' in name_lower:
            return 25, 75, 4, 'Mijotage', True, False, "Lapin chasseur : sauce vin champignons"
        else:
            return 25, 60, 4, 'Mijotage', True, False, "Lapin : mijoté sauce"
    
    if 'andouillette' in name_lower:
        return 5, 20, 2, 'Grillade', False, True, "Andouillette : grillée moutarde"
    
    if 'boudin noir' in name_lower:
        if 'pommes' in name_lower:
            return 15, 20, 2, 'Poêle', True, False, "Boudin noir pommes : duo classique"
        else:
            return 5, 15, 2, 'Poêle', False, True, "Boudin noir : poêlé rapide"
    
    if 'saucisson' in name_lower and 'brioche' in name_lower:
        return 120, 35, 8, 'Cuisson au four', True, False, "Saucisson brioche : lyonnais festif"
    
    # --------------------------------------------------
    # GALETTES & CRÊPES SALÉES
    # --------------------------------------------------
    
    if 'galettes de sarrasin' in name_lower or 'galette bretonne' in name_lower:
        return 90, 3, 8, 'Poêle', True, False, "Galettes sarrasin : pâte repos + cuisson"
    
    # --------------------------------------------------
    # GRATINS & PLATS AU FOUR
    # --------------------------------------------------
    
    if 'moussaka' in name_lower:
        return 40, 60, 6, 'Cuisson au four', True, False, "Moussaka : gratin grec aubergines viande"
    
    if 'parmentier' in name_lower and 'canard' in name_lower:
        return 30, 35, 6, 'Cuisson au four', True, False, "Parmentier canard : gratin confit"
    
    # --------------------------------------------------
    # PETITES ENTRÉES/APÉRO
    # --------------------------------------------------
    
    if 'feuilletés' in name_lower and 'saucisse' in name_lower:
        return 20, 25, 8, 'Cuisson au four', False, None, "Feuilletés saucisse : apéro chaud"
    
    if 'blinis' in name_lower:
        return 15, 15, 12, 'Poêle', False, None, "Blinis : petites crêpes russes"
    
    if 'gougères' in name_lower:
        return 20, 25, 12, 'Cuisson au four', False, None, "Gougères : choux fromage"
    
    if 'cake salé' in name_lower:
        return 15, 35, 8, 'Cuisson au four', False, None, "Cake salé : moelleux salé"
    
    if 'muffins salés' in name_lower:
        return 15, 25, 12, 'Cuisson au four', False, None, "Muffins salés : individuels"
    
    # --------------------------------------------------
    # SOUPES COMPLÉMENTAIRES
    # --------------------------------------------------
    
    if 'minestrone' in name_lower:
        return 20, 40, 6, 'Mijotage', True, False, "Minestrone : soupe-repas italienne"
    
    if 'chorba' in name_lower:
        return 20, 50, 6, 'Mijotage', True, False, "Chorba : soupe algérienne ramadan"
    
    # --------------------------------------------------
    # AGNEAU SPÉCIFIQUE
    # --------------------------------------------------
    
    if 'côtelettes' in name_lower and 'agneau' in name_lower:
        return 10, 12, 4, 'Grillade', False, True, "Côtelettes agneau : grillées rapide, besoin accompagnement"
    
    if 'navarin' in name_lower:
        return 30, 90, 6, 'Mijotage', True, False, "Navarin : ragoût agneau légumes printaniers"
    
    if 'mechoui' in name_lower or 'méchoui' in name_lower:
        return 30, 180, 12, 'Cuisson au four', True, False, "Méchoui : agneau entier cuit longtemps"
    
    # --------------------------------------------------
    # CANARD SPÉCIFIQUE
    # --------------------------------------------------
    
    if 'canard laqué' in name_lower or 'canard pékinois' in name_lower:
        return 45, 120, 4, 'Cuisson au four', True, False, "Canard laqué : mariné glacé cuisson longue"
    
    # --------------------------------------------------
    # FRUITS DE MER SPÉCIFIQUES
    # --------------------------------------------------
    
    if 'saint-jacques' in name_lower or 'noix de saint-jacques' in name_lower:
        if 'snackées' in name_lower or 'poêlées' in name_lower:
            return 10, 5, 4, 'Poêle', False, True, "Saint-Jacques snackées : saisies rapidement haute température"
        else:
            return 10, 5, 4, 'Poêle', False, True, "Saint-Jacques : cuisson très rapide"
    
    if 'crevettes' in name_lower:
        if 'armoricaine' in name_lower:
            return 20, 15, 4, 'Mijotage', False, True, "Crevettes armoricaine : sauce tomate cognac"
        elif 'wok' in name_lower:
            return 15, 8, 4, 'Sauté au wok', True, False, "Wok crevettes : sautées légumes croquants"
        else:
            return 10, 8, 4, 'Poêle', False, True, "Crevettes sautées : ail persil rapide"
    
    if 'calamars' in name_lower or 'encornets' in name_lower or 'seiches' in name_lower:
        if 'farcis' in name_lower:
            return 40, 45, 4, 'Mijotage', True, False, "Encornets farcis : farcis mijotés sauce"
        elif 'plancha' in name_lower:
            return 15, 5, 4, 'Poêle', False, True, "Seiches plancha : saisies persillade"
        else:
            return 15, 12, 4, 'Friture', False, True, "Calamars romaine : frits à la romaine"
    
    if 'poulpe' in name_lower or 'pulpo' in name_lower:
        return 15, 60, 4, 'Cuisson à l\'eau', False, True, "Poulpe galicien : bouilli paprika huile"
    
    # --------------------------------------------------
    # LÉGUMINEUSES & VÉGÉTARIEN
    # --------------------------------------------------
    
    if 'dahl' in name_lower or 'dal' in name_lower:
        return 15, 30, 4, 'Mijotage', True, False, "Dahl : lentilles épices indien, plat complet"
    
    if 'lentilles' in name_lower and 'salade' in name_lower:
        return 20, 25, 4, 'Cuisson simple', False, False, "Salade lentilles : lentilles vinaigrette entrée"
    
    if 'bolognaise' in name_lower and 'lentilles' in name_lower:
        return 20, 40, 6, 'Mijotage', True, False, "Bolognaise lentilles : version végétarienne complète"
    
    if 'pois chiches rôtis' in name_lower:
        return 10, 25, 4, 'Cuisson au four', False, None, "Pois chiches rôtis : snack croquant épicé"
    
    if 'chili sin carne' in name_lower:
        return 20, 45, 6, 'Mijotage', True, False, "Chili sin carne : version végétarienne haricots"
    
    if 'haricots blancs' in name_lower and 'bretonne' in name_lower:
        return 20, 90, 6, 'Mijotage', True, False, "Haricots bretonne : mijotés sauce tomate"
    
    if 'fèves' in name_lower and 'catalane' in name_lower:
        return 20, 35, 4, 'Mijotage', False, True, "Fèves catalane : chorizo lardons"
    
    if 'socca' in name_lower:
        return 10, 15, 4, 'Cuisson au four', False, None, "Socca niçoise : galette farine pois chiches"
    
    if 'panisses' in name_lower:
        return 60, 15, 6, 'Friture', False, None, "Panisses : farine pois chiches refroidies frites"
    
    # --------------------------------------------------
    # PÂTES SPÉCIFIQUES
    # --------------------------------------------------
    
    if 'lasagnes' in name_lower:
        if 'épinards' in name_lower and 'ricotta' in name_lower:
            return 35, 40, 6, 'Cuisson au four', True, False, "Lasagnes épinards ricotta : gratin végétarien"
        else:
            return 40, 45, 6, 'Cuisson au four', True, False, "Lasagnes : gratin multicouche"
    
    if 'risotto' in name_lower:
        return 10, 25, 4, 'Mijotage', True, False, "Risotto : riz crémeux remué constamment"
    
    if 'gnocchis' in name_lower or 'gnocchi' in name_lower:
        if 'sorrentina' in name_lower or 'tomate' in name_lower and 'mozzarella' in name_lower:
            return 60, 20, 4, 'Cuisson au four', True, False, "Gnocchis sorrentina : gratinés tomate mozza"
        else:
            return 60, 8, 4, 'Cuisson à l\'eau', False, True, "Gnocchis : pommes terre pochés"
    
    if 'raviolis' in name_lower or 'ravioli' in name_lower:
        return 90, 8, 4, 'Cuisson à l\'eau', True, False, "Raviolis maison : pâte farcis pochés"
    
    if 'cannellonis' in name_lower:
        return 45, 35, 6, 'Cuisson au four', True, False, "Cannellonis : tubes farcis gratinés"
    
    if 'one pot pasta' in name_lower:
        return 10, 15, 4, 'Cuisson unique', True, False, "One pot pasta : tout cuit ensemble rapidement"
    
    # --------------------------------------------------
    # TOFU & ALTERNATIVES VÉGÉTALES
    # --------------------------------------------------
    
    if 'tofu' in name_lower:
        if 'général tao' in name_lower:
            return 20, 15, 4, 'Friture', True, False, "Tofu général Tao : frit sauce sucrée chinoise"
        elif 'mapo' in name_lower:
            return 20, 20, 4, 'Mijotage', True, False, "Tofu mapo : sichuanais épicé pimenté"
        elif 'brouillé' in name_lower:
            return 10, 8, 2, 'Poêle', True, False, "Tofu brouillé : alternative œufs végétale"
        elif 'katsu' in name_lower or 'pané' in name_lower:
            return 15, 10, 4, 'Friture', False, True, "Tofu katsu : pané frit japonais"
        elif 'mariné' in name_lower and 'grillé' in name_lower:
            return 120, 10, 4, 'Grillade', False, True, "Tofu mariné : marinade longue puis grillé"
        else:
            return 15, 10, 4, 'Sauté au wok', False, True, "Tofu sauté : légumes sauce soja"
    
    if 'seitan' in name_lower:
        if 'burger' in name_lower:
            return 30, 15, 4, 'Cuisson mixte', True, False, "Burger seitan : alternative végétale complète"
        else:
            return 20, 12, 4, 'Sauté au wok', True, False, "Seitan sauté : protéine blé sautée"
    
    if 'tempeh' in name_lower:
        return 20, 15, 4, 'Poêle', False, True, "Tempeh laqué : soja fermenté mariné"
    
    # --------------------------------------------------
    # BOWLS & QUINOA
    # --------------------------------------------------
    
    if 'buddha bowl' in name_lower:
        return 30, 25, 2, 'Cuisson mixte', True, False, "Buddha bowl : bol complet équilibré végétarien"
    
    if 'quinoa' in name_lower:
        if 'taboulé' in name_lower:
            return 15, 15, 4, 'Cuisson à l\'eau', False, None, "Quinoa taboulé : salade fraîche herbes"
        elif 'galettes' in name_lower:
            return 25, 15, 6, 'Poêle', True, False, "Galettes quinoa : patties végétales poêlées"
        else:
            return 10, 15, 4, 'Cuisson à l\'eau', False, None, "Quinoa : graine andine cuite"
    
    # --------------------------------------------------
    # LÉGUMES MIJOTÉS & RÔTIS SPÉCIFIQUES
    # --------------------------------------------------
    
    if 'ratatouille' in name_lower:
        return 25, 45, 4, 'Mijotage', False, True, "Ratatouille : légumes mijotés provençaux"
    
    if 'wok de légumes' in name_lower:
        return 15, 10, 4, 'Sauté au wok', True, False, "Wok légumes : sautés croquants sauce"
    
    if 'légumes rôtis' in name_lower and 'four' in name_lower:
        return 20, 40, 6, 'Cuisson au four', False, True, "Légumes rôtis : carottes panais four"
    
    if 'frites de patates douces' in name_lower:
        return 15, 25, 4, 'Cuisson au four', False, None, "Frites patates douces : four paprika"
    
    if 'pommes dauphine' in name_lower:
        return 40, 15, 6, 'Friture', False, None, "Pommes dauphine : purée pâte choux frites"
    
    if 'truffade' in name_lower:
        return 20, 25, 4, 'Poêle', True, False, "Truffade : pommes terre tomme auvergne"
    
    if 'frites de polenta' in name_lower:
        return 60, 15, 4, 'Friture', False, None, "Frites polenta : semoule refroidie frite"
    
    if 'polenta crémeuse' in name_lower or ('polenta' in name_lower and 'crémeuse' in name_lower):
        return 10, 25, 4, 'Mijotage', False, None, "Polenta crémeuse : semoule maïs onctueuse"
    
    if 'asperges' in name_lower and 'rôties' in name_lower:
        return 10, 15, 4, 'Cuisson au four', False, None, "Asperges rôties : four parmesan"
    
    if 'épinards' in name_lower and 'crème' in name_lower:
        return 15, 20, 4, 'Mijotage', False, None, "Épinards crème : fondus crème fraîche"
    
    if 'choux de bruxelles' in name_lower and 'lard' in name_lower:
        return 15, 25, 4, 'Cuisson au four', False, None, "Choux Bruxelles : rôtis lard érable"
    
    if 'carottes glacées' in name_lower:
        return 10, 20, 4, 'Mijotage', False, None, "Carottes glacées : braisées orange beurre"
    
    if 'betteraves rôties' in name_lower and 'miel' in name_lower:
        return 15, 60, 4, 'Cuisson au four', False, None, "Betteraves rôties : miel thym four long"
    
    if 'fenouil braisé' in name_lower:
        return 15, 35, 4, 'Mijotage', False, None, "Fenouil braisé : mijoté anis"
    
    # --------------------------------------------------
    # PLATS INDIENS VÉGÉTARIENS
    # --------------------------------------------------
    
    if 'palak paneer' in name_lower:
        return 25, 25, 4, 'Mijotage', True, False, "Palak paneer : épinards fromage indien"
    
    if 'baingan bharta' in name_lower:
        return 20, 35, 4, 'Cuisson mixte', False, True, "Baingan bharta : caviar aubergine indien fumé"
    
    if 'pakoras' in name_lower:
        return 20, 15, 8, 'Friture', False, None, "Pakoras : beignets légumes indiens frits"
    
    # --------------------------------------------------
    # SPÉCIALITÉS MÉDITERRANÉENNES
    # --------------------------------------------------
    
    if 'caponata' in name_lower:
        return 20, 30, 6, 'Mijotage', False, None, "Caponata : ratatouille sicilienne aigre-douce"
    
    if 'crozets' in name_lower or 'croziflette' in name_lower:
        return 20, 30, 6, 'Cuisson au four', True, False, "Crozets gratin : pâtes sarrasin beaufort"
    
    if 'pissaladière' in name_lower:
        return 120, 30, 6, 'Cuisson au four', True, False, "Pissaladière : tarte oignons anchois niçoise"
    
    if 'gözleme' in name_lower or 'gozleme' in name_lower:
        return 90, 15, 4, 'Poêle', True, False, "Gözleme : crêpe turque farcie épinards feta"
    
    if 'börek' in name_lower or 'borek' in name_lower:
        return 40, 30, 6, 'Cuisson au four', False, None, "Börek : feuilleté turc épinards"
    
    if 'koshari' in name_lower:
        return 30, 30, 6, 'Cuisson mixte', True, False, "Koshari : riz lentilles pâtes égyptien"
    
    if 'mjadra' in name_lower:
        return 20, 35, 4, 'Cuisson mixte', False, True, "Mjadra : riz lentilles oignons frits libanais"
    
    # --------------------------------------------------
    # SANDWICHS & FAST-FOOD
    # --------------------------------------------------
    
    if 'coleslaw' in name_lower:
        return 15, 0, 6, 'Sans cuisson', False, None, "Coleslaw : salade chou carottes américaine"
    
    if 'burger' in name_lower:
        if 'bœuf' in name_lower or 'beef' in name_lower:
            return 20, 15, 4, 'Cuisson mixte', True, False, "Burger bœuf : classique cheddar bacon"
        elif 'poulet' in name_lower:
            return 20, 20, 4, 'Cuisson mixte', True, False, "Burger poulet : croustillant pané"
        elif 'végétarien' in name_lower or 'haricots noirs' in name_lower:
            return 25, 15, 4, 'Cuisson mixte', True, False, "Burger végétarien : galette haricots"
        else:
            return 20, 15, 4, 'Cuisson mixte', True, False, "Burger : sandwich garni complet"
    
    if 'hot-dog' in name_lower or 'hot dog' in name_lower:
        return 10, 10, 2, 'Cuisson mixte', True, False, "Hot-dog : saucisse pain garnissons"
    
    if 'croque-monsieur' in name_lower:
        return 10, 10, 2, 'Cuisson au four', True, False, "Croque-monsieur : jambon fromage grillé"
    
    if 'croque-madame' in name_lower:
        return 12, 12, 2, 'Cuisson au four', True, False, "Croque-madame : croque + œuf dessus"
    
    if 'welsh' in name_lower and 'rarebit' in name_lower:
        return 15, 15, 2, 'Cuisson au four', True, False, "Welsh rarebit : pain sauce fromage gallois"
    
    if 'gyros' in name_lower:
        return 120, 15, 4, 'Grillade', True, False, "Gyros : viande marinée grillée pita grec"
    
    if 'wrap' in name_lower:
        return 15, 10, 2, 'Cuisson mixte', True, False, "Wrap : tortilla roulée garnie"
    
    if 'arepas' in name_lower:
        return 20, 15, 4, 'Poêle', True, False, "Arepas : galettes maïs vénézuéliennes"
    
    # --------------------------------------------------
    # NOUILLES ASIATIQUES SPÉCIFIQUES
    # --------------------------------------------------
    
    if 'dan dan' in name_lower:
        return 20, 15, 4, 'Cuisson mixte', True, False, "Dan dan noodles : nouilles sichuanaises épicées"
    
    if 'nouilles sautées' in name_lower and 'poulet' in name_lower:
        return 20, 12, 4, 'Sauté au wok', True, False, "Nouilles sautées : wok poulet légumes"
    
    if 'japchae' in name_lower:
        return 25, 15, 4, 'Sauté au wok', True, False, "Japchae : nouilles patate douce coréennes"
    
    if 'onigiri' in name_lower:
        return 20, 0, 4, 'Sans cuisson', False, None, "Onigiri : boules riz farcies japonaises"
    
    # --------------------------------------------------
    # SPÉCIALITÉS RÉGIONALES FRANÇAISES
    # --------------------------------------------------
    
    if 'potjevleesch' in name_lower or 'potjevlesch' in name_lower:
        return 30, 180, 8, 'Cuisson au four', True, False, "Potjevleesch : terrine 3 viandes flamande"
    
    if 'pieds' in name_lower and 'paquets' in name_lower:
        return 40, 240, 6, 'Mijotage', True, False, "Pieds paquets : tripes pieds mouton marseillais"
    
    if 'poule au pot' in name_lower:
        return 30, 180, 8, 'Mijotage', True, False, "Poule au pot : poule farcie légumes bouillon"
    
    if 'caillettes' in name_lower:
        return 30, 60, 6, 'Cuisson au four', True, False, "Caillettes : crépine foie porc ardéchoises"
    
    if 'diots' in name_lower or 'diot' in name_lower:
        return 10, 30, 4, 'Mijotage', True, False, "Diots : saucisses savoyardes vin blanc"
    
    if 'pan bagnat' in name_lower or 'pan-bagnat' in name_lower:
        return 15, 0, 4, 'Sans cuisson', True, False, "Pan bagnat : sandwich niçois pain mouillé"
    
    if 'tourton' in name_lower:
        return 30, 15, 6, 'Poêle', False, True, "Tourton : chausson pomme terre poêlé alpes"
    
    if 'oreilles' in name_lower and 'âne' in name_lower:
        return 20, 45, 6, 'Cuisson au four', False, None, "Oreilles d'âne : gratin épinards pâtes valgaudemar"
    
    if 'pôchouse' in name_lower or 'pochouse' in name_lower:
        return 25, 40, 6, 'Mijotage', True, False, "Pôchouse : matelote poissons vin blanc bourguignonne"
    
    if 'matelote' in name_lower and 'anguille' in name_lower:
        return 30, 45, 6, 'Mijotage', True, False, "Matelote anguille : ragoût anguille vin rouge"
    
    if 'lamproie' in name_lower:
        return 40, 60, 6, 'Mijotage', True, False, "Lamproie bordelaise : poisson sang vin rouge"
    
    if 'grenouilles' in name_lower or 'grenouille' in name_lower:
        return 20, 15, 4, 'Poêle', False, True, "Grenouilles : cuisses persillade poêlées"
    
    if 'fricassée' in name_lower and 'volaille' in name_lower:
        return 20, 45, 6, 'Mijotage', True, False, "Fricassée volaille : poulet crème champignons"
    
    if 'garbure' in name_lower:
        return 25, 120, 8, 'Mijotage', True, False, "Garbure : soupe épaisse chou confit gascogne"
    
    if 'tourin' in name_lower:
        return 10, 30, 4, 'Mijotage', False, False, "Tourin : soupe ail œuf sud-ouest"
    
    # --------------------------------------------------
    # POMMES DE TERRE SPÉCIFIQUES
    # --------------------------------------------------
    
    if 'pommes noisettes' in name_lower or 'pomme noisette' in name_lower:
        return 15, 20, 6, 'Friture', False, None, "Pommes noisettes : billes frites croustillantes"
    
    if 'pommes anna' in name_lower or 'pomme anna' in name_lower:
        return 20, 50, 6, 'Cuisson au four', False, None, "Pommes Anna : fines tranches beurre four"
    
    if 'boulangères' in name_lower or 'boulangère' in name_lower:
        return 15, 60, 6, 'Cuisson au four', False, None, "Pommes boulangères : tranches oignons bouillon four"
    
    # --------------------------------------------------
    # SOUPES INTERNATIONALES
    # --------------------------------------------------
    
    if 'bortsch' in name_lower or 'borchtch' in name_lower:
        return 20, 40, 6, 'Mijotage', True, False, "Bortsch : soupe betteraves ukrainienne crème"
    
    if 'ribollita' in name_lower:
        return 20, 45, 6, 'Mijotage', True, False, "Ribollita : soupe pain chou toscane"
    
    if 'zuppa di pesce' in name_lower:
        return 30, 40, 6, 'Mijotage', True, False, "Zuppa di pesce : soupe poissons italienne"
    
    if 'acquacotta' in name_lower:
        return 15, 30, 4, 'Mijotage', False, False, "Acquacotta : soupe pain tomates toscane"
    
    if 'sopa de ajo' in name_lower:
        return 10, 20, 4, 'Mijotage', False, False, "Sopa de ajo : soupe ail espagnole paprika"
    
    if 'bisque' in name_lower:
        if 'homard' in name_lower:
            return 45, 60, 6, 'Mijotage', False, False, "Bisque homard : velouté crustacés cognac crème"
        elif 'langoustines' in name_lower or 'langoustine' in name_lower:
            return 40, 50, 6, 'Mijotage', False, False, "Bisque langoustines : velouté crustacés luxueux"
        elif 'crabes' in name_lower or 'crabe' in name_lower:
            return 40, 50, 6, 'Mijotage', False, False, "Bisque crabes : velouté crustacés puissant"
    
    # --------------------------------------------------
    # SNACK/GOÛTER SIMPLE
    # --------------------------------------------------
    
    if 'pommes en tranches' in name_lower and 'beurre' in name_lower and 'cacahuètes' in name_lower:
        return 5, 0, 2, 'Sans cuisson', False, None, "Pommes cacahuètes : snack santé rapide"
    
    # --------------------------------------------------
    # PÂTISSERIE FRANÇAISE CLASSIQUE
    # --------------------------------------------------
    
    if 'profiteroles' in name_lower:
        return 50, 25, 6, 'Cuisson au four', False, None, "Profiteroles : choux glace chocolat chaud"
    
    if 'éclair' in name_lower:
        return 45, 25, 8, 'Cuisson au four', False, None, "Éclairs : pâte choux crème pâtissière"
    
    if 'religieuse' in name_lower:
        return 60, 25, 6, 'Cuisson au four', False, None, "Religieuse : double choux crème montage"
    
    if 'saint-honoré' in name_lower:
        return 90, 30, 8, 'Cuisson au four', False, None, "Saint-Honoré : pâte feuilletée choux crème"
    
    if 'fraisier' in name_lower:
        return 60, 25, 8, 'Cuisson au four', False, None, "Fraisier : génoise mousseline fraises"
    
    if 'opéra' in name_lower:
        return 120, 15, 12, 'Cuisson au four', False, None, "Opéra : biscuit joconde café chocolat"
    
    if 'mille-feuille' in name_lower or 'millefeuille' in name_lower:
        return 60, 30, 8, 'Cuisson au four', False, None, "Mille-feuille : feuilletage crème pâtissière"
    
    if 'soufflé' in name_lower:
        return 25, 25, 4, 'Cuisson au four', False, None, "Soufflé : aérien four délicat"
    
    # --------------------------------------------------
    # DESSERTS ITALIENS
    # --------------------------------------------------
    
    if 'zabaione' in name_lower or 'zabaglione' in name_lower:
        return 15, 10, 4, 'Cuisson douce', False, None, "Zabaione : crème œufs marsala fouettée"
    
    if 'cannoli' in name_lower:
        return 60, 12, 12, 'Friture', False, None, "Cannoli : tubes frits ricotta siciliens"
    
    if 'gelato' in name_lower:
        return 20, 0, 8, 'Sans cuisson', False, None, "Gelato : glace italienne dense crémeuse"
    
    if 'panettone' in name_lower:
        return 180, 45, 12, 'Cuisson au four', False, None, "Panettone : brioche milanaise fruits confits"
    
    if 'cantucci' in name_lower:
        return 20, 30, 20, 'Cuisson au four', False, None, "Cantucci : croquants toscans amandes"
    
    if 'bonet' in name_lower:
        return 20, 50, 6, 'Cuisson au four', False, None, "Bonet : flan piémontais chocolat amaretti"
    
    if 'pêches au vin' in name_lower or 'pêches' in name_lower and 'vin' in name_lower:
        return 10, 20, 4, 'Mijotage', False, None, "Pêches vin : pochées vin rouge épices"
    
    if 'salame al cioccolato' in name_lower or 'saucisson au chocolat' in name_lower:
        return 30, 0, 12, 'Sans cuisson', False, None, "Salame cioccolato : biscuits chocolat réfrigéré"
    
    if 'sfogliatelle' in name_lower:
        return 120, 30, 12, 'Cuisson au four', False, None, "Sfogliatelle : feuilletés napolitains ricotta"
    
    if 'pastiera' in name_lower:
        return 60, 90, 12, 'Cuisson au four', False, None, "Pastiera : tarte napolitaine blé ricotta"
    
    # --------------------------------------------------
    # DESSERTS ANGLO-SAXONS
    # --------------------------------------------------
    
    if 'cheesecake' in name_lower:
        return 30, 60, 12, 'Cuisson au four', False, None, "Cheesecake : gâteau fromage new-yorkais"
    
    if 'apple pie' in name_lower:
        return 40, 50, 8, 'Cuisson au four', False, None, "Apple pie : tarte pommes américaine"
    
    if 'carrot cake' in name_lower:
        return 30, 40, 12, 'Cuisson au four', False, None, "Carrot cake : gâteau carottes cream cheese"
    
    if 'red velvet' in name_lower:
        return 30, 30, 12, 'Cuisson au four', False, None, "Red velvet : gâteau rouge velours"
    
    if 'muffins' in name_lower and 'myrtilles' in name_lower:
        return 15, 25, 12, 'Cuisson au four', False, None, "Muffins myrtilles : moelleux américains"
    
    if 'cupcakes' in name_lower:
        return 25, 20, 12, 'Cuisson au four', False, None, "Cupcakes : petits gâteaux glaçage"
    
    if 'banana bread' in name_lower:
        return 20, 55, 10, 'Cuisson au four', False, None, "Banana bread : cake bananes moelleux"
    
    if 'crumble' in name_lower:
        if 'pommes' in name_lower:
            return 20, 35, 6, 'Cuisson au four', False, None, "Crumble pommes : fruits pâte sablée"
        else:
            return 20, 35, 6, 'Cuisson au four', False, None, "Crumble fruits : pâte sablée dessus"
    
    if 'sticky toffee pudding' in name_lower:
        return 25, 40, 8, 'Cuisson au four', False, None, "Sticky toffee : gâteau dattes sauce caramel"
    
    if 'trifle' in name_lower:
        return 45, 0, 8, 'Sans cuisson', False, None, "Trifle : dessert anglais couches fruits crème"
    
    if 'banoffee' in name_lower:
        return 30, 0, 8, 'Sans cuisson', False, None, "Banoffee pie : bananes caramel biscuits"
    
    if 'bread and butter pudding' in name_lower:
        return 25, 40, 6, 'Cuisson au four', False, None, "Bread butter pudding : pain perdu gratiné"
    
    if 'shortbread' in name_lower:
        return 20, 20, 16, 'Cuisson au four', False, None, "Shortbread : sablés écossais beurre"
    
    # --------------------------------------------------
    # DESSERTS EUROPÉENS
    # --------------------------------------------------
    
    if 'apfelstrudel' in name_lower or 'strudel' in name_lower:
        return 40, 40, 8, 'Cuisson au four', False, None, "Apfelstrudel : roulé pommes autrichien"
    
    if 'sacher' in name_lower:
        return 45, 50, 12, 'Cuisson au four', False, None, "Sacher torte : gâteau chocolat viennois"
    
    if 'linzer' in name_lower:
        return 40, 40, 10, 'Cuisson au four', False, None, "Linzer torte : tarte autrichienne confiture"
    
    if 'churros' in name_lower:
        return 20, 12, 8, 'Friture', False, None, "Churros : beignets espagnols cannelés"
    
    if 'crème catalane' in name_lower or 'crema catalana' in name_lower:
        return 20, 15, 6, 'Cuisson douce', False, None, "Crème catalane : crème brûlée espagnole"
    
    if 'leche frita' in name_lower:
        return 120, 15, 8, 'Friture', False, None, "Leche frita : lait frit espagnol pané"
    
    if 'pastel de nata' in name_lower:
        return 30, 25, 12, 'Cuisson au four', False, None, "Pastel nata : flan portugais feuilleté"
    
    # --------------------------------------------------
    # DESSERTS ORIENTAUX & MONDE
    # --------------------------------------------------
    
    if 'loukoumades' in name_lower:
        return 90, 15, 12, 'Friture', False, None, "Loukoumades : beignets grecs miel levés"
    
    if 'baklava' in name_lower:
        return 45, 40, 16, 'Cuisson au four', False, None, "Baklava : feuilleté oriental noix miel"
    
    if 'halva' in name_lower or 'halwa' in name_lower:
        return 30, 15, 8, 'Cuisson douce', False, None, "Halva : confiserie sésame ou semoule"
    
    if 'cornes de gazelle' in name_lower:
        return 60, 20, 16, 'Cuisson au four', False, None, "Cornes gazelle : pâtisserie marocaine amandes"
    
    if 'mochi' in name_lower:
        return 30, 10, 8, 'Cuisson vapeur', False, None, "Mochi : gâteau riz gluant japonais"
    
    if 'alfajores' in name_lower:
        return 30, 15, 16, 'Cuisson au four', False, None, "Alfajores : sablés dulce leche argentins"
    
    if 'brigadeiros' in name_lower:
        return 20, 15, 24, 'Cuisson douce', False, None, "Brigadeiros : truffes chocolat brésiliennes"
    
    # --------------------------------------------------
    # PETITS GÂTEAUX ET BISCUITS
    # --------------------------------------------------
    
    if 'baba' in name_lower and 'rhum' in name_lower:
        return 30, 20, 8, 'Cuisson au four', False, None, "Baba au rhum : brioche imbibée sirop rhum"
    
    if 'savarin' in name_lower:
        return 30, 25, 8, 'Cuisson au four', False, None, "Savarin : couronne brioche sirop fruits"
    
    if 'tuiles' in name_lower and 'amandes' in name_lower:
        return 20, 12, 24, 'Cuisson au four', False, None, "Tuiles amandes : biscuits fins courbés"
    
    if 'palets bretons' in name_lower or 'palet breton' in name_lower:
        return 20, 15, 16, 'Cuisson au four', False, None, "Palets bretons : sablés épais beurre salé"
    
    if 'speculoos' in name_lower or 'spéculoos' in name_lower:
        return 25, 12, 30, 'Cuisson au four', False, None, "Speculoos : biscuits épices belges"
    
    if 'langues de chat' in name_lower:
        return 20, 10, 30, 'Cuisson au four', False, None, "Langues de chat : biscuits fins allongés"
    
    if 'navettes' in name_lower:
        return 20, 15, 20, 'Cuisson au four', False, None, "Navettes : biscuits provençaux fleur oranger"
    
    if 'croquants' in name_lower and 'amandes' in name_lower:
        return 20, 20, 24, 'Cuisson au four', False, None, "Croquants amandes : biscuits secs amandes"
    
    if 'rochers coco' in name_lower or 'rocher coco' in name_lower:
        return 15, 18, 20, 'Cuisson au four', False, None, "Rochers coco : meringues noix coco"
    
    if 'florentins' in name_lower:
        return 30, 12, 20, 'Cuisson au four', False, None, "Florentins : dentelles amandes chocolat"
    
    if 'biscuits' in name_lower and 'citron' in name_lower:
        return 20, 15, 24, 'Cuisson au four', False, None, "Biscuits citron : sablés agrumes frais"
    
    # --------------------------------------------------
    # CRÈMES ET DESSERTS LACTÉS
    # --------------------------------------------------
    
    if 'œufs au lait' in name_lower or 'oeufs au lait' in name_lower:
        return 15, 45, 6, 'Cuisson au four', False, None, "Œufs au lait : flan simple classique"
    
    if 'crème vanille' in name_lower and 'dessert' not in name_lower:
        return 15, 10, 6, 'Cuisson douce', False, None, "Crème vanille : crème anglaise onctueuse"
    
    if 'crème pistache' in name_lower:
        return 20, 12, 6, 'Cuisson douce', False, None, "Crème pistache : crème pâtissière pistaches"
    
    if 'crème coco' in name_lower:
        return 15, 10, 6, 'Cuisson douce', False, None, "Crème coco : crème lait coco exotique"
    
    if 'crème noisette' in name_lower:
        return 20, 12, 6, 'Cuisson douce', False, None, "Crème noisette : crème pâtissière noisettes"
    
    # --------------------------------------------------
    # DESSERTS AUX FRUITS
    # --------------------------------------------------
    
    if 'fraises' in name_lower and 'sucre' in name_lower and 'citron' in name_lower:
        return 5, 0, 4, 'Sans cuisson', False, None, "Fraises sucre citron : macérées simples"
    
    if 'poires belle-hélène' in name_lower or 'belle hélène' in name_lower:
        return 20, 20, 4, 'Cuisson douce', False, None, "Poires Belle-Hélène : pochées glace chocolat"
    
    if 'pêches melba' in name_lower:
        return 15, 0, 4, 'Sans cuisson', False, None, "Pêches Melba : glace coulis framboises"
    
    if 'pommes au four' in name_lower:
        return 15, 35, 4, 'Cuisson au four', False, None, "Pommes four : rôties miel cannelle"
    
    if 'bananes flambées' in name_lower:
        return 10, 8, 4, 'Poêle', False, None, "Bananes flambées : caramélisées rhum flambé"
    
    # --------------------------------------------------
    # PIÈCES DE BŒUF GRILLÉES/POÊLÉES
    # --------------------------------------------------
    
    if 'faux-filet' in name_lower or 'faux filet' in name_lower:
        return 5, 8, 2, 'Grillade', False, True, "Faux-filet : pièce noble grillée rapide"
    
    if 'rumsteck' in name_lower or 'rumsteack' in name_lower:
        return 5, 10, 2, 'Grillade', False, True, "Rumsteck : viande grillée tendre"
    
    if 'bavette' in name_lower and ('bœuf' in name_lower or 'grillée' in name_lower or 'poêlée' in name_lower or 'oignons' in name_lower):
        return 5, 8, 2, 'Poêle', False, True, "Bavette : pièce grillée/poêlée savoureuse"
    
    if 'aloyau' in name_lower:
        return 5, 12, 4, 'Grillade', False, True, "Aloyau : pièce noble dos bœuf"
    
    if 'onglet' in name_lower:
        return 5, 8, 2, 'Grillade', False, True, "Onglet : bavette grillée rapide"
    
    if 'hampe' in name_lower:
        return 5, 8, 2, 'Grillade', False, True, "Hampe : pièce grillée persillée"
    
    if 'tournedos' in name_lower:
        return 5, 10, 2, 'Poêle', False, True, "Tournedos : médaillon filet poêlé"
    
    if 'chateaubriand' in name_lower or 'châteaubriand' in name_lower:
        return 10, 15, 2, 'Grillade', False, True, "Chateaubriand : cœur filet bœuf noble"
    
    if 'filet de bœuf' in name_lower or 'filet de boeuf' in name_lower:
        if 'wellington' in name_lower:
            return 60, 40, 6, 'Cuisson au four', True, False, "Bœuf Wellington : filet pâte feuilletée luxe"
        elif 'morilles' in name_lower:
            return 15, 20, 4, 'Poêle', False, True, "Filet bœuf morilles : poêlé sauce champignons luxe"
        elif 'poêlé' in name_lower:
            return 5, 12, 2, 'Poêle', False, True, "Filet bœuf poêlé : pièce noble tendre"
        elif 'grillé' in name_lower:
            return 5, 12, 2, 'Grillade', False, True, "Filet bœuf grillé : pièce noble tendre"
        else:
            return 5, 12, 2, 'Poêle', False, True, "Filet bœuf : pièce la plus noble"
    
    if 'rosbif' in name_lower:
        if 'froid' in name_lower:
            return 15, 30, 6, 'Cuisson au four', False, False, "Rosbif froid : rôti refroidi tranché"
        else:
            return 15, 30, 6, 'Cuisson au four', True, False, "Rosbif : bœuf rôti saignant rosé"
    
    if 'araignée' in name_lower and 'bœuf' in name_lower:
        return 5, 8, 2, 'Grillade', False, True, "Araignée bœuf : pièce grillée rare"
    
    if 'poire' in name_lower and 'bœuf' in name_lower:
        return 5, 8, 2, 'Grillade', False, True, "Poire bœuf : muscle grillé tendre"
    
    if 'merlan' in name_lower and 'bœuf' in name_lower:
        return 5, 8, 2, 'Grillade', False, True, "Merlan bœuf : muscle grillé savoureux"
    
    if 'pavé de bœuf' in name_lower or 'pavé de boeuf' in name_lower:
        return 5, 12, 2, 'Grillade', False, True, "Pavé bœuf : grosse pièce grillée"
    
    if 'côte de bœuf' in name_lower or 'côte de boeuf' in name_lower:
        return 10, 20, 4, 'Grillade', True, False, "Côte bœuf : pièce XXL grillée partagée"
    
    if 'steak minute' in name_lower:
        return 2, 4, 2, 'Poêle', False, True, "Steak minute : ultra rapide poêlé"
    
    if 'steak haché' in name_lower:
        return 5, 10, 2, 'Poêle', False, True, "Steak haché : rapide polyvalent"
    
    if 'filet' in name_lower and ('grillé' in name_lower or 'herbes' in name_lower) and role == 'PLAT_PRINCIPAL':
        return 5, 12, 2, 'Grillade', False, True, "Filet grillé : pièce noble tendre"
    
    if 'sandwich' in name_lower and 'steak' in name_lower:
        return 15, 10, 2, 'Cuisson mixte', True, False, "Sandwich steak : pain garni steak poêlé"
    
    # --------------------------------------------------
    # BŒUF MIJOTÉ ET SAUCES
    # --------------------------------------------------
    
    if 'pot-au-feu' in name_lower:
        return 30, 180, 8, 'Mijotage', True, False, "Pot-au-feu : bœuf légumes bouillon long"
    
    if 'bœuf carottes' in name_lower or 'boeuf carottes' in name_lower:
        return 25, 120, 6, 'Mijotage', True, False, "Bœuf carottes : mijoté classique familial"
    
    if ('bœuf' in name_lower or 'boeuf' in name_lower) and 'sauce' in name_lower:
        if 'poivre' in name_lower:
            return 15, 15, 4, 'Poêle', False, True, "Bœuf sauce poivre : poêlé crème poivre"
        elif 'roquefort' in name_lower or 'gorgonzola' in name_lower or 'chèvre' in name_lower:
            return 15, 15, 4, 'Poêle', False, True, "Bœuf sauce fromage : poêlé crème fromagée"
        elif 'champignons' in name_lower:
            return 20, 20, 4, 'Mijotage', False, True, "Bœuf sauce champignons : poêlé crème champignons"
        elif 'tomate' in name_lower:
            return 20, 30, 4, 'Mijotage', False, True, "Bœuf sauce tomate : mijoté tomates"
        else:
            return 15, 20, 4, 'Cuisson mixte', False, True, "Bœuf sauce : viande sauce variée"
    
    if ('bœuf' in name_lower or 'boeuf' in name_lower) and role == 'PLAT_PRINCIPAL':
        if 'carpaccio' in name_lower or 'tartare' in name_lower:
            return 20, 0, 4, 'Sans cuisson', False, False, "Bœuf cru : tranché fin ou haché assaisonné"
        elif 'salade' in name_lower and 'froid' in name_lower:
            return 20, 0, 4, 'Sans cuisson', False, False, "Salade bœuf froid : bœuf cuit refroidi salade"
        elif 'terrine' in name_lower:
            return 40, 90, 8, 'Cuisson au four', False, False, "Terrine bœuf : farce four pâté"
        elif 'feuilleté' in name_lower:
            return 30, 35, 4, 'Cuisson au four', True, False, "Feuilleté bœuf : pâte feuilletée garnie"
        elif 'sandwich' in name_lower:
            if 'steak' in name_lower:
                return 15, 10, 2, 'Cuisson mixte', True, False, "Sandwich steak : pain garni steak"
            else:
                return 10, 0, 2, 'Sans cuisson', True, False, "Sandwich bœuf : pain garni viande froide"
        elif 'sauté' in name_lower and 'thaï' in name_lower:
            return 20, 12, 4, 'Sauté au wok', True, False, "Bœuf sauté thaï : wok épices asiatiques"
        elif 'satay' in name_lower:
            return 25, 15, 4, 'Grillade', False, True, "Bœuf satay : brochettes sauce cacahuète"
        elif 'soja' in name_lower:
            return 20, 15, 4, 'Sauté au wok', True, False, "Bœuf soja : sauté sauce soja"
        elif 'miso' in name_lower:
            return 25, 15, 4, 'Sauté au wok', True, False, "Bœuf miso : sauté pâte miso japonais"
        elif 'sésame' in name_lower:
            return 20, 15, 4, 'Sauté au wok', True, False, "Bœuf sésame : sauté graines sésame"
        elif 'curry' in name_lower:
            return 20, 40, 4, 'Mijotage', True, False, "Bœuf curry : mijoté épices asiatique"
        elif 'crème' in name_lower:
            return 20, 30, 4, 'Mijotage', False, True, "Bœuf crème : mijoté sauce crémeuse"
        elif 'moutarde' in name_lower:
            return 20, 30, 4, 'Mijotage', False, True, "Bœuf moutarde : viande crème moutarde"
        elif 'tomates' in name_lower or 'tomate' in name_lower:
            return 20, 45, 4, 'Mijotage', True, False, "Bœuf tomates : mijoté sauce tomate"
        elif 'épices' in name_lower:
            return 25, 40, 4, 'Mijotage', True, False, "Bœuf épices : mijoté parfumé"
        elif 'paprika' in name_lower:
            return 20, 35, 4, 'Mijotage', False, True, "Bœuf paprika : mijoté hongrois"
        elif any(word in name_lower for word in ['oignons', 'poivrons', 'courgettes', 'aubergines', 'champignons', 'navets', 'céleri', 'chou']):
            return 20, 45, 4, 'Mijotage', True, False, "Bœuf légumes : mijoté familial complet"
        elif any(word in name_lower for word in ['haricots', 'lentilles', 'pois chiches']):
            return 20, 60, 6, 'Mijotage', True, False, "Bœuf légumineuses : mijoté nourrissant complet"
    
    if 'boulettes de bœuf' in name_lower or 'boulettes de boeuf' in name_lower:
        return 20, 25, 4, 'Cuisson mixte', False, True, "Boulettes bœuf : façonnées poêlées sauce"
    
    if 'polpette' in name_lower:
        return 20, 25, 4, 'Cuisson mixte', False, True, "Polpette : boulettes italiennes sauce tomate"
    
    # --------------------------------------------------
    # VEAU - PIÈCES ET ESCALOPES
    # --------------------------------------------------
    
    if 'escalope' in name_lower and 'veau' in name_lower:
        if 'milanaise' in name_lower:
            return 15, 12, 4, 'Poêle', False, True, "Escalope milanaise : panée italienne citron"
        elif 'cordon bleu' in name_lower:
            return 20, 15, 4, 'Poêle', True, False, "Cordon bleu : escalope farcie jambon fromage"
        elif 'panée' in name_lower:
            return 15, 12, 4, 'Poêle', False, True, "Escalope panée : classique croustillant"
        elif 'crème' in name_lower:
            return 10, 15, 4, 'Poêle', False, True, "Escalope crème : poêlée sauce crémeuse"
        elif 'moutarde' in name_lower:
            return 10, 12, 4, 'Poêle', False, True, "Escalope moutarde : poêlée sauce piquante"
        elif 'champignons' in name_lower:
            return 15, 18, 4, 'Poêle', False, True, "Escalope champignons : poêlée crème champignons"
        elif 'curry' in name_lower:
            return 15, 18, 4, 'Poêle', False, True, "Escalope curry : poêlée épices douces"
        else:
            return 10, 12, 4, 'Poêle', False, True, "Escalope veau : poêlée tendre rapide"
    
    if 'côte de veau' in name_lower:
        if 'grillée' in name_lower:
            return 5, 12, 2, 'Grillade', False, True, "Côte veau grillée : pièce noble grillée"
        elif 'champignons' in name_lower:
            return 15, 18, 2, 'Poêle', False, True, "Côte veau champignons : poêlée crème champignons"
        elif 'moutarde' in name_lower:
            return 10, 15, 2, 'Poêle', False, True, "Côte veau moutarde : poêlée sauce piquante"
        else:
            return 5, 15, 2, 'Poêle', False, True, "Côte veau : pièce noble poêlée"
    
    if 'filet de veau' in name_lower:
        if 'grillé' in name_lower:
            return 5, 12, 2, 'Grillade', False, True, "Filet veau grillé : pièce tendre grillée"
        elif 'crème' in name_lower:
            return 10, 15, 2, 'Poêle', False, True, "Filet veau crème : poêlé sauce crémeuse"
        else:
            return 5, 15, 2, 'Poêle', False, True, "Filet veau : pièce noble poêlée"
    
    if 'grenadin' in name_lower:
        if 'champignons' in name_lower:
            return 10, 15, 2, 'Poêle', False, True, "Grenadin champignons : médaillon crème champignons"
        else:
            return 5, 12, 2, 'Poêle', False, True, "Grenadin veau : médaillon épais poêlé"
    
    # --------------------------------------------------
    # VEAU MIJOTÉ
    # --------------------------------------------------
    
    if 'veau' in name_lower and role == 'PLAT_PRINCIPAL':
        if 'rôti' in name_lower:
            if 'morilles' in name_lower:
                return 20, 90, 6, 'Cuisson au four', True, False, "Rôti veau morilles : four sauce luxueuse"
            elif 'froid' in name_lower:
                return 25, 90, 8, 'Cuisson au four', False, False, "Rôti veau froid : four refroidi tranché"
            else:
                return 20, 80, 6, 'Cuisson au four', True, False, "Rôti veau : four tendre familial"
        elif 'tartare' in name_lower or 'carpaccio' in name_lower:
            return 20, 0, 4, 'Sans cuisson', False, False, "Veau cru : préparation raffinée froide"
        elif 'salade' in name_lower and 'froid' in name_lower:
            return 20, 0, 4, 'Sans cuisson', False, False, "Salade veau froid : veau cuit refroidi salade"
        elif 'terrine' in name_lower:
            return 40, 90, 8, 'Cuisson au four', False, False, "Terrine veau : farce four entrée"
        elif 'feuilleté' in name_lower:
            return 30, 35, 4, 'Cuisson au four', True, False, "Feuilleté veau : pâte feuilletée garnie"
        elif 'tourte' in name_lower:
            return 35, 45, 6, 'Cuisson au four', True, False, "Tourte veau : pâte brisée garnie four"
        elif 'boulettes' in name_lower:
            return 20, 25, 4, 'Cuisson mixte', False, True, "Boulettes veau : façonnées sauce tomate"
        elif 'gingembre' in name_lower or 'citronnelle' in name_lower or 'thaï' in name_lower:
            return 20, 20, 4, 'Sauté au wok', True, False, "Veau asiatique : wok épices"
        elif any(word in name_lower for word in ['navets', 'épinards', 'herbes', 'champignons', 'carottes', 'courgettes', 'tomates', 'poivrons', 'aubergines', 'oignons']):
            return 20, 40, 4, 'Mijotage', True, False, "Veau légumes : mijoté tendre familial"
        elif any(word in name_lower for word in ['haricots', 'lentilles', 'pois chiches']):
            return 20, 50, 6, 'Mijotage', True, False, "Veau légumineuses : mijoté complet nourrissant"
        elif 'olives' in name_lower:
            return 20, 45, 4, 'Mijotage', True, False, "Veau olives : mijoté méditerranéen"
        elif 'curry' in name_lower:
            return 20, 40, 4, 'Mijotage', True, False, "Veau curry : mijoté épices douces"
    
    # --------------------------------------------------
    # AGNEAU - PIÈCES
    # --------------------------------------------------
    
    if 'carré' in name_lower and 'agneau' in name_lower:
        if 'rôti' in name_lower or 'grillé' in name_lower:
            return 15, 25, 4, 'Cuisson au four', False, True, "Carré agneau : côtes rôties four noble"
        elif 'miel' in name_lower:
            return 20, 30, 4, 'Cuisson au four', False, True, "Carré agneau miel : rôti glaçage sucré"
        else:
            return 15, 25, 4, 'Cuisson au four', False, True, "Carré agneau : pièce noble rôtie"
    
    if 'épaule' in name_lower and 'agneau' in name_lower:
        if 'rôtie' in name_lower or 'grillée' in name_lower:
            return 20, 120, 6, 'Cuisson au four', True, False, "Épaule agneau : rôtie four longue familial"
        elif 'miel' in name_lower:
            return 25, 130, 6, 'Cuisson au four', True, False, "Épaule agneau miel : rôtie glaçage sucré"
        elif 'fête' in name_lower:
            return 30, 150, 8, 'Cuisson au four', True, False, "Épaule agneau fête : rôtie farcie festive"
        else:
            return 20, 120, 6, 'Cuisson au four', True, False, "Épaule agneau : rôtie four familial"
    
    # --------------------------------------------------
    # AGNEAU MIJOTÉ
    # --------------------------------------------------
    
    if 'agneau' in name_lower and role == 'PLAT_PRINCIPAL':
        if 'carpaccio' in name_lower or 'tartare' in name_lower:
            return 20, 0, 4, 'Sans cuisson', False, False, "Agneau cru : tranché fin ou haché raffiné"
        elif 'feuilleté' in name_lower:
            return 30, 35, 4, 'Cuisson au four', True, False, "Feuilleté agneau : pâte feuilletée garnie"
        elif 'tourte' in name_lower:
            return 35, 45, 6, 'Cuisson au four', True, False, "Tourte agneau : pâte brisée garnie four"
        elif 'korma' in name_lower:
            return 30, 50, 6, 'Mijotage', True, False, "Agneau korma : curry doux crémeux amandes"
        elif 'massala' in name_lower or 'masala' in name_lower:
            if 'tikka' in name_lower:
                return 30, 40, 6, 'Cuisson au four', True, False, "Agneau tikka masala : tandoori sauce épicée"
            else:
                return 25, 50, 6, 'Mijotage', True, False, "Agneau massala : curry épices complexes"
        elif any(word in name_lower for word in ['moutarde', 'crème', 'gingembre']):
            return 20, 45, 6, 'Mijotage', True, False, "Agneau sauce : mijoté sauce savoureuse"
        elif any(word in name_lower for word in ['tomate', 'champignons', 'poivrons', 'navets', 'épinards', 'herbes', 'carottes', 'poireaux', 'oignons', 'tomates', 'courgettes', 'aubergines', 'céleri']):
            return 25, 90, 6, 'Mijotage', True, False, "Agneau légumes : mijoté savoureux complet"
        elif any(word in name_lower for word in ['olives', 'pommes']):
            return 25, 80, 6, 'Mijotage', True, False, "Agneau accompagnement : mijoté savoureux"
        elif any(word in name_lower for word in ['pois chiches', 'lentilles', 'haricots']):
            return 25, 100, 6, 'Mijotage', True, False, "Agneau légumineuses : mijoté complet méditerranéen"
        elif any(word in name_lower for word in ['abricots', 'pruneaux', 'dattes', 'raisins', 'figues', 'poires']):
            return 25, 90, 6, 'Mijotage', True, False, "Agneau fruits : mijoté sucré-salé oriental"
        elif any(word in name_lower for word in ['miel', 'citron', 'romarin', 'thym', 'menthe']):
            return 20, 80, 6, 'Mijotage', True, False, "Agneau aromatisé : mijoté parfumé"
        elif any(word in name_lower for word in ['épices', 'curry', 'paprika', 'cumin', 'coriandre', 'ras el hanout']):
            return 25, 90, 6, 'Mijotage', True, False, "Agneau épices : mijoté oriental épicé"
    
    # --------------------------------------------------
    # PORC - PIÈCES
    # --------------------------------------------------
    
    if 'côtes de porc' in name_lower or 'côte de porc' in name_lower:
        if 'grillées' in name_lower or 'grillée' in name_lower:
            return 5, 15, 4, 'Grillade', False, True, "Côtes porc grillées : rapide savoureux"
        elif 'barbecue' in name_lower:
            return 10, 20, 4, 'Grillade', False, True, "Côtes porc BBQ : marinées grillées sauce"
        elif 'miel' in name_lower:
            return 10, 18, 4, 'Cuisson au four', False, True, "Côtes porc miel : glacées four sucrées"
        else:
            return 5, 15, 4, 'Poêle', False, True, "Côtes porc : poêlées rapide économique"
    
    # --------------------------------------------------
    # PORC MIJOTÉ
    # --------------------------------------------------
    
    if 'filet mignon' in name_lower and 'porc' not in name_lower:
        if 'grillé' in name_lower:
            return 5, 15, 4, 'Grillade', False, True, "Filet mignon grillé : pièce noble tendre"
        elif 'miel' in name_lower:
            return 15, 20, 4, 'Cuisson au four', False, True, "Filet mignon miel : rôti glaçage sucré"
        elif 'moutarde' in name_lower:
            return 15, 20, 4, 'Cuisson au four', False, True, "Filet mignon moutarde : rôti croûte"
        elif 'romarin' in name_lower or 'herbes' in name_lower:
            return 10, 18, 4, 'Cuisson au four', False, True, "Filet mignon herbes : rôti aromatisé"
        else:
            return 10, 18, 4, 'Cuisson au four', False, True, "Filet mignon : pièce noble porc rôtie"
    
    if 'porc' in name_lower and role == 'PLAT_PRINCIPAL':
        if 'salade' in name_lower and 'froid' in name_lower:
            return 20, 0, 4, 'Sans cuisson', False, False, "Salade porc froid : porc cuit refroidi salade"
        elif 'tourte' in name_lower:
            return 35, 45, 6, 'Cuisson au four', True, False, "Tourte porc : pâte brisée garnie four"
        elif 'feuilleté' in name_lower:
            return 30, 35, 4, 'Cuisson au four', True, False, "Feuilleté porc : pâte feuilletée garnie"
        elif 'boulettes' in name_lower:
            return 20, 25, 4, 'Cuisson mixte', False, True, "Boulettes porc : façonnées sauce tomate"
        elif 'sauté' in name_lower:
            if 'carottes' in name_lower or 'aubergines' in name_lower:
                return 20, 20, 4, 'Sauté au wok', True, False, "Sauté porc légumes : wok rapide"
            elif 'miel' in name_lower:
                return 20, 18, 4, 'Sauté au wok', False, True, "Sauté porc miel : wok sucré-salé"
            else:
                return 20, 15, 4, 'Sauté au wok', True, False, "Sauté porc : wok rapide asiatique"
        elif 'sauce' in name_lower:
            if 'tomate' in name_lower:
                return 20, 35, 4, 'Mijotage', False, True, "Porc sauce tomate : mijoté italien"
            elif 'miel' in name_lower:
                return 15, 25, 4, 'Cuisson mixte', False, True, "Porc sauce miel : glacé sucré-salé"
            elif 'roquefort' in name_lower or 'fromage' in name_lower:
                return 15, 20, 4, 'Poêle', False, True, "Porc sauce fromage : poêlé crème fromagée"
            elif 'paprika' in name_lower:
                return 20, 30, 4, 'Mijotage', False, True, "Porc sauce paprika : mijoté épicé"
            elif 'bière' in name_lower:
                return 25, 60, 6, 'Mijotage', True, False, "Porc sauce bière : mijoté flamand"
            elif 'herbes' in name_lower or 'pesto' in name_lower or 'lait de coco' in name_lower:
                return 20, 30, 4, 'Mijotage', False, True, "Porc sauce : mijoté sauce variée"
            else:
                return 20, 30, 4, 'Cuisson mixte', False, True, "Porc sauce : viande sauce"
        elif 'moutarde' in name_lower or 'herbes' in name_lower:
            return 20, 35, 4, 'Mijotage', False, True, "Porc aromatisé : mijoté savoureux"
        elif 'curry' in name_lower:
            return 20, 40, 4, 'Mijotage', True, False, "Porc curry : mijoté épices asiatique"
        elif any(word in name_lower for word in ['gingembre', 'soja', 'satay', 'miso', 'thaï', 'citronnelle']):
            return 20, 35, 4, 'Cuisson mixte', True, False, "Porc asiatique : wok ou mijoté épices"
        elif any(word in name_lower for word in ['figues', 'pruneaux', 'pommes', 'poires', 'marrons', 'raisins']):
            return 25, 60, 6, 'Mijotage', True, False, "Porc fruits : mijoté sucré-salé automnal"
        elif any(word in name_lower for word in ['champignons', 'oignons', 'tomates', 'poivrons', 'courgettes']):
            return 20, 45, 4, 'Mijotage', True, False, "Porc légumes : mijoté familial complet"
    
    # --------------------------------------------------
    # GIBIER (CERF, CHEVREUIL, SANGLIER, FAISAN, BÉCASSE...)
    # --------------------------------------------------
    
    if 'gibier' in name_lower:
        if 'carpaccio' in name_lower or 'tartare' in name_lower:
            return 20, 0, 4, 'Sans cuisson', False, False, "Carpaccio/tartare gibier : cru tranché raffiné"
        elif 'terrine' in name_lower:
            return 45, 90, 10, 'Cuisson au four', False, False, "Terrine gibier : farce four pâté"
        elif 'feuilleté' in name_lower:
            return 30, 35, 4, 'Cuisson au four', True, False, "Feuilleté gibier : pâte feuilletée garnie"
        else:
            return 30, 100, 6, 'Mijotage', True, False, "Gibier : mijoté mariné sauce puissante"
    
    if any(word in name_lower for word in ['cerf', 'chevreuil', 'sanglier', 'biche']):
        if 'carpaccio' in name_lower:
            return 20, 0, 4, 'Sans cuisson', False, False, "Carpaccio gibier : cru tranché fin raffiné"
        elif 'sauce' in name_lower and ('grand veneur' in name_lower or 'poivrade' in name_lower):
            return 30, 120, 6, 'Mijotage', True, False, "Gibier sauce grand veneur : mijoté sauce classique"
        elif 'rôti' in name_lower:
            return 25, 90, 6, 'Cuisson au four', True, False, "Gibier rôti : four mariné sauce fruits"
        elif any(word in name_lower for word in ['champignons', 'châtaignes', 'marrons', 'airelles', 'myrtilles']):
            return 30, 100, 6, 'Mijotage', True, False, "Gibier accompagnement : mijoté sauce forestière"
        else:
            return 25, 90, 6, 'Mijotage', True, False, "Gibier : mijoté mariné sauce puissante"
    
    if any(word in name_lower for word in ['faisan', 'bécasse', 'perdrix', 'caille']):
        if 'rôti' in name_lower or 'rôtie' in name_lower:
            return 20, 40, 4, 'Cuisson au four', True, False, "Volaille gibier rôtie : four noble festive"
        elif any(word in name_lower for word in ['pruneaux', 'raisins', 'figues', 'poires']):
            return 25, 50, 4, 'Cuisson au four', True, False, "Volaille gibier fruits : rôtie four sucré-salé"
        elif 'truffée' in name_lower or 'truffé' in name_lower:
            return 30, 50, 4, 'Cuisson au four', True, False, "Volaille gibier truffée : rôtie luxueuse"
        else:
            return 20, 45, 4, 'Cuisson au four', True, False, "Volaille gibier : rôtie four savoureuse"
    
    if 'lièvre' in name_lower or 'lievre' in name_lower:
        if 'civet' in name_lower:
            return 40, 150, 6, 'Mijotage', True, False, "Civet lièvre : mariné sang vin rouge long"
        elif 'royale' in name_lower or 'à la royale' in name_lower:
            return 60, 180, 8, 'Mijotage', True, False, "Lièvre à la royale : farci mijoté luxe"
        elif 'rôti' in name_lower:
            return 25, 60, 6, 'Cuisson au four', True, False, "Lièvre rôti : four mariné"
        elif any(word in name_lower for word in ['herbes', 'moutarde']):
            return 30, 90, 6, 'Mijotage', True, False, "Lièvre aromatisé : mijoté sauce"
        elif any(word in name_lower for word in ['poires', 'figues', 'pruneaux']):
            return 30, 100, 6, 'Mijotage', True, False, "Lièvre fruits : mijoté sucré-salé"
        else:
            return 30, 90, 6, 'Mijotage', True, False, "Lièvre : gibier mijoté fort"
    
    if 'terrine' in name_lower and 'gibier' in name_lower:
        if 'royale' in name_lower:
            return 60, 120, 12, 'Cuisson au four', False, False, "Terrine gibier royale : farce luxe complexe"
        else:
            return 45, 90, 10, 'Cuisson au four', False, False, "Terrine gibier : farce four pâté"
    
    # --------------------------------------------------
    # SAUCES, VINAIGRETTES, BOUILLONS
    # --------------------------------------------------
    
    if role == 'SAUCE':
        if 'vinaigrette' in name_lower:
            if 'classique' in name_lower:
                return 5, 0, 6, 'Sans cuisson', None, None, "Vinaigrette classique : huile vinaigre moutarde"
            else:
                return 5, 0, 6, 'Sans cuisson', None, None, "Vinaigrette : émulsion huile vinaigre"
        elif 'aïoli' in name_lower:
            return 15, 0, 6, 'Sans cuisson', None, None, "Aïoli : mayonnaise ail provençale"
        elif 'béchamel' in name_lower:
            return 5, 10, 6, 'Cuisson douce', None, None, "Béchamel : sauce blanche roux lait"
        elif 'hollandaise' in name_lower:
            return 10, 8, 4, 'Cuisson douce', None, None, "Hollandaise : sauce beurre jaunes œufs"
        elif 'béarnaise' in name_lower:
            return 15, 8, 4, 'Cuisson douce', None, None, "Béarnaise : sauce estragon échalotes"
        elif 'beurre blanc' in name_lower:
            return 10, 10, 4, 'Cuisson douce', None, None, "Beurre blanc : réduction vin blanc beurre"
        elif 'poivre' in name_lower:
            return 5, 10, 4, 'Cuisson douce', None, None, "Sauce poivre : crème poivre concassé"
        elif 'moutarde' in name_lower:
            return 5, 8, 4, 'Cuisson douce', None, None, "Sauce moutarde : crème moutarde"
        elif 'curry' in name_lower:
            return 5, 10, 4, 'Cuisson douce', None, None, "Sauce curry : épices crème"
        elif 'bolognaise' in name_lower:
            return 20, 90, 8, 'Mijotage', None, None, "Sauce bolognaise : viande tomate longue"
        elif 'tomate' in name_lower:
            return 10, 30, 6, 'Mijotage', None, None, "Sauce tomate : tomates mijotées herbes"
        elif 'barbecue' in name_lower:
            return 10, 20, 6, 'Cuisson douce', None, None, "Sauce BBQ : tomate fumée sucrée"
        elif 'soja' in name_lower:
            return 5, 5, 4, 'Cuisson douce', None, None, "Sauce soja : soja sucré réduit"
        elif 'bouillon' in name_lower:
            if 'légumes' in name_lower:
                return 15, 60, 10, 'Mijotage', None, None, "Bouillon légumes : mijotéclarifier base"
            elif 'volaille' in name_lower or 'poulet' in name_lower:
                return 15, 120, 10, 'Mijotage', None, None, "Bouillon volaille : carcasse mijoté fond"
        elif 'fond' in name_lower:
            if 'veau' in name_lower:
                return 20, 240, 10, 'Mijotage', None, None, "Fond veau : os mijotés long réduit"
        elif 'fumet' in name_lower:
            if 'poisson' in name_lower:
                return 15, 30, 8, 'Mijotage', None, None, "Fumet poisson : arêtes têtes court"
        else:
            return 10, 15, 6, 'Cuisson douce', None, None, "Sauce : préparation liquide accompagnement"
    
    # --------------------------------------------------
    # TOURTES (si pas attrapées avant)
    # --------------------------------------------------
    
    if 'tourte' in name_lower:
        return 35, 45, 6, 'Cuisson au four', True, False, "Tourte : pâte brisée garnie four"
    
    # --------------------------------------------------
    # BOULETTES GÉNÉRIQUES
    # --------------------------------------------------
    
    if 'boulettes' in name_lower:
        return 20, 25, 4, 'Cuisson mixte', False, True, "Boulettes : façonnées poêlées sauce"
    
    # --------------------------------------------------
    # POTAGES (si beaucoup restent)
    # --------------------------------------------------
    
    if 'potage' in name_lower and role == 'ENTREE':
        return 15, 30, 6, 'Mijotage', False, False, "Potage : soupe mixée légumes"
    
    # --------------------------------------------------
    # DÉFAUT - Pas reconnu
    # --------------------------------------------------
    
    return None, None, None, None, None, None, f"NON_RECONNU - Role: {role}"


def generate_enriched_sql(csv_filename):
    """Génère le SQL avec analyse individuelle de chaque recette"""
    
    recipes = []
    with open(csv_filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            recipes.append(row)
    
    print(f"📖 {len(recipes)} recettes chargées", file=sys.stderr)
    
    # Analyser chaque recette individuellement
    enriched = []
    high_count = 0
    low_count = 0
    
    for recipe in recipes:
        recipe_id = recipe['id']
        name = recipe['name']
        role = recipe['role']
        
        prep, cook, servings, method, complete, needs_side, reasoning = analyze_recipe_individually(recipe_id, name, role)
        
        if prep is not None:
            confidence = 'HIGH'
            high_count += 1
        else:
            confidence = 'LOW'
            low_count += 1
            # Valeurs par défaut pour LOW
            prep, cook, servings, method = 20, 30, 4, 'Cuisson mixte'
            complete, needs_side = False if role != 'PLAT_PRINCIPAL' else True, None
        
        enriched.append({
            'id': recipe_id,
            'name': name,
            'prep_time': prep,
            'cook_time': cook,
            'servings': servings,
            'cooking_method': method,
            'is_complete_meal': complete,
            'needs_side_dish': needs_side,
            'confidence': confidence,
            'reasoning': reasoning
        })
    
    print(f"✅ {len(enriched)} recettes enrichies!", file=sys.stderr)
    print(f"📊 HIGH: {high_count} ({high_count*100//len(enriched)}%), LOW: {low_count} ({low_count*100//len(enriched)}%)", file=sys.stderr)
    
    # Générer le SQL
    print(f"-- ============================================================================", file=sys.stdout)
    print(f"-- ENRICHISSEMENT IA AVANCÉE - {len(enriched)} RECETTES", file=sys.stdout)
    print(f"-- Analyse individuelle de chaque recette avec raisonnement spécifique", file=sys.stdout)
    print(f"-- HIGH confidence: {high_count} ({high_count*100//len(enriched)}%)", file=sys.stdout)
    print(f"-- LOW confidence: {low_count} ({low_count*100//len(enriched)}%)", file=sys.stdout)
    print(f"-- ============================================================================", file=sys.stdout)
    print(f"", file=sys.stdout)
    print(f"BEGIN;", file=sys.stdout)
    print(f"", file=sys.stdout)
    
    for item in enriched:
        if item['confidence'] == 'HIGH':
            # Échapper les apostrophes pour PostgreSQL
            method_escaped = item['cooking_method'].replace("'", "''")
            
            # Construire les valeurs NULL/TRUE/FALSE
            complete_val = 'TRUE' if item['is_complete_meal'] is True else 'FALSE' if item['is_complete_meal'] is False else 'NULL'
            needs_val = 'TRUE' if item['needs_side_dish'] is True else 'FALSE' if item['needs_side_dish'] is False else 'NULL'
            
            print(f"-- [HIGH] {item['name']}", file=sys.stdout)
            print(f"--        {item['reasoning']}", file=sys.stdout)
            print(f"UPDATE recipes SET prep_time_minutes = {item['prep_time']}, cook_time_minutes = {item['cook_time']}, servings = {item['servings']}, cooking_method = '{method_escaped}', is_complete_meal = {complete_val}, needs_side_dish = {needs_val} WHERE id = {item['id']};", file=sys.stdout)
            print(f"", file=sys.stdout)
        else:
            print(f"-- [LOW] {item['name']} - {item['reasoning']}", file=sys.stdout)
    
    print(f"COMMIT;", file=sys.stdout)
    
    print(f"📝 Fichier SQL généré avec succès!", file=sys.stderr)
    print(f"🎉 PRÊT À EXÉCUTER!", file=sys.stderr)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python3 enrichir_ia_avancee.py recipes.csv")
        sys.exit(1)
    
    generate_enriched_sql(sys.argv[1])
