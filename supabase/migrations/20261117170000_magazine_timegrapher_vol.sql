-- =============================================================================
-- Magazine : 2 nouveaux articles (FR + EN), en brouillon.
-- À relire dans Backoffice → Magazine, puis « Publier » : le site se reconstruit tout seul.
-- Se relance sans risque : un article déjà présent (même langue, même adresse) n'est pas modifié.
-- =============================================================================

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('fr', 'timegrapher-lire-mesure-montre', 'read-timegrapher', 'Timegrapher : lire la marche, l''amplitude et le défaut de repère', 'Marche, amplitude, défaut de repère : comment lire un timegrapher, quelles valeurs sont normales et comment mesurer votre montre avec un simple téléphone.', 'Entretien', 'Arcora',
$md$Un timegrapher (ou chronocomparateur) est l'outil de base de l'horloger : il écoute le tic-tac d'une montre mécanique et en tire, en quelques secondes, un bilan de santé. Longtemps réservé aux ateliers, il tient aujourd'hui dans un téléphone. Encore faut-il savoir lire ce qu'il affiche. Voici les trois chiffres à connaître, les valeurs habituelles et la bonne façon de mesurer.

## Comment fonctionne un timegrapher

Le cœur d'une montre mécanique est le balancier : une petite roue qui oscille à un rythme régulier, entretenu par l'échappement. Chaque oscillation produit un « tic » puis un « tac », que le timegrapher capte avec un micro.

Il connaît le rythme théorique de la montre, appelé **cadence** et exprimé en alternances par heure (alt/h). Les plus courantes :

| Cadence | Fréquence | Exemples de calibres |
|---|---|---|
| 18 000 alt/h | 2,5 Hz | montres anciennes |
| 21 600 alt/h | 3 Hz | Seiko NH35, nombreux calibres vintage |
| 28 800 alt/h | 4 Hz | ETA 2824, Sellita SW200, la majorité des montres modernes |
| 36 000 alt/h | 5 Hz | Zenith El Primero, Grand Seiko Hi-Beat |

En comparant les battements réels à ce rythme théorique, l'appareil calcule trois valeurs.

## 1. La marche, en secondes par jour

C'est le chiffre que tout le monde regarde : combien de secondes la montre gagnerait (+) ou perdrait (−) en 24 heures si elle restait dans cette position.

- **Entre −4 et +6 s/j**, c'est la tolérance d'un chronomètre certifié COSC.
- **Dans une fourchette de ±10 à 20 s/j**, c'est courant pour une montre non certifiée en bon état.
- Au-delà, ou si la valeur change beaucoup d'une mesure à l'autre, la montre mérite qu'on s'y intéresse.

Attention : c'est une **marche instantanée**, mesurée dans une seule position pendant quelques secondes. Votre montre, elle, passe la journée à changer de position. Pour connaître sa précision réelle au porter, rien ne remplace une mesure sur une semaine, comme expliqué dans notre article sur [la précision d'une montre mécanique](/magazine/precision-montre-mecanique/).

## 2. L'amplitude, en degrés

L'amplitude indique jusqu'où le balancier tourne à chaque oscillation. C'est un excellent indicateur de la vigueur du mouvement : un ressort de barillet fatigué, des huiles vieillies ou une pièce qui frotte la font baisser.

À titre indicatif, sur une montre bien remontée, cadran vers le haut :

- **autour de 270 à 310°**, le mouvement est en pleine forme ;
- **entre 220 et 260°**, c'est correct, surtout pour une montre ancienne ;
- **sous 200° environ**, juste après un remontage complet, c'est souvent le signe qu'une révision approche.

L'amplitude baisse naturellement dans les positions verticales et à mesure que le ressort se détend. Comparez donc toujours des mesures faites dans les mêmes conditions.

Un détail important : pour calculer l'amplitude, l'appareil a besoin de l'**angle de levée** du calibre, une valeur technique propre à chaque mouvement. Avec un mauvais réglage, le chiffre affiché est faux. Et un micro de téléphone, qui capte le son à travers l'air, ne distingue pas assez finement les bruits de l'échappement : c'est pourquoi la plupart des mesures au téléphone, dont celle d'Arcora, ne donnent pas l'amplitude.

