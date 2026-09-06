// Config frontend — pointe vers le backend Railway en prod, local en dev
window.API_BASE = (function() {
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return "";
  // Prod : backend Railway (après déploiement, remplace si besoin)
  return "https://wapp-installer.up.railway.app";
})();
