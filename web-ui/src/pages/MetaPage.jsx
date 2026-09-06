import { motion } from "framer-motion";
import { Champ, inputCls } from "../components/fields";

export default function MetaPage({ meta, setMeta, onTester, testEtat }) {
  const set = (k) => (e) => setMeta({ ...meta, [k]: e.target.value });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-xl space-y-4"
    >
      <div>
        <h2 className="font-display text-2xl font-bold">Meta / Comptes</h2>
        <p className="mt-1 text-sm text-[#555555]">
          Connexion au Worker et au numéro WhatsApp (Meta). Ces valeurs restent dans ce navigateur.
        </p>
      </div>

      <Champ
        label="URL du Worker"
        hint="Ex : https://wapp-assist-worker.votre-compte.workers.dev (sans slash final)"
      >
        <input className={inputCls} value={meta.workerUrl} onChange={set("workerUrl")} placeholder="https://…" inputMode="url" />
      </Champ>

      <Champ label="Secret admin (ADMIN_SECRET)" hint="Celui posé via wrangler secret put. Jamais partagé.">
        <input
          className={inputCls}
          type="password"
          value={meta.adminSecret}
          onChange={set("adminSecret")}
          placeholder="••••••••"
          autoComplete="off"
        />
      </Champ>

      <Champ
        label="Phone Number ID Meta"
        hint="Meta Developer → votre app → WhatsApp → API Setup. Ex : 123456789012345"
      >
        <input className={inputCls} value={meta.phoneNumberId} onChange={set("phoneNumberId")} placeholder="ex : 123456789012345" inputMode="numeric" />
      </Champ>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onTester}
          className="rounded-lg border border-[#e0e0e0] bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:border-brand hover:text-brand"
        >
          Tester la connexion
        </button>
        {testEtat === "ok" && <span className="text-sm font-medium text-brand">Connexion OK.</span>}
        {testEtat === "chargement" && <span className="text-sm text-[#555555]">Test en cours…</span>}
      </div>
    </motion.div>
  );
}
