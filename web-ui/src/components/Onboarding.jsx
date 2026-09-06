import { AnimatePresence, motion } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiCheck } from "react-icons/fi";

const ETAPES = [
  {
    titre: "Bienvenue sur Wapp Assist !",
    texte: "Remplissez d'abord vos infos Meta : URL du Worker, secret admin et Phone Number ID.",
    onglet: "meta",
    action: "Aller à l'onglet Meta",
  },
  {
    titre: "Ajoutez vos produits",
    texte: "Nom, prix, description : c'est le cœur de votre boutique, le bot répondra avec ces infos.",
    onglet: "produits",
    action: "Aller aux produits",
  },
  {
    titre: "Horaires et FAQ",
    texte: "Configurez vos horaires, votre adresse et vos réponses aux questions fréquentes.",
    onglet: "faq",
    action: "Aller aux horaires & FAQ",
  },
  {
    titre: "Envoyez et testez !",
    texte: "Cliquez « Envoyer au Worker », puis posez une question à votre assistant sur WhatsApp.",
    onglet: "dashboard",
    action: "Voir le tableau de bord",
  },
];

export default function Onboarding({ ouvert, etape, setEtape, onAller, onTerminer }) {
  const courante = ETAPES[etape];
  const derniere = etape === ETAPES.length - 1;

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
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              Étape {etape + 1} / {ETAPES.length}
            </p>
            <h3 className="font-display mt-1 text-xl font-bold text-black">{courante.titre}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#555555]">{courante.texte}</p>

            <div className="mt-4 flex gap-1.5">
              {ETAPES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i <= etape ? "bg-brand" : "bg-gray-200"}`}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
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
