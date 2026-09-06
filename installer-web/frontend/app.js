const API_BASE = (window.API_BASE || "").replace(/\/$/, "");
const $ = (s) => document.querySelector(s);
const formCard = $("#form-card");
const runCard = $("#run-card");
const logsEl = $("#logs");
const bar = $("#bar");
const stepEl = $("#step");
const badge = $("#status-badge");
const workerUrlEl = $("#worker-url");
const formError = $("#form-error");
const cmdOut = $("#cmd-out");
const metaStatus = $("#meta-status");
const metaDetails = $("#meta-details");
const btnMeta = $("#btn-meta");
const btnMetaReset = $("#btn-meta-reset");

let es = null;
let currentJobId = null;
let metaConnected = false;
let metaInfo = null;

function api(path) { return `${API_BASE}${path}`; }

function getForm() {
  return {
    host: $("#host").value.trim(),
    port: $("#port").value.trim() || "22",
    username: $("#username").value.trim() || "root",
    remotePath: $("#remotePath").value.trim() || "/opt/wapp-assist",
    password: $("#password").value,
    privateKey: $("#privateKey").value,
    geminiKey: $("#geminiKey").value.trim(),
    whatsappToken: $("#whatsappToken").value.trim(),
    phoneNumberId: $("#phoneNumberId").value.trim(),
    cloudflareAccountId: $("#cfAccountId").value.trim(),
    cloudflareApiToken: $("#cfApiToken").value.trim(),
    adminSecret: $("#adminSecret").value.trim(),
    verifyToken: $("#verifyToken").value.trim(),
    brandName: $("#brandName").value.trim(),
    brandColor: $("#brandColor").value.trim() || "#10B27E",
    brandWhatsapp: $("#brandWhatsapp").value.trim(),
    brandLogoUrl: $("#brandLogoUrl").value.trim(),
    simulate: $("#simulate").checked,
  };
}

function validate(f) {
  const miss = [];
  if (!f.host) miss.push("Host");
  if (!f.username) miss.push("Utilisateur SSH");
  if (!f.password && !f.privateKey && !f.simulate) miss.push("Mot de passe ou clé privée");
  if (!f.geminiKey) miss.push("Clé Gemini");
  if (!metaConnected) {
    if (!f.whatsappToken) miss.push("WhatsApp (Connecter avec Meta ou coller Token)");
    if (!f.phoneNumberId) miss.push("Phone Number ID (Connecter avec Meta ou coller ID)");
  }
  if (!f.adminSecret) miss.push("ADMIN_SECRET");
  if (!f.verifyToken) miss.push("VERIFY_TOKEN");
  return miss;
}

function appendLog(entry) {
  const line = typeof entry === "string" ? entry : entry.line || JSON.stringify(entry);
  const level = entry.level || "info";
  const t = entry.t ? new Date(entry.t).toLocaleTimeString() : "";
  const span = document.createElement("div");
  span.className = level === "error" ? "log-error" : "log-info";
  span.textContent = (t ? `[${t}] ` : "") + line;
  logsEl.appendChild(span);
  logsEl.scrollTop = logsEl.scrollHeight;
  const m = line.match(/\[(\d)\/6\]/);
  if (m) {
    const n = Number(m[1]);
    bar.style.width = ((n / 6) * 100).toFixed(0) + "%";
    stepEl.textContent = `Étape ${n}/6`;
  }
  if (/Worker déployé|URL : https/.test(line)) {
    const u = line.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/);
    if (u) workerUrlEl.innerHTML = `Worker : <a href="${u[0]}" target="_blank" rel="noreferrer">${u[0]}</a>`;
  }
}

function setStatus(s, workerUrl) {
  badge.textContent = s;
  if (s === "success") { badge.style.background = "#10B27E"; bar.style.width = "100%"; stepEl.textContent = "Étape 6/6 — terminé"; }
  if (s === "error") { badge.style.background = "#c00"; }
  if (workerUrl) workerUrlEl.innerHTML = `Worker : <a href="${workerUrl}" target="_blank" rel="noreferrer">${workerUrl}</a>`;
}

