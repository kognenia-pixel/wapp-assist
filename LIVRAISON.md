# Livraison — processus le plus simple

## Paiement
- Orange Money : lien de paiement (à créer sur ton compte marchand) → `page-vente/index.html` bouton “Acheter”.
- Alternative : USDT (TRC20) → adresse à afficher après clic.

## Après paiement (automatique ou manuel)
1. Vérifie le paiement (notif Orange Money / blockchain).
2. Envoie PAR WHATSAPP (ou mail) en 1 copier-coller :
   ```
   Merci pour ton achat Wapp Assist ✅
   ZIP : https://ton-drive.com/wapp-assist.zip
   Installateur : https://wapp-installer.onrender.com  (secret : <INSTALLER_SECRET>)
   Guide : wapp-assist/docs/GUIDE_INSTALL.md (dans le ZIP) + https://wapp-installer.onrender.com
   Démo : coche “Mode simulation” pour tester sans déployer
   Usage libre : ton commerce, tes clients, revente — comme tu veux.
   ```
3. Contenu du ZIP : `worker/`, `web-ui/`, `installer-web/`, `setup.sh`, `docs/GUIDE_INSTALL.md`, `page-vente/`, `MESSAGE_VENTE.txt`.

## Pas de support
- Produit en l’état. Le client est autonome (guide + logs en direct → erreur claire si échec).
- S’il bloque : renvoie vers le guide, pas d’intervention SSH de ta part.

## Temps
- Envoi : <1 min. Installation client : 2-5 min. En ligne : immédiat.

## Check-list avant d’envoyer
- [ ] `INSTALLER_SECRET` changé (pas `change-me`)
- [ ] `SETUP_SH_URL` pointe vers ton repo public/private raw
- [ ] `https://wapp-installer.onrender.com/api/health` → `{"status":"ok"}`
- [ ] Mode simulation OK (6/6)
- [ ] Page de vente en ligne
