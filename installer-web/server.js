require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { Client } = require("ssh2");

const app = express();
const PORT = Number(process.env.PORT || 3001);
const INSTALLER_SECRET = (process.env.INSTALLER_SECRET || "").trim();
const SETUP_SH_URL = (process.env.SETUP_SH_URL || "https://raw.githubusercontent.com/ton-compte/wapp-assist/main/setup.sh").trim();
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || "*").trim();
const LICENSE_CODE = (process.env.LICENSE_CODE || "WAPP-LIC-2026").trim();

// Meta / fournisseur de solution (360Dialog, ChatMitra, Ominiflow, direct)
const META_PROVIDER = (process.env.META_PROVIDER || "direct").trim().toLowerCase(); // direct | 360dialog | chatmitra | ominiflow
const META_CLIENT_ID = (process.env.META_CLIENT_ID || "").trim();
const META_CLIENT_SECRET = (process.env.META_CLIENT_SECRET || "").trim();
const META_REDIRECT_URI = (process.env.META_REDIRECT_URI || `http://localhost:${PORT}/auth/meta/callback`).trim();
const META_SCOPE = (process.env.META_SCOPE || "whatsapp_business_management,whatsapp_business_messaging,business_management,public_profile").trim();
const META_AUTH_URL = (process.env.META_AUTH_URL || "").trim(); // override fournisseur
const META_TOKEN_URL = (process.env.META_TOKEN_URL || "").trim();

// In-memory jobs : jamais persistés, jamais loggés avec secrets
const JOBS = new Map(); // jobId -> { status, logs, createdAt, clients:Set, workerUrl, error }
// In-memory Meta sessions : state -> { status, token, phoneNumberId, displayPhone, wabaId, businessName, error, createdAt }
const META_SESSIONS = new Map();

// CORS + body
app.use(cors({ origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: false }));

// Frontend statique (avant les routes API pour servir les assets, mais les routes /auth/* restent accessibles via next())
app.use(express.static(path.join(__dirname, "frontend")));

// Middleware secret (header X-Installer-Secret) — pas pour /auth/status ni /api/health
function requireSecret(req, res, next) {
  if (!INSTALLER_SECRET) return next();
  const got = String(req.headers["x-installer-secret"] || "").trim();
  if (got !== INSTALLER_SECRET) return res.status(401).json({ erreur: "INSTALLER_SECRET invalide" });
  next();
}

// Utils
function masquerSecrets(texte, secrets) {
  let out = String(texte || "");
  for (const s of secrets) {
    if (!s || s.length < 3) continue;
    out = out.split(s).join("***");
  }
  return out;
}

function parseCookies(req) {
  const out = {};
  const h = req.headers.cookie || "";
  h.split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function getMetaCookie(req) {
  const c = parseCookies(req);
  return (c.wapp_meta_state || "").trim();
}

function buildMetaAuthUrl(state) {
  // Fournisseur spécifique si META_AUTH_URL fourni (360Dialog etc.)
  if (META_AUTH_URL) {
    const u = new URL(META_AUTH_URL);
    if (!u.searchParams.get("state")) u.searchParams.set("state", state);
    if (!u.searchParams.get("redirect_uri")) u.searchParams.set("redirect_uri", META_REDIRECT_URI);
    if (!u.searchParams.get("client_id") && META_CLIENT_ID) u.searchParams.set("client_id", META_CLIENT_ID);
    return u.toString();
  }
  // Direct Meta OAuth (Embedded Signup)
  if (!META_CLIENT_ID) return null;
  const u = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  u.searchParams.set("client_id", META_CLIENT_ID);
  u.searchParams.set("redirect_uri", META_REDIRECT_URI);
  u.searchParams.set("state", state);
  u.searchParams.set("scope", META_SCOPE);
  u.searchParams.set("response_type", "code");
  return u.toString();
}

function buildMetaTokenUrl() {
  if (META_TOKEN_URL) return META_TOKEN_URL;
  return "https://graph.facebook.com/v21.0/oauth/access_token";
}

async function exchangeCodeForToken(code) {
  const tokenUrl = buildMetaTokenUrl();
  const params = new URLSearchParams({
    client_id: META_CLIENT_ID,
    client_secret: META_CLIENT_SECRET,
    redirect_uri: META_REDIRECT_URI,
    code: String(code || "").trim(),
  });
  // 360Dialog et Meta acceptent GET avec query, mais on tente POST aussi
  let r;
  try {
    r = await fetch(`${tokenUrl}?${params.toString()}`, { method: "GET" });
  } catch (e) {
    throw new Error(`Échange token échoué : ${e.message}`);
  }
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`Échange token HTTP ${r.status} : ${t.slice(0, 400)}`);
  }
  const j = await r.json().catch(() => ({}));
  const token = j.access_token || j.accessToken || j.token;
  if (!token) throw new Error(`Token absent dans réponse : ${JSON.stringify(j).slice(0, 400)}`);
  return { token, raw: j };
}

