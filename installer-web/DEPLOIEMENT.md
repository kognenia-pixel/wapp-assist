# Déploiement public — 5 minutes

## Backend (Render.com — gratuit 750h/mois)

1. Push `installer-web/` sur GitHub (repo privé suffit).
2. Render → New → Web Service → connecte le repo → Root Directory `installer-web`.
3. Build `npm install`, Start `npm start`.
4. Env vars :
   - `INSTALLER_SECRET` = `openssl rand -hex 32` (copie cette valeur, tu la donnes au client payé)
   - `SETUP_SH_URL` = URL raw de `setup.sh` (ton GitHub)
   - `FRONTEND_ORIGIN` = `*` (ou ton domaine Pages)
5. Deploy → URL publique `https://wapp-installer.onrender.com` → teste `https://…/api/health`.

Alternative VPS (Hetzner 4€) : `docker build -t wapp-installer . && docker run -d -p 3001:3001 --env-file .env wapp-installer` derrière Caddy/Nginx HTTPS.

## Frontend (Cloudflare Pages — gratuit)

- Option A : servi par le backend lui-même (`express.static frontend/`) → pas de deploy séparé, `https://wapp-installer.onrender.com/` affiche déjà le formulaire.
- Option B : Pages séparé :
  ```bash
  npx wrangler pages deploy installer-web/frontend --project-name wapp-installer-frontend
  # → https://wapp-installer-frontend.pages.dev
  # Définis FRONTEND_ORIGIN=https://wapp-installer-frontend.pages.dev côté backend
  ```

## URL publique finale à donner au client

- Backend + frontend couplés (le plus simple) : `https://wapp-installer.onrender.com` (une seule URL, formulaire + API).
- Si Pages séparé : frontend `https://installer.wapp-assist.com` → API `https://wapp-installer.onrender.com`.

Teste en simulateur : ouvre l’URL → coche **Mode simulation** → Installer → logs 6/6 → `Worker déployé`.

## Page de vente (même hébergement)

```bash
npx wrangler pages deploy page-vente --project-name wapp-assist-vente
# → https://wapp-assist-vente.pages.dev  (custom domain possible)
```
