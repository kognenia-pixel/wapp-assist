#!/usr/bin/env bash
# Wapp Assist — installation guidée (acheteur autonome).
# N'affiche JAMAIS de secret. Accompagne l'acheteur, ne clique pas à sa place Meta.
set -u

VERT='\033[0;32m'; ROUGE='\033[0;31m'; JAUNE='\033[1;33m'; RESET='\033[0m'
ok()   { printf "${VERT}OK — %s${RESET}\n" "$1"; }
ko()   { printf "${ROUGE}ERREUR — %s${RESET}\n" "$1"; }
info() { printf "${JAUNE}%s${RESET}\n" "$1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_DIR="$SCRIPT_DIR/worker"

command_exists() { command -v "$1" >/dev/null 2>&1; }

echo "=== Wapp Assist — installation ==="
echo "Ce script vous guide. Il ne crée NI app Meta NI token à votre place :"
echo "il vous donne les liens exacts, puis vérifie ce que vous collez."
echo ""

# 1. Pré-requis
info "[1/6] Vérification des outils..."
command_exists node || { ko "Node.js absent. Installez Node 22+ puis relancez."; exit 1; }
command_exists npx || { ko "npx absent (livré avec Node). Réinstallez Node."; exit 1; }
command_exists curl || { ko "curl absent. Installez curl puis relancez."; exit 1; }
ok "node/npx/curl présents."

if npx wrangler whoami >/dev/null 2>&1; then
  ok "Cloudflare connecté (wrangler)."
else
  echo ""
  info "Cloudflare : pas de compte détecté."
  echo "Créez un compte gratuit (sans carte) sur https://dash.cloudflare.com/sign-up"
  echo "Puis connectez-vous avec :  npx wrangler login"
  echo "Relancez ensuite ce script :  ./setup.sh"
  exit 1
fi

# 2. Clés (jamais affichées, jamais loggées)
echo ""
info "[2/6] Vos clés (collées ici, jamais affichées ni enregistrées en clair dans les logs)..."
printf "Clé Gemini (https://aistudio.google.com/apikey) : "
read -rs GEMINI_API_KEY; echo ""
printf "Token Meta WhatsApp (Meta Developer > votre app > WhatsApp > API Setup > Generate token) : "
read -rs WHATSAPP_TOKEN; echo ""
printf "VERIFY_TOKEN (inventez une phrase, ex: mon_verif_2026 — à recopier côté Meta) : "
read -rs VERIFY_TOKEN; echo ""
printf "ADMIN_SECRET (inventez une phrase longue — à recopier dans la page web) : "
read -rs ADMIN_SECRET; echo ""
printf "Phone Number ID Meta (WhatsApp > API Setup, ex: 123456789...) : "
read -r PHONE_NUMBER_ID

[ -z "$GEMINI_API_KEY" ] && { ko "GEMINI_API_KEY vide."; exit 1; }
[ -z "$WHATSAPP_TOKEN" ] && { ko "WHATSAPP_TOKEN vide."; exit 1; }
[ -z "$VERIFY_TOKEN" ] && { ko "VERIFY_TOKEN vide."; exit 1; }
[ -z "$ADMIN_SECRET" ] && { ko "ADMIN_SECRET vide."; exit 1; }
[ -z "$PHONE_NUMBER_ID" ] && { ko "PHONE_NUMBER_ID vide."; exit 1; }
ok "Clés saisies (non affichées)."

# Marque blanche
echo ""
info "Marque blanche (affichée à vos clients, modifiable plus tard)..."
printf "Nom de votre boutique (ex: Ma Boutique) : "
read -r BRAND_NAME
printf "Numéro WhatsApp public (ex: +224 6XX XX XX XX) : "
read -r BRAND_WHATSAPP_NUMBER
printf "Couleur (ex: #12A66B, vide = défaut) : "
read -r BRAND_COLOR
printf "URL logo (optionnel, vide = aucun) : "
read -r BRAND_LOGO_URL

# 3. Déploiement Worker
echo ""
info "[3/6] Déploiement du Worker..."
cd "$WORKER_DIR" || exit 1
npm install --no-audit --no-fund || { ko "npm install a échoué."; exit 1; }

# KV : crée si absent, sinon réutilise
KV_ID=""
if grep -q 'id = "VOTRE_KV_ID_ICI"' wrangler.toml 2>/dev/null || ! grep -q '\[\[kv_namespaces\]\]' wrangler.toml; then
  info "Création du stockage KV..."
  KV_OUT=$(npx wrangler kv namespace create KB 2>&1) || { ko "Création KV impossible. Copiez le message ci-dessous (sans secret) à votre vendeur."; echo "$KV_OUT"; exit 1; }
  KV_ID=$(echo "$KV_OUT" | grep -oE '[0-9a-f]{32}' | head -1)
  if [ -z "$KV_ID" ]; then ko "KV créé mais id illisible. Relancez."; exit 1; fi
  # Remplace le bloc placeholder
  if grep -q 'VOTRE_KV_ID_ICI' wrangler.toml; then
    sed -i "s/VOTRE_KV_ID_ICI/$KV_ID/" wrangler.toml
  else
    printf '\n[[kv_namespaces]]\nbinding = "KB"\nid = "%s"\n' "$KV_ID" >> wrangler.toml
  fi
  ok "Stockage KV créé."
else
  ok "Stockage KV déjà configuré."
fi

npx wrangler deploy || { ko "Déploiement impossible. Vérifiez wrangler login + compte Cloudflare."; exit 1; }
WORKER_URL=$(npx wrangler deployments list 2>/dev/null | grep -oE 'https://[a-z0-9.-]+\.workers\.dev' | head -1)
ok "Worker déployé."
[ -n "$WORKER_URL" ] && echo "URL : $WORKER_URL"

# 4. Secrets (via stdin, jamais en argument/ligne de commande)
echo ""
info "[4/6] Enregistrement des secrets Cloudflare..."
printf '%s' "$GEMINI_API_KEY" | npx wrangler secret put GEMINI_API_KEY >/dev/null || { ko "secret GEMINI_API_KEY refusé."; exit 1; }
printf '%s' "$WHATSAPP_TOKEN" | npx wrangler secret put WHATSAPP_TOKEN >/dev/null || { ko "secret WHATSAPP_TOKEN refusé."; exit 1; }
printf '%s' "$VERIFY_TOKEN" | npx wrangler secret put VERIFY_TOKEN >/dev/null || { ko "secret VERIFY_TOKEN refusé."; exit 1; }
printf '%s' "$ADMIN_SECRET" | npx wrangler secret put ADMIN_SECRET >/dev/null || { ko "secret ADMIN_SECRET refusé."; exit 1; }
[ -n "$BRAND_NAME" ] && printf '%s' "$BRAND_NAME" | npx wrangler secret put BRAND_NAME >/dev/null
[ -n "$BRAND_COLOR" ] && printf '%s' "$BRAND_COLOR" | npx wrangler secret put BRAND_COLOR >/dev/null
[ -n "$BRAND_WHATSAPP_NUMBER" ] && printf '%s' "$BRAND_WHATSAPP_NUMBER" | npx wrangler secret put BRAND_WHATSAPP_NUMBER >/dev/null
[ -n "$BRAND_LOGO_URL" ] && printf '%s' "$BRAND_LOGO_URL" | npx wrangler secret put BRAND_LOGO_URL >/dev/null
ok "Secrets enregistrés."

# 5. Page web
echo ""
info "[5/6] Page de gestion (web/)..."
echo "Déployez-la (gratuit) avec :"
echo "  npx wrangler pages deploy ../web --project-name wapp-assist-admin"
echo "Puis ouvrez l'URL fournie et remplissez les 3 onglets."
echo "(Non fait automatiquement : relancez cette commande quand vous voulez.)"

# 6. Webhook Meta + test sandbox
echo ""
info "[6/6] Webhook Meta (à faire dans votre navigateur, 2 minutes)..."
echo "1) Meta Developer > votre app > WhatsApp > Configuration :"
[ -n "$WORKER_URL" ] && echo "   Callback URL = $WORKER_URL"
echo "   Verify token = (celui saisi à l'étape 2 — identique, sinon Meta refuse)"
echo "   Cliquez Vérifier et enregistrer."
echo "2) Même page > Champs webhook > Gérer > cochez « messages »."
echo "3) WhatsApp > API Setup : ajoutez votre numéro perso en destinataire de test,"
echo "   envoyez-lui un message depuis le numéro sandbox, vérifiez la réponse."
echo ""
echo "Test rapide (remplacez les 3 valeurs, secrets jamais affichés ici) :"
echo '  curl -s "$WORKER_URL/health"   # doit renvoyer {"status":"ok",...}'
echo ""
ok "Installation terminée. Ouvrez la page web pour envoyer votre fiche boutique."
echo "Rappel : aucun secret n'a été affiché ni enregistré dans ce dépôt."
