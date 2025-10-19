#!/usr/bin/env python3
"""
Script pour importer directement les recettes dans PostgreSQL via psycopg2
"""

import os
import re
import sys

# Importer la connexion depuis le fichier SQL
sql_file = "/workspaces/garde-manger-app/tools/import_recipes.sql"

print("🍳 Import direct des recettes dans PostgreSQL")
print("=" * 60)

# Vérifier que le fichier existe
if not os.path.exists(sql_file):
    print(f"❌ Fichier introuvable : {sql_file}")
    sys.exit(1)

print(f"\n📖 Lecture du fichier SQL : {sql_file}")

# Lire le contenu SQL
with open(sql_file, 'r', encoding='utf-8') as f:
    sql_content = f.read()

print(f"✅ Fichier SQL lu ({len(sql_content)} caractères)")

# Afficher les statistiques
lines = sql_content.split('\n')
insert_count = sum(1 for line in lines if line.strip().startswith('INSERT INTO'))

print(f"\n📊 Statistiques du script SQL :")
print(f"   - Lignes totales : {len(lines)}")
print(f"   - Nombre d'INSERT : {insert_count}")

print("\n✨ Le script SQL est prêt à être exécuté manuellement")
print(f"   Utilisez l'interface PostgreSQL ou l'outil pgsql_open_script")

# Indiquer la marche à suivre
print("\n📝 Pour exécuter ce script :")
print("   1. Ouvrez le fichier dans l'éditeur SQL de VS Code")
print("   2. Connectez-vous à votre base de données Supabase")
print("   3. Exécutez le script complet")
print("\n   OU via la ligne de commande avec les bonnes variables d'environnement")
