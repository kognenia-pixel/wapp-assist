const API_BASE = (window.API_BASE || "").replace(/\/$/, "");
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const formSection = $("#form-section");
const runSection = $("#run-section");
const logsEl = $("#logs");
const progressFill = $("#progress-fill");
const stepDisplay = $("#step-display");
const statusBadge = $("#status-badge");
const workerUrlEl = $("#worker-url");
const workerUrlDisplay = $("#worker-url-display");
const metaStatus = $("#meta-status");
const metaDetails = $("#meta-details");
const btnMeta = $("#btn-meta");
const btnMetaReset = $("#btn-meta-reset");
const metaCard = $("#meta-card");

let es = null;
let currentJobId = null;
let metaConnected = false;
let metaInfo = null;
let currentStep = 1;
const totalSteps = 5;
const progressSteps = $$(".progress-steps .step-item");
const formSteps = $$(".form-step");

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

function validateStep(step) {
  const f = getForm();
  const miss = [];
  if (step === 1) {
    if (!f.host) miss.push("Adresse IP / domaine");
    if (!f.username) miss.push("Utilisateur SSH");
    if (!f.password && !f.privateKey && !f.simulate) miss.push("Mot de passe ou clé privée");
  }
  if (step === 2) {
    if (!metaConnected) {
      if (!f.whatsappToken) miss.push("Token WhatsApp");
      if (!f.phoneNumberId) miss.push("Phone Number ID");
    }
  }
  if (step === 3) {
    if (!f.geminiKey) miss.push("Clé Gemini");
    if (!f.adminSecret) miss.push("ADMIN_SECRET");
    if (!f.verifyToken) miss.push("VERIFY_TOKEN");
  }
  return miss;
}

function validateAll() {
  const allMiss = [];
  for (let i = 1; i <= totalSteps; i++) {
    const miss = validateStep(i);
    if (miss.length) allMiss.push(...miss.map(m => `Étape ${i}: ${m}`));
  }
  return allMiss;
}

function showStep(step) {
  currentStep = Math.max(1, Math.min(totalSteps, step));
  formSteps.forEach(fs => fs.hidden = true);
  const target = document.querySelector(`.form-step[data-step="${currentStep}"]`);
  if (target) target.hidden = false;
  updateProgressNav();
}

function updateProgressNav() {
  progressSteps.forEach((item, idx) => {
    const stepNum = idx + 1;
    item.classList.remove("active", "completed");
    if (stepNum < currentStep) item.classList.add("completed");
    else if (stepNum === currentStep) item.classList.add("active");
  });
}

function nextStep() {
  const miss = validateStep(currentStep);
  if (miss.length) {
    alert("Champs manquants : " + miss.join(", "));
    return false;
  }
  if (currentStep < totalSteps) showStep(currentStep + 1);
  return true;
}

function prevStep() {
  if (currentStep > 1) showStep(currentStep - 1);
}