## 3. Le défaut de repère, en millisecondes

Le « tic » et le « tac » devraient être parfaitement réguliers. Le défaut de repère (*beat error* en anglais) mesure l'écart entre les deux, en millisecondes.

- **Moins de 0,5 ms** : très bon.
- **Jusqu'à environ 1 ms** : acceptable sur une montre de tous les jours.
- **Au-delà** : la montre « boite ». Elle peut encore être précise, mais elle s'arrête plus facilement et gagne à être réglée par un horloger. Le réglage est rapide.

## Lire la courbe

Beaucoup de timegraphers affichent aussi un tracé, qui en dit long d'un coup d'œil :

- **une ligne horizontale** : la marche est proche de zéro ;
- **une ligne qui monte** : la montre avance ; **qui descend** : elle retarde ;
- **deux lignes parallèles** au lieu d'une : c'est le défaut de repère, plus elles sont écartées, plus il est grand ;
- **des points dispersés** : bruit ambiant, montre mal posée… ou un mouvement qui a besoin d'une révision.

## Mesurer sa montre avec un téléphone

Le timegrapher d'Arcora utilise le micro de votre téléphone. Pour une mesure fiable :

1. **Remontez complètement la montre**, ou portez-la quelques heures avant.
2. **Installez-vous au calme** et posez le téléphone sur une surface souple, une serviette pliée par exemple, pour couper les vibrations.
3. **Placez la montre contre le micro**, en général en bas du téléphone, près du port de charge.
4. **Ne touchez plus à rien** pendant les 30 secondes de mesure.
5. **Recommencez dans plusieurs positions** : cadran en haut, cadran en bas, couronne en bas, couronne en haut… L'écart entre les positions est aussi parlant que la marche elle-même.

Enregistrez chaque mesure sur la fiche de la montre : l'historique et la courbe de précision vous montrent son évolution d'un mois à l'autre. Le résultat se partage aussi en image, pour en parler avec d'autres collectionneurs ou avec votre horloger.

## Quand consulter un horloger

Un chiffre isolé ne dit pas grand-chose. Ce qui doit vous alerter, c'est le changement par rapport à vos mesures précédentes :

- la marche dérive nettement, sans choc ni aimant en vue ;
- le défaut de repère grimpe au-dessus de 1 ms ;
- le tracé devient brouillon alors que la mesure est faite au calme ;
- la réserve de marche diminue en même temps.

Une démagnétisation ou un réglage suffisent parfois. Sinon, c'est peut-être le moment d'une [révision complète](/magazine/reviser-montre-automatique/), et votre historique de mesures aidera l'horloger à poser son diagnostic.

## En résumé

