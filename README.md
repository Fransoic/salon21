# Salon 21

Salon 21 est une webapp de blackjack solo, mobile-first, construite avec Svelte 5, TypeScript et Vite. L'application fonctionne entièrement côté client, sans backend, et conserve localement la bankroll, la mise courante, les statistiques de session et les préférences d'interface.

Version en ligne : https://fransoic.github.io/salon21/

## Aperçu

- Blackjack solo jouable dans le navigateur avec interface pensée pour mobile et utilisable sur desktop.
- Table de jeu complète avec mise, distribution, assurance, hit, stand, double, split, abandon tardif et manche suivante.
- Panneau de stratégie de base intégré, avec repère contextuel sur la ligne active et aide visuelle optionnelle sur l'action recommandée.
- Effets sonores synthétiques Web Audio et retours visuels de gain/perte.
- Interface bilingue anglais/français.
- Persistance locale via `localStorage`, sans compte utilisateur.

## Règles implémentées

- Sabot de 6 jeux.
- Le croupier reste sur soft 17.
- Blackjack payé à 3:2.
- Assurance payée à 2:1.
- Double autorisé après split.
- Resplit jusqu'à 4 mains.
- Les as splittés reçoivent une seule carte chacun.
- Abandon tardif optionnel, désactivé par défaut dans les préférences.
- Les actions illégales sont désactivées dans l'UI et rejetées côté logique d'état.

## Fonctionnalités produit

### Table et déroulé de manche

- Mise via boutons rapides et curseur manuel.
- Normalisation des mises par pas de 5 quand la bankroll le permet.
- Gestion des phases de jeu : betting, insurance, player turn, dealer turn, round over.
- Révélation animée de la carte cachée du croupier et résolution automatique de la manche.
- Support des splits, doubles, blackjack naturel, push, bust et surrender.

### Aide à la décision

- Tableau de stratégie de base pour les totaux hard, soft et les paires.
- Focus automatique sur la combinaison joueur / carte visible du croupier.
- Option `Strategy assist` pour marquer l'action recommandée pendant le tour du joueur.

### Session locale

- Sauvegarde locale de la bankroll, de la mise courante et des statistiques agrégées.
- Sauvegarde locale des préférences : volume, langue, abandon tardif, aide de stratégie.
- Réinitialisation de la progression locale avec confirmation utilisateur.
- Pas de restauration de manche en cours : seules les données de progression stables sont persistées.

## Stack technique

- Svelte 5
- TypeScript
- Vite 8
- Vitest 4
- Web Audio API pour les effets sonores
- GitHub Pages pour le déploiement statique

## Structure du projet

```text
src/
	App.svelte                  Orchestration UI, navigation hash, hydratation, actions de jeu
	app.css                     Styles globaux et layout mobile-first
	lib/
		audio.ts                  Effets sonores synthétiques
		format.ts                 Formatage monétaire
		i18n.ts                   Libellés UI et traductions dynamiques
		storage.ts                Persistance locale du profil et des préférences
		components/
			ActionBar.svelte        Actions contextuelles de la table
			BetControls.svelte      Sélection de mise, boutons rapides et slider
			GameTable.svelte        Rendu des mains, cartes et résultats
			StatsPanel.svelte       Statistiques, règles de table et reset
			StrategyPanel.svelte    Tableau de stratégie de base
		game/
			types.ts                Types du domaine blackjack
			rules.ts                Règles pures, scoring, croupier, résolution
			state.ts                Transitions d'état et disponibilité des actions
			*.test.ts               Tests de logique métier
```

## Démarrage

### Prérequis

- Node.js 22 recommandé
- npm

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

L'application est ensuite disponible via le serveur Vite local.

## Scripts disponibles

```bash
npm run dev        # lance le serveur de développement
npm run build      # produit le bundle de production
npm run preview    # sert le build localement
npm run check      # svelte-check + tsc sur la config node
npm run test       # exécute l'ensemble des tests Vitest
npm run test:watch # lance Vitest en mode watch
```

## Vérification

Commandes utiles avant un push :

```bash
npm run check
npm run test
npm run build
```

Les tests couvrent notamment :

- le scoring et les règles de résolution
- l'assurance
- le split et la progression entre mains
- le double
- l'abandon tardif
- la validation des mises personnalisées
- la persistance des préférences et de la session locale
- la recommandation d'action issue de la stratégie de base

## Déploiement

Le projet est configuré pour GitHub Pages via le workflow `.github/workflows/deploy-pages.yml`.

- Le build est déclenché sur push vers `main`.
- `npm ci` puis `npm run build` sont exécutés en CI.
- `dist/index.html` est copié vers `dist/404.html` pour le fallback SPA.
- La base Vite passe à `/salon21/` en production.

URL publiée : https://fransoic.github.io/salon21/

Note de setup initial : l'activation GitHub Pages a dû être créée une première fois côté dépôt avant que le workflow puisse publier automatiquement.

## Choix d'architecture

- La logique blackjack vit dans une couche métier testable, séparée des composants Svelte.
- `rules.ts` contient les règles pures et la résolution des mains.
- `state.ts` gère les transitions d'état, la bankroll, les phases et la disponibilité des actions.
- `App.svelte` relie la logique métier, l'interface et la persistance locale.
- La stratégie de base a été extraite dans un module dédié pour être réutilisée par le panneau d'aide et l'indicateur d'action recommandée.

## Limites actuelles

- Application 100 % locale, sans backend ni multi-joueur.
- Pas d'authentification, pas de leaderboard, pas d'analytics.
- Pas de reprise d'une manche inachevée après rechargement.
- Pas de side bets autres que l'assurance.

## Licence

Aucune licence n'est déclarée actuellement dans ce dépôt.
