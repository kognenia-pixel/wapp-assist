# Reste à faire — version finale (honnête)

## Testé dans cette session
- Syntaxe JS : `node --check` sur worker/src/*.js.
- Page web : logique de construction KB + appel POST /admin/kb relus (pas de test navigateur automatisé ici).
- setup.sh : relu (bash -n), non exécuté de bout en bout (nécessite comptes Cloudflare + Meta réels).

## À faire avant vente à grande échelle
1. Test E2E réel sur environnement vierge : setup.sh complet + page + message WhatsApp sandbox -> réponse grounded (preuve : logs + capture).
2. Token Meta permanent : documenter la création via utilisateur système (sinon le token 24h expire et le bot se tait).
3. Page web : test multi-navigateurs (mobile), gestion d'un catalogue > 50 produits (pagination), import CSV.
4. Marque blanche : appliquer BRAND_COLOR/LOGO dans la page (actuellement neutre Tailwind).
5. Mises à jour payantes (100 000 GNF/mois) : définir le mécanisme (lien privé de nouvelle version, pas codé ici).
6. Wapp Stack (agences) : session suivante — dashboard, BRAND_* dans compose, install.sh VPS.
