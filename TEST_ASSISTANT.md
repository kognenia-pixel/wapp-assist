# Tests — Module Assistant (Studio de l’Assistant)

## Pré-requis
- Worker URL + ADMIN_SECRET + Phone Number ID configurés (onglet Meta / Comptes)
- Sources existantes dans l’onglet Sources (au moins 1 PDF/TXT/URL)
- Dev server : `npm run dev -- --host 0.0.0.0 --force` dans `web-ui` (Windows via `node vite.js`, pas WSL)
- Hard reload : Ctrl+Shift+R (F12 → Network → Disable cache)

## 1. Changement de couleur → accents temps réel
- Aller onglet **Assistant → Apparence** → picker couleur → choisir `#FF3B30`
- Vérifier : boutons `bg-brand`, liens `text-brand`, `focus:border-brand` passent au rouge en temps réel (variable `--brand` sur `:root`)
- Recharger page → couleur persiste (localStorage `wapp-assist-config`)

## 2. Changement d’icône → bulles + aperçu
- Apparence → icône **Étoile** → vérifier aperçu conversation : icône `FiStar` blanche sur fond couleurPrimaire
- Changer **Bouclier** / **Hexagone** → même vérification
- Envoyer config au Worker → vérifier `GET /admin/config?phone_number_id=…` renvoie `apparence.icone`

## 3. Changement de ton → aperçu ton
- Personnalité → Ton **Chaleureux** → aperçu affiche “Avec plaisir ! …”
- Ton **Dynamique** → “Top ! …”, **Analytique** → “Voici une réponse structurée”, **Pédagogue** → “Je vous explique pas à pas”
- Instructions libres → ajouter “Vouvoiement obligatoire” → vérifier que le prompt Worker contient la phrase (voir logs `wrangler tail` ou test Gemini)

## 4. Changement de longueur → aperçu taille
- Comportement → Longueur **Courte** → aperçu “Jus ananas : 12 000 GNF…” (1 phrase)
- **Longue** → 3 phrases + “Souhaitez-vous commander ?” si proactivité
- **Standard** → 1–2 phrases

## 5. Proactivité activée → question de suivi
- Comportement → ☑ Proactivité → aperçu bulle se termine par “Avez-vous d'autres questions ?”
- Envoyer WhatsApp réel : le Worker ajoute la question si la réponse Gemini ne se termine pas par `?`
- Désactiver → question absente

## 6. Délai avant réponse → simulation
- Comportement → Délai **2s** → aperçu indique “(délai 2s)”
- Envoyer WhatsApp : observer `await attendre(2000)` avant `envoyerMeta` (tail `wrangler tail` → écart 2s entre `[gemini]` et `[meta]`)
- 0s → envoi immédiat

## 7. Tutoriel sans voix
- Chercher `speechSynthesis` dans `src` → 0 résultat (hors `kognen-ia`)
- Ouvrir **Tutoriel** → 6 étapes → boutons Retour/Suivant/Terminer → aucune icône `FiVolume` / bouton voix
- `localStorage.getItem("wapp-assist-tuto")` : `{vu, etape}` sans champ `voix`
- Recharger → pas d’appel `window.speechSynthesis`

## 8. Persistance après rechargement
- Modifier les 4 modules → recharger `Ctrl+Shift+R` → toutes valeurs conservées
- Vérifier `localStorage.getItem("wapp-assist-config")` contient JSON complet
- Supprimer `wapp-assist-avatar` → absent (migration propre)

## 9. Worker reçoit config via /admin/config
- `POST /admin/config` avec `x-admin-secret` → 200 `{ok:true}`
- `GET /admin/config?phone_number_id=…` → 200 `{config:{…}}`
- Sans `phone_number_id` → 400
- Sans secret → 401
- Valeur par défaut si jamais envoyée → Worker utilise `CONFIG_DEFAUT` (rétrocompatible)
- Vérifier historique : si `comportement.historique=true` alors `history:<pid>:<from>` créé en KV (TTL 7j), 5 derniers max

## Commandes rapides
```bash
# web-ui
npm run build # doit afficher ✓ 454 modules, pas d'erreur Avatar/voix
curl -s http://localhost:5173/src/App.jsx | grep -q "useAssistantConfig" && echo OK

# worker
node --check worker/src/index.js && echo OK
node -e "import('./worker/src/config.js').then(m=>console.log(m.buildSystemPromptAdditions(m.CONFIG_DEFAUT)))"
```

## Résultat attendu
- `dist/assets/index-*.js` < 1MB, pas de chunk Avatar
- Aucun `ReferenceError: useCallback` (import complet dans App.jsx)
- Interface noir/blanc/vert, animations Framer Motion conservées
