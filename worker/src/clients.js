// Wapp Assist — fiche de démonstration neutre (white-label).
// Utilisée UNIQUEMENT quand aucune fiche n'existe en KV pour le numéro.
// L'acheteur la remplace par sa vraie fiche via la page web.
// AUCUNE donnée personnelle ici : exemple fictif.

export const DEFAULT_KB = {
  nom: "Ma Boutique Démo",
  secteur: "boutique (exemple à remplacer)",
  ton: "chaleureux et professionnel, vouvoiement",
  nom_repondant: "",
  horaires: "Ouvert du lundi au samedi de 9h à 19h.",
  adresse: "Adresse à compléter.",
  contacts:
    "LIVRAISON : zones à compléter. Frais à compléter. " +
    "PAIEMENT : espèces / mobile money (à préciser).",
  catalogue: [
    { nom: "Produit exemple 1", prix: "100 000", description: "Remplacez par vos vrais produits" },
    { nom: "Produit exemple 2", prix: "50 000", description: "Remplacez par vos vrais produits" },
  ],
  faq: [
    { question: "Quels sont vos horaires ?", reponse: "Du lundi au samedi de 9h à 19h." },
    { question: "Livrez-vous ?", reponse: "Oui, précisez votre quartier et on vous confirme les frais." },
  ],
  regles: [
    "Commande : répéter poliment la demande puis dire que l'équipe confirme très vite (jamais confirmer soi-même).",
  ],
  escalation: { nom: "", numero: "" },
};