async function fetchPhoneNumbers(token) {
  // Essaye plusieurs endpoints (WhatsApp Business API)
  const headers = { Authorization: `Bearer ${token}` };
  const tries = [
    `https://graph.facebook.com/v21.0/me/phone_numbers?fields=id,display_phone_number,verified_name,code_verification_status`,
    `https://graph.facebook.com/v21.0/me?fields=phone_numbers{id,display_phone_number}`,
    `https://graph.facebook.com/v21.0/me/businesses?fields=id,name,phone_numbers`,
  ];
  // 1. Direct /me/phone_numbers
  for (const url of tries) {
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) continue;
      const j = await r.json().catch(() => null);
      if (!j) continue;
      // Parsing selon forme
      // {data:[{id, display_phone_number}]}
      const data = j.data || (j.phone_numbers && j.phone_numbers.data) || [];
      if (Array.isArray(data) && data.length) {
        const first = data[0];
        // Si business avec phone_numbers imbriqués
        if (first.phone_numbers && Array.isArray(first.phone_numbers.data) && first.phone_numbers.data.length) {
          const pn = first.phone_numbers.data[0];
          return { phoneNumberId: String(pn.id), displayPhone: String(pn.display_phone_number || pn.displayPhone || ""), wabaId: String(first.id || ""), raw: j };
        }
        if (first.id) {
          return { phoneNumberId: String(first.id), displayPhone: String(first.display_phone_number || first.displayPhone || ""), wabaId: String(j.waba_id || j.id || ""), raw: j };
        }
      }
      // Cas {id, display_phone_number} direct
      if (j.id && j.display_phone_number) {
        return { phoneNumberId: String(j.id), displayPhone: String(j.display_phone_number), wabaId: String(j.waba_id || ""), raw: j };
      }
    } catch {}
  }
  // Fallback : debug token pour au moins valider le token
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`, { headers });
    if (r.ok) {
      const j = await r.json().catch(() => null);
      if (j && j.data && j.data.is_valid === false) throw new Error(`Token invalide : ${j.data.error?.message || "is_valid false"}`);
    }
  } catch {}
  throw new Error("Aucun numéro WhatsApp trouvé pour ce token — vérifiez que le numéro a bien été ajouté et vérifié (SMS) dans le flux.");
}

function validerCorps(b, metaSession) {
  const e = [];
  const req = (k, label) => {
    if (!b[k] || !String(b[k]).trim()) e.push(`Champ « ${label} » manquant`);
  };
  req("host", "Adresse IP / domaine");
  req("username", "Utilisateur SSH");
  if (!b.password && !b.privateKey) e.push("Mot de passe OU clé privée requis");
  req("geminiKey", "Clé Gemini");
  // WhatsApp : soit via Meta OAuth connecté, soit via champs manuels
  const hasMeta = !!(metaSession && metaSession.status === "connected" && metaSession.phoneNumberId && metaSession.token);
  if (!hasMeta) {
    req("whatsappToken", "Token Meta WhatsApp");
    req("phoneNumberId", "Phone Number ID");
  }
  req("adminSecret", "ADMIN_SECRET");
  req("verifyToken", "VERIFY_TOKEN");
  if (b.host && /[<>\s;`$]/.test(b.host)) e.push("Host invalide");
  if (b.username && /[^a-zA-Z0-9._-]/.test(b.username)) e.push("Utilisateur SSH invalide");
  return e;
}

