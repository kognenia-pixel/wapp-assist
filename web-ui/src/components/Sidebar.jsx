import { FiGrid, FiBox, FiSettings, FiHelpCircle, FiLifeBuoy, FiBookOpen, FiBook, FiCpu, FiAward } from "react-icons/fi";

const LINKS = [
  { id: "dashboard", label: "Tableau de bord", icon: FiGrid },
  { id: "produits", label: "Produits", icon: FiBox },
  { id: "meta", label: "Meta / Comptes", icon: FiSettings },
  { id: "faq", label: "FAQ & Horaires", icon: FiHelpCircle },
  { id: "sources", label: "Sources", icon: FiBook },
  { id: "assistant", label: "Assistant", icon: FiCpu },
  { id: "progression", label: "Progression", icon: FiAward },
];

export default function Sidebar({ active, onNavigate, onHelp, onTutoriel, tutoNouveau }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-6 pt-7">
        <span className="font-display text-xl font-bold tracking-tight text-white">
          Wapp <span className="text-brand">Assist</span>
        </span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {LINKS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} aria-hidden />
              {label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto space-y-1 px-3 pb-2">
        <button
          type="button"
          onClick={onTutoriel}
          className="relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span className="relative">
            <FiBookOpen size={18} aria-hidden />
            {tutoNouveau && (
              <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
              </span>
            )}
          </span>
          Tutoriel
        </button>
        <button
          type="button"
          onClick={onHelp}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <FiLifeBuoy size={18} aria-hidden />
          Aide
        </button>
      </div>
      <div className="px-6 pb-5 text-xs text-gray-500">
        Interface premium — vos clés restent chez vous.
      </div>
    </div>
  );
}
