// Appels au Worker Wapp Assist (admin /admin/kb, protégé par x-admin-secret).

function baseUrl(url) {
  return String(url || "").trim().replace(/\/$/, "");
}

export async function testerConnexion({ workerUrl, adminSecret }) {
  const base = baseUrl(workerUrl);
  if (!base) throw new Error("Renseignez l'URL du Worker (onglet Meta / Comptes).");
  if (!adminSecret) throw new Error("Renseignez le secret admin (onglet Meta / Comptes).");
  let reponse;
  try {
    reponse = await fetch(base + "/admin/kb", {
      headers: { "x-admin-secret": adminSecret },
    });
  } catch {
    throw new Error("Worker injoignable. Vérifiez l'URL (https://…, sans slash final).");
  }
  if (reponse.status === 401) throw new Error("Secret admin refusé (401). Recopiez-le depuis vos secrets Cloudflare.");
  if (!reponse.ok) throw new Error(`Le Worker répond en erreur (${reponse.status}).`);
  return true;
}

export async function etatWorker(workerUrl) {
  const base = baseUrl(workerUrl);
  if (!base) return "non-configure";
  try {
    const reponse = await fetch(base + "/health", { signal: AbortSignal.timeout(8000) });
    return reponse.ok ? "en-ligne" : "hors-ligne";
  } catch {
    return "hors-ligne";
  }
}

async function appelSources({ workerUrl, adminSecret, methode, corps, query }) {
  const base = baseUrl(workerUrl);
  if (!base) throw new Error("Renseignez l'URL du Worker (onglet Meta / Comptes).");
  if (!adminSecret) throw new Error("Renseignez le secret admin (onglet Meta / Comptes).");
  const url = query ? `${base}/admin/sources?${query}` : `${base}/admin/sources`;
  let reponse;
  try {
    reponse = await fetch(url, {
      method: methode,
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: corps ? JSON.stringify(corps) : undefined,
    });
  } catch {
    throw new Error("Worker injoignable. Vérifiez l'URL et votre connexion.");
  }
  const donnees = await reponse.json().catch(() => ({}));
  if (reponse.status === 401) throw new Error("Secret admin refusé (401).");
  if (!reponse.ok) throw new Error(donnees.erreur ? `Erreur : ${donnees.erreur}` : `Erreur inattendue (${reponse.status}).`);
  return donnees;
}

export const listerSources = (connexion, phoneNumberId) =>
  appelSources({ ...connexion, methode: "GET", query: `phone_number_id=${encodeURIComponent(phoneNumberId)}` });

export const ajouterSource = (connexion, payload) =>
  appelSources({ ...connexion, methode: "POST", corps: payload });

export const supprimerSource = (connexion, phoneNumberId, nom) =>
  appelSources({ ...connexion, methode: "DELETE", corps: { phone_number_id: phoneNumberId, nom } });

export async function envoyerCarnet({ workerUrl, adminSecret, phoneNumberId, kb }) {
  const base = baseUrl(workerUrl);
  let reponse;
  try {
    reponse = await fetch(base + "/admin/kb", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ phone_number_id: phoneNumberId, kb }),
    });
  } catch {
    throw new Error("Worker injoignable. Vérifiez l'URL et votre connexion.");
  }
  const donnees = await reponse.json().catch(() => ({}));
  if (reponse.status === 401) throw new Error("Secret admin refusé (401).");
  if (reponse.status === 400) {
    const details = donnees.details ? " : " + donnees.details.join(" ; ") : "";
    throw new Error(`Fiche refusée (400)${details}`);
  }
  if (reponse.status === 500) throw new Error("Erreur côté Worker (500) : stockage KV non configuré. Relancez setup.sh.");
  if (!reponse.ok) throw new Error(`Erreur inattendue (${reponse.status}).`);
  return donnees;
}

export async function envoyerConfig({ workerUrl, adminSecret, phoneNumberId, config }) {
  const base = baseUrl(workerUrl);
  if (!base) throw new Error("Renseignez l'URL du Worker (onglet Meta / Comptes).");
  if (!adminSecret) throw new Error("Renseignez le secret admin.");
  if (!phoneNumberId) throw new Error("Renseignez le Phone Number ID.");
  let reponse;
  try {
    reponse = await fetch(base + "/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ phone_number_id: phoneNumberId, config }),
    });
  } catch {
    throw new Error("Worker injoignable. Vérifiez l'URL et votre connexion.");
  }
  const donnees = await reponse.json().catch(() => ({}));
  if (reponse.status === 401) throw new Error("Secret admin refusé (401).");
  if (!reponse.ok) throw new Error(donnees.erreur ? `Erreur : ${donnees.erreur}` : `Erreur inattendue (${reponse.status}).`);
  return donnees;
}

export async function chargerConfig({ workerUrl, adminSecret, phoneNumberId }) {
  const base = baseUrl(workerUrl);
  if (!base || !phoneNumberId) return null;
  try {
    const reponse = await fetch(`${base}/admin/config?phone_number_id=${encodeURIComponent(phoneNumberId)}`, {
      headers: { "x-admin-secret": adminSecret },
    });
    if (!reponse.ok) return null;
    const d = await reponse.json().catch(() => null);
    return d?.config || null;
  } catch {
    return null;
  }
}
