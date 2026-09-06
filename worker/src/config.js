// Wapp Assist — configuration de l'assistant (white-label modulaire).
// Stockée en KV : config:<phone_number_id> = { apparence, personnalite, comportement }
// Rétrocompatible : toute absence retombe sur CONFIG_DEFAUT.

export const CONFIG_DEFAUT = {
  apparence: {
    couleurPrimaire: "#10B27E",
    icone: "bot",
    bulle: "arrondi",
    fond: "clair",
  },
  personnalite: {
    ton: "Professionnel",
    niveauLangage: "Standard",
    styleReponse: "Direct",
    instructions: "",
  },
  comportement: {
    longueur: "Standard",
    proactivite: false,
    delai: 0,
    historique: false,
  },
};

const TONS = ["Professionnel", "Chaleureux", "Dynamique", "Analytique", "Pédagogue"];
const NIVEAUX = ["Simple", "Standard", "Soutenu"];
const STYLES = ["Direct", "Explicatif", "Guidé"];
const LONGUEURS = ["Courte", "Standard", "Longue"];
const ICONES = ["bot", "cercle", "etoile", "bouclier", "hexagone"];
const BULLES = ["arrondi", "carre", "asymetrique"];
const FONDS = ["clair", "fonce", "degrade"];

function estCouleurHex(v) {
  return typeof v === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());
}

export function validerConfig(c) {
  const erreurs = [];
  if (!c || typeof c !== "object") return ["config doit être un objet"];
  // apparence
  if (c.apparence) {
    if (c.apparence.couleurPrimaire !== undefined && !estCouleurHex(c.apparence.couleurPrimaire)) erreurs.push("apparence.couleurPrimaire invalide (hex #RRGGBB)");
    if (c.apparence.icone !== undefined && !ICONES.includes(c.apparence.icone)) erreurs.push("apparence.icone invalide");
    if (c.apparence.bulle !== undefined && !BULLES.includes(c.apparence.bulle)) erreurs.push("apparence.bulle invalide");
    if (c.apparence.fond !== undefined && !FONDS.includes(c.apparence.fond)) erreurs.push("apparence.fond invalide");
  }
  if (c.personnalite) {
    if (c.personnalite.ton !== undefined && !TONS.includes(c.personnalite.ton)) erreurs.push("personnalite.ton invalide");
    if (c.personnalite.niveauLangage !== undefined && !NIVEAUX.includes(c.personnalite.niveauLangage)) erreurs.push("personnalite.niveauLangage invalide");
    if (c.personnalite.styleReponse !== undefined && !STYLES.includes(c.personnalite.styleReponse)) erreurs.push("personnalite.styleReponse invalide");
    if (c.personnalite.instructions !== undefined && typeof c.personnalite.instructions !== "string") erreurs.push("personnalite.instructions doit être une chaîne");
  }
  if (c.comportement) {
    if (c.comportement.longueur !== undefined && !LONGUEURS.includes(c.comportement.longueur)) erreurs.push("comportement.longueur invalide");
    if (c.comportement.proactivite !== undefined && typeof c.comportement.proactivite !== "boolean") erreurs.push("comportement.proactivite doit être booléen");
    if (c.comportement.delai !== undefined && ![0, 1, 2, 3].includes(Number(c.comportement.delai))) erreurs.push("comportement.delai invalide (0-3)");
    if (c.comportement.historique !== undefined && typeof c.comportement.historique !== "boolean") erreurs.push("comportement.historique doit être booléen");
  }
  return erreurs;
}

export function normaliserConfig(c) {
  if (!c || typeof c !== "object") return CONFIG_DEFAUT;
  return {
    apparence: { ...CONFIG_DEFAUT.apparence, ...(c.apparence || {}) },
    personnalite: { ...CONFIG_DEFAUT.personnalite, ...(c.personnalite || {}) },
    comportement: { ...CONFIG_DEFAUT.comportement, ...(c.comportement || {}) },
  };
}

export async function lireConfig(pid, env) {
  if (!env.KB) return CONFIG_DEFAUT;
  try {
    const brut = await env.KB.get("config:" + pid);
    if (!brut) return CONFIG_DEFAUT;
    return normaliserConfig(JSON.parse(brut));
  } catch {
    return CONFIG_DEFAUT;
  }
}

export async function ecrireConfig(pid, config, env) {
  if (!env.KB) throw new Error("KV « KB » non configuré");
  const norm = normaliserConfig(config);
  await env.KB.put("config:" + pid, JSON.stringify(norm));
  return norm;
}

