'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TestSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  // Fonction de recherche
  const searchProducts = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    console.log('🔍 Recherche pour:', searchQuery);

    try {
      // Pattern de recherche flexible
      const searchPattern = `%${searchQuery}%`;

      // Recherche dans canonical_foods
      const { data: canonicalData, error: canonicalError } = await supabase
        .from('canonical_foods')
        .select('id, canonical_name, category_id')
        .ilike('canonical_name', searchPattern)
        .limit(10);

      if (canonicalError) {
        console.error('Erreur canonical:', canonicalError);
      }

      // Recherche dans cultivars
      const { data: cultivarData, error: cultivarError } = await supabase
        .from('cultivars')
        .select('id, cultivar_name, canonical_food_id')
        .ilike('cultivar_name', searchPattern)
        .limit(10);

      if (cultivarError) {
        console.error('Erreur cultivar:', cultivarError);
      }

      // Recherche dans generic_products
      const { data: genericData, error: genericError } = await supabase
        .from('generic_products')
        .select('id, name, category_id')
        .ilike('name', searchPattern)
        .limit(10);

      if (genericError) {
        console.error('Erreur generic:', genericError);
      }

      // Combiner les résultats
      const allResults = [];

      if (canonicalData) {
        canonicalData.forEach(item => {
          allResults.push({
            id: item.id,
            name: item.canonical_name,
            type: 'canonical',
            table: 'canonical_foods'
          });
        });
      }

      if (cultivarData) {
        cultivarData.forEach(item => {
          allResults.push({
            id: item.id,
            name: item.cultivar_name,
            type: 'cultivar',
            table: 'cultivars'
          });
        });
      }

      if (genericData) {
        genericData.forEach(item => {
          allResults.push({
            id: item.id,
            name: item.name,
            type: 'generic',
            table: 'generic_products'
          });
        });
      }

      console.log('✅ Résultats trouvés:', allResults);
      setResults(allResults);
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effet pour déclencher la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(query);
    }, 300); // Attendre 300ms après que l'utilisateur arrête de taper

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Fonction de test direct
  const testDirectQuery = async () => {
    console.log('🔬 Test de requête directe...');
    
    try {
      // Test 1: Récupérer les 5 premiers canonical_foods
      const { data: testData, error: testError } = await supabase
        .from('canonical_foods')
        .select('id, canonical_name')
        .limit(5);
      
      if (testError) {
        console.error('❌ Erreur test:', testError);
        alert('Erreur: ' + testError.message);
      } else {
        console.log('✅ Données test:', testData);
        alert(`Succès! ${testData?.length || 0} produits trouvés. Vérifiez la console.`);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test de recherche dans les bases de données</h1>
      
      {/* Boutons de test */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={testDirectQuery}
          style={{
            padding: '0.5rem 1rem',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔬 Tester connexion
        </button>
        
        <button
          onClick={async () => {
            const { data, error } = await supabase.from('canonical_foods').select('*').limit(10);
            console.log('Canonical foods:', data, error);
            setResults(data ? data.map(d => ({ id: d.id, name: d.canonical_name || 'Sans nom', type: 'test', table: 'canonical_foods' })) : []);
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📋 Voir 10 canonical
        </button>
        
        <button
          onClick={async () => {
            const { data, error } = await supabase.from('generic_products').select('*').limit(10);
            console.log('Generic products:', data, error);
            setResults(data ? data.map(d => ({ id: d.id, name: d.name || 'Sans nom', type: 'test', table: 'generic_products' })) : []);
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        <button
          onClick={async () => {
            // Test avec la vue ou table inventory_lots
            const { data, error } = await supabase.from('inventory_lots').select('*').limit(10);
            console.log('Inventory lots:', data, error);
            if (error) alert('Erreur inventory_lots: ' + error.message);
            else alert(`Trouvé ${data?.length || 0} lots dans inventory_lots`);
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📊 Voir inventory_lots
        </button>
        
        <button
          onClick={async () => {
            // Lister toutes les tables
            const { data, error } = await supabase.from('reference_categories').select('*').limit(10);
            console.log('Reference categories:', data, error);
            setResults(data ? data.map(d => ({ id: d.id, name: d.name || 'Sans nom', type: 'category', table: 'reference_categories' })) : []);
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#795548',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        <button
          onClick={async () => {
            // Compter les lignes dans canonical_foods
            const { count, error } = await supabase
              .from('canonical_foods')
              .select('*', { count: 'exact', head: true });
            
            if (error) {
              console.error('Erreur count:', error);
              alert(`Erreur: ${error.message}`);
            } else {
              console.log(`Nombre de lignes dans canonical_foods: ${count}`);
              alert(`La table canonical_foods contient ${count} lignes`);
            }
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#E91E63',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔢 Compter canonical_foods
        </button>
      </div>
      
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tapez au moins 2 caractères..."
        style={{
          width: '100%',
          padding: '1rem',
          fontSize: '1.2rem',
          border: '2px solid #ccc',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}
      />

      {loading && <p>🔄 Recherche en cours...</p>}

      {query.length > 0 && query.length < 2 && (
        <p style={{ color: 'orange' }}>⚠️ Tapez au moins 2 caractères pour rechercher</p>
      )}

      {results.length === 0 && query.length >= 2 && !loading && (
        <p style={{ color: 'red' }}>❌ Aucun résultat trouvé</p>
      )}

      {results.length > 0 && (
        <div>
          <h3>📊 {results.length} résultats trouvés:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {results.map((result, index) => (
              <li
                key={`${result.table}-${result.id}-${index}`}
                style={{
                  padding: '0.75rem',
                  margin: '0.5rem 0',
                  background: '#f0f0f0',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}
              >
                <strong>{result.name}</strong>
                <br />
                <small style={{ color: '#666' }}>
                  Table: {result.table} | Type: {result.type} | ID: {result.id}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Debug Info */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h4>🐛 Debug Info:</h4>
        <p>Query: "{query}"</p>
        <p>Longueur: {query.length}</p>
        <p>Loading: {loading ? 'Oui' : 'Non'}</p>
        <p>Nombre de résultats: {results.length}</p>
      </div>
    </div>
  );
}
