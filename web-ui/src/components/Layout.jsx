import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import Sidebar from "./Sidebar";
import TipsCarousel from "./TipsCarousel";

export default function Layout({ active, onNavigate, onHelp, onTutoriel, tutoNouveau, fond, couleurPrimaire, children }) {
  const [open, setOpen] = useState(false);
  const [tipsCle, setTipsCle] = useState(0);

  useEffect(() => {
    if (couleurPrimaire) {
      document.documentElement.style.setProperty("--brand", couleurPrimaire);
    }
  }, [couleurPrimaire]);

  const go = (id) => {
    onNavigate(id);
    setOpen(false);
  };

  const fondMain =
    fond === "fonce" ? "bg-[#111827] text-white" : fond === "degrade" ? "bg-gradient-to-br from-brand/10 via-white to-white" : "bg-white";

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Barre mobile */}
      <div className="flex items-center justify-between bg-black px-4 py-3 md:hidden">
        <span className="font-display text-lg font-bold text-white">
          Wapp <span className="text-brand">Assist</span>
        </span>
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-white hover:bg-white/10"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Menu mobile déroulant */}
      {open && (
        <div className="bg-black md:hidden">
          <Sidebar
            active={active}
            onNavigate={go}
            onHelp={() => { setOpen(false); onHelp(); }}
            onTutoriel={() => { setOpen(false); onTutoriel(); }}
            tutoNouveau={tutoNouveau}
          />
        </div>
      )}

      <div className="flex">
        {/* Sidebar desktop fixe 260px */}
        <aside className="hidden h-screen w-[260px] shrink-0 bg-black text-white md:sticky md:top-0 md:block">
          <Sidebar active={active} onNavigate={onNavigate} onHelp={onHelp} onTutoriel={onTutoriel} tutoNouveau={tutoNouveau} />
        </aside>

        {/* Contenu principal */}
        <main className={`min-h-screen flex-1 p-6 pb-28 sm:p-10 sm:pb-28 ${fondMain}`}>{children}</main>
      </div>

      <TipsCarousel recharge={tipsCle} />
    </div>
  );
}
