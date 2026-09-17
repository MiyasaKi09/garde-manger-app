'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, Check, Package, ChevronLeft, ChevronRight,
  RefreshCw, ImageOff, Camera, X, MoreHorizontal, Copy, Share2, Printer,
} from 'lucide-react'
import Link from 'next/link'
import { getFoodEmoji } from '@/lib/foodEmoji'
import {
  exporterListeCourses,
  chargePartageListe,
  documentImprimableListe,
} from '@/lib/domain/courses/exportListe'
import StoragePlanSheet from '@/components/StoragePlanSheet'
import IngredientReviewPanel from '@/components/IngredientReviewPanel'
import EstimationCourses from '@/components/pricing/EstimationCourses'
import './courses.css'

const RAYON_TINTS = ['#E4EBDC', '#F1E9D4', '#EFD9D0', '#E8E2D2', '#EADFCB', '#DEE7EC']

/**
 * Écrit un texte dans le presse-papiers, et dit ce qui s'est passé.
 *
 * `navigator.clipboard` n'existe que dans un contexte sécurisé (HTTPS, ou
 * localhost) et peut en plus être refusé par la permission du navigateur : sur
 * un téléphone qui ouvre l'application par son adresse IP en réseau local — le
 * cas le plus probable ici — l'objet est tout simplement absent. On essaie donc
 * d'abord l'API moderne, puis le repli historique (zone de texte hors écran et
 * `document.execCommand('copy')`), qui n'exige pas de contexte sécurisé.
 *
 * Quand les deux échouent, la fonction ne lève pas et ne se tait pas : elle rend
 * la raison, et l'appelant montre le texte à l'écran pour une copie manuelle.
 * Un échec silencieux laisserait croire à une liste copiée, et c'est devant
 * l'étal qu'on s'en apercevrait.
 *
 * @returns {Promise<{ ok: boolean, voie?: string, raison?: string }>}
 */
async function ecrireDansPressePapiers(texte) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texte)
      return { ok: true, voie: 'clipboard' }
    } catch {
      // Permission refusée ou contexte non sécurisé : on tente le repli.
    }
  }

  try {
    if (typeof document !== 'undefined' && typeof document.execCommand === 'function') {
      const zone = document.createElement('textarea')
      zone.value = texte
      zone.setAttribute('readonly', '')
      // Hors écran mais focusable : `display: none` empêcherait la sélection.
      zone.style.position = 'fixed'
      zone.style.top = '-1000px'
      zone.style.opacity = '0'
      document.body.appendChild(zone)
      zone.select()
      zone.setSelectionRange(0, texte.length)
      const copie = document.execCommand('copy')
      document.body.removeChild(zone)
      if (copie) return { ok: true, voie: 'execCommand' }
    }
  } catch {
    // Repli indisponible lui aussi : on tombe dans la copie manuelle.
  }

  const nonSecurise = typeof window !== 'undefined' && window.isSecureContext === false
  return { ok: false, raison: nonSecurise ? 'contexte_non_securise' : 'refus_navigateur' }
}

/**
 * Pourquoi la sortie demandée n'a pas pu s'exécuter. Chaque raison est écrite,
 * jamais tue : un échec silencieux laisserait croire à une liste emportée, et
 * c'est devant l'étal qu'on s'en apercevrait.
 */
const MESSAGES_COPIE_MANUELLE = {
  contexte_non_securise: 'Le presse-papiers du navigateur n’est accessible qu’en HTTPS (ou sur localhost). Cette page est servie sans contexte sécurisé : la copie automatique est impossible ici.',
  refus_navigateur: 'Le navigateur a refusé l’accès au presse-papiers.',
  partage_absent: 'Ce navigateur n’a pas de partage natif — il n’existe ni sur la plupart des navigateurs de bureau, ni hors contexte sécurisé.',
  partage_refuse: 'Le partage natif a échoué avant d’avoir envoyé quoi que ce soit.',
}

/**
 * Les réserves d'une sortie : ce que le texte porte quand même, mais qu'on
 * annonce. Une liste incomplète qui ne se signale pas est pire qu'une liste
 * courte — et les trois sorties le disent de la même façon, par cette fonction.
 */
function reservesDeSortie(anomalies) {
  const reserves = []
  if (anomalies.articles_sans_quantite.length > 0) {
    reserves.push(`${anomalies.articles_sans_quantite.length} sans quantité`)
  }
  if (anomalies.rayons_non_declares.length > 0) {
    reserves.push(`${anomalies.rayons_non_declares.length} rayon${anomalies.rayons_non_declares.length > 1 ? 's' : ''} hors parcours`)
  }
  return reserves
}

/** « 99 articles copiés · 2 sans quantité ». Le participe est passé par l'appelant. */
function messageDeSortie(participe, compte, anomalies) {
  const pluriel = compte.articles > 1 ? 's' : ''
  const base = `${compte.articles} article${pluriel} ${participe}${pluriel}`
  const reserves = reservesDeSortie(anomalies)
  return reserves.length ? `${base} · ${reserves.join(' · ')}` : base
}