function genererScriptInstall(env) {
  return `#!/usr/bin/env bash
set -u
VERT='\\033[0;32m'; ROUGE='\\033[0;31m'; JAUNE='\\033[1;33m'; RESET='\\033[0m'
ok()   { printf "\${VERT}OK — %s\${RESET}\\n" "$1"; }
ko()   { printf "\${ROUGE}ERREUR — %s\${RESET}\\n" "$1"; }
info() { printf "\${JAUNE}%s\${RESET}\\n" "$1"; }
command_exists() { command -v "$1" >/dev/null 2>&1; }

echo "=== Wapp Assist — installation (via installateur web) ==="
echo "Hôte: $(hostname) — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

info "[1/6] Vérification des outils..."
command_exists node || { ko "Node.js absent. Installez Node 22+ : https://nodejs.org"; exit 1; }
command_exists npx || { ko "npx absent."; exit 1; }
command_exists curl || { ko "curl absent."; exit 1; }
ok "node/npx/curl présents."

if [ -n "\${CLOUDFLARE_API_TOKEN:-}" ]; then
  export CLOUDFLARE_API_TOKEN
  info "CLOUDFLARE_API_TOKEN détecté (*** masqué)."
fi
if [ -n "\${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  export CLOUDFLARE_ACCOUNT_ID
fi

if npx wrangler whoami >/dev/null 2>&1; then
  ok "Cloudflare connecté (wrangler)."
else
  info "Cloudflare : wrangler whoami a échoué — vérifiez CLOUDFLARE_API_TOKEN ou lancez 'npx wrangler login' sur le serveur."
fi

for v in GEMINI_API_KEY WHATSAPP_TOKEN VERIFY_TOKEN ADMIN_SECRET PHONE_NUMBER_ID; do
  eval "val=\\$$v"
  if [ -z "\${val:-}" ]; then ko "$v vide."; exit 1; fi
done
ok "Secrets présents (non affichés)."

BRAND_NAME="\${BRAND_NAME:-}"
BRAND_WHATSAPP_NUMBER="\${BRAND_WHATSAPP_NUMBER:-}"
BRAND_COLOR="\${BRAND_COLOR:-}"
BRAND_LOGO_URL="\${BRAND_LOGO_URL:-}"

if [ ! -d worker ]; then
  if [ -n "\${SETUP_SH_URL:-}" ]; then
    info "Téléchargement de setup.sh depuis \$SETUP_SH_URL..."
    curl -fsSL "\$SETUP_SH_URL" -o /tmp/setup.sh 2>&1 | head -20 || true
  fi
  if [ ! -d worker ]; then
    ko "Dossier worker/ introuvable. Uploadez wapp-assist.zip sur le serveur et décompressez-le, puis relancez."
    echo "Exemple : scp wapp-assist.zip \${USER:-root}@\${HOST:-serveur}:/tmp && ssh ... 'unzip -o /tmp/wapp-assist.zip -d /opt/wapp-assist && cd /opt/wapp-assist && bash setup.sh'"
    exit 1
  fi
fi

info "[3/6] Déploiement du Worker..."
cd worker || exit 1
npm install --no-audit --no-fund || { ko "npm install a échoué."; exit 1; }

KV_ID=""
if grep -q 'id = "VOTRE_KV_ID_ICI"' wrangler.toml 2>/dev/null || ! grep -q '\\[\\[kv_namespaces\\]\\]' wrangler.toml; then
  info "Création du stockage KV..."
  KV_OUT=$(npx wrangler kv namespace create KB 2>&1) || { ko "Création KV impossible."; echo "$KV_OUT" | head -40; exit 1; }
  KV_ID=$(echo "$KV_OUT" | grep -oE '[0-9a-f]{32}' | head -1)
  if [ -z "$KV_ID" ]; then ko "KV créé mais id illisible."; echo "$KV_OUT"; exit 1; fi
  if grep -q 'VOTRE_KV_ID_ICI' wrangler.toml; then
    sed -i "s/VOTRE_KV_ID_ICI/$KV_ID/" wrangler.toml
  else
    printf '\\n[[kv_namespaces]]\\nbinding = "KB"\\nid = "%s"\\n' "$KV_ID" >> wrangler.toml
  fi
  ok "Stockage KV créé."
else
  ok "Stockage KV déjà configuré."
fi

npx wrangler deploy || { ko "Déploiement impossible. Vérifiez wrangler login + CLOUDFLARE_API_TOKEN."; exit 1; }
WORKER_URL=$(npx wrangler deployments list 2>/dev/null | grep -oE 'https://[a-z0-9.-]+\\.workers\\.dev' | head -1)
if [ -z "$WORKER_URL" ]; then
  NAME=$(grep -oE '^name\\s*=\\s*"[^"]+"' wrangler.toml | head -1 | cut -d'"' -f2)
  if [ -n "$NAME" ]; then WORKER_URL="https://$NAME.workers.dev"; fi
fi
ok "Worker déployé."
if [ -n "$WORKER_URL" ]; then echo "URL : $WORKER_URL"; fi

info "[4/6] Enregistrement des secrets Cloudflare..."
printf '%s' "$GEMINI_API_KEY" | npx wrangler secret put GEMINI_API_KEY >/dev/null || { ko "secret GEMINI_API_KEY refusé."; exit 1; }
printf '%s' "$WHATSAPP_TOKEN" | npx wrangler secret put WHATSAPP_TOKEN >/dev/null || { ko "secret WHATSAPP_TOKEN refusé."; exit 1; }
printf '%s' "$VERIFY_TOKEN" | npx wrangler secret put VERIFY_TOKEN >/dev/null || { ko "secret VERIFY_TOKEN refusé."; exit 1; }
printf '%s' "$ADMIN_SECRET" | npx wrangler secret put ADMIN_SECRET >/dev/null || { ko "secret ADMIN_SECRET refusé."; exit 1; }
[ -n "$BRAND_NAME" ] && printf '%s' "$BRAND_NAME" | npx wrangler secret put BRAND_NAME >/dev/null || true
[ -n "$BRAND_COLOR" ] && printf '%s' "$BRAND_COLOR" | npx wrangler secret put BRAND_COLOR >/dev/null || true
[ -n "$BRAND_WHATSAPP_NUMBER" ] && printf '%s' "$BRAND_WHATSAPP_NUMBER" | npx wrangler secret put BRAND_WHATSAPP_NUMBER >/dev/null || true
[ -n "$BRAND_LOGO_URL" ] && printf '%s' "$BRAND_LOGO_URL" | npx wrangler secret put BRAND_LOGO_URL >/dev/null || true
ok "Secrets enregistrés."

echo ""
info "[5/6] Page de gestion (à déployer si besoin)..."
echo "  npx wrangler pages deploy ../web-ui --project-name wapp-assist-admin"
echo ""

info "[6/6] Webhook Meta (à faire dans votre navigateur, 2 minutes)..."
echo "1) Meta Developer > votre app > WhatsApp > Configuration :"
if [ -n "$WORKER_URL" ]; then echo "   Callback URL = $WORKER_URL"; fi
echo "   Verify token = (celui saisi — identique côté Meta)"
echo "   Cliquez Vérifier et enregistrer."
echo "2) Champs webhook > Gérer > cochez messages."
echo "3) API Setup : ajoutez votre numéro perso en destinataire de test."
echo ""
echo 'Test rapide : curl -s "$WORKER_URL/health"  # {"status":"ok"}'
echo ""
ok "Installation terminée. Ouvrez la page web pour envoyer votre fiche boutique."
echo "Rappel : aucun secret n'a été affiché."
`;
}

