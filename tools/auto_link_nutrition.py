#!/usr/bin/env python3
"""
Script pour lier automatiquement canonical_foods et archetypes aux codes Ciqual
en utilisant le mapping existant + fuzzy matching intelligent
"""
import csv
import os
import sys
from difflib import SequenceMatcher

# Configuration
MAPPING_FILE = 'data/mapping_canonical_ciqual.csv'
MIN_SIMILARITY = 0.75  # Seuil de confiance pour le matching automatique

def normalize(text):
    """Normalise un texte pour le matching"""
    if not text:
        return ""
    text = text.lower().strip()
    # Retirer pluriels, accents simplifiés
    replacements = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ù': 'u', 'û': 'u', 'ü': 'u',
        'ô': 'o', 'ö': 'o',
        'î': 'i', 'ï': 'i',
        'ç': 'c',
        's ': ' ',  # pluriel simple
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

def similarity(a, b):
    """Calcule similarité entre deux textes"""
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()

def load_ciqual_mapping():
    """Charge le mapping Ciqual depuis le CSV"""
    mapping = {}
    print(f"📖 Chargement de {MAPPING_FILE}...")
    
    with open(MAPPING_FILE, 'r', encoding='iso-8859-1') as f:
        reader = csv.reader(f, delimiter=';')
        headers = next(reader)  # Skip header
        
        for row in reader:
            if len(row) < 8:
                continue
            
            code = row[6]  # alim_code
            nom = row[7]   # alim_nom_fr
            
            if code and nom:
                mapping[code] = nom
    
    print(f"✅ {len(mapping)} aliments Ciqual chargés")
    return mapping

def get_db_connection():
    """Obtient connexion DB depuis environnement"""
    db_url = os.getenv('DATABASE_URL_TX')
    if not db_url:
        print("❌ DATABASE_URL_TX non trouvée")
        sys.exit(1)
    
    # Remplacer pooler par connexion directe
    db_url = db_url.replace('pooler.supabase.com:6543', 'supabase.co:5432')
    
    try:
        import psycopg2
    except ImportError:
        print("⏳ Installation de psycopg2...")
        import subprocess
        subprocess.check_call(['pip', 'install', '-q', 'psycopg2-binary'])
        import psycopg2
    
    return psycopg2.connect(db_url)

def find_best_match(food_name, ciqual_mapping, threshold=MIN_SIMILARITY):
    """Trouve le meilleur match Ciqual pour un aliment"""
    best_score = 0
    best_code = None
    best_name = None
    
    for code, name in ciqual_mapping.items():
        score = similarity(food_name, name)
        if score > best_score:
            best_score = score
            best_code = code
            best_name = name
    
    if best_score >= threshold:
        return best_code, best_name, best_score
    return None, None, 0

def link_canonical_foods(conn, ciqual_mapping, dry_run=False):
    """Lie les canonical_foods aux codes Ciqual"""
    cursor = conn.cursor()
    
    # Récupérer canonical_foods sans nutrition_id
    cursor.execute("""
        SELECT id, canonical_name 
        FROM canonical_foods 
        WHERE nutrition_id IS NULL
        ORDER BY canonical_name
    """)
    
    foods = cursor.fetchall()
    print(f"\n🔍 Analyse de {len(foods)} canonical_foods non liés...")
    
    matches = []
    no_matches = []
    
    for food_id, food_name in foods:
        code, ciqual_name, score = find_best_match(food_name, ciqual_mapping)
        
        if code:
            # Vérifier que le code existe dans nutritional_data
            cursor.execute("""
                SELECT id FROM nutritional_data 
                WHERE source_id = %s
            """, (code,))
            
            result = cursor.fetchone()
            if result:
                nutrition_id = result[0]
                matches.append({
                    'food_id': food_id,
                    'food_name': food_name,
                    'ciqual_code': code,
                    'ciqual_name': ciqual_name,
                    'nutrition_id': nutrition_id,
                    'score': score
                })
            else:
                no_matches.append((food_name, f"Code {code} introuvable dans nutritional_data"))
        else:
            no_matches.append((food_name, "Aucun match trouvé"))
    
    print(f"\n✅ Correspondances trouvées : {len(matches)}")
    print(f"❌ Non trouvés : {len(no_matches)}")
    
    if not dry_run and matches:
        print("\n⏳ Application des liens...")
        for match in matches:
            cursor.execute("""
                UPDATE canonical_foods 
                SET nutrition_id = %s
                WHERE id = %s
            """, (match['nutrition_id'], match['food_id']))
            
            if match['score'] < 0.9:  # Afficher les matchs incertains
                print(f"  ⚠️  {match['food_name']} → {match['ciqual_name']} (score: {match['score']:.2f})")
        
        conn.commit()
        print(f"✅ {len(matches)} canonical_foods liés")
    
    # Afficher quelques exemples
    if matches:
        print("\n📊 Exemples de liens créés:")
        for match in matches[:10]:
            print(f"  • {match['food_name']:30} → {match['ciqual_name']:40} ({match['score']:.0%})")
    
    if no_matches and len(no_matches) <= 20:
        print(f"\n❌ Aliments non liés ({len(no_matches)}):")
        for food_name, reason in no_matches[:20]:
            print(f"  • {food_name:30} ({reason})")
    
    cursor.close()
    return len(matches), len(no_matches)

