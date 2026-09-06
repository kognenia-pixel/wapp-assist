# Wapp Assist — assistant WhatsApp pour commerces (white-label, auto-hébergé)

Votre assistant WhatsApp qui répond à vos clients 24h/24, avec vos prix et vos produits.
Sans serveur à gérer, sans Docker. L'acheteur déploie tout seul, sans nous contacter.

## Contenu du package

- `worker/` — cerveau Cloudflare (reçoit WhatsApp via Meta, répond via Gemini, fiches par numéro en KV).
- `web/index.html` — page de gestion : 3 onglets (Infos Meta, Produits & Prix, Horaires & FAQ) + bouton « Envoyer au Worker ».
- `setup.sh` — installation guidée (demande vos clés, déploie, vérifie).
- `docs/GUIDE_INSTALL.md` — guide pas-à-pas en français simple.
- `.env.example` — liste des valeurs à fournir (sans vraies clés).

## Démarrage rapide (acheteur)

1. Lisez `docs/GUIDE_INSTALL.md`.
2. Lancez `./setup.sh` et suivez les 6 étapes (clés demandées sans jamais s'afficher).
3. Déployez la page : `npx wrangler pages deploy web --project-name wapp-assist-admin`.
4. Remplissez la page, cliquez « Envoyer au Worker », testez sur WhatsApp (numéro sandbox).

Détail : voir `docs/GUIDE_INSTALL.md`. Ce qui n'est pas encore parfait : voir `docs/RESTE-A-FAIRE.md`.
