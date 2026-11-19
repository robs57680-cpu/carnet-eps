# Carnet d'entraînement EPS

Appli web (GitHub Pages + Firebase) où les élèves remplissent leur carnet d'entraînement, corrigé automatiquement selon le référentiel (CA5 · Cross training pour l'instant).

## Rôles

| Rôle | Accès |
|---|---|
| **Développeur** | Tout ce que fait un prof + écran « Développeur » : demandes d'accès, création des comptes profs |
| **Prof** | Ses classes → comptes élèves (identifiants anonymes) → activité → carnets des élèves, AFL3, réglages du référentiel, export CSV |
| **Élève** | Choisit une activité → son carnet (profil, séances, bilan) |

RGPD : aucun nom d'élève n'est enregistré. Chaque élève a un identifiant anonyme (`1g2-07-k4m`). La colonne « Repère » de la liste des élèves reste dans le navigateur du prof (localStorage), elle n'est jamais envoyée en ligne.

## Installation (une seule fois)

### 1. Projet Firebase
1. https://console.firebase.google.com → **Ajouter un projet** (ex. `carnet-eps`). Google Analytics inutile.
2. **Authentication** → Commencer → **E-mail/Mot de passe** → Activer.
3. **Firestore Database** → Créer une base → mode production → région `europe-west` (ex. `eur3`).
4. **Firestore → Règles** : coller le contenu de `firestore.rules`, remplacer `DEV_EMAIL_A_REMPLACER` par votre e-mail, **Publier**.
5. **Paramètres du projet → Vos applications → Web (</>)** → enregistrer l'appli (sans Hosting) → copier l'objet `firebaseConfig`.
6. **Authentication → Paramètres → Domaines autorisés** → ajouter `VOTRE-PSEUDO.github.io`.

### 2. Configuration
Dans `config.js` : coller `firebaseConfig` et mettre votre e-mail dans `DEV_EMAIL` (le même que dans les règles).

### 3. GitHub Pages
1. Nouveau dépôt (ex. `carnet-eps`), y déposer tous les fichiers (dont `.nojekyll`).
2. **Settings → Pages** → Source : branche `main`, dossier `/ (root)`.
3. L'appli est en ligne à `https://VOTRE-PSEUDO.github.io/carnet-eps/`.

### 4. Compte développeur
Sur la page de connexion : **Initialiser le compte développeur** → choisir un mot de passe. Le compte est créé avec le rôle développeur (autorisé uniquement pour l'e-mail `DEV_EMAIL`).

## Utilisation

- **Nouveau prof** : il clique « Demander un accès » sur la page de connexion. La demande apparaît dans l'écran Développeur → « Créer le compte » génère un mot de passe provisoire et un message à lui envoyer. Il peut ensuite changer son mot de passe dans « Mon compte » (ou « Mot de passe oublié »).
- **Prof** : Mes classes → Nouvelle classe → onglet Élèves → « Créer les comptes » (30 par défaut) → Imprimer les fiches à découper ou copier la liste.
- **Élève** : se connecte avec son identifiant → Cross training → son carnet. Une séance validée est verrouillée ; seul le prof peut la déverrouiller depuis le carnet de l'élève.
- **Coach** : dans la partie « Je réalise », l'élève entre l'identifiant d'un camarade de sa classe. Ce camarade retrouve la séance dans « Séances à coacher » et relève depuis son propre téléphone les temps de passage, les NO REP et les adaptations, qui s'affichent en direct chez l'élève. Le coach n'a accès qu'à cette partie de cette séance, et plus rien une fois la séance validée.

## Publier une nouvelle version
Changer le numéro de version au même endroit partout (`version.json`, `APP_VERSION` et les `?v=` dans `index.html`, `app.js`, `fb.js`, `ia.js`), puis déposer les fichiers sur GitHub. Les appareils qui ont l'appli ouverte affichent alors un bandeau « Mettre à jour » (vérification toutes les 5 minutes et à chaque retour sur l'appli), et les onglets en arrière-plan se mettent à jour seuls.

## Si Firestore demande un index
Si l'écran « Carnets des élèves » affiche une erreur d'index, ouvrez la console du navigateur : Firebase fournit un lien qui crée l'index en un clic.

## Carnets créés avec l'IA (Gemini)
- Onglet **Carnets IA** (profs) : importer un référentiel (PDF, photo ou texte) → l'IA Gemini prépare une ébauche de carnet (parties, champs, critères, barème, correction automatique).
- Le prof la vérifie dans l'aperçu (« Tester la correction »), la modifie en écrivant ses demandes à l'IA (avec annulation), l'enregistre puis l'active pour ses classes.
- Les élèves de ces classes voient l'activité à côté du CA5 ; le prof suit les carnets comme pour le CA5.
- IA : Firebase AI Logic, API Gemini Developer (palier gratuit, quota limité par jour et partagé entre les profs), protégée par App Check (Fraud Defense / reCAPTCHA Enterprise, clé de site dans config.js).
- Quota personnel : un prof peut coller sa propre clé Gemini gratuite (aistudio.google.com/apikey) dans « Compte » ; elle est stockée dans `prefs/{uid}` (lisible par lui seul) et ses demandes IA utilisent alors son propre quota.

## Sécurité (firestore.rules)
- Un élève ne lit et n'écrit que son propre carnet, et ne peut plus modifier une séance validée.
- Un prof ne voit que ses classes, ses élèves et leurs carnets ; il ne peut modifier que l'AFL3 et le verrouillage des séances.
- Les mots de passe élèves sont visibles du seul prof de la classe.
- Un coach ne peut lire que la séance qui le désigne et n'écrire que ses tours (règle `coachUid`).
- L'affichage reste sur fond blanc, même si le téléphone est en mode sombre.
- Supprimer un élève efface ses données Firestore ; son compte d'authentification reste (inutilisable) et peut être supprimé dans la console Firebase.

## Fichiers
- `index.html` : page et styles
- `app.js` : application (correction automatique, écrans élève/prof/développeur)
- `fb.js` : accès Firebase
- `config.js` : configuration à compléter
- `firestore.rules` : règles de sécurité à publier dans la console
