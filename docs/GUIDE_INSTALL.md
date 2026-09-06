# Guide d'installation — Wapp Assist (français simple)

Destiné à un débutant. Durée : 20 à 40 minutes. Vous n'avez besoin d'aucun serveur payant.

## Ce qu'il vous faut avant de commencer

1. Un compte Cloudflare gratuit : https://dash.cloudflare.com/sign-up (sans carte).
2. Une clé Gemini gratuite : https://aistudio.google.com/apikey (bouton « Create API key »).
3. Une app Meta WhatsApp (gratuite) : https://developers.facebook.com
   - Créez une app « Entreprise », ajoutez le produit « WhatsApp ».
   - Notez le **Phone Number ID** (page API Setup).
   - Générez un **token** (bouton « Generate token », copiez-le tout de suite).
   - Ajoutez votre propre numéro comme **destinataire de test** (sandbox Meta).
4. Node.js 22+ : https://nodejs.org (bouton LTS, suivant-suivant).

Le script ne peut PAS créer l'app Meta ni le token à votre place (c'est votre compte,
votre navigateur). Il vous donne les liens exacts, puis vérifie ce que vous collez.

## Installation

1. Décompressez `wapp-assist.zip`, ouvrez un terminal dedans.
2. Lancez : `./setup.sh` (sur Windows : dans Git Bash ou WSL).
3. Répondez aux questions (les secrets ne s'affichent jamais) :
   - clé Gemini, token Meta, VERIFY_TOKEN (inventez une phrase), ADMIN_SECRET (inventez une phrase longue),
   - Phone Number ID, nom de boutique, numéro public.
4. Le script déploie le Worker, crée le stockage, pose les secrets, affiche l'URL.
5. Déployez la page : `npx wrangler pages deploy web --project-name wapp-assist-admin`.
6. Ouvrez l'URL de la page, remplissez les 3 onglets, cliquez « Envoyer au Worker ».
7. Côté Meta (navigateur) : WhatsApp > Configuration > Callback URL = URL du Worker,
   Verify token = le même que saisi, Vérifier et enregistrer. Puis abonnez le champ « messages ».
8. Envoyez un message WhatsApp depuis votre numéro de test vers le numéro sandbox.
   L'assistant doit répondre avec vos prix.

## Problèmes fréquents

- « Cloudflare : pas de compte détecté » → créez le compte, puis `npx wrangler login`, relancez `./setup.sh`.
- Webhook Meta « Vérification refusée » → le Verify token côté Meta ≠ celui du Worker. Remettez le même.
- « non autorisé » sur la page → ADMIN_SECRET de la page ≠ secret Cloudflare. Recopiez-le.
- Pas de réponse WhatsApp → vérifiez : numéro test bien enregistré en destinataire sandbox ?
  Champ « messages » bien abonné ? Token Meta expiré (les tokens temporaires durent 24h, prenez un token permanent pour la production).
- Page blanche / Worker 500 « KV non configuré » → relancez setup.sh (il crée le KV manquant).

Vos clés ne sont jamais dans le code : elles sont dans les secrets Cloudflare + votre navigateur.
Ne les envoyez jamais par message à qui que ce soit.