// SSE helper
function sseHeaders(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
}
function sseSend(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ----------------- META OAUTH -----------------
app.get("/auth/meta", (req, res) => {
  // Si pas de META_CLIENT_ID configuré, on renvoie une page d'aide + mode simulation
  if (!META_CLIENT_ID) {
    // Mode démo : on simule une connexion réussie après 1.5s (pour tester sans Meta)
    const state = crypto.randomUUID();
    const sess = { state, status: "pending", createdAt: Date.now() };
    META_SESSIONS.set(state, sess);
    res.cookie = res.cookie || (() => {});
    // Simule directement en mémoire
    setTimeout(() => {
      sess.status = "connected";
      sess.phoneNumberId = "1182016931669434";
      sess.displayPhone = "+1 (555) 141-8006";
      sess.wabaId = "28351454684456221";
      sess.token = "SIMULATED_TOKEN_NE_PAS_UTILISER_EN_PROD";
      sess.businessName = "Ma Boutique Démo (simulation)";
      sess.connectedAt = Date.now();
    }, 1200);
    res.cookie("wapp_meta_state", state, { httpOnly: false, sameSite: "Lax", path: "/", maxAge: 30 * 60 * 1000 });
    return res.redirect(`/?meta=simulated&state=${encodeURIComponent(state)}`);
  }

  const state = crypto.randomBytes(16).toString("hex");
  const sess = { state, status: "pending", createdAt: Date.now() };
  META_SESSIONS.set(state, sess);
  // GC 30 min
  setTimeout(() => { if (META_SESSIONS.get(state)?.status === "pending") META_SESSIONS.delete(state); }, 30 * 60 * 1000);

  const authUrl = buildMetaAuthUrl(state);
  if (!authUrl) return res.status(500).send("META_CLIENT_ID manquant — configurez .env");

  res.cookie("wapp_meta_state", state, { httpOnly: false, sameSite: "Lax", path: "/", maxAge: 30 * 60 * 1000 });
  return res.redirect(authUrl);
});

app.get("/auth/meta/callback", async (req, res) => {
  const code = String(req.query.code || "").trim();
  const state = String(req.query.state || "").trim();
  const error = String(req.query.error || "").trim();
  const errorDesc = String(req.query.error_description || "").trim();

  // Vérif state (CSRF)
  const cookies = parseCookies(req);
  const cookieState = (cookies.wapp_meta_state || "").trim();
  // On accepte state query OU cookie, mais on exige correspondance si les deux présents
  const effectiveState = state || cookieState;
  if (!effectiveState) return res.status(400).send("State manquant (CSRF). Recommencez le flux depuis le bouton Connecter.");
  if (state && cookieState && state !== cookieState) {
    return res.status(400).send("State invalide (CSRF) — cookies ou onglet expiré. Recommencez.");
  }
  const sess = META_SESSIONS.get(effectiveState);
  if (!sess) return res.status(400).send("Session Meta expirée ou inconnue. Recommencez depuis le bouton Connecter.");

  if (error) {
    sess.status = "error";
    sess.error = `${error}: ${errorDesc}`.trim();
    return res.redirect(`/?meta=error&reason=${encodeURIComponent(sess.error)}`);
  }
  if (!code) {
    sess.status = "error";
    sess.error = "Code d'autorisation manquant";
    return res.redirect(`/?meta=error&reason=${encodeURIComponent(sess.error)}`);
  }

  sess.status = "exchanging";
  try {
    const { token } = await exchangeCodeForToken(code);
    sess.token = token;
    // Récupère phone_number_id
    try {
      const pn = await fetchPhoneNumbers(token);
      sess.phoneNumberId = pn.phoneNumberId;
      sess.displayPhone = pn.displayPhone;
      sess.wabaId = pn.wabaId;
      sess.businessName = pn.raw?.verified_name || pn.raw?.name || "";
    } catch (e) {
      // Token valide mais pas de numéro : on garde le token, l'utilisateur devra finir la vérif SMS côté Meta
      sess.phoneNumberId = "";
      sess.displayPhone = "";
      sess.error = e.message;
      // On considère quand même connecté si token obtenu, mais avec avertissement
    }
    sess.status = "connected";
    sess.connectedAt = Date.now();
    res.cookie("wapp_meta_state", effectiveState, { httpOnly: false, sameSite: "Lax", path: "/", maxAge: 30 * 60 * 1000 });
    // GC 30 min après connexion
    setTimeout(() => META_SESSIONS.delete(effectiveState), 30 * 60 * 1000);
    return res.redirect(`/?meta=connected&phone=${encodeURIComponent(sess.displayPhone || "")}`);
  } catch (e) {
    sess.status = "error";
    sess.error = e.message;
    return res.redirect(`/?meta=error&reason=${encodeURIComponent(e.message.slice(0, 500))}`);
  }
});

app.get("/auth/status", (req, res) => {
  const state = getMetaCookie(req) || String(req.query.state || "").trim();
  if (!state) return res.json({ connected: false, reason: "no_state" });
  const sess = META_SESSIONS.get(state);
  if (!sess) return res.json({ connected: false, reason: "expired" });
  if (sess.status === "connected") {
    return res.json({
      connected: true,
      phoneNumberId: sess.phoneNumberId || null,
      displayPhone: sess.displayPhone || null,
      wabaId: sess.wabaId || null,
      businessName: sess.businessName || null,
      hasToken: !!sess.token,
    });
  }
  if (sess.status === "error") return res.json({ connected: false, error: sess.error || "unknown", status: sess.status });
  return res.json({ connected: false, status: sess.status });
});

app.post("/auth/meta/reset", (req, res) => {
  const state = getMetaCookie(req);
  if (state) META_SESSIONS.delete(state);
  res.clearCookie("wapp_meta_state", { path: "/" });
  res.json({ ok: true });
});

// Endpoint pour le frontend : récupère l'URL d'auth (pour popup)
app.get("/auth/meta/url", (req, res) => {
  if (!META_CLIENT_ID) {
    return res.json({ ok: false, simulated: true, reason: "META_CLIENT_ID non configuré — mode simulation" });
  }
  const state = crypto.randomBytes(16).toString("hex");
  const sess = { state, status: "pending", createdAt: Date.now() };
  META_SESSIONS.set(state, sess);
  setTimeout(() => { if (META_SESSIONS.get(state)?.status === "pending") META_SESSIONS.delete(state); }, 30 * 60 * 1000);
  const authUrl = buildMetaAuthUrl(state);
  res.cookie("wapp_meta_state", state, { httpOnly: false, sameSite: "Lax", path: "/", maxAge: 30 * 60 * 1000 });
  res.json({ ok: true, authUrl, state });
});

// ----------------- LICENSE VERIFICATION -----------------
app.post("/api/verify-license", (req, res) => {
  const code = String(req.body?.code || "").trim();
  if (!code) return res.status(400).json({ valid: false, error: "Code de licence requis" });
  if (code === LICENSE_CODE) {
    return res.json({ valid: true, redirectUrl: "https://wapp-installer-frontend.pages.dev" });
  }
  return res.status(401).json({ valid: false, error: "Code invalide. Veuillez contacter le support." });
});

// ----------------- INSTALL -----------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "wapp-assist-installer", time: new Date().toISOString(), metaProvider: META_PROVIDER, metaConfigured: !!META_CLIENT_ID });
});

