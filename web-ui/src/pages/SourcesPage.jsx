import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiTrash2, FiRefreshCw, FiLink, FiFileText } from "react-icons/fi";
import * as pdfjs from "pdfjs-dist";
import workerUrlPdf from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Champ, inputCls, BoutonPrincipal } from "../components/fields";
import { ajouterSource, listerSources, supprimerSource } from "../api";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrlPdf;

async function extraireTexteFichier(fichier) {
  if (/\.txt$/i.test(fichier.name) || fichier.type.startsWith("text/")) {
    return await fichier.text();
  }
  if (/\.pdf$/i.test(fichier.name) || fichier.type === "application/pdf") {
    const tampon = await fichier.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: tampon }).promise;
    let texte = "";
    const pages = Math.min(pdf.numPages, 30); // garde-fou : 30 pages max
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const contenu = await page.getTextContent();
      texte += contenu.items.map((it) => it.str).join(" ") + "\n";
    }
    return texte;
  }
  throw new Error("Format accepté : .pdf ou .txt uniquement.");
}

export default function SourcesPage({ meta, notifier }) {
  const [sources, setSources] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wapp-assist-sources") || "[]");
    } catch {
      return [];
    }
  });
  const [url, setUrl] = useState("");
  const [chargement, setChargement] = useState(false);
  const [rafraichi, setRafraichi] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("wapp-assist-sources", JSON.stringify(sources));
    } catch {
      // ignore
    }
  }, [sources]);

  const connexion = { workerUrl: meta.workerUrl, adminSecret: meta.adminSecret };
  const pid = meta.phoneNumberId;

  const verifMeta = () => {
    if (!meta.workerUrl || !meta.adminSecret || !pid) {
      notifier("Renseignez d'abord URL, secret et Phone Number ID (onglet Meta / Comptes).", false);
      return false;
    }
    return true;
  };

  const synchroniser = async () => {
    if (!verifMeta()) return;
    setChargement(true);
    try {
      const data = await listerSources(connexion, pid);
      setSources(
        (data.sources || []).map((s) => ({
          nom: s.nom,
          type: s.type,
          date: s.date,
          chunks: s.chunks,
          extrait: s.extrait,
          statut: "indexé",
        }))
      );
      setRafraichi(true);
      notifier("Sources synchronisées depuis le Worker.", true);
    } catch (e) {
      notifier(e.message, false);
    } finally {
      setChargement(false);
    }
  };

  const envoyerSource = async (nom, type, content) => {
    const data = await ajouterSource(connexion, {
      phone_number_id: pid,
      type,
      nom,
      content,
    });
    setSources((anciennes) => {
      const autres = anciennes.filter((s) => s.nom !== nom);
      return [...autres, { nom, type, date: new Date().toISOString().slice(0, 10), chunks: data.chunks, extrait: "", statut: "indexé" }];
    });
    return data;
  };

  const ajouterFichier = async (e) => {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier || !verifMeta()) return;
    setChargement(true);
    try {
      const texte = await extraireTexteFichier(fichier);
      const data = await envoyerSource(fichier.name, "file", texte);
      notifier(`« ${fichier.name} » indexé (${data.chunks} chunks).`, true);
    } catch (err) {
      notifier(err.message, false);
    } finally {
      setChargement(false);
    }
  };

  const ajouterUrl = async () => {
    if (!url.trim() || !verifMeta()) return;
    setChargement(true);
    try {
      const data = await envoyerSource(url.trim(), "url", url.trim());
      notifier(`URL indexée (${data.chunks} chunks).`, true);
      setUrl("");
    } catch (err) {
      notifier(err.message, false);
    } finally {
      setChargement(false);
    }
  };

  const retirer = async (nom) => {
    if (!verifMeta()) return;
    try {
      await supprimerSource(connexion, pid, nom);
      setSources((anciennes) => anciennes.filter((s) => s.nom !== nom));
      notifier(`« ${nom} » supprimée.`, true);
    } catch (err) {
      notifier(err.message, false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <h2 className="font-display text-2xl font-bold">Sources</h2>
        <p className="mt-1 text-sm text-[#555555]">
          PDF, textes ou pages web : le bot s&apos;en servira pour répondre (10 max par compte).
        </p>
      </div>

      <div className="rounded-xl bg-[#f9f9f9] p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <FiFileText size={15} /> Ajouter un fichier (.pdf, .txt)
        </h3>
        <input
          type="file"
          accept=".pdf,.txt,text/plain,application/pdf"
          onChange={ajouterFichier}
          disabled={chargement}
          className="mt-3 w-full text-sm text-[#555555] file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-85 disabled:opacity-50"
        />
      </div>

      <div className="rounded-xl bg-[#f9f9f9] p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <FiLink size={15} /> Ajouter une URL
        </h3>
        <div className="mt-3 flex gap-2">
          <input
            className={inputCls}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ajouterUrl()}
            placeholder="https://…"
            inputMode="url"
          />
          <button
            type="button"
            onClick={ajouterUrl}
            disabled={chargement || !url.trim()}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-85 disabled:opacity-40"
          >
            <FiPlus size={15} /> Ajouter
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <BoutonPrincipal loading={chargement} onClick={synchroniser}>
          <FiRefreshCw size={15} /> Tout synchroniser
        </BoutonPrincipal>
        {rafraichi && <span className="text-xs text-[#555555]">{sources.length} source(s) indexée(s).</span>}
      </div>

      <div className="space-y-3">
        {sources.length === 0 && (
          <p className="text-sm text-[#555555]">Aucune source pour l&apos;instant.</p>
        )}
        {sources.map((s, i) => (
          <motion.div
            key={`${s.nom}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i * 0.05, 0.3) }}
            className="rounded-xl bg-[#f9f9f9] p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-black">
                  {s.nom}{" "}
                  <span className="ml-1 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-semibold text-brand">
                    {s.type} · {s.chunks ?? "?"} chunks
                  </span>
                </p>
                <p className="mt-1 text-xs text-[#555555]">{s.date} · {s.statut || "indexé"}</p>
                {s.extrait && (
                  <p className="mt-2 rounded-lg bg-white p-2 text-xs italic text-[#555555]">« {s.extrait}… »</p>
                )}
              </div>
              <button
                type="button"
                aria-label={`Supprimer ${s.nom}`}
                onClick={() => retirer(s.nom)}
                className="rounded-md p-2 text-[#555555] transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Champ label="Astuce" hint="">
        <p className="text-xs text-[#555555]">
          Le texte des PDF est extrait dans votre navigateur avant l&apos;envoi : seuls du texte
          et des chiffres transitent, jamais vos fichiers.
        </p>
      </Champ>
    </motion.div>
  );
}