export default function CoursesPage() {
  const router = useRouter()

  // ── Données ──────────────────────────────────────────────────────────────────
  const [loading, setLoading]         = useState(true)
  const [items, setItems]             = useState([])
  const [importId, setImportId]       = useState(null)
  const [importLabel, setImportLabel] = useState('')
  const [imports, setImports]         = useState([])
  const [importIndex, setImportIndex] = useState(0)
  // Estimation servie par la route de l'import : des chaînes déjà rédigées.
  // Le référentiel de prix (670 ko importés au build) ne descend jamais ici.
  const [estimation, setEstimation]   = useState(null)

  // ── Navigation ────────────────────────────────────────────────────────────────
  const [activeWeek, setActiveWeek]   = useState(null)
  const [activeRayon, setActiveRayon] = useState(null) // null = 1er rayon · 'TOUT' = tout

  // ── UI locale ────────────────────────────────────────────────────────────────
  const [expandedItems, setExpandedItems]     = useState(new Set())
  const [containerEdits, setContainerEdits]   = useState({})

  // ── Résolution des ingrédients ────────────────────────────────────────────────
  const [resolutionPending, setResolutionPending] = useState(false)
  const [resolutionError, setResolutionError]     = useState(false)
  const resolvedImportsRef = useRef(new Set())

  // ── Images ───────────────────────────────────────────────────────────────────
  const [fetchingImages, setFetchingImages] = useState(false)
  const [fetchResult, setFetchResult]       = useState(null)
  const [rebuilding, setRebuilding]         = useState(false)
  const [imgErrors, setImgErrors]           = useState(new Set())
  const [picker, setPicker]                 = useState(null)
  const [pickerCands, setPickerCands]       = useState([])
  const [pickerLoading, setPickerLoading]   = useState(false)
  const [pickerQuery, setPickerQuery]       = useState('')

  // ── Menu secondaire ⋯ ────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false)
  // Panneau « Aliments à confirmer » (liaisons en attente de validation)
  const [reviewOpen, setReviewOpen] = useState(false)

  // ── Feuille de rangement ─────────────────────────────────────────────────────
  const [showStorageSheet, setShowStorageSheet] = useState(false)
  const [storageItems, setStorageItems]         = useState([]) // snapshot stable

  // ── Sorties de la liste ────────────────────────────────────────────────────
  // Renseigné seulement quand une sortie n'a pas pu s'exécuter : il porte alors
  // le texte à emporter à la main et la raison de l'échec. Le même panneau sert au
  // presse-papiers et au partage natif — dans les deux cas le recours est le même
  // texte, montré déjà sélectionné.
  const [copieManuelle, setCopieManuelle] = useState(null) // { texte, raison, articles }
  const zoneCopieRef = useRef(null)

  // ── Toast ────────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null) // { id, msg, kind }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  function showToast(msg, kind = 'ok') {
    setToast({ id: Date.now(), msg, kind })
  }

  // 'YYYY-MM-DD' → 'JJ/MM' (sans passer par Date : évite les décalages timezone)
  function formatDayMonth(iso) {
    if (!iso || typeof iso !== 'string') return ''
    const [, m, d] = iso.split('-')
    return d && m ? `${d}/${m}` : ''
  }

  // ── Résumé de résolution (dérivé des items) ──────────────────────────────────
  const resolutionSummary = useMemo(() => {
    if (items.length === 0) return null
    const toConfirm = items.filter(i =>
      i.review_status === 'pending' ||
      i.review_status === 'proposed' ||
      (!i.canonical_food_id && !i.archetype_id)
    ).length
    const ready = items.filter(i =>
      (i.canonical_food_id || i.archetype_id) &&
      (!i.review_status || i.review_status === 'auto' || i.review_status === 'confirmed')
    ).length
    return { ready, toConfirm }
  }, [items])

  // ── Chargement ───────────────────────────────────────────────────────────────
  async function loadItems(imp) {
    setImportId(imp.id)
    setImportLabel(imp.month_label || '')
    setResolutionError(false)

    const res = await authFetch(`/api/planning/imports/${imp.id}`)
    const d = await res.json()
    const list = d.shoppingItems || []
    setItems(list)
    setEstimation(d.estimation || null)

    const weeks = [...new Set(list.map(i => i.week_label))].sort()
    setActiveWeek(weeks.length > 0 ? weeks[0] : null)
    setActiveRayon(null)

    // Résolution des ingrédients non liés — déclenché une fois par import
    const hasUnlinked = list.some(i => !i.canonical_food_id && !i.archetype_id)
    if (hasUnlinked && !resolvedImportsRef.current.has(imp.id)) {
      resolvedImportsRef.current.add(imp.id)
      setResolutionPending(true)
      try {
        await authFetch('/api/ingredients/resolve-pending', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ import_id: imp.id }),
        })
        const res2 = await authFetch(`/api/planning/imports/${imp.id}`)
        const d2 = await res2.json()
        setItems(d2.shoppingItems || [])
        // La résolution vient de relier des articles au catalogue : l'estimation
        // renvoyée avec eux porte donc une couverture différente de la première.
        setEstimation(d2.estimation || null)
        setResolutionPending(false)
      } catch {
        setResolutionPending(false)
        setResolutionError(true)
      }
    }
  }

  async function goToImport(idx) {
    if (idx < 0 || idx >= imports.length || idx === importIndex) return
    setImportIndex(idx)
    setExpandedItems(new Set())
    await loadItems(imports[idx])
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await authFetch('/api/planning/imports')
      const d = await res.json()
      if (!d.imports?.length) { setLoading(false); return }

      setImports(d.imports)
      const today = new Date().toISOString().split('T')[0]
      let idx = d.imports.findIndex(i =>
        i.date_range_start && i.date_range_end &&
        i.date_range_start <= today && i.date_range_end >= today)
      if (idx < 0) idx = 0
      setImportIndex(idx)
      await loadItems(d.imports[idx])
      setLoading(false)
    }
    load()
  }, [])

  // ── Dérivés filtrés ──────────────────────────────────────────────────────────
  const weekLabels = useMemo(() =>
    [...new Set(items.map(i => i.week_label))].sort(), [items])

  const filteredItems = useMemo(() =>
    activeWeek ? items.filter(i => i.week_label === activeWeek) : items,
    [items, activeWeek])

  /**
   * L'estimation suit la semaine affichée, pas l'import entier : un plan peut
   * porter un mois, et « le total du mois » ne répond pas à la question qu'on
   * se pose devant une liste de courses. Repli sur le total quand le plan n'a
   * qu'une semaine — c'est alors le même chiffre.
   */
  const estimationSemaine = useMemo(() => {
    if (!estimation) return null
    return (activeWeek && estimation.parSemaine?.[activeWeek]) || estimation.total || null
  }, [estimation, activeWeek])

  const groupedItems = useMemo(() => {
    const groups = {}
    for (const item of filteredItems) {
      const cat = item.category || 'Autres'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    return groups
  }, [filteredItems])

  // Articles cochés mais pas encore rangés (à ranger via StoragePlanSheet)
  const itemsToStore = useMemo(() =>
    items.filter(i => i.checked && !(i.created_lot_ids?.length > 0)),
    [items])

  /**
   * Le document imprimable de la semaine affichée.
   *
   * Calculé en continu plutôt qu'au clic, et posé dans la page en permanence,
   * masqué à l'écran : `window.print()` est synchrone, il n'attendrait pas un
   * rendu React déclenché par le clic, et la feuille serait imprimée vide.
   * Il ne trie ni ne regroupe rien : `documentImprimableListe` rend déjà les
   * rayons dans l'ordre, la page ne fait que les poser.
   */
  const docImprimable = useMemo(
    () => documentImprimableListe(items, { semaine: activeWeek }),
    [items, activeWeek])

  // ── Gestion du stock ─────────────────────────────────────────────────────────

  /** Retire du stock les lots créés pour un article (décochage). */
  async function removeFromStock(itemId) {
    try {
      const res = await authFetch('/api/courses/add-to-stock', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erreur inconnue' }
      }
      return { success: true, deleted: data.deleted, kept: data.kept }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Clic sur une carte = « acheté » uniquement.
   * Aucun appel add-to-stock au cochage.
   * Décochage : si l'article a des lots créés (rangé avant), les retirer du stock.
   */
  async function toggleItem(itemId) {
    const item = items.find(i => i.id === itemId)
    if (!item || item.unstocking) return
    const newChecked = !item.checked

    // Mise à jour optimiste
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: newChecked } : i))

    try {
      await authFetch(`/api/courses/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: newChecked }),
      })
    } catch {
      // PATCH échoué → revert
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: !newChecked } : i))
      return
    }

    if (!newChecked) {
      // Décochage : retirer du stock si l'article a des lots créés (déjà rangé)
      const hasLots = (item.created_lot_ids?.length > 0)
      if (hasLots) {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, unstocking: true } : i))
        const result = await removeFromStock(itemId)
        if (result.success) {
          setItems(prev => prev.map(i => i.id === itemId
            ? { ...i, stocked: false, unstocking: false, created_lot_ids: null }
            : i))
          if (result.kept > 0) showToast('Lot déjà entamé, conservé au stock')
          else if (result.deleted > 0) showToast('Retiré du stock')
        } else {
          setItems(prev => prev.map(i => i.id === itemId ? { ...i, unstocking: false } : i))
          showToast(`Stock non nettoyé — ${result.error}`, 'error')
        }
      }
      // Si l'article était coché mais pas rangé : décochage trivial (rien à faire)
    }
    // Cochage → l'article passe dans « à ranger » (itemsToStore), rien d'autre
  }

  /**
   * Callback de StoragePlanSheet : appelé après rangement réussi de chaque article.
   * Met à jour l'état local pour refléter les lots créés.
   */
  const handleItemStored = useCallback((itemId, lotIds) => {
    setItems(prev => prev.map(i => i.id === itemId
      ? { ...i, stocked: true, created_lot_ids: lotIds, stockError: false }
      : i))
  }, [])

  /**
   * Callback de StoragePlanSheet : fin du flux (utilisateur clique Terminé).
   * Ferme la feuille et affiche un toast récapitulatif.
   */
  function handleSheetDone({ stored, errors }) {
    setShowStorageSheet(false)
    if (stored > 0) {
      const msg = errors > 0
        ? `${stored} article${stored > 1 ? 's' : ''} rangé${stored > 1 ? 's' : ''} · ${errors} erreur${errors > 1 ? 's' : ''}`
        : `${stored} article${stored > 1 ? 's' : ''} rangé${stored > 1 ? 's' : ''} au stock`
      showToast(msg, errors > 0 ? 'warn' : 'ok')
    }
  }

  // ── Les trois sorties de la liste (P17) ─────────────────────────────────────
  //
  // Presse-papiers, partage natif, impression. Les trois descendent du même
  // `exporterListeCourses` : la règle « quelles lignes partent, dans quel ordre »
  // n'a qu'un seul endroit où elle est écrite, et c'est celui que le test
  // vérifie. Aucune des trois ne trie, ne regroupe ni ne filtre de son côté.

  /**
   * Compose le texte de la semaine affichée et l'écrit dans le presse-papiers.
   *
   * Le filtre de semaine est laissé au module d'export plutôt que de lui passer
   * `filteredItems` : la règle « quelles lignes partent » n'a qu'un seul endroit
   * où elle est écrite, et c'est celui que le test vérifie.
   */
  async function copierLaListe() {
    const { texte, compte, anomalies } = exporterListeCourses(items, { semaine: activeWeek })
    if (compte.articles === 0) {
      showToast('Aucun article à copier pour cette semaine.', 'warn')
      return
    }

    const resultat = await ecrireDansPressePapiers(texte)
    if (!resultat.ok) {
      setCopieManuelle({ texte, raison: resultat.raison, articles: compte.articles })
      return
    }

    // Les articles sans quantité et les rayons non déclarés sont dans le texte,
    // mais on le dit : une liste incomplète qui ne se signale pas est pire
    // qu'une liste courte.
    showToast(messageDeSortie('copié', compte, anomalies), reservesDeSortie(anomalies).length ? 'warn' : 'ok')
  }

  /**
   * Sortie 2 — partage natif.
   *
   * La charge vient de `chargePartageListe`, dont le corps est le MÊME texte que
   * celui du presse-papiers : les deux sorties ne peuvent pas diverger sur
   * l'ordre des rayons puisqu'elles n'en composent qu'un.
   *
   * Le partage natif n'existe pas partout : absent de la plupart des navigateurs
   * de bureau, absent hors contexte sécurisé, et il exige un geste de
   * l'utilisateur. Quand il manque ou qu'il échoue, le repli est le panneau de
   * copie à la main, VISIBLE, avec la raison écrite — jamais un bouton qui ne
   * fait rien.
   *
   * Une annulation n'est pas un échec : fermer la feuille de partage du système
   * lève `AbortError`, et on ne montre alors ni panneau ni message. Traiter
   * l'annulation comme une panne apprendrait à l'utilisateur à ignorer le repli.
   */
  async function partagerLaListe() {
    const { titre, texte, compte, anomalies } = chargePartageListe(items, { semaine: activeWeek })
    if (compte.articles === 0) {
      showToast('Aucun article à partager pour cette semaine.', 'warn')
      return
    }

    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      setCopieManuelle({ texte, raison: 'partage_absent', articles: compte.articles })
      return
    }

    try {
      await navigator.share({ title: titre, text: texte })
    } catch (err) {
      if (err?.name === 'AbortError') return
      setCopieManuelle({ texte, raison: 'partage_refuse', articles: compte.articles })
      return
    }

    showToast(messageDeSortie('partagé', compte, anomalies), reservesDeSortie(anomalies).length ? 'warn' : 'ok')
  }

  /**
   * Sortie 3 — impression, et donc PDF.
   *
   * Il n'y a rien à composer ici : le document imprimable est calculé en continu
   * par `docImprimable` et déjà posé dans la page, masqué à l'écran. Imprimer ne
   * fait qu'ouvrir la boîte du navigateur ; « Enregistrer en PDF » y est une
   * destination comme une autre, et c'est pour cela qu'aucune bibliothèque PDF
   * n'est embarquée. Une bibliothèque aurait été une deuxième mise en page à
   * tenir en accord avec la première.
   */
  function imprimerLaListe() {
    if (docImprimable.compte.articles === 0) {
      showToast('Aucun article à imprimer pour cette semaine.', 'warn')
      return
    }
    if (typeof window === 'undefined' || typeof window.print !== 'function') {
      showToast('Ce navigateur n’expose pas d’impression.', 'warn')
      return
    }
    window.print()
  }

  // La zone de copie manuelle s'ouvre déjà sélectionnée : il ne reste que
  // Ctrl/⌘ + C à faire.
  useEffect(() => {
    if (!copieManuelle || !zoneCopieRef.current) return
    zoneCopieRef.current.focus()
    zoneCopieRef.current.select()
  }, [copieManuelle])

  /** Ouvre la feuille de rangement avec un snapshot des articles à ranger. */
  function openStorageSheet() {
    setStorageItems(itemsToStore.slice())
    setShowStorageSheet(true)
  }

  // ── Sauvegarde du conditionnement ─────────────────────────────────────────────
  async function updateContainer(itemId, containerQty, containerSize, containerUnit) {
    try {
      await authFetch(`/api/courses/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container_qty: containerQty, container_size: containerSize, container_unit: containerUnit }),
      })
      setItems(prev => prev.map(i =>
        i.id === itemId ? { ...i, container_qty: containerQty, container_size: containerSize, container_unit: containerUnit } : i
      ))
    } catch {
      // silent — UI already reflects via containerEdits
    }
  }

  function setContainerField(itemId, field, value) {
    setContainerEdits(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), [field]: value } }))
  }

  function getContainerEdit(item, field) {
    const edits = containerEdits[item.id]
    if (edits && field in edits) return edits[field]
    return item[field] ?? ''
  }

  function saveContainerEdits(item) {
    const edits = containerEdits[item.id] || {}
    const qty  = parseInt(edits.container_qty ?? item.container_qty) || null
    const size = parseFloat(String(edits.container_size ?? item.container_size).replace(',', '.')) || null
    const unit = edits.container_unit ?? item.container_unit ?? null
    updateContainer(item.id, qty, size, unit)
  }

  // ── Actions images ────────────────────────────────────────────────────────────
  async function handleFetchImages(replace = false) {
    if (!importId) return
    setFetchingImages(true)
    setFetchResult(null)
    setMenuOpen(false)
    try {
      const res = await authFetch('/api/courses/fetch-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId, replace }),
      })
      const data = await res.json()
      if (data.error) {
        setFetchResult({ error: data.error })
      } else {
        setFetchResult({ updated: data.updated, total: data.total, cleared: data.cleared })
        if (data.updated > 0 || data.cleared > 0) {
          const res2 = await authFetch(`/api/planning/imports/${importId}`)
          const d2 = await res2.json()
          setItems(d2.shoppingItems || [])
        }
      }
    } catch (err) {
      setFetchResult({ error: err.message })
    } finally {
      setFetchingImages(false)
    }
  }

  async function handleClearImages() {
    if (!importId) return
    setFetchingImages(true)
    setFetchResult(null)
    setMenuOpen(false)
    try {
      const res = await authFetch('/api/courses/fetch-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId, clear: true }),
      })
      const data = await res.json()
      if (data.error) {
        setFetchResult({ error: data.error })
      } else {
        setFetchResult({ cleared: data.cleared, clearedOnly: true })
        const res2 = await authFetch(`/api/planning/imports/${importId}`)
        const d2 = await res2.json()
        setItems(d2.shoppingItems || [])
      }
    } catch (err) {
      setFetchResult({ error: err.message })
    } finally {
      setFetchingImages(false)
    }
  }

  async function handleRebuild() {
    if (!importId) return
    setRebuilding(true)
    setFetchResult(null)
    setMenuOpen(false)
    try {
      const res = await authFetch('/api/courses/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId }),
      })
      const data = await res.json()
      if (data.error) {
        setFetchResult({ error: data.error })
      } else {
        const res2 = await authFetch(`/api/planning/imports/${importId}`)
        const d2 = await res2.json()
        setItems(d2.shoppingItems || [])
        setFetchResult({ items: data.items, mode: data.mode, inStock: data.inStock, recipesCreated: data.recipesCreated })
      }
    } catch (err) {
      setFetchResult({ error: err.message })
    } finally {
      setRebuilding(false)
    }
  }

  // ── Sélecteur d'image par article ────────────────────────────────────────────
  async function fetchCandidates(item, customQuery) {
    setPickerLoading(true)
    try {
      const res = await authFetch('/api/courses/item-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customQuery ? { name: item.product_name, query: customQuery } : { name: item.product_name }),
      })
      const d = await res.json()
      setPickerCands(d.candidates || [])
      setPickerQuery(d.query || customQuery || '')
    } catch {
      setPickerCands([])
    } finally {
      setPickerLoading(false)
    }
  }

  function openImagePicker(item) {
    setPicker(item)
    setPickerCands([])
    setPickerQuery('')
    fetchCandidates(item)
  }

  async function chooseImage(url) {
    const item = picker
    if (!item) return
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, image_url: url } : i))
    setImgErrors(prev => { const n = new Set(prev); n.delete(item.id); return n })
    setPicker(null)
    try {
      await authFetch(`/api/courses/shopping-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url }),
      })
    } catch {}
  }

  // ── Compteurs ────────────────────────────────────────────────────────────────
  const checkedCount   = filteredItems.filter(i => i.checked).length
  const totalCount     = filteredItems.length
  const allCheckedCount = items.filter(i => i.checked).length
  const allTotalCount   = items.length
  const remaining       = totalCount - checkedCount

  const categories = Object.keys(groupedItems)
  const showAll    = activeRayon === 'TOUT'
  const currentRayon = showAll ? null : (categories.includes(activeRayon) ? activeRayon : (categories[0] ?? null))
  const currentItems  = currentRayon ? groupedItems[currentRayon] : []
  const currentChecked = currentItems.filter(i => i.checked).length
  const currentIndex   = currentRayon ? categories.indexOf(currentRayon) : -1
  const pct       = totalCount ? Math.round((checkedCount / totalCount) * 100) : 0
  const weekIdx   = activeWeek ? weekLabels.indexOf(activeWeek) : -1
  const goWeek    = (delta) => {
    const ni = weekIdx + delta
    if (ni >= 0 && ni < weekLabels.length) { setActiveWeek(weekLabels[ni]); setActiveRayon(null) }
  }
  const catTint = (cat) => RAYON_TINTS[Math.max(0, categories.indexOf(cat)) % RAYON_TINTS.length]

  // ── Rendu d'une carte article ─────────────────────────────────────────────────
  function renderCard(item, tint) {
    const isExpanded  = expandedItems.has(item.id)
    const hasContainer = !!(item.container_qty && item.container_size)
    const photo = imgErrors.has(item.id) ? null : (item.image_url || null)
    const isStored  = !!(item.created_lot_ids?.length > 0) || !!item.stocked
    const isToStore = item.checked && !isStored && !item.unstocking

    return (
      <div key={item.id} className={`cou-card${item.checked ? ' done' : ''}`}>
        <div
          className="cou-card-top"
          role="button"
          tabIndex={0}
          onClick={() => toggleItem(item.id)}
          onKeyDown={e => e.key === 'Enter' && toggleItem(item.id)}
        >
          <span className={`cou-card-chk${item.checked ? ' on' : ''}`}>
            {item.checked && <Check size={12} color="#fff" />}
          </span>
          <button
            className="cou-card-editimg"
            onClick={e => { e.stopPropagation(); openImagePicker(item) }}
            title="Changer la photo"
            aria-label="Changer la photo"
          >
            <Camera size={12} />
          </button>
          <div className="cou-card-thumb" style={photo ? undefined : { background: tint }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                className="cou-card-img"
                loading="lazy"
                onError={() => setImgErrors(prev => new Set(prev).add(item.id))}
              />
            ) : (
              <span className="cou-card-emoji">{getFoodEmoji(item.product_name, item.category)}</span>
            )}
          </div>
        </div>
        <div className="cou-card-info">
          <span className="cou-card-nm">{item.product_name}</span>
          <div className="cou-card-foot">
            {item.quantity && <span className="cou-card-qty">{item.quantity}</span>}
            {hasContainer && (
              <span className="cou-card-cond">{item.container_qty} × {item.container_size} {item.container_unit}</span>
            )}
            <button
              className={`cou-card-cont${hasContainer ? ' has' : ''}${isExpanded ? ' on' : ''}`}
              onClick={e => {
                e.stopPropagation()
                setExpandedItems(prev => {
                  const next = new Set(prev)
                  next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                  return next
                })
              }}
              title="Conditionnement (nb de contenants)"
              aria-label="Configurer le conditionnement"
            >
              <Package size={12} />
            </button>
          </div>
          {item.notes && <span className="cou-card-notes">{item.notes}</span>}
          {item.unstocking && <span className="cou-card-tag stocking">retrait…</span>}
          {isToStore && (
            <span className="cou-card-tag to-store">à ranger</span>
          )}
          {isStored && !item.unstocking && (
            <span className="cou-card-tag stocked"><Package size={10} /> rangé</span>
          )}
        </div>
        {isExpanded && (
          <div className="cou-card-picker" onClick={e => e.stopPropagation()}>
            <span className="cou-cont-label">Conditionnement</span>
            <div className="cou-cont-fields">
              <input
                type="number" min="1" placeholder="Nb" className="cou-cont-input qty"
                value={getContainerEdit(item, 'container_qty')}
                onChange={e => setContainerField(item.id, 'container_qty', e.target.value)}
                onBlur={() => saveContainerEdits(item)}
              />
              <span className="cou-cont-x">×</span>
              <input
                type="number" min="0.01" step="0.01" placeholder="Taille" className="cou-cont-input size"
                value={getContainerEdit(item, 'container_size')}
                onChange={e => setContainerField(item.id, 'container_size', e.target.value)}
                onBlur={() => saveContainerEdits(item)}
              />
              <select
                className="cou-cont-unit"
                value={getContainerEdit(item, 'container_unit') || 'L'}
                onChange={e => { setContainerField(item.id, 'container_unit', e.target.value); saveContainerEdits(item) }}
              >
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="cl">cl</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="unités">unités</option>
              </select>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Squelette de chargement ───────────────────────────────────────────────────
  if (loading) return (
    <div className="v21-page wide courses-page" aria-busy="true" aria-label="Chargement des courses">
      <div className="v21-skel" style={{ height: 150 }} />
      <div className="cou-board">
        <div className="cou-rail"><div className="v21-skel" style={{ height: 320, margin: '24px' }} /></div>
        <div className="cou-main cou-skel-list">
          {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="v21-skel" style={{ height: 120 }} />)}
        </div>
      </div>
    </div>
  )

  // ── État vide ────────────────────────────────────────────────────────────────
  if (!importId || items.length === 0) return (
    <div className="v21-page wide courses-page">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Courses</span>
          <h1 className="v21-title">La liste.</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Rien à acheter pour l'instant.</p>
        </div>
      </header>
      <div className="v21-empty cou-empty">
        <div className="cou-empty-ico"><ShoppingCart size={32} /></div>
        <p>Demande un planning à Myko pour générer la liste de courses.</p>
        <Link href="/planning/assistant" className="v21-btn">Créer un planning</Link>
      </div>
    </div>
  )

  // ── Page principale ──────────────────────────────────────────────────────────
  return (
    <div className="v21-page wide courses-page">

      {/* ── HERO ÉDITORIAL ── */}
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Courses</span>
          <h1 className="v21-title">La liste.</h1>
          <div className="v21-rule" />
          <p className="v21-lede">{remaining} restant{remaining !== 1 ? 's' : ''} sur cette semaine.</p>
        </div>
        <div className="v21-hero-side">
          <div className="v21-hero-badge">
            <span className="v">{remaining}</span>
            <span className="l">à acheter</span>
          </div>
          {/* Les trois sorties de la liste (P17). Même semaine, même ordre de
              rayons : elles descendent toutes d'`exporterListeCourses`. */}
          <div className="cou-sorties" role="group" aria-label="Emporter la liste de courses">
            <button
              className="v21-btn ghost sm"
              onClick={copierLaListe}
              title="Copier la liste de la semaine affichée"
              aria-label="Copier la liste de courses"
            >
              <Copy size={13} /> Copier
            </button>
            <button
              className="v21-btn ghost sm"
              onClick={partagerLaListe}
              title="Partager la liste de la semaine affichée"
              aria-label="Partager la liste de courses"
            >
              <Share2 size={13} /> Partager
            </button>
            <button
              className="v21-btn ghost sm"
              onClick={imprimerLaListe}
              title="Imprimer la liste, ou l’enregistrer en PDF depuis la boîte d’impression"
              aria-label="Imprimer la liste de courses"
            >
              <Printer size={13} /> Imprimer
            </button>
          </div>
          {/* Menu secondaire ⋯ */}
          <div className="cou-overflow-wrap">
            <button
              className="cou-overflow-btn"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Actions secondaires"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="cou-overflow-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="cou-overflow-dropdown" role="menu">
                  <button
                    className="cou-overflow-item"
                    role="menuitem"
                    onClick={handleRebuild}
                    disabled={rebuilding}
                  >
                    <RefreshCw size={13} />
                    {rebuilding ? 'Synchro…' : 'Synchroniser le stock'}
                  </button>
                  <button
                    className="cou-overflow-item"
                    role="menuitem"
                    onClick={() => handleFetchImages(true)}
                    disabled={fetchingImages}
                  >
                    <Camera size={13} />
                    {fetchingImages ? 'Photos…' : 'Photos auto'}
                  </button>
                  <button
                    className="cou-overflow-item"
                    role="menuitem"
                    onClick={handleClearImages}
                    disabled={fetchingImages}
                  >
                    <ImageOff size={13} />
                    Réinitialiser les photos
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Bandeau résolution des ingrédients ── */}
      {resolutionError && (
        <div className="cou-resolution-banner error">
          Résolution en attente — certains produits peuvent ne pas être reliés au catalogue
        </div>
      )}
      {!resolutionError && resolutionPending && (
        <div className="cou-resolution-banner pending">
          Liaison des ingrédients en cours…
        </div>
      )}
      {!resolutionError && !resolutionPending && resolutionSummary && resolutionSummary.toConfirm > 0 && (
        <button
          className="cou-resolution-banner warn cou-resolution-btn"
          onClick={() => setReviewOpen(true)}
          title="Ouvrir la liste des aliments à confirmer"
        >
          {resolutionSummary.ready > 0 && `${resolutionSummary.ready} article${resolutionSummary.ready !== 1 ? 's' : ''} prêt${resolutionSummary.ready !== 1 ? 's' : ''} · `}
          {resolutionSummary.toConfirm} à confirmer →
        </button>
      )}
      <IngredientReviewPanel
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onChanged={() => { if (imports[importIndex]) loadItems(imports[importIndex]) }}
      />

      {/* ── Bandeau résultat (rebuild / photos) ── */}
      {fetchResult && (
        <div className={`cou-result ${fetchResult.error ? 'error' : 'ok'}`}>
          {fetchResult.error
            ? fetchResult.error
            : fetchResult.items != null
              ? (fetchResult.mode === 'enriched'
                  ? `${fetchResult.items} articles reliés au stock${fetchResult.inStock > 0 ? ` · ${fetchResult.inStock} déjà en stock` : ''}`
                  : `Liste recalculée — ${fetchResult.items} article${fetchResult.items > 1 ? 's' : ''}`)
                + (fetchResult.recipesCreated > 0 ? ` · ${fetchResult.recipesCreated} recette(s) ajoutée(s)` : '')
              : fetchResult.clearedOnly
                ? `${fetchResult.cleared || 0} ancienne${(fetchResult.cleared || 0) > 1 ? 's' : ''} image${(fetchResult.cleared || 0) > 1 ? 's' : ''} effacée${(fetchResult.cleared || 0) > 1 ? 's' : ''} — icônes rétablies`
                : `${fetchResult.updated}/${fetchResult.total} photos`}
        </div>
      )}

      {/* ── COCKPIT : rail | cartes ── */}
      <div className="cou-board">

        {/* ── RAIL ── */}
        <aside className="cou-rail">

          {/* Avancement */}
          <section className="cou-rsec">
            <span className="v21-bl">Avancement</span>
            <div className="cou-big">{checkedCount} <span className="cou-big-of">/ {totalCount}</span></div>
            <span className="cou-rsub">articles achetés</span>
            <div className="cou-prog"><div className="cou-prog-fill" style={{ width: `${pct}%` }} /></div>
            <span className="cou-rsub">{pct} % · {remaining} restant{remaining !== 1 ? 's' : ''}</span>
            {allTotalCount !== totalCount && (
              <span className="cou-rsub">{allCheckedCount}/{allTotalCount} sur tout le plan</span>
            )}
          </section>

          {/* Estimation — au CONTENANT réel, pas au gramme (contrat §6.2).
              Placée juste sous l'avancement : c'est la question qu'on se pose
              en même temps que « combien me reste-t-il à prendre ». */}
          {estimationSemaine && (
            <section className="cou-rsec">
              <EstimationCourses estimation={estimationSemaine} compact titre="Estimation" />
            </section>
          )}

          {/* Semaine */}
          {(weekLabels.length > 0 || imports.length > 1) && (
            <section className="cou-rsec">
              <span className="v21-bl">Semaine</span>
              {weekLabels.length > 1 ? (
                <>
                  <div className="cou-wk">
                    <button className="cou-wk-btn" onClick={() => goWeek(-1)} disabled={weekIdx <= 0} aria-label="Semaine précédente"><ChevronLeft size={15} /></button>
                    <b>{activeWeek}</b>
                    <button className="cou-wk-btn" onClick={() => goWeek(1)} disabled={weekIdx >= weekLabels.length - 1} aria-label="Semaine suivante"><ChevronRight size={15} /></button>
                  </div>
                  <span className="cou-wk-cap">Semaine {weekIdx + 1} / {weekLabels.length}</span>
                  {imports.length > 1 && (
                    <div className="cou-plan">
                      <button className="cou-wk-btn" onClick={() => goToImport(importIndex + 1)} disabled={importIndex >= imports.length - 1} aria-label="Plan précédent"><ChevronLeft size={14} /></button>
                      <span className="cou-plan-lbl">{importLabel || 'Plan'}</span>
                      <button className="cou-wk-btn" onClick={() => goToImport(importIndex - 1)} disabled={importIndex <= 0} aria-label="Plan suivant"><ChevronRight size={14} /></button>
                    </div>
                  )}
                </>
              ) : imports.length > 1 ? (
                <>
                  <div className="cou-wk">
                    <button className="cou-wk-btn" onClick={() => goToImport(importIndex + 1)} disabled={importIndex >= imports.length - 1} aria-label="Semaine précédente"><ChevronLeft size={15} /></button>
                    <b>{activeWeek || importLabel}</b>
                    <button className="cou-wk-btn" onClick={() => goToImport(importIndex - 1)} disabled={importIndex <= 0} aria-label="Semaine suivante"><ChevronRight size={15} /></button>
                  </div>
                  <span className="cou-wk-cap">Semaine {imports.length - importIndex} / {imports.length}</span>
                </>
              ) : (
                <div className="cou-wk"><b>{activeWeek || importLabel || 'Semaine en cours'}</b></div>
              )}
            </section>
          )}

          {/* Rayons (onglets latéraux = parcours) */}
          <section className="cou-rsec cou-rsec-grow">
            <span className="v21-bl">Rayons</span>
            <div className="cou-tabs" role="tablist" aria-label="Filtrer par rayon">
              <button
                role="tab" aria-selected={showAll}
                className={`cou-tab cou-tab-all${showAll ? ' on' : ''}`}
                onClick={() => setActiveRayon('TOUT')}
              >
                <span className="cou-tab-nm">Tout</span>
                <span className="cou-tab-c">{totalCount}</span>
              </button>
              {categories.map((cat, i) => {
                const catItems   = groupedItems[cat]
                const catChecked = catItems.filter(it => it.checked).length
                const on = currentRayon === cat
                return (
                  <button
                    key={cat}
                    role="tab" aria-selected={on}
                    className={`cou-tab${on ? ' on' : ''}`}
                    onClick={() => setActiveRayon(cat)}
                  >
                    <span className="cou-tab-pip">{catChecked === catItems.length ? <Check size={11} /> : i + 1}</span>
                    <span className="cou-tab-nm">{cat}</span>
                    <span className="cou-tab-c">{catChecked} / {catItems.length}</span>
                    <span className="cou-tab-mini"><span className="cou-tab-mini-f" style={{ width: `${catItems.length ? (catChecked / catItems.length) * 100 : 0}%` }} /></span>
                  </button>
                )
              })}
            </div>
          </section>

        </aside>

        {/* ── MAIN ── */}
        <section className="cou-main">
          {currentRayon === null ? (
            categories.length === 0 ? (
              <div className="v21-empty cou-empty"><p>Aucun article pour cette semaine.</p></div>
            ) : (
              categories.map(cat => {
                const catItems   = groupedItems[cat]
                const catChecked = catItems.filter(it => it.checked).length
                const tint = catTint(cat)
                return (
                  <div key={cat} className="cou-group">
                    <div className="cou-group-h">
                      <span className="v21-bl">{cat}</span>
                      <span className="cou-group-c">{catChecked} / {catItems.length} achetés</span>
                    </div>
                    <div className="cou-grid">{catItems.map(it => renderCard(it, tint))}</div>
                  </div>
                )
              })
            )
          ) : (
            <>
              <header className="cou-rayhead">
                <div className="cou-rayhead-l">
                  <span className="v21-bl">Rayon en cours</span>
                  <h2 className="cou-rayhead-nm">{currentRayon}</h2>
                  <span className="cou-rayhead-meta">{currentChecked} / {currentItems.length} cochés · {currentItems.length - currentChecked} restant{currentItems.length - currentChecked !== 1 ? 's' : ''}</span>
                </div>
                <div className="cou-rayhead-count">
                  <span className="cou-rayhead-count-v">{currentItems.length - currentChecked}</span>
                  <span className="cou-rayhead-count-l">restant{currentItems.length - currentChecked !== 1 ? 's' : ''}</span>
                </div>
              </header>
              <div className="cou-prog cou-rayhead-prog"><div className="cou-prog-fill" style={{ width: `${currentItems.length ? (currentChecked / currentItems.length) * 100 : 0}%` }} /></div>

              <div className="cou-grid">{currentItems.map(it => renderCard(it, catTint(currentRayon)))}</div>

              <div className="cou-parcours">
                <span className="cou-parcours-step">Rayon <b>{currentIndex + 1}</b> / {categories.length}</span>
                <span className="cou-parcours-mid">{currentItems.length - currentChecked} article{currentItems.length - currentChecked !== 1 ? 's' : ''} restant{currentItems.length - currentChecked !== 1 ? 's' : ''} dans ce rayon</span>
                <span className="cou-parcours-nav">
                  <button
                    className="cou-parcours-btn ghost"
                    disabled={currentIndex <= 0}
                    onClick={() => currentIndex > 0 && setActiveRayon(categories[currentIndex - 1])}
                  >
                    <ChevronLeft size={14} /> Précédent
                  </button>
                  <button
                    className="cou-parcours-btn next"
                    disabled={currentIndex >= categories.length - 1}
                    onClick={() => currentIndex < categories.length - 1 && setActiveRayon(categories[currentIndex + 1])}
                  >
                    {currentIndex < categories.length - 1 ? categories[currentIndex + 1] : 'Fin'} <ChevronRight size={14} />
                  </button>
                </span>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Bouton principal sticky « Ranger mes N achats » ── */}
      {itemsToStore.length > 0 && (
        <button
          className="cou-store-btn"
          onClick={openStorageSheet}
          aria-label={`Ranger ${itemsToStore.length} achat${itemsToStore.length !== 1 ? 's' : ''}`}
        >
          <Package size={15} />
          Ranger mes {itemsToStore.length} achat{itemsToStore.length !== 1 ? 's' : ''}
        </button>
      )}

      {/* ── Feuille de rangement ── */}
      {showStorageSheet && storageItems.length > 0 && (
        <StoragePlanSheet
          items={storageItems}
          onClose={() => setShowStorageSheet(false)}
          onItemStored={handleItemStored}
          onDone={handleSheetDone}
        />
      )}

      {/* ── Copie manuelle : le presse-papiers n'a pas pu être écrit ── */}
      {copieManuelle && typeof document !== 'undefined' && createPortal(
        <div className="cou-copy-overlay" onClick={() => setCopieManuelle(null)}>
          <div className="cou-copy-panel" role="dialog" aria-modal="true" aria-labelledby="cou-copy-title" onClick={e => e.stopPropagation()}>
            <div className="cou-copy-head">
              <span className="cou-copy-title" id="cou-copy-title">
                {copieManuelle.raison?.startsWith('partage') ? 'Partage à faire à la main' : 'Copie à faire à la main'}
              </span>
              <button className="cou-copy-close" onClick={() => setCopieManuelle(null)} aria-label="Fermer"><X size={16} /></button>
            </div>
            <p className="cou-copy-msg">
              {MESSAGES_COPIE_MANUELLE[copieManuelle.raison] || 'La sortie demandée n’a pas pu s’exécuter.'}
              {' '}La liste ({copieManuelle.articles} article{copieManuelle.articles > 1 ? 's' : ''}) est ci-dessous, déjà sélectionnée : Ctrl + C, ou ⌘ + C.
            </p>
            <textarea
              ref={zoneCopieRef}
              className="cou-copy-zone"
              readOnly
              value={copieManuelle.texte}
              onFocus={e => e.target.select()}
              aria-label="Texte de la liste de courses à copier"
            />
          </div>
        </div>,
        document.body
      )}

      {/* ── Document imprimable : sortie 3 ─────────────────────────────────────
          Posé en permanence, masqué à l'écran par `.cou-print-doc`, révélé par
          la feuille `@media print` de `courses.css`. `window.print()` est
          synchrone : il n'attendrait pas un rendu React déclenché par le clic,
          et la feuille sortirait vide. Aucun tri ici — les rayons arrivent déjà
          dans leur ordre de parcours. */}
      <section className="cou-print-doc">
        <header className="cou-print-head">
          <h2 className="cou-print-title">{docImprimable.titre}</h2>
          {docImprimable.resume && <p className="cou-print-resume">{docImprimable.resume}</p>}
        </header>
        {docImprimable.compte.articles === 0 ? (
          <p className="cou-print-vide">Aucun article pour cette semaine.</p>
        ) : docImprimable.rayons.map(rayon => (
          <section className="cou-print-rayon" key={rayon.nom}>
            <h3 className="cou-print-rayon-nom">
              {rayon.nom} <span className="cou-print-rayon-n">({rayon.articles.length})</span>
            </h3>
            <ul className="cou-print-list">
              {rayon.articles.map(article => (
                <li className={`cou-print-item${article.achete ? ' achete' : ''}`} key={article.cle}>
                  <span className="cou-print-case">{article.achete ? '✕' : ''}</span>
                  <span className="cou-print-nom">{article.nom}</span>
                  {article.quantite && <span className="cou-print-qte">{article.quantite}</span>}
                  {article.conditionnement && <span className="cou-print-cond">{article.conditionnement}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      {/* ── Toast discret ── */}
      {toast && typeof document !== 'undefined' && createPortal(
        <div key={toast.id} className={`cou-toast ${toast.kind}`} role="status">{toast.msg}</div>,
        document.body
      )}

      {/* ── Sélecteur de photo par article ── */}
      {picker && typeof document !== 'undefined' && createPortal(
        <div className="cou-pick-overlay" onClick={() => setPicker(null)}>
          <div className="cou-pick" onClick={e => e.stopPropagation()}>
            <div className="cou-pick-head">
              <span className="cou-pick-title">{picker.product_name}</span>
              <button className="cou-pick-close" onClick={() => setPicker(null)} aria-label="Fermer"><X size={16} /></button>
            </div>
            <form className="cou-pick-search" onSubmit={e => { e.preventDefault(); fetchCandidates(picker, pickerQuery.trim()) }}>
              <input
                className="cou-pick-input"
                value={pickerQuery}
                onChange={e => setPickerQuery(e.target.value)}
                placeholder="Affiner la recherche (en anglais)…"
              />
              <button type="submit" className="cou-pick-search-btn">Chercher</button>
            </form>
            {pickerLoading ? (
              <div className="cou-pick-msg">Recherche de photos…</div>
            ) : pickerCands.length === 0 ? (
              <div className="cou-pick-msg">Aucune photo trouvée pour ce produit.</div>
            ) : (
              <div className="cou-pick-grid">
                {pickerCands.map((u, i) => (
                  <button key={i} className={`cou-pick-cand${picker.image_url === u ? ' on' : ''}`} onClick={() => chooseImage(u)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            <button className="cou-pick-none" onClick={() => chooseImage(null)}>
              <ImageOff size={13} /> Aucune photo (icône)
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