// ---------- META OAUTH ----------
async function refreshMetaStatus() {
  try {
    const r = await fetch(api("/auth/status"), { credentials: "include" });
    const j = await r.json();
    if (j.connected) {
      metaConnected = true;
      metaInfo = j;
      metaStatus.textContent = `✅ WhatsApp connecté : ${j.displayPhone || j.phoneNumberId} ${j.businessName ? "— " + j.businessName : ""}`;
      metaStatus.style.background = "#dcfce7";
      metaStatus.style.borderColor = "#86efac";
      metaDetails.style.display = "block";
      metaDetails.innerHTML = `Phone Number ID : <code>${j.phoneNumberId}</code><br/>WABA : <code>${j.wabaId || "—"}</code><br/>Token : <code>*** (stocké côté serveur, jamais affiché)</code>`;
      btnMeta.style.display = "none";
      btnMetaReset.style.display = "inline-flex";
      // Masque les champs manuels (on les laisse mais on indique qu'ils sont auto-remplis)
      $("#whatsappToken").value = "*** via Meta ***";
      $("#phoneNumberId").value = j.phoneNumberId;
    } else {
      metaConnected = false;
      metaInfo = null;
      if (j.error) {
        metaStatus.textContent = `❌ Erreur Meta : ${j.error} — réessayez`;
        metaStatus.style.background = "#fee2e2";
      } else {
        metaStatus.textContent = "🔌 Non connecté — cliquez sur “Connecter avec Meta”";
        metaStatus.style.background = "#fff";
      }
      metaDetails.style.display = "none";
      btnMeta.style.display = "inline-flex";
      btnMetaReset.style.display = "none";
      if ($("#whatsappToken").value === "*** via Meta ***") $("#whatsappToken").value = "";
    }
  } catch {
    // ignore
  }
}

async function startMetaConnect() {
  metaStatus.textContent = "⏳ Ouverture du flux Meta…";
  try {
    const r = await fetch(api("/auth/meta/url"), { credentials: "include" });
    const j = await r.json().catch(() => ({}));
    if (j.authUrl) {
      // Ouvre popup 600x700
      const w = window.open(j.authUrl, "wapp_meta", "width=600,height=700,scrollbars=yes");
      if (!w) {
        window.location.href = api("/auth/meta");
        return;
      }
      metaStatus.textContent = "⏳ En attente de validation Meta (choisissez Business, numéro, code SMS)…";
      // Poll toutes les 2s
      const iv = setInterval(async () => {
        await refreshMetaStatus();
        if (metaConnected) { clearInterval(iv); try { w.close(); } catch {} }
        // Si popup fermée manuellement, on arrête
        if (w.closed) { clearInterval(iv); setTimeout(refreshMetaStatus, 800); }
      }, 2000);
      // Timeout 5 min
      setTimeout(() => clearInterval(iv), 5 * 60 * 1000);
    } else if (j.simulated) {
      window.location.href = api("/auth/meta");
    } else {
      window.location.href = api("/auth/meta");
    }
  } catch {
    window.location.href = api("/auth/meta");
  }
}

btnMeta.addEventListener("click", (e) => { e.preventDefault(); startMetaConnect(); });
btnMetaReset.addEventListener("click", async (e) => {
  e.preventDefault();
  await fetch(api("/auth/meta/reset"), { method: "POST", credentials: "include" });
  $("#whatsappToken").value = "";
  $("#phoneNumberId").value = "";
  await refreshMetaStatus();
});

// Au chargement : reflète l'état (après callback ?meta=connected)
(async () => {
  const p = new URLSearchParams(window.location.search);
  if (p.get("meta") === "connected") {
    // Nettoie l'URL
    history.replaceState({}, "", window.location.pathname);
  }
  if (p.get("meta") === "error") {
    metaStatus.textContent = `❌ Erreur : ${p.get("reason") || "flux interrompu"}`;
    metaStatus.style.background = "#fee2e2";
    history.replaceState({}, "", window.location.pathname);
  }
  if (p.get("meta") === "simulated") {
    // Simulation réussie
    setTimeout(refreshMetaStatus, 600);
  }
  await refreshMetaStatus();
  // Re-poll toutes les 3s au cas où l'utilisateur revient du flux
  setInterval(refreshMetaStatus, 3000);
})();

