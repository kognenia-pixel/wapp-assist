import { useEffect, useState } from "react";

export function useLocalStorage(cle, valeurInitiale) {
  const [valeur, setValeur] = useState(() => {
    try {
      const brut = localStorage.getItem(cle);
      return brut !== null ? JSON.parse(brut) : valeurInitiale;
    } catch {
      return valeurInitiale;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(cle, JSON.stringify(valeur));
    } catch {
      // stockage plein ou indisponible : on ignore, l'app reste utilisable
    }
  }, [cle, valeur]);
  return [valeur, setValeur];
}
