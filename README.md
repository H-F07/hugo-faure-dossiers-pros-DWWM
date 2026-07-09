# 🏰 Card-Kingdom

**Card-Kingdom** est une marketplace de trading cards entre particuliers (Pokémon & Yu-Gi-Oh!), pensée comme une taverne médiévale numérique où collectionneurs et marchands se retrouvent pour échanger leurs trésors.

Projet réalisé dans le cadre de la certification **RNCP Développeur Web et Web Mobile (DWWM)** — LPlateforme, campus de Cannes.

---

## ✨ Aperçu

Card-Kingdom permet à tout utilisateur inscrit de mettre en vente ses cartes à collectionner, de parcourir les annonces d'autres collectionneurs, et de gérer son profil et ses transactions. Un espace d'administration complet permet le suivi de la plateforme (statistiques, gestion des utilisateurs, des annonces).

L'identité visuelle du projet s'inspire de l'univers des tavernes médiévales : bois sombre, cuir vert, parchemin, dorures et typographie gothique, pour une expérience immersive cohérente sur l'ensemble du site.

---

## 🛠️ Stack technique

| Domaine | Technologie |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| Langage | TypeScript |
| Style | Tailwind CSS |
| Backend / BaaS | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage) |
| Génération PDF | jsPDF |
| Graphiques (admin) | Bibliothèque de charts (barres / camembert) |

---

## 🔑 Fonctionnalités principales

### Côté utilisateur
- **Authentification** complète via Supabase Auth (inscription, connexion, déconnexion, gestion de session)
- **Vente de cartes** : formulaire de mise en vente avec sélection de catégorie (Pokémon / Yu-Gi-Oh!) et récupération automatique du visuel de la carte via API externe
- **Page profil** : gestion de ses annonces, upload d'images vers Supabase Storage, édition et suppression de cartes
- **Page d'accueil** : affichage combiné des cartes issues des API externes et des annonces publiées par les collectionneurs (section dédiée)
- **Génération de factures PDF** (détail HT / TVA / TTC, numérotation automatique, charte graphique Card-Kingdom)
- **Design responsive** : expérience adaptée mobile, tablette et desktop

### Côté administration
- Tableau de bord avec statistiques animées
- Visualisations graphiques (répartition des ventes, utilisateurs, etc.)
- Gestion des utilisateurs (bannissement, suppression, rôles)
- Gestion des annonces publiées

---

## 🔒 Sécurité

- Variables sensibles isolées dans `.env.local`
- Vérification des droits admin basée sur la session (pas uniquement côté client)
- Politiques **RLS (Row Level Security)** sur Supabase, y compris pour les opérations de mise à jour
- Validation des entrées et protection contre les injections XSS

---

## 🗂️ Structure de la base de données

Le schéma repose sur Supabase PostgreSQL, avec notamment :
- `auth.users` — gestion des comptes utilisateurs
- `Cards` — table principale des annonces, protégée par RLS, liée à `user_id`

*(Un schéma ERD détaillé est disponible dans les annexes du dossier de certification.)*

---

## 🚀 Lancer le projet en local

```bash
# Cloner le dépôt
git clone https://github.com/<ton-user>/card-kingdom.git
cd card-kingdom

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# puis renseigner les clés Supabase (URL + anon key)

# Lancer le serveur de développement
npm run dev
```

L'application est ensuite accessible sur [http://localhost:3000](http://localhost:3000).

---

## 📋 Variables d'environnement requises

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 🎓 Contexte du projet

Ce projet a été développé en tant que projet fil rouge dans le cadre de la formation **Concepteur Développeur d'Applications (CDPI)** de LPlateforme, en vue de l'obtention du titre professionnel **DWWM**. Il illustre les trois blocs de compétences :

- **AT1** — Développement front-end
- **AT2** — Développement back-end, API et base de données
- **AT3** — Fonctionnalités avancées (administration, génération de documents)

---

## 👤 Auteur

**HUGO FAURE**
Apprenti développeur web — LPlateforme, campus de CANNES

---

## 📄 Licence

Projet réalisé à des fins pédagogiques dans le cadre d'un tire professionnelle.
