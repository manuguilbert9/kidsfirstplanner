# Configuration des Règles de Sécurité Firestore

## Problème

Si vous rencontrez l'erreur `FirebaseError: Missing or insufficient permissions`, cela signifie que les règles de sécurité Firestore ne sont pas configurées correctement.

## Solution

Vous avez **deux options** pour déployer les règles de sécurité :

---

## Option 1 : Via la Console Firebase (Plus Simple)

### Étapes :

1. **Accédez à la Console Firebase**
   - Allez sur https://console.firebase.google.com/
   - Sélectionnez votre projet : `studio-5908953384-f26d4`

2. **Naviguez vers Firestore Database**
   - Dans le menu de gauche, cliquez sur **Build** → **Firestore Database**

3. **Ouvrez l'onglet Règles**
   - Cliquez sur l'onglet **Règles** (Rules)

4. **Copiez-collez les règles**
   - Ouvrez le fichier `firestore.rules` de ce projet
   - Copiez tout le contenu
   - Collez-le dans l'éditeur de règles de la console Firebase

5. **Publiez les règles**
   - Cliquez sur le bouton **Publier** (Publish)
   - Attendez quelques secondes que les règles soient déployées

✅ **C'est fait !** Les règles sont maintenant actives.

---

## Option 2 : Via Firebase CLI (Pour développeurs)

### Prérequis :

Installer Firebase CLI si ce n'est pas déjà fait :
```bash
npm install -g firebase-tools
```

### Étapes :

1. **Se connecter à Firebase**
   ```bash
   firebase login
   ```

2. **Initialiser Firebase dans le projet (si pas déjà fait)**
   ```bash
   firebase init firestore
   ```
   - Sélectionnez votre projet : `studio-5908953384-f26d4`
   - Utilisez le fichier `firestore.rules` existant

3. **Déployer les règles**
   ```bash
   firebase deploy --only firestore:rules
   ```

✅ **C'est fait !** Les règles sont déployées.

---

## Vérification

Après avoir déployé les règles, testez votre application :

1. Connectez-vous avec votre compte Google
2. Créez ou rejoignez un groupe
3. Vérifiez que vous pouvez voir et modifier le calendrier

Si vous voyez toujours l'erreur, attendez 30 secondes et rafraîchissez la page.

---

## Détails des Règles de Sécurité

Les règles configurées permettent :

### ✅ Collection `users`
- **Lecture/Écriture** : Un utilisateur peut lire et modifier son propre document
- **Lecture** : Un utilisateur peut lire les documents des autres membres de son groupe

### ✅ Collection `groups`
- **Lecture** : Un utilisateur peut lire les données de son groupe
- **Écriture** : Un utilisateur peut modifier les données de son groupe
- **Création** : Un utilisateur peut créer un nouveau groupe s'il s'ajoute comme membre

### ✅ Collection `calendarData`
- **Lecture/Écriture** : Un utilisateur peut lire et modifier ses propres données de calendrier

### ❌ Toutes les autres collections
- **Accès refusé** par défaut pour plus de sécurité

---

## Aide Supplémentaire

Si vous rencontrez encore des problèmes :

1. Vérifiez que vous êtes bien connecté avec un compte Google
2. Vérifiez dans la console Firebase que les règles sont bien déployées
3. Regardez la console du navigateur (F12) pour plus de détails sur l'erreur
4. Vérifiez que votre projet Firebase a bien l'authentification Google activée

---

## Firebase Studio

Si vous utilisez Firebase Studio pour éditer le code :

1. Committez et poussez ce fichier `firestore.rules` vers Git
2. Dans Firebase Studio, le fichier sera automatiquement synchronisé
3. Déployez les règles via la Console Firebase (Option 1) ou via CLI dans le terminal de Studio
