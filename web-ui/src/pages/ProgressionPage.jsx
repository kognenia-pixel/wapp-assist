import { motion } from "framer-motion";
import { BADGES, progressionNiveau } from "../services/gamification";
import { BoutonPrincipal } from "../components/fields";
import Confetti from "../components/Confetti";

export default function ProgressionPage({ nbBadges, badgesActuels, stats }) {
  const prog = progressionNiveau(nbBadges);
  const confetti = badgesActuels.has("expert") || badgesActuels.has("maitre");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Progression</h2>
        <p className="mt-1 text-sm text-[#555555]">Niveau {prog.niveau} / 5 — {nbBadges} / 8 badges</p>
      </div>

      <div className="rounded-xl bg-[#f9f9f9] p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-[#555555]">
          <span>Niveau {prog.niveau}</span>
          <span>{prog.prochain ? `${nbBadges}/${prog.prochain}` : "Max"}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${prog.avancement * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-brand"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {BADGES.map((b) => {
          const ok = badgesActuels.has(b.id);
          const Icone = b.icone;
          return (
            <div
              key={b.id}
              className={`flex items-start gap-3 rounded-xl p-4 shadow-sm ${ok ? "bg-brand text-white" : "bg-[#f9f9f9] text-[#555555]"}`}
            >
              <Icone size={20} className={ok ? "text-white" : "text-[#555555]"} aria-hidden />
              <div>
                <p className={`text-sm font-semibold ${ok ? "text-white" : "text-black"}`}>{b.nom}</p>
                <p className={`text-xs ${ok ? "text-white/80" : "text-[#555555]"}`}>{b.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#e0e0e0] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Statistiques</h3>
        <p className="mt-1 text-sm text-[#555555]">
          Produits : {stats.produits} · FAQ : {stats.faq} · Sources : {stats.sources} · Messages traites : {stats.messages}
        </p>
      </div>

      <Confetti declenche={confetti} />
    </motion.div>
  );
}