app.get("/api/install/:jobId", (req, res) => {
  const j = JOBS.get(req.params.jobId);
  if (!j) return res.status(404).json({ erreur: "job inconnu" });
  res.json({ jobId: req.params.jobId, status: j.status, workerUrl: j.workerUrl || null, error: j.error || null, logsCount: j.logs.length });
});

app.get("/api/install/:jobId/stream", (req, res) => {
  const j = JOBS.get(req.params.jobId);
  if (!j) return res.status(404).json({ erreur: "job inconnu" });
  sseHeaders(res);
  const ping = setInterval(() => res.write(": ping\n\n"), 15000);
  j.clients.add(res);
  for (const l of j.logs) sseSend(res, "log", l);
  sseSend(res, "status", { status: j.status, workerUrl: j.workerUrl || null });
  if (j.status === "success" || j.status === "error") {
    sseSend(res, "done", { status: j.status, workerUrl: j.workerUrl || null, error: j.error || null });
  }
  req.on("close", () => {
    clearInterval(ping);
    j.clients.delete(res);
    try { res.end(); } catch {}
  });
});

app.post("/api/install", requireSecret, async (req, res) => {
  const b = req.body || {};
  const metaState = getMetaCookie(req) || String(b.metaState || "").trim();
  const metaSession = metaState ? META_SESSIONS.get(metaState) : null;
  const hasMeta = !!(metaSession && metaSession.status === "connected" && metaSession.token && metaSession.phoneNumberId);

  const erreurs = validerCorps(b, metaSession);
  if (erreurs.length) return res.status(400).json({ erreur: "validation", details: erreurs });

  // Résout les secrets WhatsApp : priorité à la session Meta connectée
  const resolvedWhatsappToken = hasMeta ? metaSession.token : String(b.whatsappToken || "").trim();
  const resolvedPhoneNumberId = hasMeta ? metaSession.phoneNumberId : String(b.phoneNumberId || "").trim();
  const resolvedDisplayPhone = hasMeta ? metaSession.displayPhone : "";

  const jobId = crypto.randomUUID();
  const job = { status: "running", logs: [], clients: new Set(), createdAt: Date.now(), workerUrl: null, error: null };
  JOBS.set(jobId, job);
  res.json({ jobId, status: "running", meta: hasMeta ? { phoneNumberId: resolvedPhoneNumberId, displayPhone: resolvedDisplayPhone } : null });

  const secrets = [b.geminiKey, resolvedWhatsappToken, b.adminSecret, b.verifyToken, b.privateKey, b.password, b.cloudflareApiToken].filter(Boolean);
  const pushLog = (line, level = "info") => {
    const safe = masquerSecrets(String(line || ""), secrets);
    const entry = { t: new Date().toISOString(), level, line: safe };
    job.logs.push(entry);
    for (const c of job.clients) sseSend(c, "log", entry);
  };
  const pushStatus = () => {
    for (const c of job.clients) sseSend(c, "status", { status: job.status, workerUrl: job.workerUrl });
  };
  const finish = (status, workerUrl, error) => {
    job.status = status;
    job.workerUrl = workerUrl || job.workerUrl;
    job.error = error || null;
    pushStatus();
    for (const c of job.clients) sseSend(c, "done", { status, workerUrl: job.workerUrl, error: job.error });
    setTimeout(() => JOBS.delete(jobId), 30 * 60 * 1000);
  };

  if (hasMeta) pushLog(`✅ WhatsApp connecté via Meta : ${resolvedDisplayPhone || resolvedPhoneNumberId} (token permanent, *** masqué)`, "info");

  const isSimu = ["demo", "simulate", "simulation", "test"].includes(String(b.host).trim().toLowerCase());
  if (isSimu || b.simulate === true) {
    pushLog("=== Wapp Assist — installation (SIMULATION) ===", "info");
    const steps = [
      "[1/6] Vérification des outils... OK — node/npx/curl présents.",
      hasMeta ? `[2/6] WhatsApp connecté : ${resolvedDisplayPhone || resolvedPhoneNumberId}` : "[2/6] Secrets présents (non affichés).",
      "[3/6] Déploiement du Worker... (simulé)",
      "  -> KV créé : 2140aa550dd443e5846295fded6e7f84",
      "  -> Worker déployé : https://wapp-assist-worker-demo.workers.dev",
      "[4/6] Secrets enregistrés.",
      "[5/6] Page de gestion prête.",
      "[6/6] Webhook Meta — à faire dans votre navigateur.",
      "OK — Installation terminée (simulation).",
    ];
    let i = 0;
    const iv = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(iv);
        job.workerUrl = "https://wapp-assist-worker-demo.workers.dev";
        finish("success", job.workerUrl, null);
        return;
      }
      pushLog(steps[i], "info");
      for (const c of job.clients) sseSend(c, "progress", { step: i + 1, total: steps.length });
      i++;
    }, 650);
    return;
  }

  const host = String(b.host).trim();
  const port = Number(b.port || 22);
  const username = String(b.username).trim() || "root";
  const password = b.password ? String(b.password) : undefined;
  const privateKey = b.privateKey ? String(b.privateKey) : undefined;
  const remotePath = String(b.remotePath || "/opt/wapp-assist").trim() || "/opt/wapp-assist";

  pushLog(`Connexion SSH à ${username}@${host}:${port} ...`, "info");
  const conn = new Client();
  let finished = false;
  const doFinish = (st, url, err) => { if (!finished) { finished = true; try { conn.end(); } catch {} finish(st, url, err); } };

  conn.on("ready", () => {
    pushLog("SSH connecté.", "info");
    const envExports = [
      `export GEMINI_API_KEY=${JSON.stringify(String(b.geminiKey))}`,
      `export WHATSAPP_TOKEN=${JSON.stringify(String(resolvedWhatsappToken))}`,
      `export VERIFY_TOKEN=${JSON.stringify(String(b.verifyToken))}`,
      `export ADMIN_SECRET=${JSON.stringify(String(b.adminSecret))}`,
      `export PHONE_NUMBER_ID=${JSON.stringify(String(resolvedPhoneNumberId))}`,
      `export BRAND_NAME=${JSON.stringify(String(b.brandName || ""))}`,
      `export BRAND_COLOR=${JSON.stringify(String(b.brandColor || "#10B27E"))}`,
      `export BRAND_WHATSAPP_NUMBER=${JSON.stringify(String(b.brandWhatsapp || resolvedDisplayPhone || ""))}`,
      `export BRAND_LOGO_URL=${JSON.stringify(String(b.brandLogoUrl || ""))}`,
      `export CLOUDFLARE_API_TOKEN=${JSON.stringify(String(b.cloudflareApiToken || ""))}`,
      `export CLOUDFLARE_ACCOUNT_ID=${JSON.stringify(String(b.cloudflareAccountId || ""))}`,
      `export SETUP_SH_URL=${JSON.stringify(SETUP_SH_URL)}`,
      `export WORKER_URL=""`,
    ].join("\n");
    const script = genererScriptInstall();
    const remoteCmd = `
set -e
mkdir -p ${JSON.stringify(remotePath)}
cd ${JSON.stringify(remotePath)}
if [ ! -d worker ] && [ ! -f setup.sh ]; then
  echo "[installateur] worker/ absent — tentative de récupération via SETUP_SH_URL..."
  curl -fsSL "$SETUP_SH_URL" -o /tmp/setup.sh 2>&1 | head -20 || true
fi
cat > /tmp/wapp-install.sh <<'__WAPP_EOF__'
${script}
__WAPP_EOF__
chmod +x /tmp/wapp-install.sh
${envExports}
bash /tmp/wapp-install.sh 2>&1
echo "__WAPP_EXIT__:$?"
`;
    conn.exec(remoteCmd, { pty: false }, (err, stream) => {
      if (err) {
        pushLog(`SSH exec échouée : ${err.message}`, "error");
        return doFinish("error", null, err.message);
      }
      let buf = "";
      let workerUrl = null;
      stream.on("close", (code) => {
        if (buf.trim()) buf.split("\n").forEach((l) => l.trim() && pushLog(l, "info"));
        if (workerUrl) job.workerUrl = workerUrl;
        if (code === 0) {
          pushLog("✅ Installation terminée.", "info");
          doFinish("success", workerUrl || job.workerUrl, null);
        } else {
          pushLog(`ERREUR — setup.sh a quitté avec le code ${code}`, "error");
          doFinish("error", workerUrl || job.workerUrl, `setup.sh exit ${code}`);
        }
      });
      stream.on("data", (data) => {
        const txt = data.toString("utf8");
        buf += txt;
        const m = txt.match(/https:\/\/[a-z0-9-]+\.workers\.dev/);
        if (m) workerUrl = m[0];
        let lines = buf.split("\n");
        buf = lines.pop();
        for (const l of lines) if (l.trim()) pushLog(l, "info");
      });
      stream.stderr.on("data", (data) => {
        const txt = data.toString("utf8");
        txt.split("\n").forEach((l) => l.trim() && pushLog(l, "error"));
      });
    });
  }).on("error", (err) => {
    pushLog(`SSH connexion échouée : ${err.message}`, "error");
    let hint = "";
    if (/All configured authentication methods failed/.test(err.message)) hint = " — vérifiez mot de passe / clé privée et utilisateur.";
    if (/Timed out/.test(err.message)) hint = " — hôte injoignable ou port 22 fermé.";
    if (hint) pushLog(hint, "error");
    doFinish("error", null, err.message + hint);
  }).connect({
    host, port, username,
    password: password || undefined,
    privateKey: privateKey || undefined,
    readyTimeout: 15000,
    keepaliveInterval: 10000,
  });
  setTimeout(() => {
    if (job.status === "running") {
      pushLog("Timeout 20 min — installation interrompue.", "error");
      doFinish("error", job.workerUrl, "timeout 20 min");
    }
  }, 20 * 60 * 1000);
});

