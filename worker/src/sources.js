// Wapp Assist — Sources externes (mini-RAG par commerce).
// Une source = texte fourni par le commerçant (fichier extrait côté
// navigateur, ou URL récupérée ici). Stockage INLINE dans le KV :
//   sources:<phoneNumberId> = [{ id, nom, type, date, chunks: [{ h, t, v }] }]
// Inline (plutôt qu'une clé par chunk) = 1 seule lecture KV par message,
// donc latence et quota divisés. Isolation stricte par phone_number_id.
// Tout échec (fetch, embedding, KV) est best-effort : jamais de crash,
// jamais de blocage de la réponse WhatsApp.

const MAX_SOURCES = 10;
const MOTS_PAR_CHUNK = 500;
const CHEVAUCHEMENT = 50;
const MAX_CARACTERES_SOURCE = 200000;
const MAX_CHUNKS_SOURCE = 200;
const TOP_K = 3;
const SEUIL_SCORE = 0.3;

function json(donnees, statut = 200, cors = {}) {
  return new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

// FNV-1a hexadécimal — id stable d'un chunk (déduplication).
function hashTexte(texte) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

export function decouperChunks(texte) {
  const mots = String(texte || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  const chunks = [];
  for (let i = 0; i < mots.length; i += MOTS_PAR_CHUNK - CHEVAUCHEMENT) {
    const part = mots.slice(i, i + MOTS_PAR_CHUNK).join(" ");
    if (part) chunks.push(part);
    if (i + MOTS_PAR_CHUNK >= mots.length) break;
  }
  return chunks.slice(0, MAX_CHUNKS_SOURCE);
}

export function similariteCosinus(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const MODELES_EMBEDDING = [
  "models/gemini-embedding-001",
  "models/text-embedding-004",
  "models/embedding-001",
];

async function embedTexte(texte, env, requete = false) {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY manquant");
  const contenu = String(texte || "").slice(0, 8000);
  if (!contenu.trim()) throw new Error("texte vide");
  let derniereErreur = null;
  for (const modele of MODELES_EMBEDDING) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${modele}:embedContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: modele,
            content: { parts: [{ text: contenu }] },
            taskType: requete ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
          }),
        }
      );
      if (!r.ok) {
        const detail = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} ${detail.slice(0, 120)}`);
      }
      const d = await r.json();
      const valeurs = d?.embedding?.values;
      if (!valeurs || !valeurs.length) throw new Error("embedding vide");
      return valeurs;
    } catch (e) {
      derniereErreur = e;
      if (!/404|not found/i.test(e.message)) throw e;
    }
  }
  throw derniereErreur || new Error("embedding impossible");
}

function nettoyerHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function texteDepuisUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    throw new Error("URL invalide");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("URL http(s) requise");
  const r = await fetch(u.toString(), {
    headers: { "User-Agent": "WappAssist/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`URL injoignable (HTTP ${r.status})`);
  const type = r.headers.get("content-type") || "";
  if (!/text|html/i.test(type)) throw new Error("l'URL ne renvoie pas une page texte/HTML");
  const brut = await r.text();
  if (brut.length > MAX_CARACTERES_SOURCE * 3) throw new Error("page trop volumineuse");
  const texte = nettoyerHtml(brut).slice(0, MAX_CARACTERES_SOURCE);
  if (texte.length < 50) throw new Error("aucun texte exploitable sur cette page");
  return texte;
}

async function lireSources(pid, env) {
  if (!env.KB) throw new Error("KV « KB » non configuré");
  const brut = await env.KB.get("sources:" + pid);
  return brut ? JSON.parse(brut) : [];
}

// --- API admin : GET (liste) / POST (ajout) / DELETE (suppression) ---
export async function traiterAdminSources(request, env, cors) {
  const secret = request.headers.get("x-admin-secret") || "";
  if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    return json({ erreur: "non autorisé" }, 401, cors);
  }
  if (request.method === "GET") {
    const pidGet = String(new URL(request.url).searchParams.get("phone_number_id") || "").trim();
    if (!pidGet) return json({ erreur: "phone_number_id manquant (?phone_number_id=…)" }, 400, cors);
    try {
      const sources = await lireSources(pidGet, env);
      return json(
        {
          sources: sources.map((s) => ({
            nom: s.nom,
            type: s.type,
            date: s.date,
            chunks: s.chunks.length,
            // Bonus : aperçu du contenu indexé (sans les vecteurs)
            extrait: (s.chunks[0]?.t || "").slice(0, 200),
          })),
        },
        200,
        cors
      );
    } catch (e) {
      return json({ erreur: e.message }, 500, cors);
    }
  }
  if (request.method === "DELETE") {
    const corps = await request.json().catch(() => null);
    const pid = String((corps && corps.phone_number_id) || "").trim();
    const nom = String((corps && corps.nom) || "").trim();
    if (!pid || !nom) return json({ erreur: "phone_number_id et nom requis" }, 400, cors);
    try {
      const sources = await lireSources(pid, env);
      await env.KB.put("sources:" + pid, JSON.stringify(sources.filter((s) => s.nom !== nom)));
      return json({ ok: true }, 200, cors);
    } catch (e) {
      return json({ erreur: e.message }, 500, cors);
    }
  }
  if (request.method !== "POST") return json({ erreur: "route inconnue" }, 404, cors);

  const corps = await request.json().catch(() => null);
  const pid = String((corps && corps.phone_number_id) || "").trim();
  const type = String((corps && corps.type) || "").trim();
  const nom = String((corps && corps.nom) || "").trim();
  if (!pid) return json({ erreur: "phone_number_id manquant" }, 400, cors);
  if (!["file", "url", "text"].includes(type)) return json({ erreur: "type invalide (file|url|text)" }, 400, cors);
  if (!nom) return json({ erreur: "nom manquant" }, 400, cors);

  try {
    let texte = "";
    if (type === "url") {
      texte = await texteDepuisUrl(String(corps.content || corps.url || ""));
    } else {
      texte = String(corps.content || "").slice(0, MAX_CARACTERES_SOURCE);
      if (texte.trim().length < 50) {
        return json({ erreur: "contenu trop court (50 caractères minimum)" }, 400, cors);
      }
    }
    const morceaux = decouperChunks(texte);
    if (!morceaux.length) return json({ erreur: "aucun contenu indexable" }, 400, cors);

    const sources = await lireSources(pid, env);
    if (!sources.some((s) => s.nom === nom) && sources.length >= MAX_SOURCES) {
      return json({ erreur: `limite de ${MAX_SOURCES} sources par compte` }, 400, cors);
    }
    const chunks = [];
    for (const m of morceaux) {
      const v = await embedTexte(m, env, false);
      chunks.push({ h: hashTexte(m), t: m.slice(0, 2000), v });
    }
    const source = {
      id: hashTexte(pid + nom + Date.now()),
      nom,
      type,
      date: new Date().toISOString().slice(0, 10),
      chunks,
    };
    const autres = sources.filter((s) => s.nom !== nom);
    autres.push(source);
    await env.KB.put("sources:" + pid, JSON.stringify(autres));
    return json({ ok: true, nom, chunks: chunks.length }, 200, cors);
  } catch (e) {
    console.error("[sources] échec indexation :", e.message);
    return json({ erreur: e.message }, 500, cors);
  }
}

// --- Recherche : top chunks pour enrichir le prompt Gemini ---
export async function searchSources(question, pid, env) {
  try {
    const sources = await lireSources(pid, env);
    const tous = sources.flatMap((s) => s.chunks.map((c) => ({ ...c, source: s.nom })));
    if (!tous.length) return "";
    const vq = await embedTexte(question, env, true);
    const notes = tous
      .map((c) => ({ c, score: similariteCosinus(vq, c.v) }))
      .filter((x) => x.score > SEUIL_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);
    if (!notes.length) return "";
    return notes.map((x) => `[${x.c.source}] ${x.c.t}`).join("\n---\n");
  } catch (e) {
    console.error("[sources] recherche impossible :", e.message);
    return "";
  }
}
