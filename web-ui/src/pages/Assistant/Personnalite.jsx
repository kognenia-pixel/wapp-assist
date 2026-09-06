import { TONS, NIVEAUX_LANGAGE, STYLES_REPONSE } from "../../hooks/useAssistantConfig";

export default function Personnalite({ config, setPersonnalite }) {
  const { ton, niveauLangage, styleReponse, instructions } = config.personnalite;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold">Personnalité</h3>
        <p className="mt-1 text-sm text-[#555555]">Définit le ton et le registre injectés dans le prompt Gemini.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-medium text-black">
          Ton
          <select
            value={ton}
            onChange={(e) => setPersonnalite("ton", e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {TONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-black">
          Niveau de langage
          <select
            value={niveauLangage}
            onChange={(e) => setPersonnalite("niveauLangage", e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {NIVEAUX_LANGAGE.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-black">
          Style de réponse
          <select
            value={styleReponse}
            onChange={(e) => setPersonnalite("styleReponse", e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {STYLES_REPONSE.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-black">
        Instructions système libres
        <textarea
          value={instructions}
          onChange={(e) => setPersonnalite("instructions", e.target.value)}
          rows={4}
          placeholder="Ex : Tu es un assistant pour une boutique de cosmétiques, vouvoiement, conseils produits..."
          className="mt-1 w-full rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <p className="mt-1 text-xs font-normal text-[#555555]">Ajoutées telles quelles au prompt système.</p>
      </label>

      <div className="rounded-xl bg-[#f9f9f9] p-4 text-sm">
        <p className="font-semibold">Aperçu ton</p>
        <p className="mt-1 text-[#555555]">
          {ton === "Chaleureux" && "Avec plaisir ! Je vous aide avec le sourire — dites-m’en plus sur votre besoin."}
          {ton === "Dynamique" && "Top ! On s’en occupe vite — quel produit vous fait envie ?"}
          {ton === "Analytique" && "Voici une réponse structurée : prix, disponibilité et options comparées."}
          {ton === "Pédagogue" && "Je vous explique pas à pas : voici ce que propose l’offre et comment commander."}
          {ton === "Professionnel" && "Bonjour, je reste à votre disposition pour toute information complémentaire."}
          {" "}
          <span className="opacity-60">· Niveau {niveauLangage} · Style {styleReponse}</span>
        </p>
      </div>
    </div>
  );
}
