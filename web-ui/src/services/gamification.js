import {
  FiCheckCircle,
  FiPackage,
  FiHelpCircle,
  FiBook,
  FiMessageSquare,
  FiStar,
  FiZap,
  FiAward,
} from "react-icons/fi";

export const BADGES = [
  { id: "config", nom: "Premiere configuration", description: "Meta rempli + 1 produit ajoute", icone: FiCheckCircle },
  { id: "premier_produit", nom: "Premier produit", description: "Ajouter un produit", icone: FiPackage },
  { id: "faq", nom: "FAQ completee", description: "Au moins 3 FAQ", icone: FiHelpCircle },
  { id: "source", nom: "Source connectee", description: "Ajouter une source", icone: FiBook },
  { id: "premier_message", nom: "Premier message", description: "Recevoir et repondre sur WhatsApp", icone: FiMessageSquare },
  { id: "expert", nom: "Expert", description: "5 produits + 5 FAQ + 3 sources", icone: FiStar },
  { id: "cent_messages", nom: "100 messages", description: "Traiter 100 messages", icone: FiZap },
  { id: "maitre", nom: "Maitre", description: "Tous les badges precedents", icone: FiAward },
];

const SEUILS_NIVEAU = [1, 3, 5, 7, 8];

export function calculerBadges({ meta, produits, faq, sources, messagesTraites }) {
  const badges = new Set();
  if ((meta?.workerUrl || meta?.phoneNumberId) && produits?.length > 0) badges.add("config");
  if (produits?.length > 0) badges.add("premier_produit");
  if ((faq?.length || 0) >= 3) badges.add("faq");
  if ((sources?.length || 0) > 0) badges.add("source");
  if ((messagesTraites || 0) >= 1) badges.add("premier_message");
  if ((produits?.length || 0) >= 5 && (faq?.length || 0) >= 5 && (sources?.length || 0) >= 3) badges.add("expert");
  if ((messagesTraites || 0) >= 100) badges.add("cent_messages");
  if (badges.size === 7 && badges.has("config") && badges.has("premier_produit") && badges.has("faq") && badges.has("source") && badges.has("premier_message") && badges.has("expert") && badges.has("cent_messages")) {
    badges.add("maitre");
  }
  return badges;
}

export function calculerNiveau(nbBadges) {
  for (let i = SEUILS_NIVEAU.length - 1; i >= 0; i--) {
    if (nbBadges >= SEUILS_NIVEAU[i]) return i + 1;
  }
  return 0;
}

export function progressionNiveau(nbBadges) {
  const niveau = calculerNiveau(nbBadges);
  if (niveau === 0) return { niveau: 0, avancement: nbBadges / SEUILS_NIVEAU[0], prochain: SEUILS_NIVEAU[0] };
  if (niveau >= 5) return { niveau: 5, avancement: 1, prochain: 8 };
  const seuilActuel = SEUILS_NIVEAU[niveau - 1];
  const seuilSuivant = SEUILS_NIVEAU[niveau];
  const dansNiveau = nbBadges - seuilActuel;
  const taille = seuilSuivant - seuilActuel;
  return { niveau, avancement: taille === 0 ? 1 : dansNiveau / taille, prochain: seuilSuivant };
}
