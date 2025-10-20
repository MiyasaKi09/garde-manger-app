#!/usr/bin/env python3
"""
Script pour exécuter l'import des 600 recettes via une connexion PostgreSQL.
"""

import os
import re
from pathlib import Path

def main():
    """Exécute le SQL d'import"""
    sql_file = Path("/workspaces/garde-manger-app/tools/enrich_recipes_with_mega.sql")
    
    print("=" * 80)
    print("IMPORT DES 600 NOUVELLES RECETTES")
    print("=" * 80)
    
    # Lire le fichier SQL
    print(f"\n📖 Lecture du fichier SQL...")
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Compter les INSERT
    insert_count = sql_content.count("INSERT INTO recipes")
    print(f"✅ {insert_count} recettes à importer")
    
    # Vérifier la connexion
    database_url = os.environ.get('DATABASE_URL_TX')
    if not database_url:
        print("\n❌ Variable DATABASE_URL_TX non trouvée!")
        print("💡 Chargement depuis .env.local...")
        
        env_file = Path("/workspaces/garde-manger-app/.env.local")
        if env_file.exists():
            with open(env_file, 'r') as f:
                for line in f:
                    if line.startswith('DATABASE_URL_TX='):
                        database_url = line.split('=', 1)[1].strip().strip('"').strip("'")
                        os.environ['DATABASE_URL_TX'] = database_url
                        print(f"✅ DATABASE_URL_TX chargé")
                        break
    
    if not database_url:
        print("\n❌ Impossible de trouver DATABASE_URL_TX")
        print("📋 Instructions manuelles :")
        print(f"   psql \"$DATABASE_URL_TX\" -f {sql_file}")
        return
    
    # Exécuter via psql
    print(f"\n🚀 Exécution de l'import...")
    print(f"   Fichier: {sql_file}")
    print(f"   Durée estimée: ~30 secondes")
    
    import subprocess
    result = subprocess.run(
        ['psql', database_url, '-v', 'ON_ERROR_STOP=1', '-f', str(sql_file)],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("\n✅ IMPORT RÉUSSI!")
        
        # Extraire les stats du résultat
        if "ENRICHISSEMENT TERMINÉ" in result.stdout:
            print("\n📊 Résultats:")
            for line in result.stdout.split('\n'):
                if any(word in line for word in ['total_recettes', 'plats', 'entrees', 'desserts', 'accompagnements']):
                    print(f"   {line}")
    else:
        print(f"\n❌ ERREUR lors de l'import:")
        print(result.stderr)
        return 1
    
    print("\n" + "=" * 80)
    print("✅ TERMINÉ!")
    print("=" * 80)
    
    return 0

if __name__ == "__main__":
    exit(main())