app.post("/api/command", requireSecret, (req, res) => {
  const b = req.body || {};
  const cmd = [
    `export GEMINI_API_KEY='***'`,
    `export WHATSAPP_TOKEN='***'`,
    `export VERIFY_TOKEN='${String(b.verifyToken || "mon_verif_2026")}'`,
    `export ADMIN_SECRET='${String(b.adminSecret || "mon_secret_long")}'`,
    `export PHONE_NUMBER_ID='${String(b.phoneNumberId || "123...")}'`,
    `bash -c "$(curl -fsSL ${SETUP_SH_URL})"`,
  ].join(" && ");
  res.json({ command: cmd, note: "Remplacez *** par vos vraies clés (ne les collez jamais en public). Ou utilisez l'installateur SSH / Connecter avec Meta." });
});

// Frontend fallback SPA
app.get("*", (req, res) => {
  const p = path.join(__dirname, "frontend", "index.html");
  if (fs.existsSync(p)) return res.sendFile(p);
  res.status(404).send("frontend/index.html manquant — lancez depuis installer-web/");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[installer] http://0.0.0.0:${PORT} — secret ${INSTALLER_SECRET ? "configuré" : "NON CONFIGURÉ (dev ouvert)"} — Meta ${META_CLIENT_ID ? `configuré (${META_PROVIDER})` : "NON CONFIGURÉ (simulation)"}`);
});