function appendLog(entry) {
  const line = typeof entry === "string" ? entry : entry.line || JSON.stringify(entry);
  const level = entry.level || "info";
  const time = entry.t ? new Date(entry.t).toLocaleTimeString() : "";
  const div = document.createElement("div");
  div.className = "log-entry";
  div.innerHTML = `
    <span class="log-time">${time || ""}</span>
    <span class="log-level ${level}">${level.toUpperCase()}</span>
    <span class="log-line">${escapeHtml(line)}</span>
  `;
  logsEl.appendChild(div);
  logsEl.scrollTop = logsEl.scrollHeight;
  updateProgressFromLogs(line);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function updateProgressFromLogs(line) {
  const m = line.match(/\[(\d)\/6\]/);
  if (m) {
    const n = Number(m[1]);
    progressFill.style.width = ((n / 6) * 100).toFixed(0) + "%";
    stepDisplay.textContent = `Étape ${n}/6`;
  }
  const urlMatch = line.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/);
  if (urlMatch) {
    const url = urlMatch[0];
    workerUrlEl.hidden = false;
    workerUrlEl.innerHTML = `Worker déployé : <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    workerUrlDisplay.hidden = false;
    workerUrlDisplay.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  }
}

function setStatus(s, workerUrl) {
  statusBadge.className = "status-badge " + s;
  if (s === "running") statusBadge.textContent = "En cours";
  else if (s === "success") { statusBadge.textContent = "Succès"; progressFill.style.width = "100%"; stepDisplay.textContent = "Étape 6/6 — terminé"; }
  else if (s === "error") { statusBadge.textContent = "Erreur"; }
  if (workerUrl) {
    workerUrlEl.hidden = false;
    workerUrlEl.innerHTML = `Worker : <a href="${workerUrl}" target="_blank" rel="noopener noreferrer">${workerUrl}</a>`;
    workerUrlDisplay.hidden = false;
    workerUrlDisplay.innerHTML = `<a href="${workerUrl}" target="_blank" rel="noopener noreferrer">${workerUrl}</a>`;
  }
}

// ---------- META OAUTH ----------
async function refreshMetaStatus() {
  try {
    const r = await fetch(api("/auth/status"), { credentials: "include" });
    const j = await r.json();
    if (j.connected) {
      metaConnected = true;
      metaInfo = j;
      metaStatus.className = "meta-status connected";
      metaStatus.innerHTML = `<span class="status-indicator" aria-hidden="true"></span><span>✅ WhatsApp connecté : ${j.displayPhone || j.phoneNumberId}${j.businessName ? " — " + j.businessName : ""}</span>`;
      metaDetails.hidden = false;
      metaDetails.innerHTML = `
        <strong>Détails de la connexion</strong>
        <div class="kv">
          <span>Phone Number ID : ${j.phoneNumberId}</span>
          <span>WABA : ${j.wabaId || "—"}</span>
          <span>Token : stocké côté serveur (jamais affiché)</span>
        </div>
      `;
      btnMeta.hidden = true;
      btnMetaReset.hidden = false;
      $("#whatsappToken").value = "*** via Meta ***";
      $("#phoneNumberId").value = j.phoneNumberId || "";
    } else {
      metaConnected = false;
      metaInfo = null;
      if (j.error) {
        metaStatus.className = "meta-status error";
        metaStatus.innerHTML = `<span class="status-indicator" aria-hidden="true"></span><span>❌ Erreur Meta : ${j.error} — réessayez</span>`;
      } else {
        metaStatus.className = "meta-status disconnected";
        metaStatus.innerHTML = `<span class="status-indicator" aria-hidden="true"></span><span>Non connecté — cliquez sur "Connecter avec Meta"</span>`;
      }
      metaDetails.hidden = true;
      btnMeta.hidden = false;
      btnMetaReset.hidden = true;
      if ($("#whatsappToken").value === "*** via Meta ***") $("#whatsappToken").value = "";
    }
  } catch {
    // ignore network errors
  }
}

async function startMetaConnect() {
  metaStatus.className = "meta-status";
  metaStatus.innerHTML = `<span class="status-indicator" aria-hidden="true"></span><span>Ouverture du flux Meta…</span>`;
  try {
    const r = await fetch(api("/auth/meta/url"), { credentials: "include" });
    const j = await r.json().catch(() => ({}));
    if (j.authUrl) {
      const w = window.open(j.authUrl, "wapp_meta", "width=600,height=700,scrollbars=yes");
      if (!w) { window.location.href = api("/auth/meta"); return; }
      metaStatus.innerHTML = `<span class="status-indicator" aria-hidden="true"></span><span>En attente de validation Meta (choisissez Business, numéro, code SMS)…</span>`;
      const iv = setInterval(async () => {
        await refreshMetaStatus();
        if (metaConnected) { clearInterval(iv); try { w.close(); } catch {} }
        if (w.closed) { clearInterval(iv); setTimeout(refreshMetaStatus, 800); }
      }, 2000);
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

// Initial load
(async () => {
  const p = new URLSearchParams(window.location.search);
  if (p.get("meta") === "connected") history.replaceState({}, "", window.location.pathname);
  if (p.get("meta") === "error") {
    metaStatus.className = "meta-status error";
    metaStatus.innerHTML = `<span class="status-indicator" aria-hidden="true"></span><span>❌ Erreur : ${p.get("reason") || "flux interrompu"}</span>`;
    history.replaceState({}, "", window.location.pathname);
  }
  if (p.get("meta") === "simulated") setTimeout(refreshMetaStatus, 600);
  await refreshMetaStatus();
  setInterval(refreshMetaStatus, 3000);
})();

// ---------- INSTALL ----------
async function startInstall() {
  const miss = validateAll();
  if (miss.length) { alert("Champs manquants :\n" + miss.join("\n")); return; }
  const installerSecret = $("#installerSecret").value.trim();
  
  formSection.hidden = true;
  runSection.hidden = false;
  logsEl.innerHTML = "";
  progressFill.style.width = "0%";
  stepDisplay.textContent = "Étape 0/6";
  setStatus("running");
  workerUrlEl.hidden = true;
  workerUrlDisplay.hidden = true;

  let jobId;
  try {
    const f = getForm();
    const r = await fetch(api("/api/install"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(installerSecret ? { "X-Installer-Secret": installerSecret } : {}) },
      credentials: "include",
      body: JSON.stringify({
        host: f.host, port: f.port, username: f.username, remotePath: f.remotePath,
        password: f.password || undefined, privateKey: f.privateKey || undefined,
        geminiKey: f.geminiKey,
        whatsappToken: (f.whatsappToken && f.whatsappToken !== "*** via Meta ***") ? f.whatsappToken : undefined,
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
    if (data.meta) appendLog(`✅ WhatsApp via Meta : ${data.meta.displayPhone || data.meta.phoneNumberId}`, "info");
  } catch (e) {
    appendLog("ERREUR — " + e.message, "error");
    setStatus("error", null);
    return;
  }

  if (es) try { es.close(); } catch {}
  es = new EventSource(api(`/api/install/${encodeURIComponent(jobId)}/stream`), { withCredentials: true });
  es.addEventListener("log", (ev) => { try { appendLog(JSON.parse(ev.data)); } catch { appendLog(ev.data); } });
  es.addEventListener("progress", (ev) => {
    try { const p = JSON.parse(ev.data); progressFill.style.width = ((p.step / p.total) * 100).toFixed(0) + "%"; stepDisplay.textContent = `Étape ${p.step}/${p.total}`; } catch {}
  });
  es.addEventListener("status", (ev) => { try { const s = JSON.parse(ev.data); setStatus(s.status, s.workerUrl); } catch {} });
  es.addEventListener("done", (ev) => {
    try {
      const d = JSON.parse(ev.data);
      setStatus(d.status, d.workerUrl);
      if (d.status === "success") {
        appendLog("✅ Installation terminée — ouvrez l'URL du Worker et l'interface.", "info");
        showCompletionStep();
      } else {
        appendLog("❌ Installation échouée : " + (d.error || "voir logs"), "error");
      }
    } catch {}
    try { es.close(); } catch {}
  });
  es.onerror = () => appendLog("Connexion SSE interrompue — reconnexion...", "error");
}

function showCompletionStep() {
  // Update progress nav to show step 6 completed
  progressSteps.forEach(item => item.classList.remove("active"));
  progressSteps[5].classList.add("completed");
  
  // Hide run section, show form step 6
  runSection.hidden = true;
  formSection.hidden = false;
  showStep(6);
}

function goBackToForm() {
  if (es) try { es.close(); } catch {}
  runSection.hidden = true;
  formSection.hidden = false;
  showStep(currentStep);
}

async function copyLogs() {
  const text = logsEl.innerText;
  try {
    await navigator.clipboard.writeText(text);
    const btn = $("#btn-copy-logs-run") || $("#btn-copy-logs");
    const original = btn.textContent;
    btn.textContent = "Copié !";
    setTimeout(() => btn.textContent = original, 1500);
  } catch {}
}

$("#btn-install").addEventListener("click", (e) => { e.preventDefault(); startInstall(); });
$("#btn-back").addEventListener("click", goBackToForm);
$("#btn-back-run").addEventListener("click", goBackToForm);
$("#btn-copy-logs").addEventListener("click", copyLogs);
$("#btn-copy-logs-run").addEventListener("click", copyLogs);

// Keyboard navigation for form steps
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && !runSection.hidden) return;
});

// Generate fallback command
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
    // Show in a modal-like way since cmd-out is removed
    alert("Commande générée (copiez-la dans votre terminal SSH) :\n\n" + d.command + "\n\n" + (d.note || ""));
  } catch (e) {
    alert("Erreur : " + e.message);
  }
});