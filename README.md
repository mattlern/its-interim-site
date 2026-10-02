# ITS Intérim — site web

Site de l'agence ITS Intérim (Lyon 8e), spécialisée dans l'intérim des métiers du bois et du second œuvre depuis 1977. Membre du Groupe LMI.

Site statique (HTML, CSS, JavaScript), sans base de données ni abonnement. Hébergement prévu sur Vercel (offre gratuite), relié à ce dépôt GitHub.

## Pages

| Fichier | Page |
|---|---|
| `index.html` | Accueil |
| `agence.html` | L'agence (histoire, savoir-faire, sécurité, équipe, Groupe LMI) |
| `metiers.html` | Nos métiers (5 familles, postes, diplômes, zone) |
| `offres.html` | Offres de mission (filtres + détail + candidature) |
| `entreprises.html` | Entreprises (solutions + demande de personnel) |
| `postuler.html` | Candidature en 4 étapes |
| `contact.html` | Contact et accès |
| `mentions-legales.html` | Mentions légales et confidentialité |
| `404.html` | Page introuvable |

## Mettre à jour les offres

1. Ouvrir l'outil `admin-offres.html` (dossier ITS-Admin).
2. Ajouter ou supprimer les offres, puis cliquer sur **Exporter offres.json**.
3. Remplacer le fichier `offres.json` à la racine de ce dossier.
4. Envoyer la modification sur GitHub : le site se met à jour tout seul.

Le site range automatiquement chaque offre dans sa famille de métier d'après son intitulé (menuisier, agenceur, charpentier, plaquiste, étancheur…).

## Ajouter les photos

Déposer les photos dans `images/` avec les noms indiqués dans `images/LISEZ-MOI.txt`. Elles remplacent automatiquement les fonds provisoires.

## Formulaires

Les formulaires (candidature, demande de personnel, contact) fonctionnent en **mode démonstration** tant qu'aucun service d'envoi n'est branché. Pour les relier à la boîte mail d'ITS, renseigner l'adresse du service dans `assets/js/site.js` (`ITS.FORM_ENDPOINT`).

## Prévisualiser sur son ordinateur

```bash
python3 -m http.server 4173
```

Puis ouvrir http://localhost:4173 dans le navigateur.
