# Wapp Assist — Installateur web

Installateur graphique pour clients non techniques. Le client remplit un formulaire, le backend se connecte en SSH à son serveur, exécute `setup.sh` (non-interactif) et stream les logs en temps réel (SSE).

## Architecture

- **Frontend** `frontend/` : HTML/CSS/JS statique, noir/blanc/vert `#10B27E`, barre 6 étapes, console monospace, SSE `EventSource`.
- **Backend** `server.js` : Node + Express + `ssh2`, endpoints SSE, validation, secret, jamais de stockage disque des clés.
- **Sécurité** : header `X-Installer-Secret` = `INSTALLER_SECRET` du `.env` ; CORS ; secrets en mémoire uniquement, masqués `***` dans les logs ; pas d’exécution arbitraire (uniquement `/tmp/wapp-install.sh` généré).

## Démarrage rapide

```bash
cd wapp-assist/installer-web
cp .env.example .env   # renseigne INSTALLER_SECRET (long aléatoire)
npm install
npm start              # http://0.0.0.0:3001
```

Ouvre `http://localhost:3001` dans ton navigateur.

### .env

- `PORT=3001`
- `INSTALLER_SECRET=change-me-tres-long` (requis en prod, header `X-Installer-Secret`)
- `SETUP_SH_URL=https://raw.githubusercontent.com/ton-compte/wapp-assist/main/setup.sh`
- `FRONTEND_ORIGIN=*` (ou `https://ton-frontend.pages.dev`)

### Hébergement

- **Frontend** : `frontend/` est statique → déployable sur Cloudflare Pages (`npx wrangler pages deploy frontend --project-name wapp-assist-installer`).
- **Backend** : petit VPS (1 vCPU) ou packagé avec le ZIP. Derrière HTTPS (reverse proxy Nginx/Caddy). Ne l’expose jamais sans `INSTALLER_SECRET`.

## Utilisation client (PME) — flux “Connecter avec Meta” (sans Meta for Developers)

1. Ouvre l’URL de l’installateur (fournie par toi ou `file://` du ZIP si backend local).
2. Clique **Connecter avec Meta** → choisis ton Business, entre ton numéro, valide le SMS, donne un nom à l’assistant. Le bandeau passe à `✅ WhatsApp connecté : +224 6X XX XX XX`. Plus de token à copier.
3. Remplis : IP/domaine, SSH user (`root`), mot de passe *ou* clé privée PEM, clé Gemini, `ADMIN_SECRET`/`VERIFY_TOKEN` (inventés), Cloudflare Account ID + API Token, marque blanche optionnelle. Les champs `whatsappToken`/`phoneNumberId` sont auto-remplis et masqués.
4. Coche **Mode simulation** pour tester sans déployer (même avec Meta simulé).
5. Clique **Installer Wapp Assist** → logs en direct, barre 1/6…6/6, `Worker : https://…workers.dev` à la fin.
6. Si SSH échoue (port 22 fermé) : **Générer commande fallback** → copie/colle en SSH manuel.

Fallback manuel : déplie “Mode manuel (avancé)” et colle `WHATSAPP_TOKEN` + `Phone Number ID` comme avant.

## Connexion WhatsApp en 1 clic (OAuth)

- **Sans fournisseur** (direct Meta) : crée un compte Tech Provider sur https://developers.facebook.com → app type Business → `META_CLIENT_ID`/`META_CLIENT_SECRET`/`META_REDIRECT_URI` dans `.env`. Flux : `/auth/meta` → `facebook.com/dialog/oauth` → `/auth/meta/callback` → échange `code→token` → `GET /me/phone_numbers`.
- **Avec fournisseur** (recommandé) : 360Dialog / ChatMitra / Ominiflow → `META_PROVIDER=360dialog` + `META_AUTH_URL`/`META_TOKEN_URL` + `META_CLIENT_ID/SECRET`. Le fournisseur renvoie un token permanent directement.
- **Sans config** : si `META_CLIENT_ID` vide, le bouton passe en **simulation** (numéro `+1 (555) 141-8006` / `1182016931669434`) pour tester l’installateur sans dépenser de crédits.
- Besoin client : compte Meta Business (gratuit) + numéro capable de recevoir un SMS. Le client garde la propriété du compte, seules les autorisations `whatsapp_business_*` sont accordées.
- Sécurité : `state` OAuth vérifié (CSRF), token en mémoire `META_SESSIONS` 30 min, jamais en base, `***` dans les logs, `wapp_meta_state` cookie `HttpOnly=false, SameSite=Lax`.

## API

- `GET /api/health` → `{status:"ok", metaProvider, metaConfigured}`
- `GET /auth/meta` → 302 vers Meta/fournisseur (génère `state`, cookie `wapp_meta_state`)
- `GET /auth/meta/url` → `{ok, authUrl, state}` (pour popup)
- `GET /auth/meta/callback` → échange `code`, récupère `phoneNumberId`, `302 → /?meta=connected` ou `?meta=error`
- `GET /auth/status` → `{connected, phoneNumberId, displayPhone, wabaId, hasToken}` (via cookie)
- `POST /auth/meta/reset` → déconnexion
- `POST /api/install` (header `X-Installer-Secret`) body JSON `{host, username, password/privateKey, geminiKey, whatsappToken?, phoneNumberId?, adminSecret, verifyToken, ...}` → `{jobId, meta?:{phoneNumberId}}` (utilise la session Meta si `wapp_meta_state` connecté)
- `GET /api/install/:jobId/stream` → SSE `event: log|progress|status|done` `data: JSON`
- `GET /api/install/:jobId` → statut
- `POST /api/command` → `{command, note}` (placeholders `***` pour secrets)

## Logs & debug

- `masquerSecrets()` remplace chaque secret par `***` avant diffusion.
- Jobs en mémoire 30 min puis GC (`JOBS.delete`).
- Timeout global 20 min, `readyTimeout` SSH 15s.
- `curl -s http://localhost:3001/api/health`

## Tests

1. **Simulation** : host=`demo` → coche simulation → logs 8 lignes en ~5s, `success`, barre 100%, URL demo.
2. **Validation** : envoie sans `geminiKey` → `400 {erreur:"validation", details:[...]}`.
3. **Secret** : `INSTALLER_SECRET=abc` côté backend, requête sans header → `401`.
4. **Vierge** : VPS Ubuntu vierge, `host` réel, clés vraies → `Worker déployé`, `/health` → `{"status":"ok"}`, interface accessible.
5. **Erreur SSH** : mauvais mot de passe → log `All configured authentication methods failed — vérifiez…`, `done {status:"error"}`.

## Packaging dans le ZIP Wapp Assist

- Inclure `installer-web/` tel quel (ou livrer séparément).
- Le client peut aussi lancer l’installateur en local : `npm install && npm start` puis ouvrir `http://localhost:3001`.
- Alternative sans backend : il décompresse `wapp-assist.zip` sur son serveur et lance `bash setup.sh` (guide `docs/GUIDE_INSTALL.md`).

## Garde-fous

- Jamais de `localStorage`/`fichier` pour les clés côté backend.
- Clé privée utilisée uniquement pour `ssh2`, jetée après `conn.end()`.
- Pas d’`eval`/`exec` arbitraire : seul `/tmp/wapp-install.sh` (généré) est exécuté.
