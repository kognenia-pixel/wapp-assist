import { useState } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { Champ, inputCls } from "../components/fields";

export default function ProduitsPage({ boutique, setBoutique, produits, setProduits }) {
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [description, setDescription] = useState("");

  const setB = (k) => (e) => setBoutique({ ...boutique, [k]: e.target.value });

  const ajouter = () => {
    if (!nom.trim() || !prix.trim()) return;
    setProduits([...produits, { nom: nom.trim(), prix: prix.trim(), description: description.trim() }]);
    setNom("");
    setPrix("");
    setDescription("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <h2 className="font-display text-2xl font-bold">Produits &amp; Prix</h2>
        <p className="mt-1 text-sm text-[#555555]">Votre boutique d&apos;abord, puis vos produits un par un.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Champ label="Nom du commerce (obligatoire)">
          <input className={inputCls} value={boutique.nom} onChange={setB("nom")} placeholder="ex : Ma Boutique" />
        </Champ>
        <Champ label="Secteur">
          <input className={inputCls} value={boutique.secteur} onChange={setB("secteur")} placeholder="ex : cosmétiques, restaurant…" />
        </Champ>
      </div>
      <Champ label="Ton des réponses" hint="Ex : chaleureux et professionnel, vouvoiement">
        <input className={inputCls} value={boutique.ton} onChange={setB("ton")} placeholder="chaleureux et professionnel…" />
      </Champ>

      <div className="rounded-xl bg-[#f9f9f9] p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Ajouter un produit</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
          <input className={inputCls} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom (ex : Savon réparateur)" />
          <input className={inputCls} value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Prix (ex : 100 000)" />
        </div>
        <input
          className={`${inputCls} mt-3`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnel)"
        />
        <button
          type="button"
          onClick={ajouter}
          disabled={!nom.trim() || !prix.trim()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          <FiPlus size={16} /> Ajouter
        </button>
      </div>

      <div className="space-y-3">
        {produits.length === 0 && (
          <p className="text-sm text-[#555555]">Aucun produit pour l&apos;instant. Ajoutez-en au moins un avant l&apos;envoi.</p>
        )}
        {produits.map((p, i) => (
          <motion.div
            key={`${p.nom}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i * 0.05, 0.3) }}
            className="flex items-start justify-between gap-3 rounded-xl bg-[#f9f9f9] p-4 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-black">
                {p.nom} <span className="text-brand">· {p.prix}</span>
              </p>
              {p.description && <p className="mt-1 text-sm text-[#555555]">{p.description}</p>}
            </div>
            <button
              type="button"
              aria-label={`Supprimer ${p.nom}`}
              onClick={() => setProduits(produits.filter((_, j) => j !== i))}
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
