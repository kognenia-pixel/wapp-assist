import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiActivity, FiBox, FiHelpCircle, FiSend, FiZap } from "react-icons/fi";
import { etatWorker } from "../api";
import { BoutonPrincipal } from "../components/fields";
import { progressionNiveau } from "../services/gamification";

const CONSEILS = [
  "Ajoutez des photos de vos produits pour plus de conversions.",
  "Renseignez vos horaires : un client rassuré commande plus vite.",
  "Mettez vos prix exacts : le bot ne doit jamais inventer.",
  "Ajoutez vos 3 questions les plus fréquentes en FAQ.",
  "Testez votre assistant comme un client : posez-lui vos propres questions.",
];

function Squelette() {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-28 rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}

function Carte({ icone: Icone, titre, valeur, sousTitre, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl bg-[#f9f9f9] p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 text-[#555555]">
        <Icone size={16} aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">{titre}</span>
      </div>
      <p className={`mt-2 font-display text-2xl font-bold ${accent ? "text-brand" : "text-black"}`}>{valeur}</p>
      {sousTitre && <p className="mt-1 text-xs text-[#555555]">{sousTitre}</p>}
    </motion.div>
  );
}

export default function Dashboard({ meta, boutique, produits, faq, nbBadges, niveau }) {
  const [statut, setStatut] = useState("chargement");
  const [question, setQuestion] = useState("");
  const [apercu, setApercu] = useState(null);

  useEffect(() => {
    let actif = true;
    const verifier = async () => {
      const etat = await etatWorker(meta.workerUrl);
      if (actif) setStatut(etat);
    };
    verifier();
    const minuteur = setInterval(verifier, 30000);
    return () => {
      actif = false;
      clearInterval(minuteur);
    };
  }, [meta.workerUrl]);

  const botActif =
    statut === "en-ligne" && boutique.nom.trim() !== "" && produits.length > 0;

  const conseil = CONSEILS[new Date().getDate() % CONSEILS.length];

  const previsualiser = () => {
    const q = question.trim() || "Bonjour, que proposez-vous ?";
    const premier = produits[0];
    const reponse = premier
      ? `Bonjour ! Nous proposons notamment : ${premier.nom} à ${premier.prix}${
          premier.description ? ` — ${premier.description}` : ""
        }. Dites-m'en plus sur votre besoin !`
      : "Bonjour ! Notre catalogue arrive bientôt — laissez-nous votre question, l'équipe répond très vite.";
    setApercu({ question: q, reponse });
    setQuestion("");
  };

  if (statut === "chargement") {
    return (
      <div className="max-w-3xl space-y-6">
        <h2 className="font-display text-2xl font-bold">Tableau de bord</h2>
        <Squelette />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-3xl space-y-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-bold">Tableau de bord</h2>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${
            statut === "en-ligne" ? "bg-brand" : "bg-gray-400"
          }`}
        >
          <span className="relative flex h-2 w-2">
            {statut === "en-ligne" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          {statut === "en-ligne" ? "Worker en ligne" : statut === "non-configure" ? "Worker non configuré" : "Worker hors ligne"}
        </span>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            botActif ? "bg-black text-white" : "bg-gray-100 text-[#555555]"
          }`}
        >
          <FiZap size={12} aria-hidden />
          {botActif ? "Bot actif" : "Bot en préparation"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Carte icone={FiBox} titre="Produits" valeur={produits.length} sousTitre="dans le catalogue" accent />
        <Carte icone={FiHelpCircle} titre="FAQ" valeur={faq.length} sousTitre="questions configurées" />
        <Carte
          icone={FiSend}
          titre="Dernier message"
          valeur="Démo"
          sousTitre="« Client : Bonjour, le poulet yassa est-il disponible ? »"
        />
        <Carte icone={FiActivity} titre="Dernière activité" valeur="—" sousTitre="Aucun message reçu aujourd'hui" />
      </div>

      {typeof nbBadges === "number" && (
        <div className="rounded-xl bg-[#f9f9f9] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#555555]">Progression · Niveau {niveau} / 5</p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(progressionNiveau(nbBadges).avancement * 100).toFixed(0)}%` }}
              transition={{ duration: 0.6 }}
              className="h-full bg-brand"
            />
          </div>
          <p className="mt-1 text-xs text-[#555555]">{nbBadges} / 8 badges</p>
        </div>
      )}

      <div className="rounded-xl border border-[#e0e0e0] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Conseil du jour</h3>
        <p className="mt-1 text-sm text-[#555555]">{conseil}</p>
      </div>

      <div className="rounded-xl bg-[#f9f9f9] p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Prévisualiser (simulation locale)</h3>
        <p className="mt-1 text-xs text-[#555555]">
          Testez le ton de votre bot avec vos vrais produits, sans toucher au Worker.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && previsualiser()}
            placeholder="Ex : que proposez-vous ?"
            className="w-full rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <BoutonPrincipal onClick={previsualiser}>Tester</BoutonPrincipal>
        </div>
        {apercu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2 text-sm">
            <p className="rounded-lg bg-white p-3 shadow-sm">
              <span className="font-semibold">Vous :</span> {apercu.question}
            </p>
            <p className="rounded-lg bg-black p-3 text-white shadow-sm">
              <span className="font-semibold text-brand">Bot :</span> {apercu.reponse}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
