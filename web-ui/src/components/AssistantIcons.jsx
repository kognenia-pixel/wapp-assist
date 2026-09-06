import { FiCpu, FiCircle, FiStar, FiShield, FiHexagon } from "react-icons/fi";

const MAP = {
  bot: FiCpu,
  cercle: FiCircle,
  etoile: FiStar,
  bouclier: FiShield,
  hexagone: FiHexagon,
};

export function IconeAssistant({ icone = "bot", size = 20, couleur = "currentColor" }) {
  const Comp = MAP[icone] || FiCpu;
  return <Comp size={size} color={couleur} aria-hidden />;
}

export const ICONE_OPTIONS = [
  { id: "bot", label: "Bot", Icon: FiCpu },
  { id: "cercle", label: "Cercle", Icon: FiCircle },
  { id: "etoile", label: "Étoile", Icon: FiStar },
  { id: "bouclier", label: "Bouclier", Icon: FiShield },
  { id: "hexagone", label: "Hexagone", Icon: FiHexagon },
];
