import { motion } from "framer-motion";
import { FiBook, FiAlertCircle } from "react-icons/fi";

function calculerScore(sources) {
  const nb = sources.length;
  const types = new Set(sources.map((s) => s.type)).size;
  // 10 pts par source + 5 pts par type différent, plafonné 100
  const brut = nb * 10 + types * 5;
  return Math.min(100, brut);
}

export default function Connaissances({ sources, onAllerSources }) {
  const score = calculerScore(sources || []);
  const recommandation = score < 50;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold">Connaissances</h3>
        <p className="mt-1 text-sm text-[#555555]">Score basé sur le nombre et la diversité de vos sources.</p>
      </div>

      <div className="rounded-xl bg-[#f9f9f9] p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#555555]">Niveau de connaissances</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.6 }}
              className="h-full bg-brand"
            />
          </div>
          <span className="text-sm font-bold text-black">{score} / 100</span>
        </div>
        <p className="mt-1 text-xs text-[#555555]">
          {sources.length} source(s) · {new Set(sources.map((s) => s.type)).size} type(s) · 10 pts/source + 5 pts/type
        </p>
      </div>

      {recommandation && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
          <div>
            <p className="font-semibold">Améliorez vos réponses</p>
            <p className="mt-1 text-xs">Ajoutez un PDF ou une URL pour enrichir le contexte du bot.</p>
            <button
              type="button"
              onClick={onAllerSources}
              className="mt-2 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:opacity-85"
            >
              Aller aux Sources
            </button>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold">Sources actuelles</h4>
        {sources.length === 0 ? (
          <p className="mt-2 text-sm text-[#555555]">Aucune source. Ajoutez un PDF, TXT ou URL dans l’onglet Sources.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {sources.map((s) => (
              <li key={s.nom || s.id} className="flex items-center gap-2 rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm">
                <FiBook size={14} className="text-[#555555]" />
                <span className="font-medium">{s.nom}</span>
                <span className="ml-auto text-xs text-[#555555]">{s.type} · {s.chunks ?? "?"} chunks</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
