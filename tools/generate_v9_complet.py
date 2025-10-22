#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VERSION 9 - MAPPING MANUEL COMPLET DE TOUS LES INGRÉDIENTS
Chaque ingrédient vérifié individuellement
"""

import csv
from collections import defaultdict

# MAPPING COMPLET - TOUS les 441 ingrédients analysés UN PAR UN
COMPLETE_MAPPING = {
    # === DÉJÀ DANS LA BASE (vérifiés) ===
    'sel': 'EXISTE',
    'poivre': 'EXISTE',
    'ail': 'EXISTE',
    'oignon': 'EXISTE',
    'huile d\'olive': 'EXISTE',
    'persil': 'EXISTE',
    'gingembre': 'EXISTE',
    'thym': 'EXISTE',
    'citron': 'EXISTE',
    'vanille': 'EXISTE',
    'laurier': 'EXISTE',
    'moutarde': 'EXISTE',
    'riz': 'EXISTE',
    'parmesan': 'EXISTE',
    'curcuma': 'EXISTE',
    'origan': 'EXISTE',
    'muscade': 'EXISTE',
    
    # === BEURRE (produit laitier transformé = ARCHETYPE) ===
    'beurre': ('beurre', 'archetype', 7, 'Produit laitier transformé'),
    'beurre fondu': ('beurre', 'archetype', 7, 'État temporaire'),
    'beurre mou': ('beurre', 'archetype', 7, 'État temporaire'),
    'beurre de tourage': ('beurre', 'archetype', 7, 'Trop spécifique'),
    'beurre salé': ('beurre salé', 'archetype', 7, 'Beurre salé'),
    'beurre noisette': ('beurre noisette', 'archetype', 7, 'Beurre cuit'),
    
    # === FARINE (céréale moulue = ARCHETYPE) ===
    'farine': ('farine', 'archetype', 5, 'Céréale moulue'),
    'farine T45': ('farine', 'archetype', 5, 'Type trop précis'),
    'farine T65': ('farine', 'archetype', 5, 'Type trop précis'),
    'farine de sarrasin': ('farine de sarrasin', 'archetype', 5, 'Sarrasin moulu'),
    
    # === ŒUFS ===
    'oeufs': ('oeuf', 'canonical', 7, 'Aliment brut'),
    'oeuf': ('oeuf', 'canonical', 7, 'Aliment brut'),
    'œuf': ('oeuf', 'canonical', 7, 'Aliment brut'),
    'œufs': ('oeuf', 'canonical', 7, 'Aliment brut'),
    'oeufs (4 gros)': ('oeuf', 'canonical', 7, 'Retirer quantité'),
    'oeufs entiers': ('oeuf', 'canonical', 7, 'Adjectif inutile'),
    'oeufs durs': ('oeuf dur', 'archetype', 7, 'Cuisson'),
    'jaunes d\'oeufs': ('jaune d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'jaune d\'oeuf': ('jaune d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'jaunes d\'œufs': ('jaune d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'jaune d\'œuf': ('jaune d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'jaunes oeufs': ('jaune d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'jaune d\'oeuf pour dorure': ('jaune d\'oeuf', 'archetype', 7, 'Usage spécifique'),
    'pour dorure': ('SKIP', None, None, 'Trop vague'),
    'blancs d\'oeufs': ('blanc d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'blanc d\'oeuf': ('blanc d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'blancs d\'oeufs vieillis': ('blanc d\'oeuf', 'archetype', 7, 'Adjectif inutile'),
    'oeufs pour meringue': ('oeuf', 'canonical', 7, 'Usage spécifique'),
    
    # === SUCRE ===
    'sucre': ('sucre', 'canonical', 14, 'Aliment brut'),
    'sucre blanc': ('sucre', 'canonical', 14, 'Couleur inutile'),
    'sucre glace': ('sucre glace', 'canonical', 14, 'Forme différente'),
    'sucre semoule': ('sucre', 'canonical', 14, 'Granulation'),
    'sucre brun': ('cassonade', 'canonical', 14, 'Type différent'),
    'cassonade': ('cassonade', 'canonical', 14, 'Type différent'),
    'sucre pour caramel': ('sucre', 'canonical', 14, 'Usage spécifique'),
    'sucre pour meringue': ('sucre', 'canonical', 14, 'Usage spécifique'),
    
    # === EAU ET LIQUIDES DE BASE ===
    'eau': ('eau', 'canonical', 14, 'Liquide brut'),
    'eau tiède': ('eau', 'canonical', 14, 'Température'),
    'eau de cuisson': ('SKIP', None, None, 'Trop vague'),
    
    # === LAIT ET PRODUITS LAITIERS ===
    'lait': ('lait', 'canonical', 7, 'Produit brut'),
    'lait entier': ('lait', 'canonical', 7, 'Type inutile'),
    'lait végétal': ('lait végétal', 'canonical', 7, 'Alternative végétale'),
    'lait de coco': ('lait de coco', 'archetype', 7, 'Extraction'),
    'crème': ('crème', 'archetype', 7, 'Produit laitier transformé'),
    'crème fraîche': ('crème fraîche', 'archetype', 7, 'Produit laitier transformé'),
    'crème liquide': ('crème liquide', 'archetype', 7, 'Produit laitier transformé'),
    'crème épaisse': ('crème épaisse', 'archetype', 7, 'Produit laitier transformé'),
    'crème de marrons': ('crème de marrons', 'archetype', 14, 'Préparation sucrée'),
    
    # === FROMAGES ===
    'fromage frais': ('fromage frais', 'canonical', 7, 'Fromage non affiné'),
    'fromage blanc': ('fromage blanc', 'canonical', 7, 'Fromage non affiné'),
    'fromage de chèvre': ('fromage de chèvre', 'canonical', 7, 'Fromage'),
    'fromage râpé': ('fromage râpé', 'archetype', 7, 'Transformation'),
    'parmesan râpé': ('parmesan râpé', 'archetype', 7, 'Transformation'),
    'gruyère râpé': ('gruyère râpé', 'archetype', 7, 'Transformation'),
    'comté râpé': ('comté râpé', 'archetype', 7, 'Transformation'),
    'mozzarella': ('mozzarella', 'canonical', 7, 'Fromage'),
    'feta': ('feta', 'canonical', 7, 'Fromage'),
    'pecorino romano': ('pecorino romano', 'canonical', 7, 'Fromage'),
    'chèvre': ('chèvre', 'canonical', 7, 'Fromage'),
    'tomme': ('tomme', 'canonical', 7, 'Fromage'),
    'tranches d\'emmental': ('emmental', 'canonical', 7, 'Forme inutile'),
    
    # === YAOURTS ===
    'yaourt grec': ('yaourt grec', 'canonical', 7, 'Produit laitier'),
    'yaourt nature': ('yaourt', 'canonical', 7, 'Produit laitier'),
    
    # === AIL ET OIGNONS ===
    'gousses d\'ail': ('ail', 'canonical', 2, 'Retirer unité'),
    'gousse d\'ail': ('ail', 'canonical', 2, 'Retirer unité'),
    'ail (facultatif)': ('ail', 'canonical', 2, 'Retirer facultatif'),
    'ail en poudre': ('ail en poudre', 'archetype', 2, 'Transformation'),
    'oignons': ('oignon', 'canonical', 2, 'Singulariser'),
    'oignon rouge': ('oignon rouge', 'canonical', 2, 'Variété'),
    'oignon vert': ('oignon vert', 'canonical', 2, 'Variété'),
    'petits oignons': ('oignon', 'canonical', 2, 'Taille inutile'),
    'petits oignons blancs': ('oignon', 'canonical', 2, 'Taille/couleur'),
    'petits oignons grelots': ('oignon grelot', 'canonical', 2, 'Variété'),
    'échalotes': ('échalote', 'canonical', 2, 'Singulariser'),
    'échalote': ('échalote', 'canonical', 2, 'Base'),
    
    # === LÉGUMES ===
    'carottes': ('carotte', 'canonical', 2, 'Singulariser'),
    'carotte': ('carotte', 'canonical', 2, 'Base'),
    'tomates': ('tomate', 'canonical', 2, 'Singulariser'),
    'tomate': ('tomate', 'canonical', 2, 'Base'),
    'tomates mûres': ('tomate', 'canonical', 2, 'Adjectif inutile'),
    'tomates pelées': ('tomate pelée', 'archetype', 2, 'Transformation'),
    'tomates concassées': ('tomate concassée', 'archetype', 2, 'Transformation'),
    'tomates cerises': ('tomate cerise', 'canonical', 2, 'Variété'),
    'concentré de tomate': ('concentré de tomate', 'archetype', 2, 'Concentration'),
    'concentré de tomates': ('concentré de tomate', 'archetype', 2, 'Concentration'),
    'sauce tomate': ('sauce tomate', 'archetype', 2, 'Préparation'),
    'sauce tomates': ('sauce tomate', 'archetype', 2, 'Préparation'),
    'pommes de terre': ('pomme de terre', 'canonical', 2, 'Base'),
    'pomme de terre': ('pomme de terre', 'canonical', 2, 'Base'),
    'poireau': ('poireau', 'canonical', 2, 'Base'),
    'poireaux': ('poireau', 'canonical', 2, 'Singulariser'),
    'poireal': ('poireau', 'canonical', 2, 'Correction orthographe'),
    'blanc de poireau': ('poireau', 'canonical', 2, 'Partie spécifique'),
    'céleri': ('céleri', 'canonical', 2, 'Base'),
    'branche de céleri': ('céleri', 'canonical', 2, 'Retirer unité'),
    'poivron rouge': ('poivron rouge', 'canonical', 2, 'Couleur importante'),
    'poivron': ('poivron', 'canonical', 2, 'Base'),
    'poivrons': ('poivron', 'canonical', 2, 'Singulariser'),
    'poivrons rouges': ('poivron rouge', 'canonical', 2, 'Couleur importante'),
    'poivrons jaunes': ('poivron jaune', 'canonical', 2, 'Couleur importante'),
    'courgette': ('courgette', 'canonical', 2, 'Base'),
    'courgettes': ('courgette', 'canonical', 2, 'Singulariser'),
    'concombre': ('concombre', 'canonical', 2, 'Base'),
    'piment': ('piment', 'canonical', 2, 'Base'),
    'piment d\'Espelette': ('piment d\'Espelette', 'canonical', 2, 'Variété'),
    'piment cayenne': ('piment cayenne', 'canonical', 2, 'Variété'),
    "piment de Cayenne": ('piment cayenne', 'canonical', 2, 'Variété'),
    'cayenne': ('piment cayenne', 'canonical', 2, 'Raccourci'),
    'aubergine': ('aubergine', 'canonical', 2, 'Base'),
    'aubergines': ('aubergine', 'canonical', 2, 'Singulariser'),
    'épinard': ('épinard', 'canonical', 2, 'Base'),
    'épinards': ('épinard', 'canonical', 2, 'Singulariser'),
    'épinards frais': ('épinard', 'canonical', 2, 'Adjectif inutile'),
    'artichaut': ('artichaut', 'canonical', 2, 'Base'),
    'artichauts violets moyens': ('artichaut', 'canonical', 2, 'Taille/couleur inutile'),
    'navet': ('navet', 'canonical', 2, 'Base'),
    'navets': ('navet', 'canonical', 2, 'Singulariser'),
    'salade': ('salade', 'canonical', 2, 'Base'),
    'lentilles corail': ('lentille corail', 'canonical', 5, 'Variété'),
    'lentille corail': ('lentille corail', 'canonical', 5, 'Variété'),
    'pois chiches': ('pois chiche', 'canonical', 5, 'Singulariser'),
    'pois chiche': ('pois chiche', 'canonical', 5, 'Base'),
    'pois chiches secs': ('pois chiche', 'canonical', 5, 'Adjectif inutile'),
    'pois chiches cuits': ('pois chiche cuit', 'archetype', 5, 'Cuisson'),
    'pois chiche sec': ('pois chiche', 'canonical', 5, 'Adjectif inutile'),
    'petits pois': ('petit pois', 'canonical', 2, 'Base'),
    'pois mange-tout': ('pois mange-tout', 'canonical', 2, 'Variété'),
    'haricots rouges': ('haricot rouge', 'canonical', 5, 'Variété'),
    'haricot rouge': ('haricot rouge', 'canonical', 5, 'Variété'),
    'haricots blancs secs': ('haricot blanc', 'canonical', 5, 'Variété'),
    'haricot blanc': ('haricot blanc', 'canonical', 5, 'Variété'),
    'haricots noirs': ('haricot noir', 'canonical', 5, 'Variété'),
    'haricots blancs sauce tomate': ('haricot blanc sauce tomate', 'archetype', 5, 'Préparation'),
    
    # === CHAMPIGNONS ===
    'champignon': ('champignon', 'canonical', 3, 'Base'),
    'champignons': ('champignon', 'canonical', 3, 'Singulariser'),
    'champignons de Paris': ('champignon de Paris', 'canonical', 3, 'Variété'),
    'champignons noirs': ('champignon', 'canonical', 3, 'Couleur inutile'),
    
    # === HERBES FRAÎCHES ===
    'basilic frais': ('basilic', 'canonical', 10, 'Adjectif inutile'),
    'persil frais': ('persil', 'canonical', 10, 'Adjectif inutile'),
    'persil plat': ('persil', 'canonical', 10, 'Type inutile'),
    'persil haché': ('persil haché', 'archetype', 10, 'Transformation'),
    'coriandre': ('coriandre', 'canonical', 10, 'Base'),
    'coriandre fraîche': ('coriandre', 'canonical', 10, 'Adjectif inutile'),
    'coriandre moulue': ('coriandre moulue', 'archetype', 10, 'Transformation'),
    'aneth frais': ('aneth', 'canonical', 10, 'Adjectif inutile'),
    'aneth': ('aneth', 'canonical', 10, 'Base'),
    'menthe fraîche': ('menthe', 'canonical', 10, 'Adjectif inutile'),
    'menthe': ('menthe', 'canonical', 10, 'Base'),
    'branches de thym': ('thym', 'canonical', 10, 'Retirer unité'),
    'branche de thym': ('thym', 'canonical', 10, 'Retirer unité'),
    'brin de thym': ('thym', 'canonical', 10, 'Retirer unité'),
    'feuille de laurier': ('laurier', 'canonical', 10, 'Retirer unité'),
    'feuilles de laurier': ('laurier', 'canonical', 10, 'Retirer unité'),
    'cive': ('ciboulette', 'canonical', 10, 'Synonyme'),
    'ciboulette': ('ciboulette', 'canonical', 10, 'Base'),
    
    # === ÉPICES (attention : séchage/broyage = transformation) ===
    'cumin': ('cumin', 'canonical', 10, 'Graine brute'),
    'cumin moulu': ('cumin moulu', 'archetype', 10, 'Transformation'),
    'cannelle': ('cannelle', 'archetype', 10, 'Écorce séchée'),
    'paprika': ('paprika', 'archetype', 10, 'Piment séché et moulu'),
    'paprika fumé': ('paprika fumé', 'archetype', 10, 'Piment transformé'),
    'paprika doux': ('paprika', 'archetype', 10, 'Adjectif inutile'),
    'noix de muscade': ('muscade', 'canonical', 10, 'Noix entière'),
    'poivre blanc': ('poivre blanc', 'canonical', 10, 'Variété'),
    'poivre noir': ('poivre noir', 'canonical', 10, 'Variété'),
    'poivre vert': ('poivre vert', 'canonical', 10, 'Variété'),
    'poivre en grains': ('poivre', 'canonical', 10, 'Forme brute'),
    'poivre moulu': ('poivre moulu', 'archetype', 10, 'Transformation'),
    'girofle': ('girofle', 'canonical', 10, 'Bouton séché'),
    
    # === MÉLANGES D'ÉPICES ===
    'herbes de Provence': ('herbes de Provence', 'archetype', 10, 'Mélange'),
    'herbes italiennes': ('herbes italiennes', 'archetype', 10, 'Mélange'),
    'curry': ('curry', 'archetype', 10, 'Mélange'),
    'garam masala': ('garam masala', 'archetype', 10, 'Mélange'),
    'quatre-épices': ('quatre-épices', 'archetype', 10, 'Mélange'),
    'cinq épices': ('cinq épices', 'archetype', 10, 'Mélange'),
    'ras el hanout': ('SKIP', None, None, 'À ajouter manuellement'),
    
    # === BOUQUET GARNI ===
    'bouquet garni': ('bouquet garni', 'canonical', 10, 'Assemblage standard'),
    'garni': ('SKIP', None, None, 'Incomplet'),
    
    # === HUILES (extraction = ARCHETYPE) ===
    'huile': ('huile', 'archetype', 11, 'Extraction'),
    'huile végétale': ('huile végétale', 'archetype', 11, 'Extraction'),
    'huile de friture': ('huile de friture', 'archetype', 11, 'Usage spécifique'),
    'huile de sésame': ('huile de sésame', 'archetype', 11, 'Extraction'),
    'huile sésame': ('huile de sésame', 'archetype', 11, 'Extraction'),
    'huile de coco': ('huile de coco', 'archetype', 11, 'Extraction'),
    'huile neutre': ('huile', 'archetype', 11, 'Adjectif inutile'),
    
    # === JUS (extraction = ARCHETYPE) ===
    'jus de citron': ('jus de citron', 'archetype', 1, 'Extraction'),
    'jus de citron vert': ('jus de citron vert', 'archetype', 1, 'Extraction'),
    'jus citron': ('jus de citron', 'archetype', 1, 'Correction'),
    
    # === SAUCES ET CONDIMENTS ===
    'sauce soja': ('sauce soja', 'archetype', 14, 'Préparation'),
    'sauce soja claire': ('sauce soja claire', 'archetype', 14, 'Préparation'),
    'sauce soja foncée': ('sauce soja foncée', 'archetype', 14, 'Préparation'),
    'sauce d\'huître': ('sauce d\'huître', 'archetype', 14, 'Préparation'),
    'sauce hoisin': ('sauce hoisin', 'archetype', 14, 'Préparation'),
    'sauce tonkatsu': ('sauce tonkatsu', 'archetype', 14, 'Préparation'),
    'sauce béchamel': ('sauce béchamel', 'archetype', 7, 'Préparation'),
    'ketchup': ('ketchup', 'archetype', 14, 'Préparation'),
    'nuoc mam': ('nuoc mam', 'canonical', 14, 'Sauce poisson fermentée'),
    'nuoc-mâm': ('nuoc mam', 'canonical', 14, 'Sauce poisson fermentée'),
    
    # === VINAIGRES (fermentation = ARCHETYPE) ===
    'vinaigre': ('vinaigre', 'archetype', 14, 'Fermentation acétique'),
    'vinaigre blanc': ('vinaigre blanc', 'archetype', 14, 'Fermentation'),
    'vinaigre balsamique': ('vinaigre balsamique', 'archetype', 14, 'Fermentation'),
    'vinaigre de riz': ('vinaigre de riz', 'archetype', 14, 'Fermentation'),
    'vinaigre de cidre': ('vinaigre de cidre', 'archetype', 14, 'Fermentation'),
    'vinaigre de xérès': ('vinaigre de xérès', 'archetype', 14, 'Fermentation'),
    'vinaigre d\'estragon': ('vinaigre d\'estragon', 'archetype', 14, 'Fermentation'),
    
    # === BOUILLONS ET FONDS ===
    'bouillon': ('bouillon', 'archetype', 14, 'Préparation'),
    'bouillon de boeuf': ('bouillon de boeuf', 'archetype', 9, 'Préparation'),
    'bouillon de poulet': ('bouillon de poulet', 'archetype', 9, 'Préparation'),
    'fond de veau': ('fond de veau', 'archetype', 9, 'Préparation'),
    'fumet de poisson': ('fumet de poisson', 'archetype', 9, 'Préparation'),
    
    # === PAINS (cuisson = ARCHETYPE) ===
    'pain': ('pain', 'archetype', 5, 'Produit cuit'),
    'pain de mie': ('pain de mie', 'archetype', 5, 'Produit cuit'),
    'pain de campagne': ('pain de campagne', 'archetype', 5, 'Produit cuit'),
    'pain rassis': ('pain rassis', 'archetype', 5, 'Pain séché'),
    'pain d\'épices': ('pain d\'épices', 'archetype', 5, 'Produit cuit'),
    'baguette': ('baguette', 'archetype', 5, 'Produit cuit'),
    'muffins anglais': ('muffin anglais', 'archetype', 5, 'Produit cuit'),
    'mie de pain': ('mie de pain', 'archetype', 5, 'Partie de pain'),
    
    # === PÂTES ET CÉRÉALES TRANSFORMÉES ===
    'flocons d\'avoine': ('flocon d\'avoine', 'archetype', 5, 'Transformation'),
    'flocon d\'avoine': ('flocon d\'avoine', 'archetype', 5, 'Transformation'),
    'chapelure': ('chapelure', 'archetype', 5, 'Pain transformé'),
    'chapelure panko': ('chapelure panko', 'archetype', 5, 'Pain transformé'),
    'panko': ('panko', 'archetype', 5, 'Pain transformé'),
    'spaghetti': ('spaghetti', 'archetype', 5, 'Pâtes'),
    'penne': ('penne', 'archetype', 5, 'Pâtes'),
    'lasagnes': ('lasagne', 'archetype', 5, 'Pâtes'),
    'lasagne': ('lasagne', 'archetype', 5, 'Pâtes'),
    'pâtes courtes': ('pâtes courtes', 'archetype', 5, 'Pâtes'),
    'vermicelles de riz': ('vermicelle de riz', 'archetype', 5, 'Pâtes'),
    'vermicelle de riz': ('vermicelle de riz', 'archetype', 5, 'Pâtes'),
    'vermicelle': ('vermicelle', 'archetype', 5, 'Pâtes'),
    'nouilles ramen': ('nouille ramen', 'archetype', 5, 'Pâtes'),
    'tonnarelli': ('tonnarelli', 'archetype', 5, 'Pâtes'),
    'semoule': ('semoule', 'archetype', 5, 'Céréale moulue'),
    
    # === GALETTES ET TORTILLAS ===
    'galettes de riz': ('galette de riz', 'archetype', 5, 'Produit transformé'),
    'galette de riz': ('galette de riz', 'archetype', 5, 'Produit transformé'),
    'galettes chinoises': ('galette chinoise', 'archetype', 5, 'Produit transformé'),
    'tortillas': ('tortilla', 'archetype', 5, 'Produit cuit'),
    'tortilla': ('tortilla', 'archetype', 5, 'Produit cuit'),
    'feuilles de brick': ('feuille de brick', 'archetype', 5, 'Produit transformé'),
    'feuille de brick': ('feuille de brick', 'archetype', 5, 'Produit transformé'),
    
    # === PÂTES À TARTE/PIZZA ===
    'pâte feuilletée': ('pâte feuilletée', 'archetype', 14, 'Préparation'),
    'pâte brisée': ('pâte brisée', 'archetype', 14, 'Préparation'),
    'pâte à pizza': ('pâte à pizza', 'archetype', 14, 'Préparation'),
    'pâte sablée': ('pâte sablée', 'archetype', 14, 'Préparation'),
    'sablée': ('pâte sablée', 'archetype', 14, 'Préparation'),
    'brisées': ('pâte brisée', 'archetype', 14, 'Préparation'),
    
    # === VIANDES BRUTES ===
    'boeuf': ('boeuf', 'canonical', 9, 'Viande brute'),
    'boeuf à braiser': ('boeuf', 'canonical', 9, 'Découpe'),
    'boeuf à mijoter': ('boeuf', 'canonical', 9, 'Découpe'),
    'boeuf (gîte, paleron)': ('boeuf', 'canonical', 9, 'Découpe'),
    'paleron de boeuf': ('boeuf', 'canonical', 9, 'Découpe'),
    'steaks de boeuf 180g': ('boeuf', 'canonical', 9, 'Découpe'),
    'entrecôte de boeuf': ('boeuf', 'canonical', 9, 'Découpe'),
    'veau pour blanquette': ('veau', 'canonical', 9, 'Découpe'),
    'jarret de veau en tranches de 4cm': ('veau', 'canonical', 9, 'Découpe'),
    'rôti de veau sous-noix': ('veau', 'canonical', 9, 'Découpe'),
    'sauté de veau': ('veau', 'canonical', 9, 'Découpe'),
    'rôti de porc': ('porc', 'canonical', 9, 'Découpe'),
    'travers de porc': ('porc', 'canonical', 9, 'Découpe'),
    'échine de porc': ('porc', 'canonical', 9, 'Découpe'),
    'poitrine de porc': ('porc', 'canonical', 9, 'Découpe'),
    'gigot d\'agneau': ('agneau', 'canonical', 9, 'Découpe'),
    'épaule d\'agneau': ('agneau', 'canonical', 9, 'Découpe'),
    'côtelettes d\'agneau': ('agneau', 'canonical', 9, 'Découpe'),
    'viande d\'agneau': ('agneau', 'canonical', 9, 'Base'),
    'poulet fermier (1,5 kg)': ('poulet', 'canonical', 9, 'Retirer détails'),
    'poulet fermier (1,8 kg)': ('poulet', 'canonical', 9, 'Retirer détails'),
    'poulet découpé': ('poulet', 'canonical', 9, 'Découpe'),
    'canard entier': ('canard', 'canonical', 9, 'Volaille'),
    'magrets de canard': ('magret de canard', 'canonical', 9, 'Découpe'),
    'magret de canard': ('magret de canard', 'canonical', 9, 'Découpe'),
    'poule': ('poule', 'canonical', 9, 'Volaille'),
    'lapin découpé': ('lapin', 'canonical', 9, 'Découpe'),
    
    # === VIANDES TRANSFORMÉES ===
    'boeuf haché': ('boeuf haché', 'archetype', 9, 'Hachage'),
    'porc haché': ('porc haché', 'archetype', 9, 'Hachage'),
    'agneau haché': ('agneau haché', 'archetype', 9, 'Hachage'),
    'viande d\'agneau hachée': ('agneau haché', 'archetype', 9, 'Hachage'),
    'chair à saucisse': ('chair à saucisse', 'archetype', 9, 'Préparation'),
    'escalopes de poulet': ('escalope de poulet', 'archetype', 9, 'Découpe fine'),
    'escalope de poulet': ('escalope de poulet', 'archetype', 9, 'Découpe fine'),
    'blancs de poulet': ('blanc de poulet', 'archetype', 9, 'Partie spécifique'),
    'blanc de poulet': ('blanc de poulet', 'archetype', 9, 'Partie spécifique'),
    'escalopes de veau': ('escalope de veau', 'archetype', 9, 'Découpe fine'),
    'escalope de veau': ('escalope de veau', 'archetype', 9, 'Découpe fine'),
    'escalopes de veau (70 g)': ('escalope de veau', 'archetype', 9, 'Découpe fine'),
    'escalopes de porc': ('escalope de porc', 'archetype', 9, 'Découpe fine'),
    'escalope de porc': ('escalope de porc', 'archetype', 9, 'Découpe fine'),
    'paupiettes de veau': ('paupiette de veau', 'archetype', 9, 'Préparation'),
    'paupiette de veau': ('paupiette de veau', 'archetype', 9, 'Préparation'),
    
    # === CHARCUTERIE ===
    'bacon': ('bacon', 'archetype', 9, 'Charcuterie'),
    'tranches de bacon': ('bacon', 'archetype', 9, 'Charcuterie'),
    'lardons': ('lardon', 'archetype', 9, 'Charcuterie'),
    'lardon': ('lardon', 'archetype', 9, 'Charcuterie'),
    'lardons fumés': ('lardon fumé', 'archetype', 9, 'Charcuterie fumée'),
    'jambon': ('jambon', 'archetype', 9, 'Charcuterie'),
    'jambon blanc': ('jambon blanc', 'archetype', 9, 'Charcuterie'),
    'jambon cuit': ('jambon cuit', 'archetype', 9, 'Charcuterie'),
    'jambon cru': ('jambon cru', 'archetype', 9, 'Charcuterie'),
    'jambon serrano': ('jambon serrano', 'archetype', 9, 'Charcuterie'),
    'jambon ibérique': ('jambon ibérique', 'archetype', 9, 'Charcuterie'),
    'jambon à l\'os': ('jambon', 'archetype', 9, 'Charcuterie'),
    'saucisses porc': ('saucisse', 'archetype', 9, 'Charcuterie'),
    'saucisse': ('saucisse', 'archetype', 9, 'Charcuterie'),
    'saucisses de Toulouse': ('saucisse de Toulouse', 'archetype', 9, 'Charcuterie'),
    'saucisse de Toulouse': ('saucisse de Toulouse', 'archetype', 9, 'Charcuterie'),
    'saucisses de Strasbourg': ('saucisse de Strasbourg', 'archetype', 9, 'Charcuterie'),
    'saucisse de Strasbourg': ('saucisse de Strasbourg', 'archetype', 9, 'Charcuterie'),
    'saucisses fumées': ('saucisse fumée', 'archetype', 9, 'Charcuterie'),
    'saucisson de Lyon pistaché 800g': ('saucisson de Lyon', 'archetype', 9, 'Charcuterie'),
    'andouillettes de Troyes': ('andouillette', 'archetype', 9, 'Charcuterie'),
    'andouillette': ('andouillette', 'archetype', 9, 'Charcuterie'),
    'boudins noirs': ('boudin noir', 'archetype', 9, 'Charcuterie'),
    'boudin noir': ('boudin noir', 'archetype', 9, 'Charcuterie'),
    'chorizo': ('chorizo', 'archetype', 9, 'Charcuterie'),
    'guanciale': ('guanciale', 'archetype', 9, 'Charcuterie'),
    'poitrine fumée': ('poitrine fumée', 'archetype', 9, 'Charcuterie'),
    'confit de canard': ('confit de canard', 'archetype', 9, 'Préparation'),
    
    # === POISSONS ET FRUITS DE MER ===
    'saumon fumé': ('saumon fumé', 'archetype', 9, 'Fumage'),
    'pavés saumon 150g': ('saumon', 'canonical', 9, 'Découpe'),
    'pavés saumon': ('saumon', 'canonical', 9, 'Découpe'),
    'saumon': ('saumon', 'canonical', 9, 'Poisson'),
    'thon au naturel': ('thon', 'canonical', 9, 'Conserve'),
    'thon': ('thon', 'canonical', 9, 'Poisson'),
    'morue dessalée': ('morue dessalée', 'archetype', 9, 'Dessalage'),
    'morue': ('morue', 'canonical', 9, 'Poisson'),
    'moules': ('moule', 'canonical', 9, 'Fruits de mer'),
    'moule': ('moule', 'canonical', 9, 'Fruits de mer'),
    'crevettes cuites': ('crevette cuite', 'archetype', 9, 'Cuisson'),
    'crevette': ('crevette', 'canonical', 9, 'Fruits de mer'),
    'calamars': ('calmar', 'canonical', 9, 'Fruits de mer'),
    'calmar': ('calmar', 'canonical', 9, 'Fruits de mer'),
    'escargots': ('escargot', 'canonical', 9, 'Gastropode'),
    
    # === FRUITS ===
    'pommes': ('pomme', 'canonical', 1, 'Singulariser'),
    'pomme': ('pomme', 'canonical', 1, 'Fruit'),
    'citrons': ('citron', 'canonical', 1, 'Singulariser'),
    'citron bio': ('citron', 'canonical', 1, 'Label inutile'),
    'zeste de citron': ('zeste de citron', 'archetype', 1, 'Partie râpée'),
    'bananes mûres': ('banane', 'canonical', 1, 'Adjectif inutile'),
    'banane': ('banane', 'canonical', 1, 'Fruit'),
    'figues fraîches': ('figue', 'canonical', 1, 'Adjectif inutile'),
    'figue': ('figue', 'canonical', 1, 'Fruit'),
    'fruits rouges mélangés': ('fruit rouge', 'canonical', 1, 'Retirer mélangés'),
    'pruneaux': ('pruneau', 'canonical', 1, 'Singulariser'),
    'pruneau': ('pruneau', 'canonical', 1, 'Fruit séché'),
    'pruneaux dénoyautés': ('pruneau', 'canonical', 1, 'Retirer dénoyauté'),
    
    # === NOIX ET GRAINES ===
    'graines de sésame': ('graine de sésame', 'canonical', 14, 'Singulariser'),
    'graine de sésame': ('graine de sésame', 'canonical', 14, 'Base'),
    'graines sésame': ('graine de sésame', 'canonical', 14, 'Correction'),
    'graines de chia': ('graine de chia', 'canonical', 14, 'Singulariser'),
    'graine de chia': ('graine de chia', 'canonical', 14, 'Base'),
    'pignons de pin': ('pignon de pin', 'canonical', 14, 'Singulariser'),
    'pignon de pin': ('pignon de pin', 'canonical', 14, 'Base'),
    'pignons': ('pignon de pin', 'canonical', 14, 'Compléter'),
    'pignon': ('pignon de pin', 'canonical', 14, 'Compléter'),
    'cerneaux de noix': ('cerneau de noix', 'canonical', 14, 'Singulariser'),
    'cerneau de noix': ('cerneau de noix', 'canonical', 14, 'Base'),
    'noisettes': ('noisette', 'canonical', 14, 'Singulariser'),
    'noisette': ('noisette', 'canonical', 14, 'Base'),
    'amandes effilées': ('amande effilée', 'archetype', 14, 'Transformation'),
    'amande effilée': ('amande effilée', 'archetype', 14, 'Transformation'),
    'poudre d\'amandes': ('poudre d\'amande', 'archetype', 14, 'Transformation'),
    'poudre d\'amande': ('poudre d\'amande', 'archetype', 14, 'Transformation'),
    
    # === CHOCOLAT ===
    'chocolat noir': ('chocolat noir', 'canonical', 14, 'Base'),
    'pépites de chocolat': ('pépite de chocolat', 'canonical', 14, 'Forme'),
    'pépites chocolat': ('pépite de chocolat', 'canonical', 14, 'Forme'),
    'pépite de chocolat': ('pépite de chocolat', 'canonical', 14, 'Forme'),
    'ganache chocolat': ('ganache chocolat', 'archetype', 14, 'Préparation'),
    
    # === AUTRES INGRÉDIENTS ===
    'levure': ('levure', 'canonical', 14, 'Micro-organisme'),
    'levure chimique': ('levure chimique', 'canonical', 14, 'Agent levant'),
    'levure boulanger': ('levure', 'canonical', 14, 'Même chose'),
    'levure de boulanger': ('levure', 'canonical', 14, 'Même chose'),
    'levure de bière': ('levure de bière', 'canonical', 14, 'Complément'),
    'bicarbonate': ('bicarbonate', 'canonical', 14, 'Produit chimique'),
    'maïzena': ('maïzena', 'archetype', 14, 'Fécule de maïs'),
    'fécule de maïs': ('fécule de maïs', 'archetype', 14, 'Extraction'),
    'tahini': ('tahini', 'archetype', 14, 'Pâte de sésame'),
    'mirin': ('mirin', 'canonical', 14, 'Vin de riz doux'),
    'saké': ('saké', 'canonical', 14, 'Alcool de riz'),
    'dashi': ('dashi', 'archetype', 14, 'Bouillon'),
    'paneer': ('paneer', 'canonical', 7, 'Fromage'),
    'tofu ferme': ('tofu', 'canonical', 14, 'Caillé de soja'),
    'pousses de soja': ('pousse de soja', 'canonical', 14, 'Germe'),
    'pousse de soja': ('pousse de soja', 'canonical', 14, 'Germe'),
    'câpres': ('câpre', 'canonical', 14, 'Bouton de fleur'),
    'câpre': ('câpre', 'canonical', 14, 'Bouton de fleur'),
    'olives': ('olive', 'canonical', 14, 'Fruit'),
    'olive': ('olive', 'canonical', 14, 'Fruit'),
    'olives noires': ('olive noire', 'canonical', 14, 'Variété'),
    'olive noire': ('olive noire', 'canonical', 14, 'Variété'),
    'olives noires dénoyautées': ('olive noire', 'canonical', 14, 'Retirer dénoyauté'),
    
    # === VINS ET ALCOOLS ===
    'vin blanc': ('vin blanc', 'canonical', 14, 'Boisson fermentée'),
    'vin blanc sec': ('vin blanc', 'canonical', 14, 'Adjectif inutile'),
    'vin rouge': ('vin rouge', 'canonical', 14, 'Boisson fermentée'),
    'vin rouge de Bourgogne': ('vin rouge', 'canonical', 14, 'Origine inutile'),
    'xérès': ('xérès', 'canonical', 14, 'Vin fortifié'),
    'sherry': ('xérès', 'canonical', 14, 'Synonyme anglais'),
    'madère': ('madère', 'canonical', 14, 'Vin fortifié'),
    'cognac': ('cognac', 'canonical', 14, 'Eau-de-vie'),
    'calvados': ('calvados', 'canonical', 14, 'Eau-de-vie'),
    'rhum': ('rhum', 'canonical', 14, 'Alcool'),
    'rhum ambré': ('rhum', 'canonical', 14, 'Type inutile'),
    'amaretto': ('amaretto', 'canonical', 14, 'Liqueur'),
    'cidre brut': ('cidre', 'canonical', 14, 'Boisson fermentée'),
    'bière ambrée': ('bière', 'canonical', 14, 'Type inutile'),
    
    # === SIROPS ===
    'sirop d\'érable': ('sirop d\'érable', 'canonical', 14, 'Sève concentrée'),
    'sirop d\'agave': ('sirop d\'agave', 'canonical', 14, 'Sève concentrée'),
    
    # === DIVERS ===
    'coleslaw': ('coleslaw', 'archetype', 14, 'Salade préparée'),
    'chips de maïs': ('chip de maïs', 'archetype', 5, 'Transformation'),
    'chip de maïs': ('chip de maïs', 'archetype', 5, 'Transformation'),
    'biscuits Graham': ('biscuit Graham', 'archetype', 14, 'Biscuit'),
    'biscuit Graham': ('biscuit Graham', 'archetype', 14, 'Biscuit'),
    'fleur de sel': ('fleur de sel', 'canonical', 14, 'Sel spécial'),
    'vanille liquide': ('vanille liquide', 'archetype', 14, 'Extrait'),
    'café fort': ('café', 'canonical', 14, 'Force inutile'),
    'café': ('café', 'canonical', 14, 'Grain moulu'),
    'riz bomba': ('riz bomba', 'canonical', 5, 'Variété'),
    'riz arborio': ('riz arborio', 'canonical', 5, 'Variété'),
    'riz Arborio': ('SKIP', None, None, 'Cultivar spécifique'),
    'riz cuit froid': ('riz cuit', 'archetype', 5, 'Cuisson'),
    'garrofó': ('garrofó', 'canonical', 5, 'Haricot espagnol'),
    
    # === INGRÉDIENTS RESTANTS (V9 complet) ===
    'champignons de Paris': ('champignon de Paris', 'canonical', 3, 'Variété commune'),
    'miel': ('miel', 'canonical', 14, 'Produit naturel'),
    'safran': ('safran', 'archetype', 10, 'Pistils séchés'),
    'crème fraîche épaisse': ('crème fraîche épaisse', 'archetype', 7, 'Produit laitier transformé'),
    'noix de pécan': ('noix de pécan', 'canonical', 14, 'Noix brute'),
    'avocat': ('avocat', 'canonical', 1, 'Fruit'),
    'cacahuètes': ('cacahuète', 'canonical', 14, 'Graine brute'),
    'cacahuète': ('cacahuète', 'canonical', 14, 'Graine brute'),
    'anchois': ('anchois', 'archetype', 9, 'Poisson salé'),
    'filets d\'anchois': ('anchois', 'archetype', 9, 'Poisson salé'),
    'raisins secs': ('raisin sec', 'canonical', 1, 'Fruit séché'),
    'raisin sec': ('raisin sec', 'canonical', 1, 'Fruit séché'),
    'abricots secs': ('abricot sec', 'canonical', 1, 'Fruit séché'),
    'abricot sec': ('abricot sec', 'canonical', 1, 'Fruit séché'),
    'cacao en poudre': ('cacao en poudre', 'archetype', 14, 'Fève moulue'),
    'cacao': ('cacao en poudre', 'archetype', 14, 'Fève moulue'),
    'pâte de curry': ('pâte de curry', 'archetype', 10, 'Pâte d\'épices'),
    'pâte de curry verte': ('pâte de curry verte', 'archetype', 10, 'Pâte d\'épices'),
    'pâte de curry rouge': ('pâte de curry rouge', 'archetype', 10, 'Pâte d\'épices'),
    'wasabi': ('wasabi', 'canonical', 10, 'Racine brute'),
    'wasabi en poudre': ('wasabi en poudre', 'archetype', 10, 'Racine moulue'),
    'gingembre frais': ('gingembre', 'canonical', 10, 'Racine brute'),
    'gingembre en poudre': ('gingembre en poudre', 'archetype', 10, 'Racine moulue'),
    'cumin en grains': ('cumin', 'canonical', 10, 'Graine brute'),
    'cardamome': ('cardamome', 'canonical', 10, 'Graine brute'),
    'cardamome moulue': ('cardamome moulue', 'archetype', 10, 'Graine moulue'),
    'fenouil': ('fenouil', 'canonical', 2, 'Légume'),
    'graines de fenouil': ('graine de fenouil', 'canonical', 10, 'Graine brute'),
    'graine de fenouil': ('graine de fenouil', 'canonical', 10, 'Graine brute'),
    'graines de coriandre': ('graine de coriandre', 'canonical', 10, 'Graine brute'),
    'graine de coriandre': ('graine de coriandre', 'canonical', 10, 'Graine brute'),
    'estragon': ('estragon', 'canonical', 10, 'Herbe fraîche'),
    'estragon frais': ('estragon', 'canonical', 10, 'Herbe fraîche'),
    'romarin': ('romarin', 'canonical', 10, 'Herbe fraîche'),
    'romarin frais': ('romarin', 'canonical', 10, 'Herbe fraîche'),
    'sauge': ('sauge', 'canonical', 10, 'Herbe fraîche'),
    'sauge fraîche': ('sauge', 'canonical', 10, 'Herbe fraîche'),
    'feuilles de laurier-sauce': ('laurier', 'canonical', 10, 'Feuille'),
    'pâte d\'arachide': ('beurre de cacahuète', 'archetype', 14, 'Pâte de noix'),
    'beurre de cacahuète': ('beurre de cacahuète', 'archetype', 14, 'Pâte de noix'),
    'beurre d\'amande': ('beurre d\'amande', 'archetype', 14, 'Pâte de noix'),
    'dattes': ('datte', 'canonical', 1, 'Fruit'),
    'datte': ('datte', 'canonical', 1, 'Fruit'),
    'dattes dénoyautées': ('datte', 'canonical', 1, 'Retirer dénoyauté'),
    'lait condensé': ('lait condensé', 'archetype', 7, 'Lait concentré'),
    'lait condensé sucré': ('lait condensé sucré', 'archetype', 7, 'Lait concentré sucré'),
    'lait en poudre': ('lait en poudre', 'archetype', 7, 'Lait déshydraté'),
    'gélatine': ('gélatine', 'canonical', 14, 'Protéine animale'),
    'gélatine en poudre': ('gélatine', 'canonical', 14, 'Forme poudre'),
    'agar-agar': ('agar-agar', 'canonical', 14, 'Gélifiant algue'),
    'tapioca': ('tapioca', 'archetype', 5, 'Fécule de manioc'),
    'fécule de pomme de terre': ('fécule de pomme de terre', 'archetype', 14, 'Extraction'),
    'arrow-root': ('arrow-root', 'archetype', 14, 'Fécule'),
    'konjac': ('konjac', 'canonical', 14, 'Racine'),
    'miso': ('miso', 'archetype', 14, 'Pâte fermentée'),
    'miso blanc': ('miso blanc', 'archetype', 14, 'Pâte fermentée'),
    'miso rouge': ('miso rouge', 'archetype', 14, 'Pâte fermentée'),
    'nori': ('nori', 'archetype', 14, 'Algue séchée'),
    'feuilles de nori': ('nori', 'archetype', 14, 'Algue séchée'),
    'wakamé': ('wakamé', 'canonical', 14, 'Algue'),
    'kombu': ('kombu', 'canonical', 14, 'Algue'),
    'tempeh': ('tempeh', 'archetype', 14, 'Soja fermenté'),
    'seitan': ('seitan', 'archetype', 14, 'Gluten de blé'),
    'levure nutritionnelle': ('levure nutritionnelle', 'canonical', 14, 'Levure désactivée'),
    'extrait de vanille': ('extrait de vanille', 'archetype', 14, 'Extraction'),
    'essence d\'amande': ('essence d\'amande', 'archetype', 14, 'Extraction'),
    'colorant alimentaire': ('colorant alimentaire', 'canonical', 14, 'Additif'),
    'gélifiant': ('SKIP', None, None, 'Trop vague'),
    'épaississant': ('SKIP', None, None, 'Trop vague'),
    
    # === 61 DERNIERS INGRÉDIENTS ===
    "champignons de Paris": ('champignon de Paris', 'canonical', 3, 'Variété commune'),
    "piment d'Espelette": ("piment d'Espelette", 'archetype', 10, 'Piment séché et moulu'),
    "herbes de Provence": ('herbes de Provence', 'archetype', 10, "Mélange d'herbes séchées"),
    'crevettes': ('crevette', 'canonical', 9, 'Crustacé brut'),
    'coulis de tomate': ('coulis de tomate', 'archetype', 2, 'Tomates cuites et mixées'),
    'bouillon de légumes': ('bouillon de légumes', 'archetype', 2, 'Préparation'),
    'bouillon de volaille': ('bouillon de volaille', 'archetype', 9, 'Préparation'),
    'mayonnaise': ('mayonnaise', 'archetype', 14, 'Émulsion'),
    'clou de girofle': ('girofle', 'canonical', 10, 'Bouton de fleur séché'),
    "moutarde de Dijon": ('moutarde de Dijon', 'canonical', 14, 'Condiment'),
    'haricots verts': ('haricot vert', 'canonical', 2, 'Légume'),
    'haricot vert': ('haricot vert', 'canonical', 2, 'Légume'),
    'porc': ('porc', 'canonical', 9, 'Viande brute'),
    'basilic': ('basilic', 'canonical', 10, 'Herbe fraîche'),
    'brocoli': ('brocoli', 'canonical', 2, 'Légume'),
    'brocolis': ('brocoli', 'canonical', 2, 'Légume'),
    'riz basmati': ('riz basmati', 'canonical', 5, 'Variété de riz'),
    'mangue': ('mangue', 'canonical', 1, 'Fruit'),
    'mangues': ('mangue', 'canonical', 1, 'Fruit'),
    'lait concentré sucré': ('lait concentré sucré', 'archetype', 7, 'Lait concentré et sucré'),
    'citronnelle': ('citronnelle', 'canonical', 10, 'Herbe aromatique'),
    'avocats': ('avocat', 'canonical', 1, 'Fruit'),
    'noix': ('noix', 'canonical', 14, 'Fruit à coque'),
    'saumon frais': ('saumon', 'canonical', 9, 'Adjectif inutile'),
    'levure de bière fraîche': ('levure', 'canonical', 14, 'Type inutile'),
    'origan séché': ('origan séché', 'archetype', 10, 'Herbe séchée'),
    'potimarron': ('potimarron', 'canonical', 2, 'Courge'),
    'châtaignes': ('châtaigne', 'canonical', 14, 'Fruit à coque'),
    'châtaigne': ('châtaigne', 'canonical', 14, 'Fruit à coque'),
    'chou-fleur': ('chou-fleur', 'canonical', 2, 'Légume'),
    'chou fleur': ('chou-fleur', 'canonical', 2, 'Légume'),
    'lentilles': ('lentille', 'canonical', 5, 'Légumineuse'),
    'lentille': ('lentille', 'canonical', 5, 'Légumineuse'),
    "saucisses de Strasbourg": ('saucisse de Strasbourg', 'archetype', 9, 'Charcuterie'),
    'pesto': ('pesto', 'archetype', 14, 'Sauce préparée'),
    'chèvre frais': ('chèvre frais', 'canonical', 7, 'Fromage frais'),
    'poulet  fermier (1,5 kg)': ('poulet', 'canonical', 9, 'Retirer détails'),
    'thym frais': ('thym', 'canonical', 10, 'Adjectif inutile'),
    "vin rouge de Bourgogne": ('vin rouge', 'canonical', 14, 'Origine inutile'),
    'orange': ('orange', 'canonical', 1, 'Fruit'),
    'oranges': ('orange', 'canonical', 1, 'Fruit'),
    'ananas': ('ananas', 'canonical', 1, 'Fruit'),
    "saucisses de Toulouse": ('saucisse de Toulouse', 'archetype', 9, 'Charcuterie'),
    'sauce barbecue': ('sauce barbecue', 'archetype', 14, 'Sauce préparée'),
    'chou blanc': ('chou blanc', 'canonical', 2, 'Variété'),
    'chou': ('chou', 'canonical', 2, 'Légume'),
    'oignons nouveaux': ('oignon nouveau', 'canonical', 2, 'Variété jeune'),
    'oignon nouveau': ('oignon nouveau', 'canonical', 2, 'Variété jeune'),
    "andouillettes de Troyes": ('andouillette', 'archetype', 9, 'Charcuterie'),
    "saucisson de Lyon pistaché 800g": ('saucisson de Lyon', 'archetype', 9, 'Charcuterie'),
    "biscuits Graham": ('biscuit Graham', 'archetype', 14, 'Biscuit'),
    'cream cheese': ('cream cheese', 'canonical', 7, 'Fromage frais'),
    "farine T65": ('farine', 'archetype', 5, 'Type inutile'),
    'levure boulanger fraîche': ('levure', 'canonical', 14, 'Type inutile'),
    'burger': ('SKIP', None, None, 'Plat complet'),
    'cheddar': ('cheddar', 'canonical', 7, 'Fromage'),
    'tomme fraîche': ('tomme fraîche', 'canonical', 7, 'Fromage frais'),
    'maïs': ('maïs', 'canonical', 5, 'Céréale'),
    'ricotta': ('ricotta', 'canonical', 7, 'Fromage'),
    'pecorino': ('pecorino', 'canonical', 7, 'Fromage'),
    'quinoa': ('quinoa', 'canonical', 5, 'Pseudo-céréale'),
    'patate douce': ('patate douce', 'canonical', 2, 'Légume'),
    'patates douces': ('patate douce', 'canonical', 2, 'Légume'),
    'endives': ('endive', 'canonical', 2, 'Légume'),
    'endive': ('endive', 'canonical', 2, 'Légume'),
    'cerises': ('cerise', 'canonical', 1, 'Fruit'),
    'cerise': ('cerise', 'canonical', 1, 'Fruit'),
    'mascarpone': ('mascarpone', 'canonical', 7, 'Fromage'),
    'céleri-rave': ('céleri-rave', 'canonical', 2, 'Légume racine'),
    "farine T45": ('farine', 'archetype', 5, 'Type inutile'),
    
    # === ITEMS À IGNORER ===
    'bavette ou rumsteck de boeuf': ('SKIP', None, None, 'Multiple choix'),
    'pomme ou poire': ('SKIP', None, None, 'Multiple choix'),
    'ganache ou crème': ('SKIP', None, None, 'Multiple choix'),
    'trofie ou linguine': ('SKIP', None, None, 'Multiple choix'),
    'malt d\'orge ou sucre': ('SKIP', None, None, 'Multiple choix'),
    "pimientos de Padrón": ('SKIP', None, None, 'Cultivar spécifique'),
    "St Môret": ('SKIP', None, None, 'Marque'),
    'cuillère': ('SKIP', None, None, 'Ustensile'),
    'verts': ('SKIP', None, None, 'Incomplet'),
    'rouge': ('SKIP', None, None, 'Incomplet'),
    'brisées': ('SKIP', None, None, 'Incomplet - déjà mappé'),
    'oeufs pour meringue': ('oeuf', 'canonical', 7, 'Usage spécifique'),
    'sucre pour meringue': ('sucre', 'canonical', 14, 'Usage spécifique'),
}

def load_existing_data():
    canonical = {}
    with open('../supabase/exports/latest/csv/canonical_foods.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            canonical[row['canonical_name'].lower().strip()] = row['id']
    
    archetypes = {}
    with open('../supabase/exports/latest/csv/archetypes.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            archetypes[row['name'].lower().strip()] = row['id']
    
    return canonical, archetypes

def extract_raw_ingredients():
    ingredients = defaultdict(int)
    with open('../LISTE_TOUTES_RECETTES COMPLETE.txt', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            if len(row) < 4:
                continue
            for i in range(3, len(row)):
                ing_raw = row[i].strip()
                if not ing_raw:
                    continue
                parts = ing_raw.split('|')
                if len(parts) >= 3:
                    ing_name = parts[2].strip()
                    ingredients[ing_name] += 1
    return ingredients

def main():
    print("=== VERSION 9 - MAPPING COMPLET ===\n")
    
    canonical_exist, archetypes_exist = load_existing_data()
    raw_ingredients = extract_raw_ingredients()
    
    to_create_canonical = {}
    to_create_archetype = {}
    already_exist = []
    skipped = []
    not_mapped = []
    
    # Créer un dictionnaire en minuscules pour la recherche
    mapping_lower = {k.lower(): v for k, v in COMPLETE_MAPPING.items()}
    
    for ing_name, count in sorted(raw_ingredients.items(), key=lambda x: -x[1]):
        ing_lower = ing_name.lower()
        
        # Mapping manuel
        if ing_lower not in mapping_lower:
            not_mapped.append((ing_name, count))
            continue
        
        mapping = mapping_lower[ing_lower]
        
        if mapping == 'EXISTE':
            already_exist.append((ing_name, count))
            continue
        
        if mapping[0] == 'SKIP':
            skipped.append((ing_name, count, mapping[3] if len(mapping) > 3 else 'Skip'))
            continue
        
        final_name, type_ing, category, notes = mapping
        
        # Vérifier si existe après mapping
        if final_name.lower() in canonical_exist or final_name.lower() in archetypes_exist:
            already_exist.append((ing_name, count))
            continue
        
        if type_ing == 'canonical':
            key = final_name.lower()
            if key not in to_create_canonical:
                to_create_canonical[key] = {
                    'name': final_name,
                    'category': category,
                    'count': count,
                    'notes': notes,
                    'original': ing_name
                }
        else:  # archetype
            key = final_name.lower()
            if key not in to_create_archetype:
                to_create_archetype[key] = {
                    'name': final_name,
                    'category': category,
                    'count': count,
                    'notes': notes,
                    'original': ing_name
                }
    
    print(f"✓ {len(to_create_canonical)} canonical")
    print(f"✓ {len(to_create_archetype)} archetypes")
    print(f"✓ {len(already_exist)} existants")
    print(f"✓ {len(skipped)} ignorés")
    print(f"✗ {len(not_mapped)} NON MAPPÉS\n")
    
    if not_mapped:
        print("⚠️  NON MAPPÉS:")
        for ing, count in not_mapped:
            print(f"  {count:3}x {ing}")
    
    # Générer SQL
    with open('INSERT_INGREDIENTS_FINAL_V9.sql', 'w', encoding='utf-8') as f:
        f.write("-- ========================================\n")
        f.write("-- VERSION 9 - MAPPING MANUEL COMPLET\n")
        f.write("-- Chaque ingrédient vérifié individuellement\n")
        f.write("-- ========================================\n\n")
        f.write("BEGIN;\n\n")
        
        f.write("-- ========================================\n")
        f.write("-- CANONICAL FOODS (aliments bruts)\n")
        f.write("-- ========================================\n\n")
        
        for key in sorted(to_create_canonical.keys()):
            item = to_create_canonical[key]
            if item['original'].lower() != item['name'].lower():
                f.write(f"-- {item['name']} ({item['count']}x) | {item['notes']} | de: {item['original']}\n")
            else:
                f.write(f"-- {item['name']} ({item['count']}x) | {item['notes']}\n")
            f.write(f"INSERT INTO canonical_foods (canonical_name, category_id)\n")
            f.write(f"VALUES ('{item['name']}', {item['category']})\n")
            f.write(f"ON CONFLICT (canonical_name) DO NOTHING;\n\n")
        
        f.write("\n-- ========================================\n")
        f.write("-- ARCHETYPES (transformés/préparés)\n")
        f.write("-- ========================================\n\n")
        
        for key in sorted(to_create_archetype.keys()):
            item = to_create_archetype[key]
            if item['original'].lower() != item['name'].lower():
                f.write(f"-- {item['name']} ({item['count']}x) | {item['notes']} | de: {item['original']}\n")
            else:
                f.write(f"-- {item['name']} ({item['count']}x) | {item['notes']}\n")
            f.write(f"INSERT INTO archetypes (name, category_id)\n")
            f.write(f"VALUES ('{item['name']}', {item['category']})\n")
            f.write(f"ON CONFLICT (name) DO NOTHING;\n\n")
        
        f.write("COMMIT;\n")
    
    print("\n✅ INSERT_INGREDIENTS_FINAL_V9.sql")

if __name__ == '__main__':
    main()
