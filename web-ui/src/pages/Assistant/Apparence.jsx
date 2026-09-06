import { motion } from "framer-motion";
import { ICONE_OPTIONS, IconeAssistant } from "../../components/AssistantIcons";
import { BULLES, FONDS } from "../../hooks/useAssistantConfig";

function bulleCls(bulle) {
  if (bulle === "carre") return "rounded-md";
  if (bulle === "asymetrique") return "rounded-2xl rounded-bl-none";
  return "rounded-2xl";
}

function fondCls(fond) {
  if (fond === "fonce") return "bg-[#111827] text-white";
  if (fond === "degrade") return "bg-gradient-to-br from-[#10B27E]/20 via-white to-white text-black";
  return "bg-white text-black";
}

export default function Apparence({ config, setApparence }) {
  const { couleurPrimaire, icone, bulle, fond } = config.apparence;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold">Apparence</h3>
        <p className="mt-1 text-sm text-[#555555]">Personnalisez la couleur, l’icône et le style des bulles.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="block text-sm font-medium text-black">
          Couleur primaire
          <div className="mt-1 flex items-center gap-3">
            <input
              type="color"
              value={couleurPrimaire}
              onChange={(e) => setApparence("couleurPrimaire", e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-lg border border-[#e0e0e0] bg-white p-1"
            />
            <input
              type="text"
              value={couleurPrimaire}
              onChange={(e) => setApparence("couleurPrimaire", e.target.value)}
              placeholder="#10B27E"
              className="w-full rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <p className="mt-1 text-xs text-[#555555]">Défaut #10B27E — accents boutons, liens, focus.</p>
        </label>

        <div>
          <p className="text-sm font-medium text-black">Icône de l’assistant</p>
          <div className="mt-1 grid grid-cols-5 gap-2">
            {ICONE_OPTIONS.map(({ id, label, Icon }) => {
              const active = icone === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setApparence("icone", id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors ${
                    active ? "border-brand bg-brand/10 text-black" : "border-[#e0e0e0] bg-white hover:border-brand"
                  }`}
                >
                  <Icon size={18} color={active ? couleurPrimaire : "#111827"} />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-[#555555]">Utilisée dans les bulles et comme photo de profil WhatsApp.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="block text-sm font-medium text-black">
          Style de bulle
          <select
            value={bulle}
            onChange={(e) => setApparence("bulle", e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {BULLES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-black">
          Arrière-plan
          <select
            value={fond}
            onChange={(e) => setApparence("fond", e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#e0e0e0] bg-white p-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {FONDS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`rounded-xl border p-4 shadow-sm ${fondCls(fond)} border-[#e0e0e0]`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Aperçu en direct</p>
        <div className="mt-3 space-y-2">
          <div className="flex justify-end">
            <p className="max-w-[75%] rounded-2xl bg-black px-3 py-2 text-sm text-white">Salut, vous avez quoi comme boisson fraîche ?</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2"
          >
            <span
              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: couleurPrimaire }}
            >
              <IconeAssistant icone={icone} size={16} couleur="white" />
            </span>
            <p className={`max-w-[75%] px-3 py-2 text-sm shadow-sm ${bulleCls(bulle)}`} style={{ background: couleurPrimaire, color: "white" }}>
              Bonjour ! Thème {bulle} avec icône {icone} — couleur {couleurPrimaire}. Nos jus sont à 15 000 GNF.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
