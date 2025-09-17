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

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test de recherche dans les bases de données</h1>
      
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
