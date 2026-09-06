import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import Toast from "./components/Toast";
import Onboarding from "./components/Onboarding";
import Tutoriel, { chargerProgressionTuto } from "./components/Tutoriel";
import { BoutonPrincipal } from "./components/fields";
import Dashboard from "./pages/Dashboard";
import MetaPage from "./pages/MetaPage";
import ProduitsPage from "./pages/ProduitsPage";
import FAQPage from "./pages/FAQPage";
import SourcesPage from "./pages/SourcesPage";
import AssistantPage from "./pages/Assistant";
import ProgressionPage from "./pages/ProgressionPage";
import { useLocalStorage } from "./hooks";
import { envoyerCarnet, envoyerConfig, testerConnexion } from "./api";
import { useAssistantConfig } from "./hooks/useAssistantConfig";
import { useMessagesTraites, useProgression } from "./hooks/useProgression";

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [meta, setMeta] = useLocalStorage("wapp-assist-meta", {
    workerUrl: "",
    adminSecret: "",
    phoneNumberId: "",
  });
  const [boutique, setBoutique] = useLocalStorage("wapp-assist-boutique", {
    nom: "",
    secteur: "",
    ton: "",
    horaires: "",
    adresse: "",
    contacts: "",
  });
  const [produits, setProduits] = useLocalStorage("wapp-assist-produits", []);
  const [faq, setFaq] = useLocalStorage("wapp-assist-faq", []);
  const { config, setApparence, setPersonnalite, setComportement } = useAssistantConfig();
  const [sourcesLS, setSourcesLS] = useLocalStorage("wapp-assist-sources", []);
  const [messagesTraites] = useMessagesTraites();

  const [toast, setToast] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [envoiConfig, setEnvoiConfig] = useState(false);
  const [testEtat, setTestEtat] = useState(null);
  const [guideOuvert, setGuideOuvert] = useState(() => {
    try {
      return localStorage.getItem("wapp-assist-onboarding") !== "done";
    } catch {
      return true;
    }
  });
  const [etapeGuide, setEtapeGuide] = useState(0);
  const [tutoOuvert, setTutoOuvert] = useState(false);
  const [etapeTuto, setEtapeTuto] = useState(() => chargerProgressionTuto().etape);
  const [tutoVu, setTutoVu] = useState(() => chargerProgressionTuto().vu);
  const minuteur = useRef(null);

  // Nettoie l'ancien stockage avatar (ignore, ne casse pas les autres onglets)
  useEffect(() => {
    try {
      localStorage.removeItem("wapp-assist-avatar");
    } catch {
      // ignore
    }
  }, []);

  const terminerGuide = () => {
    try {
      localStorage.setItem("wapp-assist-onboarding", "done");
    } catch {
      // stockage indisponible : le guide reviendra, sans bloquer
    }
    setGuideOuvert(false);
    if (!tutoVu) {
      setEtapeTuto(0);
      setTutoOuvert(true);
    }
  };

  const terminerTuto = () => {
    try {
      const brut = JSON.parse(localStorage.getItem("wapp-assist-tuto") || "{}");
      localStorage.setItem("wapp-assist-tuto", JSON.stringify({ ...brut, vu: true }));
    } catch {
      // ignore
    }
    setTutoVu(true);
    setTutoOuvert(false);
  };

  const rouvrirTuto = () => {
    setEtapeTuto(0);
    setTutoOuvert(true);
  };

  const rouvrirGuide = () => {
    setEtapeGuide(0);
    setGuideOuvert(true);
  };

  const notifier = useCallback((message, ok) => {
    if (minuteur.current) clearTimeout(minuteur.current);
    setToast({ id: Date.now(), message, ok });
    minuteur.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const { badgesActuels, niveau } = useProgression({
    meta,
    produits,
    faq,
    sources: sourcesLS,
    messagesTraites,
    notifier,
  });

  const tester = async () => {
    setTestEtat("chargement");
    try {
      await testerConnexion(meta);
      setTestEtat("ok");
      notifier("Connexion au Worker OK.", true);
    } catch (e) {
      setTestEtat(null);
      notifier(e.message, false);
    }
  };

  const envoyer = async () => {
    if (!meta.workerUrl || !meta.adminSecret || !meta.phoneNumberId) {
      notifier("Renseignez d'abord l'URL, le secret et le Phone Number ID (onglet Meta / Comptes).", false);
      setActive("meta");
      return;
    }
    if (!boutique.nom.trim()) {
      notifier("Le nom du commerce est obligatoire (onglet Produits).", false);
      setActive("produits");
      return;
    }
    if (produits.length === 0) {
      notifier("Attention : aucun produit — l'assistant répondra quand même, mais ajoutez-en au moins un.", true);
    }
    setEnvoi(true);
    try {
      await envoyerCarnet({
        workerUrl: meta.workerUrl,
        adminSecret: meta.adminSecret,
        phoneNumberId: meta.phoneNumberId,
        kb: {
          nom: boutique.nom.trim(),
          secteur: boutique.secteur.trim(),
          ton: boutique.ton.trim(),
          nom_repondant: "",
          horaires: boutique.horaires.trim(),
          adresse: boutique.adresse.trim(),
          contacts: boutique.contacts.trim(),
          catalogue: produits,
          faq,
          regles: [],
          escalation: { nom: "", numero: "" },
        },
      });
      notifier("Fiche envoyée au Worker. Testez sur WhatsApp !", true);
    } catch (e) {
      notifier(e.message, false);
    } finally {
      setEnvoi(false);
    }
  };

  const envoyerConfigAuWorker = async () => {
    if (!meta.workerUrl || !meta.adminSecret || !meta.phoneNumberId) {
      notifier("Renseignez d'abord l'URL, le secret et le Phone Number ID (onglet Meta / Comptes).", false);
      setActive("meta");
      return;
    }
    setEnvoiConfig(true);
    try {
      await envoyerConfig({
        workerUrl: meta.workerUrl,
        adminSecret: meta.adminSecret,
        phoneNumberId: meta.phoneNumberId,
        config,
      });
      notifier("Configuration envoyée au Worker.", true);
    } catch (e) {
      notifier(e.message, false);
    } finally {
      setEnvoiConfig(false);
    }
  };

  return (
    <Layout
      active={active}
      onNavigate={setActive}
      onHelp={rouvrirGuide}
      onTutoriel={rouvrirTuto}
      tutoNouveau={!tutoVu}
      fond={config.apparence.fond}
      couleurPrimaire={config.apparence.couleurPrimaire}
    >
      <Onboarding
        ouvert={guideOuvert}
        etape={etapeGuide}
        setEtape={setEtapeGuide}
        onAller={(onglet) => setActive(onglet)}
        onTerminer={terminerGuide}
      />
      <Tutoriel
        ouvert={tutoOuvert}
        etape={etapeTuto}
        setEtape={setEtapeTuto}
        onAller={(onglet) => setActive(onglet)}
        onTerminer={terminerTuto}
      />
      <AnimatePresence mode="wait">
        <div key={active}>
          {active === "meta" && (
            <MetaPage meta={meta} setMeta={setMeta} onTester={tester} testEtat={testEtat} />
          )}
          {active === "dashboard" && (
            <Dashboard
              meta={meta}
              boutique={boutique}
              produits={produits}
              faq={faq}
              nbBadges={badgesActuels.size}
              niveau={niveau}
            />
          )}
          {active === "produits" && (
            <div>
              <ProduitsPage boutique={boutique} setBoutique={setBoutique} produits={produits} setProduits={setProduits} />
              <div className="mt-6">
                <BoutonPrincipal loading={envoi} onClick={envoyer}>
                  Envoyer au Worker
                </BoutonPrincipal>
              </div>
            </div>
          )}
          {active === "faq" && (
            <div>
              <FAQPage boutique={boutique} setBoutique={setBoutique} faq={faq} setFaq={setFaq} />
              <div className="mt-6">
                <BoutonPrincipal loading={envoi} onClick={envoyer}>
                  Envoyer au Worker
                </BoutonPrincipal>
              </div>
            </div>
          )}
          {active === "sources" && <SourcesPage meta={meta} notifier={notifier} />}
          {active === "assistant" && (
            <AssistantPage
              config={config}
              setApparence={setApparence}
              setPersonnalite={setPersonnalite}
              setComportement={setComportement}
              sources={sourcesLS}
              onAllerSources={() => setActive("sources")}
              onRelancerTuto={rouvrirTuto}
              onEnvoyerConfig={envoyerConfigAuWorker}
              envoiConfig={envoiConfig}
            />
          )}
          {active === "progression" && (
            <ProgressionPage
              nbBadges={badgesActuels.size}
              badgesActuels={badgesActuels}
              stats={{ produits: produits.length, faq: faq.length, sources: sourcesLS.length, messages: messagesTraites }}
            />
          )}
        </div>
      </AnimatePresence>
      <Toast toast={toast} />
    </Layout>
  );
}
