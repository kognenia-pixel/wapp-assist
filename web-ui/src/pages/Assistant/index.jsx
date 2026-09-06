import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Apparence from "./Apparence";
import Personnalite from "./Personnalite";
import Connaissances from "./Connaissances";
import Comportement from "./Comportement";

const ONGLETS = [
  { id: "apparence", label: "Apparence" },
  { id: "personnalite", label: "Personnalité" },
  { id: "connaissances", label: "Connaissances" },
  { id: "comportement", label: "Comportement" },
];

export default function AssistantPage({ config, setApparence, setPersonnalite, setComportement, sources, onAllerSources, onRelancerTuto, onEnvoyerConfig, envoiConfig }) {
  const [tab, setTab] = useState("apparence");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Assistant</h2>
        <p className="mt-1 text-sm text-[#555555]">Studio de l’assistant — 4 modules, prévisualisation en direct.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setTab(o.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tab === o.id ? "bg-brand text-white" : "bg-[#f0f0f0] text-black hover:bg-black hover:text-white"}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#e0e0e0] bg-white p-5 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {tab === "apparence" && <Apparence config={config} setApparence={setApparence} />}
            {tab === "personnalite" && <Personnalite config={config} setPersonnalite={setPersonnalite} />}
            {tab === "connaissances" && <Connaissances sources={sources} onAllerSources={onAllerSources} />}
            {tab === "comportement" && <Comportement config={config} setComportement={setComportement} onRelancerTuto={onRelancerTuto} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEnvoyerConfig}
          disabled={!!envoiConfig}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d8f64] disabled:opacity-60"
        >
          {envoiConfig ? "Envoi..." : "Envoyer la config au Worker"}
        </button>
        <p className="py-3 text-xs text-[#555555]">Stockée en localStorage et dans le KV du Worker (par phone_number_id).</p>
      </div>
    </motion.div>
  );
}
