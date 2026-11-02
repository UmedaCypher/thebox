# Publier Arcora sur le Play Store (Android)

Arcora est une PWA : on la publie telle quelle, emballée dans une **TWA** (Trusted Web Activity).
L'application affiche le site arcorawatch.com en plein écran, sans barre d'adresse, avec son icône et ses notifications.
Elle se met à jour toute seule à chaque mise en ligne du site : on ne republie sur le Play Store que pour changer
le nom, l'icône ou la version Android.

**Paiement** : l'application ne vend rien (règles de Google Play). Premium s'achète sur le site ; un compte Premium
l'est aussi dans l'application. L'app le sait grâce à son adresse de lancement `/?app=android` (voir `src/lib/platform.ts`).

Compter : 1 à 4 semaines pour le compte développeur (vérification de la société), puis 1 heure de préparation
et quelques jours d'examen par Google.

---

## 1. Compte Google Play Console (à lancer tout de suite : c'est le plus long)

Créer un compte **Organisation** au nom de Mahé Fine Collectibles, pas un compte personnel :
un compte personnel récent doit faire tester l'app par **12 personnes pendant 14 jours** avant de pouvoir la publier ;
un compte organisation en est dispensé.

1. **Numéro D-U-N-S** de la société (gratuit, de quelques jours à 30 jours) : la Play Console propose de le chercher
   pendant l'inscription ; s'il n'existe pas, le demander sur le site de Dun & Bradstreet. Nom, adresse et téléphone
   doivent être exactement ceux du Kbis.
2. [play.google.com/console](https://play.google.com/console) → créer un compte → **Organisation** → 25 $ (une fois).
3. Vérification d'identité (pièce d'identité du président) et du site web (`arcorawatch.com`).

## 2. Fabriquer l'application avec PWABuilder (sans Android Studio)