- **Marche** : secondes gagnées ou perdues par jour, dans une position donnée.
- **Amplitude** : la vigueur du balancier, environ 270 à 310° pour un mouvement en forme.
- **Défaut de repère** : l'irrégularité entre tic et tac, idéalement sous 0,5 ms.
- Mesurez montre remontée, au calme, dans plusieurs positions, et suivez l'évolution dans le temps.
$md$, 'local:tissot-fond-transparent-mouvement-automatique.webp', 'Montre Tissot vue de dos, le mouvement automatique visible à travers le fond transparent', 'Le timegrapher écoute ce mouvement battre, plusieurs fois par seconde.', 'draft', '2026-11-17')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('en', 'how-to-read-timegrapher', 'read-timegrapher', 'How to read a timegrapher: rate, amplitude and beat error', 'Rate, amplitude, beat error: how to read a timegrapher, what normal values look like, and how to measure your mechanical watch with just your phone.', 'Care', 'Arcora',
$md$A timegrapher is the watchmaker's basic tool: it listens to a mechanical watch tick and, within seconds, gives a health check. Long confined to workshops, it now fits in a phone. You still need to know how to read it. Here are the three numbers that matter, typical values and the right way to measure.

## How a timegrapher works

The heart of a mechanical watch is the balance wheel: a small wheel swinging back and forth at a steady pace, kept going by the escapement. Each swing produces a "tick" and then a "tock", which the timegrapher picks up with a microphone.

It knows the watch's theoretical pace, called the **beat rate** and expressed in beats per hour (bph). The most common ones:

| Beat rate | Frequency | Example calibres |
|---|---|---|
| 18,000 bph | 2.5 Hz | older watches |
| 21,600 bph | 3 Hz | Seiko NH35, many vintage calibres |
| 28,800 bph | 4 Hz | ETA 2824, Sellita SW200, most modern watches |
| 36,000 bph | 5 Hz | Zenith El Primero, Grand Seiko Hi-Beat |

By comparing the actual beats to that theoretical pace, the machine works out three values.

## 1. Rate, in seconds per day

This is the number everyone looks at: how many seconds the watch would gain (+) or lose (−) in 24 hours if it stayed in this position.

- **Between −4 and +6 s/d** is the tolerance of a COSC-certified chronometer.
- **Within roughly ±10 to 20 s/d** is common for a non-certified watch in good health.
- Beyond that, or if the value swings a lot between measurements, the watch deserves a closer look.

Keep in mind this is an **instant rate**, measured in a single position over a few seconds. Your watch spends the day changing positions. To know how accurate it really is on the wrist, nothing beats measuring over a week, as explained in our article on [mechanical watch accuracy](/en/magazine/mechanical-watch-accuracy/).

## 2. Amplitude, in degrees

Amplitude shows how far the balance wheel swings on each oscillation. It's an excellent indicator of how healthy the movement is: a tired mainspring, ageing oils or a part that rubs will all bring it down.

As a rough guide, on a fully wound watch, dial up:

- **around 270–310°**: the movement is in great shape;
- **220–260°**: fine, especially for an older watch;
- **below about 200°** right after a full wind: often a sign that a service is coming.

Amplitude naturally drops in vertical positions and as the mainspring unwinds, so always compare measurements taken in the same conditions.

One important detail: to calculate amplitude, the machine needs the calibre's **lift angle**, a technical value specific to each movement. Set it wrong and the number is wrong. And a phone microphone, picking up sound through the air, can't separate the escapement's noises finely enough, which is why most phone-based measurements, Arcora's included, don't show amplitude.

## 3. Beat error, in milliseconds

The tick and the tock should be perfectly even. Beat error measures the gap between them, in milliseconds.

- **Under 0.5 ms**: very good.
- **Up to about 1 ms**: acceptable on a daily wearer.
- **Above that**: the watch is "out of beat". It may still keep good time, but it stops more easily and would benefit from a quick adjustment by a watchmaker.

## Reading the trace

Many timegraphers also draw a trace that tells you a lot at a glance:

- **a flat line**: the rate is close to zero;
- **a rising line**: the watch is running fast; **falling**: it's running slow;
- **two parallel lines** instead of one: that's beat error, and the further apart, the bigger it is;
- **scattered dots**: background noise, a badly placed watch… or a movement that needs a service.

## Measuring your watch with a phone

Arcora's timegrapher uses your phone's microphone. For a reliable reading:

1. **Fully wind the watch**, or wear it for a few hours first.
2. **Find a quiet room** and lay the phone on something soft, like a folded towel, to dampen vibrations.
3. **Place the watch against the microphone**, usually at the bottom of the phone near the charging port.
4. **Don't touch anything** during the 30-second measurement.
5. **Repeat in several positions**: dial up, dial down, crown down, crown up… The spread between positions says as much as the rate itself.

Save each measurement to the watch's page: the history and the accuracy curve show how it changes from month to month. You can also share the result as an image, to discuss it with other collectors or with your watchmaker.

## When to see a watchmaker

A single number doesn't say much. What should alert you is a change compared with your previous measurements:

- the rate drifts noticeably, with no knock or magnet in sight;
- beat error climbs above 1 ms;
- the trace turns messy even when measured in a quiet room;
- the power reserve drops at the same time.

Sometimes demagnetising or a regulation is enough. Otherwise, it may be time for a [full service](/en/magazine/automatic-watch-service-interval/), and your measurement history will help the watchmaker make a diagnosis.

## In short

- **Rate**: seconds gained or lost per day, in a given position.
- **Amplitude**: how strongly the balance swings, roughly 270–310° for a healthy movement.
- **Beat error**: the unevenness between tick and tock, ideally under 0.5 ms.
- Measure fully wound, in a quiet room, in several positions, and track the trend over time.
$md$, 'local:tissot-fond-transparent-mouvement-automatique.webp', 'Tissot watch seen from the back, its automatic movement visible through the exhibition caseback', 'A timegrapher listens to this movement beat, several times a second.', 'draft', '2026-11-17')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('fr', 'montre-volee-que-faire', 'stolen-watch', 'Montre volée : que faire, et comment vérifier une montre d''occasion', 'Plainte, assureur, numéro de série, registres de montres volées : les bons réflexes après un vol, et les vérifications à faire avant d''acheter d''occasion.', 'Guides', 'Arcora',
$md$Se faire voler une montre, c'est perdre un objet de valeur, et souvent un souvenir. La bonne nouvelle, c'est qu'une montre se retrouve plus souvent qu'on ne le croit : elle porte un numéro de série unique, et elle finit presque toujours par être revendue. Encore faut-il que ce numéro soit connu, et que le vol soit signalé au bon endroit. Voici quoi faire, dans l'ordre, et comment éviter d'acheter vous-même une montre volée.

## Avant tout : connaître son numéro de série

Tout repose sur lui. Le numéro de série est gravé sur la montre (au dos, entre les cornes ou sur le côté du boîtier selon les marques) et figure en général sur la carte de garantie.

Notez-le **dès aujourd'hui**, pour chaque montre, avec la facture et des photos nettes. Le jour d'un vol, vous n'aurez plus la montre sous la main pour le relire. Notre article sur [la boîte et les papiers](/magazine/boite-et-papiers-montre/) explique comment bien conserver ces documents, et celui sur [l'assurance d'une collection](/magazine/assurer-collection-montres/) détaille le dossier à préparer.

## Dans les premières heures après un vol

### 1. Porter plainte

Rendez-vous au commissariat ou à la gendarmerie. Apportez tout ce qui identifie la montre : marque, modèle, référence, **numéro de série**, photos, facture, et les signes distinctifs (une rayure, un bracelet changé, une gravure). Plus la description est précise, plus la montre pourra être reconnue si elle est retrouvée.

Gardez le récépissé de plainte : votre assureur vous le demandera.

### 2. Prévenir votre assureur, vite

Les délais sont courts. En France, la loi prévoit en général **deux jours ouvrés** pour déclarer un vol à son assureur, sauf si votre contrat accorde un délai plus long. Ne laissez pas passer ce délai en attendant de retrouver la montre.

### 3. Signaler le numéro de série

Le but : que la montre soit repérée si quelqu'un tente de la revendre.

- **La marque.** Certaines maisons enregistrent les numéros de série signalés volés, ce qui peut permettre d'identifier la montre lors d'un passage en service après-vente. Contactez leur service client avec votre plainte.
- **Les registres de montres volées.** Des bases spécialisées, comme The Watch Register, sont consultées par des revendeurs et des maisons de vente avant d'acheter.
- **Arcora.** Déclarez le vol depuis la fiche de la montre (voir plus bas).

### 4. Surveiller les annonces

Les semaines qui suivent, gardez un œil sur les sites d'annonces et les plateformes de montres d'occasion, en cherchant votre modèle. Prévenez aussi les horlogers et revendeurs de votre ville. Si vous pensez reconnaître votre montre, **ne contactez pas le vendeur vous-même** : transmettez l'annonce à la police, avec votre numéro de plainte.

## Déclarer le vol sur Arcora

Si la montre est dans votre collection Arcora, ouvrez sa fiche et choisissez **Déclarer un vol**. Vous y indiquez la date, la ville et le numéro de série, et vous pouvez joindre vos preuves : facture, papiers, dépôt de plainte.

- **Votre numéro de série reste privé.** Il n'est jamais affiché : on peut seulement vérifier un numéro précis.
- **La montre est retirée du Marché**, et plus personne ne peut y mettre en vente une montre avec le même numéro de série.
- **N'importe qui peut vérifier un numéro** sur la page publique [Montres volées](/montres-volees), sans compte. Si un acheteur tombe sur votre montre, il est averti, et peut vous écrire.

## Avant d'acheter d'occasion : vérifier que la montre n'est pas volée

Acheter une montre volée, même de bonne foi, peut coûter cher : en France, le propriétaire volé peut en principe la revendiquer pendant trois ans après le vol, et vous risquez de perdre à la fois la montre et l'argent payé. Quelques vérifications suffisent à éviter la plupart des mauvaises surprises.

![Rolex Submariner à lunette verte portée au poignet, en plein soleil](../images/rolex-submariner-lunette-verte-poignet-soleil.webp "Les modèles les plus recherchés sont aussi ceux qui se revendent le plus vite après un vol.")

1. **Demandez le numéro de série avant de payer.** Un vendeur honnête le communique en privé sans difficulté. Un refus est un signal d'alerte.
2. **Vérifiez-le** sur la page [Montres volées](/montres-volees) d'Arcora et dans les registres spécialisés. Gardez en tête qu'aucun registre n'est complet : un résultat négatif n'est pas une garantie.
3. **Comparez-le** avec la carte de garantie, la facture et une photo de la gravure sur la montre. Les trois doivent correspondre.
4. **Méfiez-vous d'un numéro effacé ou poli.** Une gravure illisible sur un boîtier par ailleurs en bon état n'a rien d'anodin.
5. **Regardez le nom sur la facture.** S'il ne correspond pas au vendeur, demandez-lui d'expliquer le parcours de la montre.
6. **Additionnez les signaux d'alerte** : prix trop bas, vendeur pressé, pas de papiers, refus de se rencontrer. Un seul n'est pas forcément grave ; plusieurs ensemble, si.

Pour le reste (authenticité, calibre, rencontre chez un horloger, paiement), notre guide pour [repérer une fausse montre avant d'acheter](/magazine/reperer-fausse-montre-occasion/) détaille chaque étape.

## Et si vous découvrez avoir acheté une montre volée ?

Ne la revendez pas pour vous en débarrasser : vous transmettriez le problème, et vous pourriez être mis en cause. Contactez la police, gardez toutes les preuves de votre achat (annonce, messages, paiement) et renseignez-vous auprès d'un professionnel du droit sur vos recours contre le vendeur.

## En résumé

- Notez dès aujourd'hui le numéro de série de chaque montre, avec facture et photos.
- Après un vol : plainte, assureur sous deux jours ouvrés, puis signalement du numéro à la marque, aux registres et sur Arcora.
- Avant d'acheter : demandez le numéro de série, vérifiez-le, comparez-le aux papiers.
- Aucun registre n'est exhaustif : ce sont plusieurs signaux ensemble qui doivent vous alerter.
$md$, 'local:montres-et-bracelets-en-vrac-brocante.webp', 'Montres, boîtiers et bracelets en vrac sur un étal de brocante', 'En ligne comme sur les brocantes, une montre volée peut refaire surface des mois plus tard.', 'draft', '2026-11-17')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('en', 'stolen-watch-what-to-do', 'stolen-watch', 'Stolen watch: what to do, and how to check a pre-owned watch', 'Police report, insurer, serial number, stolen watch registers: what to do after a theft, and the checks to make before buying a pre-owned watch.', 'Guides', 'Arcora',
$md$Having a watch stolen means losing something valuable, and often something with memories attached. The good news: watches turn up more often than you'd think. Each one carries a unique serial number, and stolen watches almost always end up being resold. That only helps if the number is known and the theft has been reported in the right places. Here's what to do, in order, and how to avoid buying a stolen watch yourself.

## First things first: know your serial number

Everything hinges on it. The serial number is engraved on the watch (on the caseback, between the lugs or on the side of the case, depending on the brand) and usually appears on the warranty card.

Write it down **today**, for every watch, along with the receipt and sharp photos. On the day of a theft, you won't have the watch in hand to read it. Our article on [box and papers](/en/magazine/watch-box-and-papers/) explains how to keep these documents safe, and the one on [insuring a collection](/en/magazine/insuring-watch-collection/) covers the file to prepare.

## In the first hours after a theft

### 1. Report it to the police

File a report with the police. Bring everything that identifies the watch: brand, model, reference, **serial number**, photos, receipt, and distinguishing marks (a scratch, a replacement strap, an engraving). The more precise the description, the better the chance the watch is recognised if it's recovered.

Keep the crime reference number or a copy of the report: your insurer will ask for it.

### 2. Notify your insurer quickly

Deadlines are short, sometimes just a couple of working days. Check your policy and don't let the deadline pass while you wait to see if the watch turns up.

### 3. Flag the serial number

The goal: make sure the watch is spotted if someone tries to sell it.

- **The brand.** Some manufacturers record serial numbers reported stolen, which can help identify the watch if it comes in for service. Contact their customer service with your police report.
- **Stolen watch registers.** Specialist databases such as The Watch Register are checked by dealers and auction houses before they buy.
- **Arcora.** Report the theft from the watch's page (see below).

### 4. Keep an eye on listings

In the weeks that follow, watch the classifieds and pre-owned watch platforms for your model. Let local watchmakers and dealers know too. If you think you've spotted your watch, **don't contact the seller yourself**: pass the listing to the police along with your report number.

## Reporting the theft on Arcora

If the watch is in your Arcora collection, open its page and choose **Report a theft**. Add the date, the city and the serial number, and attach your evidence: receipt, papers, police report.

- **Your serial number stays private.** It's never displayed: people can only check a specific number.
- **The watch is removed from the Market**, and no one can list a watch with the same serial number there.
- **Anyone can check a number** on the public [Stolen watches](/montres-volees) page, no account needed. If a buyer comes across your watch, they're warned, and can write to you.

## Before buying pre-owned: check the watch isn't stolen

Buying a stolen watch, even in good faith, can be costly: in many countries the rightful owner can reclaim it, and you may lose both the watch and the money you paid. A few checks prevent most bad surprises.

![Rolex Submariner with a green bezel on the wrist, in bright sunlight](../images/rolex-submariner-lunette-verte-poignet-soleil.webp "The most sought-after models are also the ones that get resold fastest after a theft.")

1. **Ask for the serial number before paying.** An honest seller will share it privately without fuss. A refusal is a red flag.
2. **Check it** on Arcora's [Stolen watches](/montres-volees) page and on specialist registers. No register is complete, so a clean result isn't a guarantee.
3. **Compare it** with the warranty card, the receipt and a photo of the engraving on the watch. All three should match.
4. **Be wary of a polished-off or erased serial.** An unreadable engraving on an otherwise well-kept case is never a coincidence to ignore.
5. **Check the name on the receipt.** If it isn't the seller's, ask them to explain the watch's history.
6. **Add up the warning signs**: a price that's too low, a seller in a hurry, no papers, refusing to meet. One on its own may be harmless; several together are not.

For everything else (authenticity, the movement, meeting at a watchmaker, payment), our guide on [how to spot a fake watch](/en/magazine/how-to-spot-fake-watch/) walks through each step.

## What if you find out you bought a stolen watch?

Don't sell it on to get rid of it: you'd pass the problem along and could find yourself implicated. Contact the police, keep every proof of your purchase (listing, messages, payment) and ask a legal professional about your options against the seller.

## In short

- Write down every watch's serial number today, with the receipt and photos.
- After a theft: police report, insurer within your policy's deadline, then flag the number with the brand, registers and Arcora.
- Before buying: ask for the serial number, check it, compare it with the papers.
- No register is exhaustive: it's several warning signs together that should stop you.
$md$, 'local:montres-et-bracelets-en-vrac-brocante.webp', 'Watches, cases and straps piled up on a flea-market stall', 'Online or at a flea market, a stolen watch can resurface months later.', 'draft', '2026-11-17')
on conflict (lang, slug) do nothing;
