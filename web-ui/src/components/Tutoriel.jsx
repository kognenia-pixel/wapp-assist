import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiCheck } from "react-icons/fi";

const CLE_PROGRESSION = "wapp-assist-tuto";

const ETAPES = [
  {
    titre: "Bienvenue : ce que fait Wapp Assist",
    texte:
      "Wapp Assist transforme votre WhatsApp en assistant qui répond seul à vos clients, 24h/24, avec vos prix et vos produits. Vous remplissez votre fiche ici, le Worker s'occupe du reste.",
    onglet: "dashboard",
    action: "Voir le tableau de bord",
  },
  {
    titre: "Connectez votre compte Meta",
    texte:
      "Collez l'URL du Worker, votre secret admin et votre Phone Number ID (Meta Developer → votre app → WhatsApp → API Setup). Puis cliquez « Tester la connexion ».",
    onglet: "meta",
    action: "Aller à l'onglet Meta",
  },
  {
    titre: "Ajoutez vos produits",
    texte:
      "Nom, prix, description : un par un, avec le bouton Ajouter. C'est avec ces infos exactes que le bot répondra — jamais d'invention.",
    onglet: "produits",
    action: "Aller aux produits",
  },
  {
    titre: "Horaires et FAQ",
    texte:
      "Renseignez vos horaires, votre adresse, la livraison et le paiement, puis vos questions fréquentes avec leurs réponses.",
    onglet: "faq",
    action: "Aller aux horaires & FAQ",
  },
  {
    titre: "Envoyez et testez",
    texte:
      "Cliquez « Envoyer au Worker » (bandeau vert = envoyé), puis écrivez à votre numéro de test sur WhatsApp : le bot doit répondre avec vos prix.",
    onglet: "produits",
    action: "Revoir l'envoi",
  },
  {
    titre: "Lisez votre tableau de bord",
    texte:
      "Pastille Worker en ligne, nombre de produits et FAQ, conseil du jour et prévisualisation : tout est sous les yeux, chaque jour.",
    onglet: "dashboard",
    action: "Voir le tableau de bord",
  },
];

export function chargerProgressionTuto() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_PROGRESSION) || "{}");
    return { vu: brut.vu === true, etape: Number.isInteger(brut.etape) ? brut.etape : 0 };
  } catch {
    return { vu: false, etape: 0 };
  }
}

export default function Tutoriel({ ouvert, etape, setEtape, onAller, onTerminer }) {
  const courante = ETAPES[etape];
  const derniere = etape === ETAPES.length - 1;

  useEffect(() => {
    try {
      const brut = JSON.parse(localStorage.getItem(CLE_PROGRESSION) || "{}");
      localStorage.setItem(CLE_PROGRESSION, JSON.stringify({ ...brut, etape }));
    } catch {
      // ignore
    }
  }, [etape]);

  const reinitialiser = () => {
    setEtape(0);
    try {
      localStorage.setItem(CLE_PROGRESSION, JSON.stringify({ vu: false, etape: 0 }));
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <motion.div
            key={etape}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              Tutoriel · étape {etape + 1} / {ETAPES.length}
            </p>
            <h3 className="font-display mt-1 text-xl font-bold text-black">{courante.titre}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#555555]">{courante.texte}</p>

            <div className="mt-4 flex gap-1.5">
              {ETAPES.map((_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= etape ? "bg-brand" : "bg-gray-200"}`} />
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={reinitialiser}
                className="rounded-lg px-3 py-1.5 text-xs text-[#555555] underline hover:text-brand"
              >
                Réinitialiser le tutoriel
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {etape > 0 && (
                <button
                  type="button"
                  onClick={() => setEtape(etape - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#e0e0e0] px-4 py-2 text-sm font-semibold text-black hover:border-brand"
                >
                  <FiArrowLeft size={14} /> Retour
                </button>
              )}
              <button
                type="button"
                onClick={() => onAller(courante.onglet)}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-85"
              >
                {courante.action}
              </button>
              {!derniere ? (
                <button
                  type="button"
                  onClick={() => setEtape(etape + 1)}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d8f64]"
                >
                  Suivant <FiArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onTerminer}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d8f64]"
                >
                  <FiCheck size={14} /> Terminer
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
