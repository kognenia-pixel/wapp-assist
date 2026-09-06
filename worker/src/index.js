// Wapp Assist — Worker Cloudflare minimal (white-label).
// Reçoit les messages WhatsApp (Meta Cloud API) -> Gemini -> répond.
// Fiches par numéro en KV (kb:<phone_number_id>), via /admin/kb.
// AUCUN secret en dur. AUCUNE marque en dur (voir lireMarque).

import { DEFAULT_KB } from "./clients.js";
import { PHRASE_ABSENT, construireInstruction, validerKb } from "./kb.js";
import { searchSources, traiterAdminSources } from "./sources.js";
import {
  buildSystemPromptAdditions,
  ecrireHistorique,
  lireConfig,
  lireHistorique,
  traiterAdminConfig,
} from "./config.js";

const REPLI_FALLBACK = "Merci pour votre message ! Notre équipe vous répond très vite.";
const MODELES_GEMINI = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-pro-latest", "gemini-1.5-flash", "gemini-2.0-flash-lite"];

function lireMarque(env) {
  return {
    name: (env.BRAND_NAME || "").trim(),
    color: (env.BRAND_COLOR || "").trim(),
    whatsapp: (env.BRAND_WHATSAPP_NUMBER || "").trim(),
    logo: (env.BRAND_LOGO_URL || "").trim(),
  };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-secret, Authorization",
};

function json(donnees, statut = 200) {
  return new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function reponseTexte(texte, statut = 200, type = "text/plain; charset=utf-8") {
  return new Response(texte, { status: statut, headers: { "Content-Type": type, ...CORS } });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...CORS } });
    }
    const url = new URL(request.url);
    if (url.pathname === "/admin/kb") return traiterAdminKb(request, env);
    if (url.pathname === "/admin/config") {
      return traiterAdminConfig(request, env, CORS).catch((e) =>
        json({ erreur: e.message }, 500)
      );
    }
    if (url.pathname === "/admin/sources") {
      return traiterAdminSources(request, env, CORS).catch((e) =>
        json({ erreur: e.message }, 500)
      );
    }
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ status: "ok", service: "wapp-assist-worker" });
    }
    if (request.method === "GET") return verifierWebhook(url, env);
    if (request.method === "POST") {
      const corps = await request.json().catch(() => null);
      ctx.waitUntil(
        traiterMessage(corps, env).catch((e) => console.error("[wapp] ERREUR :", e.message))
      );
      return reponseTexte("OK", 200);
    }
    return reponseTexte("Méthode non supportée", 405);
  },
};

function verifierWebhook(url, env) {
  const mode = url.searchParams.get("hub.mode");
  const jeton = url.searchParams.get("hub.verify_token");
  const defi = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && jeton === env.VERIFY_TOKEN && defi !== null) {
    return reponseTexte(defi, 200);
  }
  return reponseTexte("Vérification refusée", 403);
}

// --- Admin /admin/kb (protégé par x-admin-secret) ---
async function traiterAdminKb(request, env) {
  const secret = request.headers.get("x-admin-secret") || "";
  if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    return json({ erreur: "non autorisé" }, 401);
  }
  if (request.method === "GET") {
    if (!env.KB) return json({ erreur: "KV « KB » non configuré" }, 500);
    const { keys } = await env.KB.list({ prefix: "kb:" });
    const clients = [];
    for (const cle of keys) {
      const id = cle.name.slice(3);
      try {
        const brut = await env.KB.get(cle.name);
        const d = brut ? JSON.parse(brut) : null;
        clients.push({ phone_number_id: id, nom: (d && d.nom) || "" });
      } catch (e) {
        console.error("[admin] KB illisible " + id);
      }
    }
    return json({ clients });
  }
  if (request.method === "POST") {
    if (!env.KB) return json({ erreur: "KV « KB » non configuré" }, 500);
    const corps = await request.json().catch(() => null);
    if (!corps || typeof corps !== "object") {
      return json({ erreur: "corps JSON requis : {phone_number_id, kb}" }, 400);
    }
    const pid = String(corps.phone_number_id || "").trim();
    if (!pid) return json({ erreur: "phone_number_id manquant" }, 400);
    const erreurs = validerKb(corps.kb);
    if (erreurs.length) return json({ erreur: "fiche invalide", details: erreurs }, 400);
    await env.KB.put("kb:" + pid, JSON.stringify(corps.kb));
    return json({ ok: true });
  }
  if (request.method === "DELETE") {
    if (!env.KB) return json({ erreur: "KV « KB » non configuré" }, 500);
    const corps = await request.json().catch(() => null);
    const pid = String((corps && corps.phone_number_id) || "").trim();
    if (!pid) return json({ erreur: "phone_number_id manquant" }, 400);
    await env.KB.delete("kb:" + pid);
    return json({ ok: true });
  }
  return json({ erreur: "route inconnue" }, 404);
}