// ---------- INSTALL ----------
async function startInstall() {
  formError.textContent = "";
  const f = getForm();
  const miss = validate(f);
  if (miss.length) { formError.textContent = "Manquant : " + miss.join(", "); return; }
  const installerSecret = $("#installerSecret").value.trim();
  formCard.style.display = "none";
  runCard.style.display = "block";
  logsEl.innerHTML = "";
  bar.style.width = "0%";
  stepEl.textContent = "Étape 0/6";
  badge.textContent = "⏳ running";
  badge.style.background = "#000";
  workerUrlEl.textContent = "";

  let jobId;
  try {
    const r = await fetch(api("/api/install"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(installerSecret ? { "X-Installer-Secret": installerSecret } : {}) },
      credentials: "include",
      body: JSON.stringify({
        host: f.host, port: f.port, username: f.username, remotePath: f.remotePath,
        password: f.password || undefined, privateKey: f.privateKey || undefined,
        geminiKey: f.geminiKey,
        // Si Meta connecté, le backend utilisera le token en session (on envoie quand même ce qu'il y a)
        whatsappToken: f.whatsappToken && f.whatsappToken !== "*** via Meta ***" ? f.whatsappToken : undefined,
        phoneNumberId: f.phoneNumberId || undefined,
        cloudflareAccountId: f.cloudflareAccountId, cloudflareApiToken: f.cloudflareApiToken,
        adminSecret: f.adminSecret, verifyToken: f.verifyToken,
        brandName: f.brandName, brandColor: f.brandColor, brandWhatsapp: f.brandWhatsapp, brandLogoUrl: f.brandLogoUrl,
        simulate: f.simulate,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.details ? data.details.join(" ; ") : (data.erreur || `HTTP ${r.status}`));
    jobId = data.jobId;
    currentJobId = jobId;
    if (data.meta) {
      appendLog(`✅ WhatsApp via Meta : ${data.meta.displayPhone || data.meta.phoneNumberId}`, "info");
    }
  } catch (e) {
    appendLog("ERREUR — " + e.message, "error");
    setStatus("error", null);
    return;
  }

  if (es) try { es.close(); } catch {}
  es = new EventSource(api(`/api/install/${encodeURIComponent(jobId)}/stream`), { withCredentials: true });
  es.addEventListener("log", (ev) => { try { appendLog(JSON.parse(ev.data)); } catch { appendLog(ev.data); } });
  es.addEventListener("progress", (ev) => {
    try { const p = JSON.parse(ev.data); bar.style.width = ((p.step / p.total) * 100).toFixed(0) + "%"; stepEl.textContent = `Étape ${p.step}/${p.total}`; } catch {}
  });
  es.addEventListener("status", (ev) => { try { const s = JSON.parse(ev.data); setStatus(s.status, s.workerUrl); } catch {} });
  es.addEventListener("done", (ev) => {
    try {
      const d = JSON.parse(ev.data);
      setStatus(d.status, d.workerUrl);
      if (d.status === "success") appendLog("✅ Installation terminée — ouvrez l'URL du Worker et l'interface.", "info");
      else appendLog("❌ Installation échouée : " + (d.error || "voir logs"), "error");
    } catch {}
    try { es.close(); } catch {}
  });
  es.onerror = () => appendLog("Connexion SSE interrompue — reconnexion...", "error");
}

$("#btn-install").addEventListener("click", (e) => { e.preventDefault(); startInstall(); });
$("#btn-back").addEventListener("click", () => {
  if (es) try { es.close(); } catch {}
  runCard.style.display = "none";
  formCard.style.display = "block";
});
$("#btn-copy-logs").addEventListener("click", async () => {
  const t = logsEl.innerText;
  try { await navigator.clipboard.writeText(t); $("#btn-copy-logs").textContent = "Copié !"; setTimeout(() => $("#btn-copy-logs").textContent = "Copier les logs", 1500); } catch {}
});
$("#btn-command").addEventListener("click", async () => {
  const f = getForm();
  const installerSecret = $("#installerSecret").value.trim();
  try {
    const r = await fetch(api("/api/command"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(installerSecret ? { "X-Installer-Secret": installerSecret } : {}) },
      body: JSON.stringify({ verifyToken: f.verifyToken, adminSecret: f.adminSecret, phoneNumberId: f.phoneNumberId }),
    });
    const d = await r.json();
    cmdOut.style.display = "block";
    cmdOut.textContent = d.command + "\n\n" + (d.note || "");
  } catch (e) {
    cmdOut.style.display = "block";
    cmdOut.textContent = "Erreur : " + e.message;
  }
});
