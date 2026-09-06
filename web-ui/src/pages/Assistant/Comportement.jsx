import { LONGUEURS, DELAIS } from "../../hooks/useAssistantConfig";
import { IconeAssistant } from "../../components/AssistantIcons";

function bulleCls(bulle) {
  if (bulle === "carre") return "rounded-md";
  if (bulle === "asymetrique") return "rounded-2xl rounded-bl-none";
  return "rounded-2xl";
}

function exempleLongueur(longueur) {
  if (longueur === "Courte") return "Jus ananas : 12 000 GNF. Dispo aujourd'hui.";
  if (longueur === "Longue") return "Jus ananas frais : 12 000 GNF, pressé du jour, livraison en 30 min à Conakry. Ingrédients 100% naturels, bouteille 33cl. Souhaitez-vous commander ?";
  return "Jus ananas frais à 12 000 GNF, dispo aujourd'hui. Dites-m'en plus sur votre besoin !";
}

export default function Comportement({ config, setComportement, onRelancerTuto }) {
  const { longueur, proactivite, delai, historique } = config.comportement;
  const apparence = config.apparence;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold">Comportement</h3>
        <p className="mt-1 text-sm text-[#555555]">Contrôle la longueur, la proactivité et la mémoire.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-black">
          Longueur des réponses
          <select
            value={longueur}
            onChange={(e) => setComportement("longueur", e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {LONGUEURS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-black">
          Délai avant réponse
          <select
            value={String(delai)}
            onChange={(e) => setComportement("delai", Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {DELAIS.map((d) => (
              <option key={d} value={String(d)}>
                {d}s
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-black">
          <input
            type="checkbox"
            checked={!!proactivite}
            onChange={(e) => setComportement("proactivite", e.target.checked)}
            className="accent-brand"
          />
          Proactivité — pose une question de suivi à chaque réponse
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-black">
          <input
            type="checkbox"
            checked={!!historique}
            onChange={(e) => setComportement("historique", e.target.checked)}
            className="accent-brand"
          />
          Conserver le contexte des 5 derniers messages
        </label>
      </div>

      <div className="rounded-xl bg-[#f9f9f9] p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#555555]">Aperçu comportement</p>
        <div className="mt-3 flex items-start gap-2">
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ background: apparence.couleurPrimaire }}>
            <IconeAssistant icone={apparence.icone} size={14} couleur="white" />
          </span>
          <p className={`max-w-[75%] px-3 py-2 text-sm shadow-sm ${bulleCls(apparence.bulle)}`} style={{ background: apparence.couleurPrimaire, color: "white" }}>
            {exempleLongueur(longueur)}
            {proactivite ? " Avez-vous d'autres questions ?" : ""}
            {delai > 0 ? ` (délai ${delai}s)` : ""}
            {historique ? " · mémoire 5 msgs" : ""}
          </p>
        </div>
        <p className="mt-2 text-xs text-[#555555]">Le Worker ajoute la question de suivi et respecte le délai côté envoi.</p>
      </div>

      <div className="rounded-xl border border-[#e0e0e0] bg-white p-4">
        <h4 className="text-sm font-semibold">Tutoriel</h4>
        <p className="mt-1 text-xs text-[#555555]">Le tutoriel est désormais 100% textuel, sans voix.</p>
        <button
          type="button"
          onClick={onRelancerTuto}
          className="mt-3 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-85"
        >
          Relancer le tutoriel
        </button>
      </div>
    </div>
  );
}