// Construit les ajouts de prompt à partir de la config utilisateur.
export function buildSystemPromptAdditions(config) {
  const c = normaliserConfig(config);
  const parties = [];

  // Personnalité — ton
  const tonMap = {
    Professionnel: "Ton professionnel, courtois et posé.",
    Chaleureux: "Ton chaleureux, accueillant et bienveillant.",
    Dynamique: "Ton dynamique, énergique et enthousiaste.",
    Analytique: "Ton analytique, structuré et précis.",
    Pédagogue: "Ton pédagogue, clair et explicatif, pas à pas.",
  };
  parties.push(tonMap[c.personnalite.ton] || tonMap.Professionnel);

  // Niveau de langage
  const niveauMap = {
    Simple: "Niveau de langage simple : phrases courtes, vocabulaire accessible.",
    Standard: "Niveau de langage standard : clair et naturel.",
    Soutenu: "Niveau de langage soutenu : vocabulaire riche et soigné.",
  };
  parties.push(niveauMap[c.personnalite.niveauLangage] || niveauMap.Standard);

  // Style de réponse
  const styleMap = {
    Direct: "Style direct : va à l'essentiel, réponse concise.",
    Explicatif: "Style explicatif : détaille, argumente et donne du contexte.",
    Guidé: "Style guidé : propose des étapes et des suggestions pour guider le client.",
  };
  parties.push(styleMap[c.personnalite.styleReponse] || styleMap.Direct);

  // Longueur
  const longueurMap = {
    Courte: "Longueur courte : 1 à 2 phrases maximum.",
    Standard: "Longueur standard : 1 à 4 phrases.",
    Longue: "Longueur longue : 3 à 6 phrases, détaillée.",
  };
  parties.push(longueurMap[c.comportement.longueur] || longueurMap.Standard);

  // Proactivité
  if (c.comportement.proactivite) {
    parties.push("Proactivité active : termine chaque réponse par une question de suivi pertinente (ex : « Avez-vous d'autres questions ? » ou « Souhaitez-vous passer commande ? »).");
  }

  // Instructions libres
  if (c.personnalite.instructions && c.personnalite.instructions.trim()) {
    parties.push(`Consignes supplémentaires du commerce : ${c.personnalite.instructions.trim()}`);
  }

  // Historique (ne change pas le prompt mais informatif)
  if (c.comportement.historique) {
    parties.push("Mémoire conversationnelle active : tiens compte des 5 derniers échanges fournis dans le contexte.");
  }

  return parties.join(" ");
}

// --- Historique 5 derniers messages (KV par conversation) ---
export async function lireHistorique(pid, expediteur, env) {
  if (!env.KB) return [];
  try {
    const brut = await env.KB.get(`history:${pid}:${expediteur}`);
    if (!brut) return [];
    const arr = JSON.parse(brut);
    return Array.isArray(arr) ? arr.slice(-5) : [];
  } catch {
    return [];
  }
}

export async function ecrireHistorique(pid, expediteur, role, texte, env) {
  if (!env.KB) return;
  try {
    const hist = await lireHistorique(pid, expediteur, env);
    hist.push({ role, texte: String(texte).slice(0, 1000), date: Date.now() });
    const garde = hist.slice(-5);
    await env.KB.put(`history:${pid}:${expediteur}`, JSON.stringify(garde), { expirationTtl: 60 * 60 * 24 * 7 });
  } catch {
    // best-effort
  }
}

export async function traiterAdminConfig(request, env, cors) {
  const secret = request.headers.get("x-admin-secret") || "";
  if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ erreur: "non autorisé" }), { status: 401, headers: { "Content-Type": "application/json", ...cors } });
  }
  const url = new URL(request.url);
  if (request.method === "GET") {
    const pid = String(url.searchParams.get("phone_number_id") || "").trim();
    if (!pid) return new Response(JSON.stringify({ erreur: "phone_number_id manquant" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });
    const cfg = await lireConfig(pid, env);
    return new Response(JSON.stringify({ config: cfg }), { status: 200, headers: { "Content-Type": "application/json", ...cors } });
  }
  if (request.method === "POST") {
    const corps = await request.json().catch(() => null);
    const pid = String((corps && corps.phone_number_id) || "").trim();
    if (!pid) return new Response(JSON.stringify({ erreur: "phone_number_id manquant" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });
    const erreurs = validerConfig(corps.config);
    if (erreurs.length) return new Response(JSON.stringify({ erreur: "config invalide", details: erreurs }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });
    const norm = await ecrireConfig(pid, corps.config, env);
    return new Response(JSON.stringify({ ok: true, config: norm }), { status: 200, headers: { "Content-Type": "application/json", ...cors } });
  }
  return new Response(JSON.stringify({ erreur: "route inconnue" }), { status: 404, headers: { "Content-Type": "application/json", ...cors } });
}
