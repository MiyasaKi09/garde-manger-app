#!/usr/bin/env python3
"""
Script pour analyser les 7610 recettes des fichiers MEGA et sélectionner
les meilleures pour enrichir notre encyclopédie de recettes.

Objectif: Passer de 442 recettes à ~1000-1200 recettes de haute qualité.
"""

import re
import json
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Set, Tuple

class RecipeAnalyzer:
    """Analyse et filtre les recettes des fichiers MEGA"""
    
    def __init__(self):
        self.recipes = []
        self.existing_names = set()
        self.stats = defaultdict(int)
        
        # Patterns de recettes à exclure
        self.exclude_patterns = [
            r'À compléter',
            r'à compléter',
            r'festif|express|fusion|hybride|surprise|créatif|expérimental',
            r'poulet.*(kiwi|café|chocolat|thé fumé|fleurs comestibles)',
            r'(bœuf|agneau|veau).*(kiwi|café|chocolat)',
            r'rapide$',
            r'crémeuse?$',
            r'légère?$',
            r'détox',
            r'^Bouillon ',
            r'^Beurre ',
            r'^Vinaigrette ',
            r'^Fond ',
        ]
        
        # Limites par catégorie
        self.category_limits = {
            'Soupe': 40,
            'Velouté': 25,
            'Tarte': 50,
            'Feuilleté': 30,
            'Burger': 25,
            'Wrap': 20,
            'Gratin': 30,
            'Risotto': 15,
            'Salade': 30,
            'Beignets': 15,
            'Cake': 20,
            'Poulet grillé': 15,
            'Poulet rôti': 15,
        }
        
    def load_existing_recipes(self, connection_id: str):
        """Charge les noms des recettes existantes pour éviter doublons"""
        # Cette fonction sera appelée après connexion DB
        print("📖 Chargement des 442 recettes existantes...")
        self.existing_names = set()
        
    def extract_recipes_from_sql(self, sql_file: Path) -> List[Dict]:
        """Extrait les recettes d'un fichier SQL MEGA"""
        recipes = []
        
        with open(sql_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern pour extraire les INSERT INTO recipes
        # Format: INSERT INTO recipes (name, description, role, preparation_time, cooking_time, servings)
        # VALUES ('name', 'description', 'ROLE', time, time, servings);
        
        pattern = r"VALUES\s*\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*(\d+)\)"
        
        matches = re.finditer(pattern, content, re.MULTILINE)
        
        for match in matches:
            recipe = {
                'name': match.group(1),
                'description': match.group(2),
                'role': match.group(3),
                'preparation_time': int(match.group(4)),
                'cooking_time': int(match.group(5)),
                'servings': int(match.group(6)),
                'source_file': sql_file.name
            }
            recipes.append(recipe)
        
        return recipes
    
    def should_exclude(self, recipe: Dict) -> Tuple[bool, str]:
        """Détermine si une recette doit être exclue et pourquoi"""
        name = recipe['name']
        description = recipe['description']
        
        # 1. Vérifier si doublon avec base existante
        if name in self.existing_names:
            return True, "doublon_existant"
        
        # 2. Vérifier description vide ou "À compléter"
        if not description or len(description.strip()) < 20:
            return True, "description_vide"
        
        if 'À compléter' in description or 'à compléter' in description:
            return True, "description_incomplete"
        
        # 3. Vérifier patterns farfelus
        combined_text = f"{name} {description}"
        for pattern in self.exclude_patterns:
            if re.search(pattern, combined_text, re.IGNORECASE):
                return True, f"pattern_{pattern[:20]}"
        
        # 4. Vérifier longueur du nom (trop long = probablement variation bizarre)
        if len(name) > 80:
            return True, "nom_trop_long"
        
        return False, ""
    
    def categorize_recipe(self, recipe: Dict) -> str:
        """Détermine la catégorie d'une recette pour application des limites"""
        name = recipe['name']
        
        for category in self.category_limits.keys():
            if name.startswith(category):
                return category
        
        return "Autre"
    
    def analyze_all_mega_files(self, mega_dir: Path) -> List[Dict]:
        """Analyse tous les fichiers MEGA et retourne recettes candidates"""
        print(f"🔍 Analyse des fichiers MEGA dans {mega_dir}...")
        
        all_recipes = []
        mega_files = sorted(mega_dir.glob("add_recipes_MEGA_*.sql"))
        
        print(f"📁 Trouvé {len(mega_files)} fichiers MEGA")
        
        for sql_file in mega_files:
            print(f"  ⚙️  Traitement de {sql_file.name}...")
            recipes = self.extract_recipes_from_sql(sql_file)
            all_recipes.extend(recipes)
            print(f"     → {len(recipes)} recettes extraites")
        
        print(f"\n✅ Total extrait: {len(all_recipes)} recettes")
        return all_recipes
    
    def filter_recipes(self, recipes: List[Dict]) -> List[Dict]:
        """Filtre les recettes selon critères de qualité"""
        print("\n🔬 Application des filtres de qualité...")
        
        filtered = []
        exclusion_reasons = Counter()
        category_counts = Counter()
        
        for recipe in recipes:
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
            self.existing_names.add(recipe['name'])  # Éviter doublons internes
        
        print(f"\n📊 Résultats du filtrage:")
        print(f"   ✅ Recettes acceptées: {len(filtered)}")
        print(f"   ❌ Recettes rejetées: {len(recipes) - len(filtered)}")
        print(f"\n📋 Raisons d'exclusion:")
        for reason, count in exclusion_reasons.most_common():
            print(f"   • {reason}: {count}")
        
        print(f"\n📈 Distribution par catégorie:")
        for category, count in category_counts.most_common(20):
            limit = self.category_limits.get(category, "∞")
            print(f"   • {category}: {count}/{limit}")
        
        return filtered
    
    def balance_selection(self, recipes: List[Dict], target: int = 600) -> List[Dict]:
        """Équilibre la sélection finale par rôle"""
        print(f"\n⚖️  Équilibrage pour atteindre ~{target} recettes...")
        
        # Grouper par rôle
        by_role = defaultdict(list)
        for recipe in recipes:
            by_role[recipe['role']].append(recipe)
        
        print(f"\n📊 Distribution actuelle:")
        for role, role_recipes in by_role.items():
            print(f"   • {role}: {len(role_recipes)}")
        
        # Objectif: 60% plats, 15% entrées, 15% desserts, 10% accompagnements
        target_distribution = {
            'PLAT_PRINCIPAL': int(target * 0.60),
            'ENTREE': int(target * 0.15),
            'DESSERT': int(target * 0.15),
            'ACCOMPAGNEMENT': int(target * 0.10),
        }
        
        balanced = []
        for role, target_count in target_distribution.items():
            available = by_role.get(role, [])
            selected = available[:target_count]
            balanced.extend(selected)
            print(f"   ✓ {role}: sélection de {len(selected)}/{len(available)}")
        
        print(f"\n✅ Total après équilibrage: {len(balanced)} recettes")
        return balanced
    
    def generate_sql_insert(self, recipes: List[Dict], output_file: Path):
        """Génère le SQL d'insertion pour les recettes sélectionnées"""
        print(f"\n📝 Génération du SQL dans {output_file}...")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("-- ========================================================================\n")
            f.write("-- IMPORT SÉLECTIF DE RECETTES DE QUALITÉ DEPUIS FICHIERS MEGA\n")
            f.write(f"-- Total: {len(recipes)} recettes\n")
            f.write("-- ========================================================================\n\n")
            
            f.write("BEGIN;\n\n")
            
            # Grouper par rôle pour organisation
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
                    
                    f.write(f"INSERT INTO recipes (name, description, role, preparation_time, cooking_time, servings)\n")
                    f.write(f"VALUES ('{name}', '{description}', '{recipe['role']}', ")
                    f.write(f"{recipe['preparation_time']}, {recipe['cooking_time']}, {recipe['servings']})\n")
                    f.write(f"ON CONFLICT (name) DO NOTHING;  -- Éviter doublons\n\n")
            
            f.write("COMMIT;\n\n")
            
            # Requête de vérification finale
            f.write("-- ========================================================================\n")
            f.write("-- VÉRIFICATION FINALE\n")
            f.write("-- ========================================================================\n\n")
            f.write("SELECT \n")
            f.write("  'IMPORT TERMINÉ' as message,\n")
            f.write("  COUNT(*) as total_recettes,\n")
            f.write("  COUNT(*) FILTER (WHERE role = 'PLAT_PRINCIPAL') as plats_principaux,\n")
            f.write("  COUNT(*) FILTER (WHERE role = 'ENTREE') as entrees,\n")
            f.write("  COUNT(*) FILTER (WHERE role = 'DESSERT') as desserts,\n")
            f.write("  COUNT(*) FILTER (WHERE role = 'ACCOMPAGNEMENT') as accompagnements\n")
            f.write("FROM recipes;\n")
        
        print(f"✅ SQL généré: {output_file}")
    
    def save_report(self, recipes: List[Dict], report_file: Path):
        """Sauvegarde un rapport détaillé des recettes sélectionnées"""
        print(f"\n📊 Génération du rapport dans {report_file}...")
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("# RAPPORT DE SÉLECTION DES RECETTES MEGA\n\n")
            f.write(f"**Total sélectionné**: {len(recipes)} recettes\n\n")
            
            # Stats par rôle
            by_role = defaultdict(list)
            for recipe in recipes:
                by_role[recipe['role']].append(recipe)
            
            f.write("## Distribution par rôle\n\n")
            for role, role_recipes in sorted(by_role.items()):
                f.write(f"- **{role}**: {len(role_recipes)} recettes\n")
            
            # Stats par catégorie
            f.write("\n## Distribution par catégorie\n\n")
            category_counts = Counter()
            for recipe in recipes:
                category = self.categorize_recipe(recipe)
                category_counts[category] += 1
            
            for category, count in category_counts.most_common():
                f.write(f"- **{category}**: {count} recettes\n")
            
            # Exemples
            f.write("\n## Exemples de recettes sélectionnées\n\n")
            for role, role_recipes in sorted(by_role.items()):
                f.write(f"### {role}\n\n")
                for recipe in role_recipes[:10]:  # 10 exemples max
                    f.write(f"- **{recipe['name']}**: {recipe['description'][:100]}...\n")
                f.write("\n")
        
        print(f"✅ Rapport généré: {report_file}")


def main():
    """Point d'entrée principal"""
    print("=" * 80)
    print("SÉLECTION INTELLIGENTE DE RECETTES DEPUIS FICHIERS MEGA")
    print("=" * 80)
    
    # Chemins
    mega_dir = Path("/workspaces/garde-manger-app/tools")
    output_sql = mega_dir / "import_selected_recipes.sql"
    output_report = mega_dir / "import_selection_report.md"
    
    # Analyser
    analyzer = RecipeAnalyzer()
    
    # NOTE: Pour charger les recettes existantes, il faudrait connexion DB
    # Pour l'instant, on va extraire les noms du cleanup_recipes.sql
    print("\n⚠️  Note: Les noms des 442 recettes existantes seront chargés depuis la DB")
    
    # Extraire toutes les recettes des MEGA
    all_recipes = analyzer.analyze_all_mega_files(mega_dir)
    
    # Filtrer selon critères de qualité
    filtered_recipes = analyzer.filter_recipes(all_recipes)
    
    # Équilibrer la sélection (objectif ~600 recettes)
    selected_recipes = analyzer.balance_selection(filtered_recipes, target=600)
    
    # Générer le SQL d'insertion
    analyzer.generate_sql_insert(selected_recipes, output_sql)
    
    # Générer le rapport
    analyzer.save_report(selected_recipes, output_report)
    
    print("\n" + "=" * 80)
    print(f"✅ TERMINÉ!")
    print(f"   → SQL d'import: {output_sql}")
    print(f"   → Rapport: {output_report}")
    print(f"   → Recettes sélectionnées: {len(selected_recipes)}")
    print(f"   → Total final prévu: 442 + {len(selected_recipes)} = {442 + len(selected_recipes)} recettes")
    print("=" * 80)


if __name__ == "__main__":
    main()
