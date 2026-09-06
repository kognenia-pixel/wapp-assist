import { useState } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { Champ, inputCls } from "../components/fields";

export default function FAQPage({ boutique, setBoutique, faq, setFaq }) {
  const [question, setQuestion] = useState("");
  const [reponse, setReponse] = useState("");

  const setB = (k) => (e) => setBoutique({ ...boutique, [k]: e.target.value });

  const ajouter = () => {
    if (!question.trim() || !reponse.trim()) return;
    setFaq([...faq, { question: question.trim(), reponse: reponse.trim() }]);
    setQuestion("");
    setReponse("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <h2 className="font-display text-2xl font-bold">FAQ &amp; Horaires</h2>
        <p className="mt-1 text-sm text-[#555555]">Horaires, adresse et réponses aux questions fréquentes.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Champ label="Horaires">
          <input className={inputCls} value={boutique.horaires} onChange={setB("horaires")} placeholder="ex : Lun-Sam 9h-19h" />
        </Champ>
        <Champ label="Adresse">
          <input className={inputCls} value={boutique.adresse} onChange={setB("adresse")} placeholder="ex : Dixinn, Conakry" />
        </Champ>
      </div>
      <Champ label="Contacts (livraison, paiement)" hint="Ex : LIVRAISON partout à Conakry. PAIEMENT Orange Money ou espèces.">
        <input className={inputCls} value={boutique.contacts} onChange={setB("contacts")} placeholder="Livraison, paiement…" />
      </Champ>

      <div className="rounded-xl bg-[#f9f9f9] p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Ajouter une question / réponse</h3>
        <input
          className={`${inputCls} mt-3`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Question (ex : Vous livrez ?)"
        />
        <input
          className={`${inputCls} mt-3`}
          value={reponse}
          onChange={(e) => setReponse(e.target.value)}
          placeholder="Réponse (ex : Oui, partout à Conakry…)"
        />
        <button
          type="button"
          onClick={ajouter}
          disabled={!question.trim() || !reponse.trim()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          <FiPlus size={16} /> Ajouter
        </button>
      </div>

      <div className="space-y-3">
        {faq.length === 0 && (
          <p className="text-sm text-[#555555]">Aucune FAQ pour l&apos;instant.</p>
        )}
        {faq.map((f, i) => (
          <motion.div
            key={`${f.question}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i * 0.05, 0.3) }}
            className="flex items-start justify-between gap-3 rounded-xl bg-[#f9f9f9] p-4 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-black">{f.question}</p>
              <p className="mt-1 text-sm text-[#555555]">{f.reponse}</p>
            </div>
            <button
              type="button"
              aria-label="Supprimer cette FAQ"
              onClick={() => setFaq(faq.filter((_, j) => j !== i))}
              className="rounded-md p-2 text-[#555555] transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <FiTrash2 size={16} />
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
