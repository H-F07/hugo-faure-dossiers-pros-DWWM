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
- **Recherche et tri** des annonces par catégorie
- **Génération de factures PDF** (numérotation automatique, charte graphique Card-Kingdom), en remplacement d'un véritable système de paiement — projet à visée pédagogique
- **Design responsive** : expérience adaptée mobile, tablette et desktop

### Côté administration
- Tableau de bord avec statistiques (chiffre d'affaires, répartition des stocks)
- Gestion des utilisateurs inscrits
- Gestion des annonces publiées

---

## 🔒 Sécurité

- Variables sensibles isolées dans `.env.local`
- Authentification gérée par Supabase Auth (hachage automatique des mots de passe, sessions sécurisées)
- Politiques **RLS (Row Level Security)** sur Supabase, restreignant les actions (lecture, création, modification, suppression) selon le rôle de l'utilisateur
- Validation des champs obligatoires sur les formulaires

---

## 🗂️ Structure de la base de données

Le schéma repose sur Supabase PostgreSQL, avec notamment :
- `auth.users` — gestion des comptes utilisateurs (géré par Supabase)
- `profiles` — profils utilisateurs, liés à `auth.users`
- `Cards` — table principale des annonces, protégée par RLS, liée à `user_id`

*(Un schéma détaillé est disponible dans les annexes du dossier de certification.)*

---

## 🚀 Installer et lancer le projet en local

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

Ce projet a été développé en tant que projet fil rouge dans le cadre de la formation **Concepteur Développeur d'Applications (CDPI)** de LPlateforme, en vue de l'obtention du titre professionnel **DWWM**. Il illustre les deux blocs de compétences du référentiel :

- **Bloc 1** — Développer la partie front-end d'une application web ou web mobile sécurisée
- **Bloc 2** — Développer la partie back-end d'une application web ou web mobile sécurisée

📁 Le dossier professionnel et le dossier projet associés à cette certification sont disponibles dans le dossier [`docs`](./docs) de ce dépôt.
---

## 👤 Auteur

**HUGO FAURE**
Apprenti développeur web — LPlateforme, campus de CANNES

---

## 📄 Licence

Projet réalisé à des fins pédagogiques dans le cadre d'un titre professionnel.
