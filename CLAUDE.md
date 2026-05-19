# Myko — Garde-Manger App

> "Cultivez les connexions entre cuisine, garde-manger et potager"

Application de gestion alimentaire personnelle : garde-manger intelligent, recettes avec nutrition, batch cooking, anti-gaspillage et planification des repas.

---

## Stack technique

| Couche | Techno |
|--------|--------|
| Framework | Next.js 14 (App Router) |
| Langage | JavaScript pur — **pas de TypeScript** |
| Style | CSS custom colocalisé — **pas de Tailwind** |
| Base de données | Supabase (Postgres + RLS + Auth) |
| IA | Anthropic SDK (`@anthropic-ai/sdk`) |
| Icônes | `lucide-react` |
| Alias | `@/` → racine du projet (`jsconfig.json`) |

---

## Commandes utiles

```bash
npm run dev      # Lance le serveur de dev (http://localhost:3000)
npm run build    # Build de production (vérifie les erreurs Next.js)
npm run start    # Serveur de production
```

---

## Structure des dossiers clés

```
app/                    # Pages Next.js (App Router)
  api/                  # Routes API (serveur uniquement)
  layout.js             # Layout racine, fonts, header, wallpaper
  page.js               # Page d'accueil
components/             # Composants React réutilisables
lib/                    # Services, clients Supabase, utilitaires
  supabaseClient.js     # Client navigateur (anon key)
  supabaseServer.js     # Client serveur (cookies SSR)
migrations/             # Migrations SQL versionnées
supabase/               # Config Supabase + exports DB
scripts/                # Scripts d'import/analyse (Node.js)
.claude/agents/         # Subagents Claude Code (Agent Teams)
```

---

## Conventions de code

### JavaScript
- `.js` pour les modules/services, `.jsx` pour les composants React.
- `"use client"` uniquement si hooks React ou events navigateur nécessaires.
- Server Components par défaut dans `app/` — éviter de tout mettre en client.
- Pas de `console.log` en production.

### CSS
- Fichier `.css` colocalisé avec son composant (`MonComposant.css` à côté de `MonComposant.jsx`).
- Variables CSS globales dans `app/globals.css` et `components/myko-theme.css`.
- Fonts : Crimson Text (texte éditorial), Fraunces (titres), Inter (UI).

### Supabase
- Pattern systématique : `const { data, error } = await supabase.from(...)`.
- Toujours vérifier `error` avant d'utiliser `data`.
- Mutations : passer par des API routes (`app/api/`), jamais directement depuis un composant client.
- RLS activé sur toutes les tables — les policies utilisent `auth.uid()`.

### Données sensibles
- Variables d'env côté serveur : `SUPABASE_SERVICE_ROLE_KEY`, clés Anthropic.
- Variables côté client (préfixe `NEXT_PUBLIC_`) : uniquement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Domaine métier

### Hiérarchie ingrédients
```
Archétype → Canonique → Variante produit
```
Les macros nutritionnels se calculent au niveau **canonique** (données CIQUAL).

### Règles DLC
- **DLC** (Date Limite Consommation) : alerte à J-3.
- **DDM** (Date Durabilité Minimale) : alerte à J-7.
- Règle FIFO : toujours consommer le lot le plus ancien en premier.

### Calculs nutritionnels
- Base : pour 100g (source CIQUAL France).
- Formule : `(quantité_g / 100) × valeur_nutritive`.
- Arrondi : 1 décimale pour les macros, 2 pour les micros.

---

## Pièges connus

1. **Supabase client vs serveur** : ne pas importer `supabaseClient.js` dans un Server Component ou une API route — utiliser `supabaseServer.js` qui lit les cookies.

2. **App Router et `params`** : les params de routes dynamiques (`[id]`) sont asynchrones en Next.js 14 — `const { id } = await params` (pas de destructuring direct).

3. **Migrations SQL** : toujours écrire les migrations de façon idempotente (`IF NOT EXISTS`). Jamais de `DROP` sans fichier de rollback.

4. **DLC et timezone** : comparer les dates DLC en UTC pour éviter les décalages d'1 jour selon le fuseau horaire de l'utilisateur.

5. **Anthropic SDK** : les appels IA sont coûteux — toujours mettre un `max_tokens` explicite et implémenter le prompt caching sur les system prompts longs.

6. **Scaling recettes** : les temps de cuisson ne scalent pas linéairement — ne pas multiplier bêtement le temps par le ratio de portions.

---

## Subagents disponibles (Agent Teams)

| Agent | Modèle | Rôle |
|-------|--------|------|
| `tech-lead` | Opus 4.7 | Coordination, architecture, décisions cross-domain |
| `frontend-dev` | Sonnet 4.6 | Composants React, pages, CSS, UX |
| `supabase-architect` | Sonnet 4.6 | Schema, migrations, RLS, edge functions |
| `recipe-domain-expert` | Sonnet 4.6 | Logique métier cuisine, nutrition, batch cooking |
| `qa-tester` | Sonnet 4.6 | Tests, review qualité, Playwright, Vitest |

Pour lancer une session multi-agents : voir section "3 commandes à connaître" dans la doc de setup.
