# ITS Interim — Site web

Site statique de l'agence ITS Interim (Lyon), spécialisée en intérim menuiserie et bois depuis 1977.

## Structure

- `index.html` — Page d'accueil
- `offres.json` — Offres de mission (géré via l'outil admin)

## Gestion des offres

Les offres sont gérées avec l'outil `admin-offres.html` (dossier ITS-Admin sur le bureau).  
Exporter le fichier `offres.json` et le remplacer dans ce dossier, puis pousser sur GitHub.

## Déploiement

Ce site est hébergé sur **Vercel** (gratuit) via connexion GitHub.  
Toute modification poussée sur la branche `main` est déployée automatiquement.
