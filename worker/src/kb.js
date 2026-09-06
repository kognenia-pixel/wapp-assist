// Wapp Assist — validation + instruction KB.
// Schéma compatible Wapp Stack (même format) :
// { nom, secteur, ton, nom_repondant, horaires, adresse, contacts,
//   catalogue: [{nom, prix, description}], faq: [{question, reponse}],
//   regles: [], escalation: {nom, numero} }

export const PHRASE_ABSENT =
  "Laissez-moi vérifier avec l'équipe et je reviens très vite vers vous.";

const CHAMPS_TEXTE = ["secteur", "ton", "nom_repondant", "horaires", "adresse", "contacts"];

function estTexte(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export function validerKb(d) {
  const erreurs = [];
  if (!d || typeof d !== "object" || Array.isArray(d)) return ["la fiche doit être un objet JSON"];
  if (!estTexte(d.nom)) erreurs.push("champ « nom » manquant ou vide (nom du commerce, obligatoire)");
  for (const c of CHAMPS_TEXTE) {
    if (d[c] !== undefined && typeof d[c] !== "string") erreurs.push(`champ « ${c} » doit être une chaîne`);
  }
  if (!Array.isArray(d.catalogue)) {
    erreurs.push("champ « catalogue » doit être une liste (même vide : [])");
  } else {
    d.catalogue.forEach((item, i) => {
      if (!item || typeof item !== "object") { erreurs.push(`catalogue[${i}] doit être un objet`); return; }
      if (!estTexte(item.nom)) erreurs.push(`catalogue[${i}].nom manquant ou vide`);
      if (!estTexte(item.prix) && typeof item.prix !== "number") erreurs.push(`catalogue[${i}].prix manquant ou vide`);
    });
  }
  if (!Array.isArray(d.faq)) {
    erreurs.push("champ « faq » doit être une liste (même vide : [])");
  } else {
    d.faq.forEach((item, i) => {
      if (!item || typeof item !== "object") { erreurs.push(`faq[${i}] doit être un objet`); return; }
      if (!estTexte(item.question)) erreurs.push(`faq[${i}].question manquante`);
      if (!estTexte(item.reponse)) erreurs.push(`faq[${i}].reponse manquante`);
    });
  }
  if (!Array.isArray(d.regles)) erreurs.push("champ « regles » doit être une liste (même vide : [])");
  if (d.escalation !== undefined) {
    if (!d.escalation || typeof d.escalation !== "object") {
      erreurs.push("champ « escalation » doit être un objet {nom, numero}");
    }
  }
  return erreurs;
}

function ligneCatalogue(item) {
  const prix = typeof item.prix === "number" ? String(item.prix) : item.prix;
  const desc = item.description && item.description.trim() ? ` — ${item.description.trim()}` : "";
  return `- ${item.nom} : ${prix}${desc}`;
}

export function construireInstruction(kb, brand) {
  const nom = (kb.nom || (brand && brand.name) || "ce commerce").trim();
  const infos = [];
  if (kb.secteur && kb.secteur.trim()) infos.push(`secteur : ${kb.secteur.trim()}`);
  if (kb.horaires && kb.horaires.trim()) infos.push(`horaires : ${kb.horaires.trim()}`);
  if (kb.adresse && kb.adresse.trim()) infos.push(`adresse : ${kb.adresse.trim()}`);
  if (kb.contacts && kb.contacts.trim()) infos.push(`contacts : ${kb.contacts.trim()}`);
  if (kb.nom_repondant && kb.nom_repondant.trim()) infos.push(`répondant : ${kb.nom_repondant.trim()}`);

  const catalogue = (kb.catalogue || [])
    .map((it) => (it && it.nom ? ligneCatalogue(it) : null))
    .filter(Boolean)
    .join("\n");
  const faq = (kb.faq || [])
    .map((it) => (it && it.question && it.reponse ? `- Q : ${it.question.trim()}\n  R : ${it.reponse.trim()}` : null))
    .filter(Boolean)
    .join("\n");
  const regles = (kb.regles || []).filter((r) => r && r.trim()).map((r) => `- ${r.trim()}`);
  const esc = kb.escalation;
  const escalade = esc && (esc.nom || esc.numero)
    ? `- Si tu ne sais vraiment pas : oriente vers ${esc.nom || "l'équipe"}${esc.numero ? ` (${esc.numero})` : ""}.\n`
    : "";

  return (
    `Tu es l'assistant WhatsApp du commerce « ${nom} »${kb.secteur ? ` (${kb.secteur})` : ""}.\n\n` +
    `Ton : ${kb.ton && kb.ton.trim() ? kb.ton.trim() : "courtois et professionnel"}. ` +
    "Réponds COURT, façon WhatsApp (1 à 4 phrases), en français, sans liste exhaustive.\n\n" +
    "BASE UNIQUE — réponds UNIQUEMENT à partir de ces informations, ne JAMAIS inventer " +
    "un prix, un produit, une adresse, un horaire ou un fait absent :\n" +
    (infos.length ? infos.join("\n") + "\n" : "") +
    (catalogue ? `CATALOGUE (prix exacts) :\n${catalogue}\n` : "") +
    (faq ? `QUESTIONS FRÉQUENTES :\n${faq}\n` : "") +
    "RÈGLES :\n" +
    "- Prix, horaires, adresse, livraison, paiement → base uniquement, prix exacts.\n" +
    "- Commande ou réservation → répète poliment la demande, dis que l'équipe confirme très vite.\n" +
    `- Info absente → réponds EXACTEMENT ceci, sans rien ajouter : « ${PHRASE_ABSENT} ».\n` +
    "- Ne promets jamais un délai ou tarif absent de la base.\n" +
    (regles.length ? `- Règles du commerce :\n${regles.join("\n")}\n` : "") +
    escalade +
    "- Salutation (« Bonjour ») UNIQUEMENT si le client en a mis une ; sinon réponds direct.\n" +
    "- Reste courtois et précis."
  );
}
