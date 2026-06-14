# Guide de lecture — app `vendors` (console vendeur)

Front-end Angular de l'espace vendeur. Même principe que l'app `users` : Angular
standalone, SCSS maison, **tout passe par la gateway**. Les services portent le
suffixe `-vendeur` pour bien les distinguer de ceux de la boutique acheteur.

## Convention de nommage

- **`service-*-vendeur`** = service Angular (logique + appels API) côté vendeur.
- **`depot-*`** = dépôt d'état (store en mémoire).

## Le chemin d'un appel API

Identique à l'app `users` : un composant → un service → `service-api-*` →
intercepteur (PoW + en-têtes + Bearer) → gateway. La différence est métier :
ici on manipule **les commandes, produits et retours qui concernent le vendeur connecté**.

## Carte des dossiers (`src/app/`)

### `core/services/`
| Fichier | Rôle |
|---------|------|
| `service-auth-vendeur.ts`, `service-jeton-auth-vendeur.ts` | Connexion/inscription vendeur, gestion du token. |
| `service-pow-vendeur.ts` | Preuve de travail côté client. |
| `service-produit-vendeur.ts` | Création/édition des produits du vendeur. |
| `service-commandes-vendeur.ts` | Commandes reçues par le vendeur. |
| `service-retours-vendeur.ts` | Traitement des retours. |
| `service-api-messagerie-vendeur.ts`, `service-conversation-vendeur.ts`, `service-socket-vendeur.ts` | Messagerie avec les acheteurs (REST + websocket). |
| `service-notification.ts`, `service-dialogue-confirmation.ts` | Bannières/toasts et boîtes de confirmation globales. |
| `depot-session-vendeur.ts` | État de session du vendeur connecté. |

### `features/` — un dossier par écran
`tableau-de-bord` (accueil vendeur), `produits-vendeur` + `formulaire-produit`,
`commandes-vendeur`, `retours`, `messagerie`, `connexion-vendeur`, `inscription-vendeur`.

> `features/blank` est un composant placeholder hérité du scaffold Angular. S'il
> n'est pas utilisé par une route, il peut être supprimé pour rester propre.

### `shared/`
`components/` (chrome commun, hôtes de notifications/dialogues) et `pipes/`.

### Racine `src/app/`
`app.ts` (nav + `<main class="container">` + `<router-outlet>`), `app.routes.ts`, `app.config.ts`.

## « Où je regarde si… »

| Question | Fichier de départ |
|----------|-------------------|
| Comment un vendeur publie un produit ? | `features/formulaire-produit/` + `core/services/service-produit-vendeur.ts` |
| Comment il traite une commande/retour ? | `features/commandes-vendeur/`, `features/retours/` |
| La messagerie avec l'acheteur ? | `core/services/service-conversation-vendeur.ts` + `service-socket-vendeur.ts` |
