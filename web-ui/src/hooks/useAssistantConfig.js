import { useCallback, useEffect, useState } from "react";

const CLE = "wapp-assist-config";

export const CONFIG_DEFAUT = {
  apparence: {
    couleurPrimaire: "#10B27E",
    icone: "bot",
    bulle: "arrondi",
    fond: "clair",
  },
  personnalite: {
    ton: "Professionnel",
    niveauLangage: "Standard",
    styleReponse: "Direct",
    instructions: "",
  },
  comportement: {
    longueur: "Standard",
    proactivite: false,
    delai: 0,
    historique: false,
  },
};

export const ICONES = [
  { id: "bot", label: "Bot" },
  { id: "cercle", label: "Cercle" },
  { id: "etoile", label: "Étoile" },
  { id: "bouclier", label: "Bouclier" },
  { id: "hexagone", label: "Hexagone" },
];

export const BULLES = [
  { id: "arrondi", label: "Arrondi" },
  { id: "carre", label: "Carré" },
  { id: "asymetrique", label: "Asymétrique" },
];

export const FONDS = [
  { id: "clair", label: "Clair" },
  { id: "fonce", label: "Foncé" },
  { id: "degrade", label: "Dégradé" },
];

export const TONS = ["Professionnel", "Chaleureux", "Dynamique", "Analytique", "Pédagogue"];
export const NIVEAUX_LANGAGE = ["Simple", "Standard", "Soutenu"];
export const STYLES_REPONSE = ["Direct", "Explicatif", "Guidé"];
export const LONGUEURS = ["Courte", "Standard", "Longue"];
export const DELAIS = [0, 1, 2, 3];

function migrerConfig(brut) {
  if (!brut || typeof brut !== "object") return CONFIG_DEFAUT;
  return {
    apparence: { ...CONFIG_DEFAUT.apparence, ...(brut.apparence || {}) },
    personnalite: { ...CONFIG_DEFAUT.personnalite, ...(brut.personnalite || {}) },
    comportement: { ...CONFIG_DEFAUT.comportement, ...(brut.comportement || {}) },
  };
}

export function useAssistantConfig() {
  const [config, setConfig] = useState(() => {
    try {
      const raw = localStorage.getItem(CLE);
      if (!raw) return CONFIG_DEFAUT;
      return migrerConfig(JSON.parse(raw));
    } catch {
      return CONFIG_DEFAUT;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(config));
    } catch {
      // ignore
    }
    // Applique la couleur primaire en temps réel via CSS variable
    try {
      const couleur = config?.apparence?.couleurPrimaire || CONFIG_DEFAUT.apparence.couleurPrimaire;
      document.documentElement.style.setProperty("--brand", couleur);
    } catch {
      // ignore
    }
  }, [config]);

  // Initialise la variable au montage si pas encore posée
  useEffect(() => {
    try {
      document.documentElement.style.setProperty("--brand", config.apparence.couleurPrimaire);
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = useCallback((chemin, valeur) => {
    setConfig((c) => {
      const next = structuredClone ? structuredClone(c) : JSON.parse(JSON.stringify(c));
      const keys = chemin.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = valeur;
      return next;
    });
  }, []);

  const setApparence = useCallback((k, v) => patch(`apparence.${k}`, v), [patch]);
  const setPersonnalite = useCallback((k, v) => patch(`personnalite.${k}`, v), [patch]);
  const setComportement = useCallback((k, v) => patch(`comportement.${k}`, v), [patch]);

  const reset = useCallback(() => setConfig(CONFIG_DEFAUT), []);

  return { config, setConfig, patch, setApparence, setPersonnalite, setComportement, reset };
}