1. Aller sur [pwabuilder.com](https://www.pwabuilder.com), saisir `https://arcorawatch.com`, **Start**.
2. **Package for stores** → **Android** → **Generate Package** → **All settings** :

| Réglage | Valeur |
| --- | --- |
| Package ID | `com.arcorawatch.app` (définitif : ne plus jamais le changer) |
| App name / Launcher name | `Arcora` |
| App version / Version code | `1.0.0` / `1` (augmenter le code à chaque nouvelle version) |
| Host | `arcorawatch.com` |
| Start URL | `/?app=android` (indispensable : c'est ce qui masque l'achat dans l'app) |
| Theme color / Background color / Nav bar color | `#1F0E11` |
| Display mode | Standalone |
| Notification delegation | **activé** (notifications push) |
| Location delegation | désactivé |
| Google Play billing | **désactivé** |
| Signing key | **Create new**, avec les informations de la société |

3. **Download** : un fichier zip contenant notamment `app-release-bundle.aab` (l'application),
   `signing.keystore` et `signing-key-info.txt` (la clé et ses mots de passe), `assetlinks.json`.

**Garder précieusement `signing.keystore` et `signing-key-info.txt`** (gestionnaire de mots de passe + copie hors ligne) :
sans eux, impossible de publier une mise à jour. Ne jamais les mettre sur GitHub.

## 3. Créer l'application dans la Play Console

Play Console → **Créer une application** : nom Arcora, langue français, Application, Gratuite.

### Fiche du Play Store
Les visuels sont prêts dans `docs/store/android/` :

- icône 512 × 512 : `icone-512.png`
- image de présentation 1024 × 500 : `image-de-presentation-1024x500.png`
- captures téléphone : `capture-1.png` à `capture-4.png`

Textes proposés :

- **Description courte** (80 caractères max) :
  `Ta collection de montres, rangée, portée, partagée. Passeport, portage, galerie.`
- **Description complète** :

```
Arcora est l'écrin des collectionneurs de montres.

• Ta collection au même endroit : fiches détaillées, photos, valeur déclarée, entretiens à prévoir.
• Le calendrier de portage : note en un geste la montre du jour, retrouve ton mois au poignet et partage ton image du mois.
• Le passeport : une page à partager pour chaque montre.
• La galerie au poignet : vois comment une pièce tombe sur un poignet comme le tien.
• Le Marché : annonces de vente et d'échange entre membres, avec messagerie.
• Le parrainage : offre un mois de Premium à tes amis collectionneurs.

Gratuit jusqu'à 6 montres. Premium débloque une collection illimitée, le coût par port, les statistiques,
la wishlist et l'inventaire pour l'assurance.

Conçu par un collectionneur, pour les collectionneurs.
```

- Catégorie : **Style de vie**. E-mail de contact : `contact@arcorawatch.com`. Site : `https://arcorawatch.com`.

### Contenu de l'application (questionnaires obligatoires)
| Rubrique | Réponse |
| --- | --- |
| Règles de confidentialité | `https://arcorawatch.com/confidentialite` |
| Accès à l'application | « Certaines fonctionnalités sont restreintes » : donner **un compte de test** (e-mail + mot de passe) avec quelques montres, pour l'examinateur Google |
| Annonces | Non, l'application ne contient pas de publicité |
| Classification du contenu | Questionnaire : les utilisateurs peuvent échanger (messagerie) et publier des photos ; pas de violence, etc. |
| Public cible | 18 ans et plus |
| Sécurité des données | Voir ci-dessous |
| Suppression de compte | `https://arcorawatch.com/suppression-compte` (et la suppression existe dans l'app : Profil → Compte) |
| Application gouvernementale / financière / santé | Non |

**Sécurité des données** (ce qu'Arcora collecte) :
- Informations personnelles : adresse e-mail, nom (facultatif) → gestion du compte ; obligatoire pour l'e-mail.
- Photos : photos des montres → fonctionnalité de l'app ; facultatif.
- Messages : messages entre membres → fonctionnalité de l'app.
- Contenu généré par l'utilisateur : fiches de montres, annonces → fonctionnalité de l'app.
- Activité dans l'app : montres portées, partages → fonctionnalité et statistiques (Arcora uniquement).
- Aucune donnée vendue ni partagée à des fins publicitaires. Données chiffrées en transit (HTTPS).
  Les utilisateurs peuvent demander la suppression de leurs données.

## 4. Premier envoi, puis lien entre le site et l'application

1. Play Console → **Tests → Test interne** → Créer une version → accepter **la signature d'application par Google Play** →
   importer `app-release-bundle.aab` → ajouter ton adresse comme testeur → publier le test interne.
2. Play Console → **Intégrité de l'application → Signature d'application** : copier l'**empreinte SHA-256**
   du « Certificat de clé de signature d'application » (et celle du certificat de clé d'importation).
3. **Envoie-moi ces deux empreintes** : j'ajoute le fichier `public/.well-known/assetlinks.json` au site.
   Sans lui, l'application affiche une barre d'adresse en haut : c'est le signe que le lien n'est pas fait.
4. Vérifier que `https://arcorawatch.com/.well-known/assetlinks.json` s'affiche bien (du texte JSON, pas la page d'accueil).
5. Installer l'app depuis le lien du test interne : plus de barre d'adresse, et la page Premium n'affiche ni prix ni bouton d'achat.

## 5. Publication

Play Console → **Production** → Créer une version → reprendre le même `.aab` → **Envoyer pour examen**.
L'examen prend en général quelques jours la première fois.

## Plus tard

- **Nouvelle version Android** (nouvelle icône, nouveau nom…) : refaire l'étape 2 **avec la même clé**
  (« Use mine » : importer `signing.keystore`) et un *version code* plus grand.
- **iOS** : l'App Store n'accepte pas une simple PWA emballée ; il faudra une app Capacitor, et l'achat intégré d'Apple
  pour vendre Premium dans l'app (ou ne rien y vendre, comme sur Android).
