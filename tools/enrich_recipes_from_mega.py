#!/usr/bin/env python3
"""
Script pour enrichir notre base de recettes en utilisant les noms
des fichiers MEGA et en générant des descriptions réalistes.

Objectif: Passer de 442 à ~800-1000 recettes de qualité.
"""

import re
import json
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Set, Tuple

class RecipeEnricher:
    """Enrichit la base de recettes en complétant les placeholders MEGA"""
    
    def __init__(self):
        self.recipes = []
        self.existing_names = set()
        
        # Patterns de recettes à exclure (mêmes que cleanup)
        self.exclude_patterns = [
            r'kiwi|café|chocolat|thé fumé|fleurs comestibles',
            r'festif|express|fusion|hybride|surprise|créatif|expérimental',
            r'détox',
            r'rapide$',
            r'crémeuse?$',
            r'légère?$',
            r'champenoise|lilloise|vosgienne|poitevine|berrichonne|charentaise',
            r'cognac|porto|champagne|vin rouge|vin blanc|cidre',
            r'rustique$',
            r'^Bouillon ',
            r'^Beurre ',
            r'^Vinaigrette ',
            r'^Fond ',
            r'fine$',  # Tarte fine, etc.
        ]
        
        # Limites par catégorie (plus généreuses que cleanup)
        self.category_limits = {
            'Soupe': 50,
            'Velouté': 30,
            'Tarte': 60,
            'Feuilleté': 35,
            'Burger': 30,
            'Wrap': 25,
            'Gratin': 35,
            'Risotto': 20,
            'Salade': 35,
            'Beignets': 20,
            'Cake': 25,
            'Poulet grillé': 20,
            'Poulet rôti': 20,
            'Steak': 15,
            'Entrecôte': 10,
            'Bavette': 10,
            'Pizza': 30,
            'Quiche': 25,
        }
        
    def extract_recipes_from_mega(self, sql_file: Path) -> List[Dict]:
        """Extrait les noms de recettes d'un fichier MEGA"""
        recipes = []
        
        with open(sql_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern: INSERT INTO recipes (name, role, description)
        # VALUES ('Nom de recette', 'ROLE', 'Description')
        pattern = r"VALUES\s*\('([^']+)',\s*'([^']+)',\s*'[^']+'\)"
        
        matches = re.finditer(pattern, content, re.MULTILINE)
        
        for match in matches:
            recipe = {
                'name': match.group(1),
                'role': match.group(2),
                'description': '',  # Sera généré
                'source_file': sql_file.name
            }
            recipes.append(recipe)
        
        return recipes
    
    def should_exclude(self, recipe: Dict) -> Tuple[bool, str]:
        """Détermine si une recette doit être exclue"""
        name = recipe['name']
        
        # 1. Vérifier si doublon avec base existante
        if name in self.existing_names:
            return True, "doublon_existant"
        
        # 2. Vérifier patterns farfelus
        for pattern in self.exclude_patterns:
            if re.search(pattern, name, re.IGNORECASE):
                return True, f"pattern_exclude"
        
        # 3. Vérifier longueur du nom (trop long = variation bizarre)
        if len(name) > 80:
            return True, "nom_trop_long"
        
        # 4. Vérifier combinaisons farfelues spécifiques
        farfelu_combos = [
            (r'poulet', r'(kiwi|café|chocolat|curry banane|curry cacao)'),
            (r'bœuf|agneau|veau', r'(kiwi|café|chocolat)'),
            (r'poisson|thon|saumon', r'(chocolat|café)'),
        ]
        
        for meat, weird in farfelu_combos:
            if re.search(meat, name, re.IGNORECASE) and re.search(weird, name, re.IGNORECASE):
                return True, "combinaison_farfelue"
        
        return False, ""
    
    def categorize_recipe(self, recipe: Dict) -> str:
        """Détermine la catégorie d'une recette"""
        name = recipe['name']
        
        for category in self.category_limits.keys():
            if name.startswith(category):
                return category
        
        return "Autre"
    
    def generate_description(self, recipe: Dict) -> str:
        """Génère une description réaliste basée sur le nom de la recette"""
        name = recipe['name']
        role = recipe['role']
        
        # Templates par rôle
        if role == 'PLAT_PRINCIPAL':
            return self._generate_main_dish_description(name)
        elif role == 'ENTREE':
            return self._generate_starter_description(name)
        elif role == 'DESSERT':
            return self._generate_dessert_description(name)
        elif role == 'ACCOMPAGNEMENT':
            return self._generate_side_description(name)
        
        return f"Recette de {name.lower()}."
    
    def _generate_main_dish_description(self, name: str) -> str:
        """Génère description pour un plat principal"""
        name_lower = name.lower()
        
        # Détecter viandes
        if any(meat in name_lower for meat in ['poulet', 'volaille', 'dinde', 'canard']):
            base = "Délicieux plat de volaille"
        elif any(meat in name_lower for meat in ['bœuf', 'veau', 'agneau']):
            base = "Savoureuse préparation de viande"
        elif any(fish in name_lower for fish in ['poisson', 'saumon', 'thon', 'cabillaud', 'bar', 'sole']):
            base = "Recette de poisson"
        elif 'végétarien' in name_lower or 'légumes' in name_lower:
            base = "Plat végétarien équilibré"
        else:
            base = "Plat principal savoureux"
        
        # Détecter technique
        if 'grillé' in name_lower:
            technique = "grillé à la perfection"
        elif 'rôti' in name_lower:
            technique = "rôti au four"
        elif 'poêlé' in name_lower:
            technique = "poêlé avec soin"
        elif 'mijoté' in name_lower or 'braisé' in name_lower:
            technique = "mijoté longuement pour plus de tendreté"
        elif 'vapeur' in name_lower:
            technique = "cuit à la vapeur pour préserver les saveurs"
        else:
            technique = "préparé avec attention"
        
        # Détecter sauce/garniture
        sauce = ""
        if 'sauce' in name_lower:
            sauce = ", accompagné de sa sauce signature"
        elif 'curry' in name_lower:
            sauce = ", relevé d'épices curry"
        elif 'moutarde' in name_lower:
            sauce = ", nappé d'une sauce à la moutarde"
        elif 'vin' in name_lower:
            sauce = ", mijoté dans une sauce au vin"
        elif 'crème' in name_lower:
            sauce = ", agrémenté d'une sauce crémeuse"
        
        return f"{base} {technique}{sauce}. Parfait pour un repas convivial."
    
    def _generate_starter_description(self, name: str) -> str:
        """Génère description pour une entrée"""
        name_lower = name.lower()
        
        if 'soupe' in name_lower or 'velouté' in name_lower:
            return f"Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur."
        elif 'salade' in name_lower:
            return f"Salade fraîche et croquante, parfaite pour une entrée légère et équilibrée."
        elif 'tarte' in name_lower or 'quiche' in name_lower:
            return f"Entrée gourmande à base de pâte croustillante. Se déguste chaude ou tiède."
        else:
            return f"Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide."
    
    def _generate_dessert_description(self, name: str) -> str:
        """Génère description pour un dessert"""
        name_lower = name.lower()
        
        if 'tarte' in name_lower:
            return f"Dessert gourmand avec une pâte croustillante. Parfait pour terminer un repas en beauté."
        elif 'gâteau' in name_lower or 'cake' in name_lower:
            return f"Gâteau moelleux et savoureux. Idéal pour le goûter ou un dessert gourmand."
        elif 'mousse' in name_lower or 'crème' in name_lower:
            return f"Dessert léger et onctueux. Une touche de douceur pour finir le repas."
        elif 'glace' in name_lower or 'sorbet' in name_lower:
            return f"Dessert glacé rafraîchissant. Parfait pour les beaux jours."
        else:
            return f"Dessert délicieux pour conclure le repas sur une note sucrée."
    
    def _generate_side_description(self, name: str) -> str:
        """Génère description pour un accompagnement"""
        name_lower = name.lower()
        
        if 'purée' in name_lower:
            return f"Accompagnement onctueux et réconfortant. Se marie parfaitement avec viandes et poissons."
        elif 'gratin' in name_lower:
            return f"Accompagnement gratinéau four, doré et croustillant. Idéal avec un plat principal."
        elif 'riz' in name_lower or 'pâtes' in name_lower:
            return f"Accompagnement de féculents pour compléter votre plat principal."
        elif 'légumes' in name_lower:
            return f"Accompagnement de légumes frais et savoureux. Apporte couleur et vitamines au repas."
        else:
            return f"Accompagnement savoureux pour sublimer votre plat principal."
    
    def process_all_mega_files(self, mega_dir: Path, target_count: int = 600) -> List[Dict]:
        """Traite tous les fichiers MEGA et sélectionne les meilleures recettes"""
        print(f"🔍 Analyse des fichiers MEGA dans {mega_dir}...")
        
        # 1. Extraire toutes les recettes
        all_recipes = []
        mega_files = sorted(mega_dir.glob("add_recipes_MEGA_*.sql"))
        
        print(f"📁 Trouvé {len(mega_files)} fichiers MEGA")
        
        for sql_file in mega_files:
            recipes = self.extract_recipes_from_mega(sql_file)
            all_recipes.extend(recipes)
            print(f"  ✓ {sql_file.name}: {len(recipes)} recettes")
        
        print(f"\n✅ Total extrait: {len(all_recipes)} recettes")
        
        # 2. Filtrer selon critères de qualité
        print("\n🔬 Application des filtres de qualité...")
        
        filtered = []
        exclusion_reasons = Counter()
        category_counts = Counter()
        
        for recipe in all_recipes:
            # Vérifier exclusion
            should_exclude, reason = self.should_exclude(recipe)
            
            if should_exclude:
                exclusion_reasons[reason] += 1
                continue
            
            # Vérifier limite de catégorie
            category = self.categorize_recipe(recipe)
            if category in self.category_limits:
                if category_counts[category] >= self.category_limits[category]:
                    exclusion_reasons[f"limite_{category}"] += 1
                    continue
            
            # Recette acceptée
            filtered.append(recipe)
            category_counts[category] += 1
            self.existing_names.add(recipe['name'])
        
        print(f"\n📊 Résultats du filtrage:")
        print(f"   ✅ Recettes acceptées: {len(filtered)}")
        print(f"   ❌ Recettes rejetées: {len(all_recipes) - len(filtered)}")
        
        print(f"\n📋 Top 10 raisons d'exclusion:")
        for reason, count in exclusion_reasons.most_common(10):
            print(f"   • {reason}: {count}")
        
        # 3. Équilibrer par rôle
        print(f"\n⚖️  Équilibrage pour ~{target_count} recettes...")
        
        by_role = defaultdict(list)
        for recipe in filtered:
            by_role[recipe['role']].append(recipe)
        
        # Distribution cible: 60% plats, 15% entrées, 15% desserts, 10% accompagnements
        target_distribution = {
            'PLAT_PRINCIPAL': int(target_count * 0.60),
            'ENTREE': int(target_count * 0.15),
            'DESSERT': int(target_count * 0.15),
            'ACCOMPAGNEMENT': int(target_count * 0.10),
        }
        
        balanced = []
        for role, target in target_distribution.items():
            available = by_role.get(role, [])
            selected = available[:target]
            balanced.extend(selected)
            print(f"   • {role}: {len(selected)}/{len(available)} sélectionnées")
        
        print(f"\n✅ Total sélectionné: {len(balanced)} recettes")
        
        # 4. Générer descriptions
        print(f"\n📝 Génération des descriptions...")
        for i, recipe in enumerate(balanced):
            recipe['description'] = self.generate_description(recipe)
            if (i + 1) % 100 == 0:
                print(f"   ✓ {i + 1}/{len(balanced)} descriptions générées")
        
        print(f"   ✅ Toutes les descriptions générées!")
        
        return balanced
    
    def generate_sql_insert(self, recipes: List[Dict], output_file: Path):
        """Génère le SQL d'insertion"""
        print(f"\n📄 Génération du SQL dans {output_file}...")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("-- ========================================================================\n")
            f.write("-- ENRICHISSEMENT DE LA BASE AVEC RECETTES MEGA COMPLÉTÉES\n")
            f.write(f"-- Total: {len(recipes)} nouvelles recettes avec descriptions réalistes\n")
            f.write("-- ========================================================================\n\n")
            
            f.write("BEGIN;\n\n")
            
            # Grouper par rôle
            by_role = defaultdict(list)
            for recipe in recipes:
                by_role[recipe['role']].append(recipe)
            
            for role, role_recipes in sorted(by_role.items()):
                f.write(f"-- ========================================================================\n")
                f.write(f"-- {role} ({len(role_recipes)} recettes)\n")
                f.write(f"-- ========================================================================\n\n")
                
                for recipe in role_recipes:
                    # Échapper les apostrophes
                    name = recipe['name'].replace("'", "''")
                    description = recipe['description'].replace("'", "''")
                    
                    f.write(f"-- {name}\n")
                    f.write(f"INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)\n")
                    f.write(f"VALUES ('{name}', '{recipe['role']}', '{description}', 30, 30, 4)\n")
                    f.write(f"ON CONFLICT (name) DO NOTHING;\n\n")
            
            f.write("COMMIT;\n\n")
            
            # Vérification finale
            f.write("-- ========================================================================\n")
            f.write("-- VÉRIFICATION FINALE\n")
            f.write("-- ========================================================================\n\n")
            f.write("SELECT \n")
            f.write("  'ENRICHISSEMENT TERMINÉ' as message,\n")
            f.write("  COUNT(*) as total_recettes,\n")
            f.write("  COUNT(*) FILTER (WHERE role = 'PLAT_PRINCIPAL') as plats_principaux,\n")
            f.write("  COUNT(*) FILTER (WHERE role = 'ENTREE') as entrees,\n")
            f.write("  COUNT(*) FILTER (WHERE role = 'DESSERT') as desserts,\n")
            f.write("  COUNT(*) FILTER (WHERE role = 'ACCOMPAGNEMENT') as accompagnements,\n")
            f.write("  COUNT(*) FILTER (WHERE description LIKE '%À compléter%') as incompletes\n")
            f.write("FROM recipes;\n\n")
            
            f.write("-- Quelques exemples\n")
            f.write("SELECT name, role, LEFT(description, 80) as description_preview\n")
            f.write("FROM recipes\n")
            f.write("ORDER BY id DESC\n")
            f.write("LIMIT 20;\n")
        
        print(f"✅ SQL généré!")
    
    def save_report(self, recipes: List[Dict], report_file: Path):
        """Sauvegarde un rapport détaillé"""
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("# RAPPORT D'ENRICHISSEMENT DES RECETTES\n\n")
            f.write(f"**Total sélectionné**: {len(recipes)} nouvelles recettes\n\n")
            
            # Stats par rôle
            by_role = defaultdict(list)
            for recipe in recipes:
                by_role[recipe['role']].append(recipe)
            
            f.write("## Distribution par rôle\n\n")
            for role, role_recipes in sorted(by_role.items()):
                f.write(f"- **{role}**: {len(role_recipes)} recettes\n")
            
            f.write("\n## Exemples de recettes enrichies\n\n")
            for role, role_recipes in sorted(by_role.items()):
                f.write(f"### {role}\n\n")
                for recipe in role_recipes[:5]:
                    f.write(f"**{recipe['name']}**\n")
                    f.write(f"> {recipe['description']}\n\n")
        
        print(f"✅ Rapport généré: {report_file}")


def main():
    """Point d'entrée principal"""
    print("=" * 80)
    print("ENRICHISSEMENT DE LA BASE AVEC RECETTES MEGA")
    print("=" * 80)
    
    mega_dir = Path("/workspaces/garde-manger-app/tools")
    output_sql = mega_dir / "enrich_recipes_with_mega.sql"
    output_report = mega_dir / "enrichment_report.md"
    
    enricher = RecipeEnricher()
    
    # NOTE: Charger les noms existants depuis la DB
    # Pour l'instant simulé - sera connecté à la DB
    print("\n⚠️  Note: Les 442 recettes existantes seront chargées depuis la DB")
    
    # Traiter les fichiers MEGA (objectif: +600 recettes)
    selected_recipes = enricher.process_all_mega_files(mega_dir, target_count=600)
    
    # Générer le SQL
    enricher.generate_sql_insert(selected_recipes, output_sql)
    
    # Générer le rapport
    enricher.save_report(selected_recipes, output_report)
    
    print("\n" + "=" * 80)
    print(f"✅ TERMINÉ!")
    print(f"   → SQL d'enrichissement: {output_sql}")
    print(f"   → Rapport: {output_report}")
    print(f"   → Nouvelles recettes: {len(selected_recipes)}")
    print(f"   → Total final prévu: 442 + {len(selected_recipes)} = {442 + len(selected_recipes)} recettes")
    print("=" * 80)


if __name__ == "__main__":
    main()