// --- Messages WhatsApp entrants ---
function attendre(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function traiterMessage(corps, env) {
  if (!corps || !corps.entry?.[0]?.changes?.[0]) return;
  const valeur = corps.entry[0].changes[0].value || {};
  if (valeur.statuses?.length) return; // accusés de lecture
  const message = valeur.messages?.[0];
  if (!message || message.type !== "text" || !message.text?.body) return;
  const expediteur = message.from;
  const texte = message.text.body;
  const pid = valeur.metadata?.phone_number_id;
  if (!expediteur || !pid) return;

  const marque = lireMarque(env);
  let kb = DEFAULT_KB;
  try {
    if (env.KB) {
      const brut = await env.KB.get("kb:" + pid);
      if (brut) kb = JSON.parse(brut);
    }
  } catch (e) {
    console.error("[wapp] lecture KB impossible, démo utilisée");
  }

  let config = null;
  let historique = [];
  try {
    config = await lireConfig(pid, env);
    if (config?.comportement?.historique) {
      historique = await lireHistorique(pid, expediteur, env);
    }
  } catch (e) {
    console.error("[config] lecture ignorée :", e.message);
  }

  // Contexte RAG : best-effort, jamais bloquant
  let contexteSources = "";
  try {
    contexteSources = await searchSources(texte, pid, env);
  } catch (e) {
    console.error("[sources] recherche ignorée :", e.message);
  }

  // Stocke le message utilisateur si historique activé (avant réponse)
  if (config?.comportement?.historique) {
    try {
      await ecrireHistorique(pid, expediteur, "user", texte, env);
    } catch {
      // best-effort
    }
  }

  let reponse;
  try {
    reponse = await demanderGemini(texte, kb, marque, env, contexteSources, config, historique);
  } catch (e) {
    console.error("[gemini] échec :", e.message);
    reponse = REPLI_FALLBACK;
  }

  // Proactivité : ajoute question de suivi si activée et absente
  try {
    if (config?.comportement?.proactivite && reponse && !/[?？]\s*$/.test(reponse.trim())) {
      const suivi = config?.personnalite?.ton === "Chaleureux"
        ? " Avez-vous d'autres questions ? Je suis là pour vous aider !"
        : config?.personnalite?.ton === "Dynamique"
          ? " Souhaitez-vous passer commande ?"
          : " Avez-vous d'autres questions ?";
      reponse = reponse.trim() + suivi;
    }
  } catch {
    // ignore
  }

  // Délai avant réponse (effet humain)
  try {
    const delai = Number(config?.comportement?.delai || 0);
    if (delai > 0 && delai <= 3) await attendre(delai * 1000);
  } catch {
    // ignore
  }

  try {
    await envoyerMeta(expediteur, reponse, pid, env);
    if (config?.comportement?.historique) {
      await ecrireHistorique(pid, expediteur, "assistant", reponse, env);
    }
  } catch (e) {
    console.error("[meta] échec envoi :", e.message);
  }
}

async function demanderGemini(texte, kb, marque, env, contexteSources = "", config = null, historique = []) {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY manquant");
  const baseInstruction = construireInstruction(kb, marque);
  const additions = config ? buildSystemPromptAdditions(config) : "";
  const contexteHistorique =
    historique && historique.length
      ? `\nHistorique récent (5 derniers messages) :\n${historique.map((h) => `${h.role === "user" ? "Client" : "Assistant"} : ${h.texte}`).join("\n")}\n`
      : "";
  const instruction =
    baseInstruction +
    (additions ? `\n\nConsignes d'apparence et de comportement : ${additions}` : "") +
    contexteHistorique +
    (contexteSources
      ? `\nContexte issu de vos sources (documents fournis par le commerce, fiables — utilisez-les en priorité) :\n${contexteSources}\n`
      : "");
  let derniereErreur = null;
  for (const modele of MODELES_GEMINI) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: texte }] }],
            systemInstruction: { parts: [{ text: instruction }] },
          }),
        }
      );
      if (!r.ok) {
        const detail = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} ${detail.slice(0, 120)}`);
      }
      const d = await r.json();
      const txt = d?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!txt) throw new Error("réponse vide");
      return txt;
    } catch (e) {
      console.error(`[gemini] échec ${modele} : ${e.message}`);
      derniereErreur = e;
    }
  }
  throw derniereErreur || new Error("Gemini indisponible");
}

async function envoyerMeta(expediteur, texte, pid, env) {
  if (!env.WHATSAPP_TOKEN) throw new Error("WHATSAPP_TOKEN manquant");
  const r = await fetch(`https://graph.facebook.com/v21.0/${pid}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: expediteur,
      type: "text",
      text: { body: texte },
    }),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} ${detail.slice(0, 120)}`);
  }
}
