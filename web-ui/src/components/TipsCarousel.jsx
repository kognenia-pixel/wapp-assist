import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiZap, FiX } from "react-icons/fi";
import { TIPS } from "../data/tips";

const DELAI_MS = 8000;
const CLE_STOCKAGE = "wapp-assist-tips";

export function tipsMasques() {
  try {
    return localStorage.getItem(CLE_STOCKAGE) === "masques";
  } catch {
    return false;
  }
}

export default function TipsCarousel({ recharge }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(() => !tipsMasques());

  useEffect(() => {
    if (!visible) return;
    const minuteur = setInterval(() => setIndex((i) => (i + 1) % TIPS.length), DELAI_MS);
    return () => clearInterval(minuteur);
  }, [visible, recharge]);

  if (!visible) return null;

  const masquer = (definitif) => {
    if (definitif) {
      try {
        localStorage.setItem(CLE_STOCKAGE, "masques");
      } catch {
        // stockage indisponible : masquage session uniquement
      }
    }
    setVisible(false);
  };

  return (
    <div className="pointer-events-none fixed bottom-5 left-0 right-0 z-40 flex justify-center px-4 md:left-[260px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${recharge}-${index}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-auto w-full max-w-xl rounded-2xl bg-black px-4 py-3 text-white shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <FiZap size={20} className="shrink-0 text-brand" aria-hidden />
            <p className="flex-1 text-sm leading-snug">{TIPS[index]}</p>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Conseil précédent"
                onClick={() => setIndex((index - 1 + TIPS.length) % TIPS.length)}
                className="rounded-md p-1.5 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Conseil suivant"
                onClick={() => setIndex((index + 1) % TIPS.length)}
                className="rounded-md p-1.5 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <FiChevronRight size={16} />
              </button>
              <button
                type="button"
                aria-label="Masquer les conseils"
                onClick={() => masquer(false)}
                className="rounded-md p-1.5 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between pl-8">
            <div className="flex gap-1.5" role="tablist" aria-label="Conseils">
              {TIPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Conseil ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-brand" : "w-1.5 bg-white/30 hover:bg-white/50"}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => masquer(true)}
              className="text-xs text-gray-400 underline hover:text-white"
            >
              Ne plus afficher
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
