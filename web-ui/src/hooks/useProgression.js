import { useEffect, useMemo, useRef, useState } from "react";
import { BADGES, calculerBadges, calculerNiveau } from "../services/gamification";

const CLE_BADGES = "wapp-assist-badges-vus";
const CLE_MESSAGES = "wapp-assist-messages";

export function useMessagesTraites() {
  const [n, setN] = useState(() => {
    try {
      const v = localStorage.getItem(CLE_MESSAGES);
      return v ? Number(JSON.parse(v)) || 0 : 0;
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(CLE_MESSAGES, JSON.stringify(n));
    } catch {
      // ignore
    }
  }, [n]);
  return [n, setN];
}

export function useProgression({ meta, produits, faq, sources, messagesTraites, notifier }) {
  const badgesActuels = useMemo(
    () => calculerBadges({ meta, produits, faq, sources, messagesTraites }),
    [meta, produits, faq, sources, messagesTraites]
  );
  const niveau = useMemo(() => calculerNiveau(badgesActuels.size), [badgesActuels]);
  const vusRef = useRef(() => {
    try {
      const brut = JSON.parse(localStorage.getItem(CLE_BADGES) || "[]");
      return new Set(Array.isArray(brut) ? brut : []);
    } catch {
      return new Set();
    }
  });
  const [vus] = useState(() => vusRef.current());

  useEffect(() => {
    const nouveaux = [...badgesActuels].filter((id) => !vus.has(id));
    if (!nouveaux.length) return;
    nouveaux.forEach((id) => {
      const b = BADGES.find((x) => x.id === id);
      if (b) notifier(`${b.nom} debloque : ${b.description}`, true);
      vus.add(id);
    });
    try {
      localStorage.setItem(CLE_BADGES, JSON.stringify([...vus]));
    } catch {
      // ignore
    }
  }, [badgesActuels, vus, notifier]);

  return { badgesActuels, niveau, badges: BADGES };
}
