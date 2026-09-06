// Config frontend — pointe vers le backend Render en prod, local en dev
window.API_BASE = (function() {
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return "";
  // Prod : backend Render (à remplacer après déploiement Render)
  return "https://wapp-installer.onrender.com";
})();