def link_archetypes(conn, ciqual_mapping, dry_run=False):
    """Lie les archetypes via leur canonical_food ou par matching direct"""
    cursor = conn.cursor()
    
    print(f"\n🔍 Analyse des archetypes...")
    
    # 1. Hériter du canonical_food si possible
    cursor.execute("""
        UPDATE archetypes a
        SET nutrition_modifier_id = (
            SELECT cf.nutrition_id 
            FROM canonical_foods cf 
            WHERE cf.id = a.canonical_food_id
        )
        WHERE a.canonical_food_id IS NOT NULL
          AND a.nutrition_modifier_id IS NULL
          AND EXISTS (
              SELECT 1 FROM canonical_foods cf 
              WHERE cf.id = a.canonical_food_id 
                AND cf.nutrition_id IS NOT NULL
          )
    """)
    
    inherited = cursor.rowcount
    conn.commit()
    
    print(f"✅ {inherited} archetypes hérités de leur canonical_food")
    
    # 2. Matching direct pour les archetypes sans canonical_food
    cursor.execute("""
        SELECT id, name 
        FROM archetypes 
        WHERE nutrition_modifier_id IS NULL
          AND (canonical_food_id IS NULL 
               OR NOT EXISTS (
                   SELECT 1 FROM canonical_foods cf 
                   WHERE cf.id = archetypes.canonical_food_id 
                     AND cf.nutrition_id IS NOT NULL
               ))
        ORDER BY name
    """)
    
    orphans = cursor.fetchall()
    print(f"🔍 {len(orphans)} archetypes orphelins à matcher...")
    
    matches = 0
    for archetype_id, archetype_name in orphans[:50]:  # Limiter pour éviter trop de matchs incertains
        code, ciqual_name, score = find_best_match(archetype_name, ciqual_mapping, threshold=0.85)
        
        if code and score >= 0.85:
            cursor.execute("""
                SELECT id FROM nutritional_data WHERE source_id = %s
            """, (code,))
            
            result = cursor.fetchone()
            if result:
                nutrition_id = result[0]
                
                if not dry_run:
                    cursor.execute("""
                        UPDATE archetypes 
                        SET nutrition_modifier_id = %s
                        WHERE id = %s
                    """, (nutrition_id, archetype_id))
                    
                    print(f"  • {archetype_name:35} → {ciqual_name:40} ({score:.0%})")
                    matches += 1
    
    if not dry_run and matches > 0:
        conn.commit()
    
    print(f"✅ {matches} archetypes liés par matching")
    
    cursor.close()
    return inherited + matches

def main():
    dry_run = '--dry-run' in sys.argv or '--test' in sys.argv
    
    if dry_run:
        print("🧪 MODE TEST (dry-run) - Aucune modification DB\n")
    
    # Charger mapping Ciqual
    ciqual_mapping = load_ciqual_mapping()
    
    # Connexion DB
    print("\n🔌 Connexion à la base de données...")
    conn = get_db_connection()
    
    try:
        # Lier canonical_foods
        cf_matched, cf_unmatched = link_canonical_foods(conn, ciqual_mapping, dry_run)
        
        # Lier archetypes
        arch_matched = link_archetypes(conn, ciqual_mapping, dry_run)
        
        # Statistiques finales
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE nutrition_id IS NOT NULL) AS linked,
                COUNT(*) AS total
            FROM canonical_foods
        """)
        cf_stats = cursor.fetchone()
        
        cursor.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE nutrition_modifier_id IS NOT NULL) AS linked,
                COUNT(*) AS total
            FROM archetypes
        """)
        arch_stats = cursor.fetchone()
        
        print(f"\n{'='*60}")
        print(f"📊 RÉSUMÉ")
        print(f"{'='*60}")
        print(f"canonical_foods : {cf_stats[0]}/{cf_stats[1]} liés ({100*cf_stats[0]/cf_stats[1]:.1f}%)")
        print(f"archetypes      : {arch_stats[0]}/{arch_stats[1]} liés ({100*arch_stats[0]/arch_stats[1]:.1f}%)")
        print(f"{'='*60}")
        
        if dry_run:
            print("\n💡 Exécutez sans --dry-run pour appliquer les changements")
        
        cursor.close()
        
    finally:
        conn.close()

if __name__ == '__main__':
    main()
