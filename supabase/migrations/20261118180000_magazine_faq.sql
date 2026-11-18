-- =============================================================================
-- Magazine : section « Questions fréquentes » ajoutée à la fin de chaque article (FR et EN).
-- Le site en tire automatiquement des données structurées FAQPage (Google, moteurs IA).
-- Ajout uniquement : le reste du texte n'est pas touché, y compris vos modifications du backoffice.
-- Se relance sans risque : un article qui a déjà sa section n'est pas modifié.
-- =============================================================================

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Questions fréquentes

### Quelle taille de montre pour un poignet de 16 cm ?

Pour un poignet d'environ 16 cm, un diamètre de 36 à 39 mm convient en général, avec un entre-cornes qui ne dépasse pas 46 mm environ. Vérifiez surtout que les cornes ne débordent pas du dessus du poignet : c'est ce qui décide si la montre tombe bien.

### Une montre de 40 mm est-elle trop grande pour un petit poignet ?

Pas forcément. Une montre de 40 mm aux cornes courtes et à la lunette large peut très bien aller sur un poignet de 15 à 16 cm. Regardez l'entre-cornes et l'épaisseur plutôt que le seul diamètre, et comparez sur des photos de poignets de votre taille dans la [galerie au poignet](/galerie).

### Comment mesurer son tour de poignet sans mètre ?

Enroulez une bande de papier juste au-dessus de l'os du poignet, marquez le point de jonction au stylo, puis posez la bande à plat sur une règle. Mesurez aussi la largeur du dessus du poignet : c'est la limite à ne pas dépasser pour l'entre-cornes.
$faq$
where lang = 'fr' and slug = 'taille-montre-poignet' and position('## Questions fréquentes' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Frequently asked questions

### What watch size fits a 6.5-inch wrist?

For a wrist of about 6.5 in (16.5 cm), a 38 to 40 mm case usually works, with a lug-to-lug of up to roughly 47 mm. Above all, check that the lugs don't hang over the top of your wrist: that's what decides whether a watch fits.

### Is a 40 mm watch too big for a small wrist?

Not necessarily. A 40 mm watch with short lugs and a wide bezel can wear well on a 6–6.5 in wrist. Look at lug-to-lug and thickness rather than diameter alone, and compare photos on wrists your size in the [wrist gallery](/galerie).

### How do I measure my wrist without a tape measure?

Wrap a strip of paper just above your wrist bone, mark where it overlaps, then lay it flat against a ruler. Also measure the width of the top of your wrist: that's the limit your watch's lug-to-lug shouldn't exceed.
$faq$
where lang = 'en' and slug = 'watch-size-for-wrist' and position('## Frequently asked questions' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Questions fréquentes

### Combien coûte la révision d'une montre automatique ?

Le prix dépend surtout de la marque, du calibre et des pièces à remplacer : il va de quelques centaines d'euros chez un horloger indépendant pour un mouvement simple, à bien plus dans le service après-vente d'une grande marque ou pour un chronographe. Demandez toujours un devis détaillé avant d'accepter.

### Peut-on porter une montre automatique sans la faire réviser ?

Oui, tant qu'elle fonctionne bien, mais les huiles sèchent avec le temps et l'usure s'accélère. Attendre trop longtemps peut transformer une révision simple en réparation plus coûteuse. Surveillez la précision et la réserve de marche : une dérive est souvent le premier signe, et un [timegrapher](/magazine/timegrapher-lire-mesure-montre/) aide à la repérer.

### Faut-il faire réviser sa montre chez la marque ou chez un horloger indépendant ?

Les deux sont possibles. La marque garantit des pièces d'origine et conserve parfois la garantie ; un bon horloger indépendant est souvent plus rapide et moins cher. Pour une montre de collection, précisez dans tous les cas si vous refusez le polissage du boîtier.
$faq$
where lang = 'fr' and slug = 'reviser-montre-automatique' and position('## Questions fréquentes' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Frequently asked questions

### How much does it cost to service an automatic watch?

It depends mainly on the brand, the movement and the parts that need replacing: from a few hundred euros or dollars at an independent watchmaker for a simple movement, to much more at a major brand's service centre or for a chronograph. Always ask for a detailed quote first.

### Can I keep wearing an automatic watch without servicing it?

Yes, as long as it runs well, but the oils dry out over time and wear speeds up. Waiting too long can turn a routine service into a costlier repair. Keep an eye on accuracy and power reserve: drift is often the first sign, and a [timegrapher](/en/magazine/how-to-read-timegrapher/) helps you spot it.

### Should I service my watch with the brand or an independent watchmaker?

Both work. The brand guarantees original parts and sometimes a warranty on the work; a good independent is often faster and cheaper. For a collector's piece, say clearly in either case if you don't want the case polished.
$faq$
where lang = 'en' and slug = 'automatic-watch-service-interval' and position('## Frequently asked questions' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Questions fréquentes

### Quelle est la meilleure lumière pour photographier une montre ?

Une lumière du jour douce et indirecte : près d'une fenêtre sans soleil direct, ou dehors à l'ombre. Elle limite les reflets sur le verre et rend les couleurs du cadran fidèles. Évitez le flash et les spots du plafond, qui créent des reflets durs.

### Pourquoi ma montre paraît plus grosse en photo ?

Parce que l'objectif grand-angle du téléphone grossit ce qui est proche de lui. Utilisez le zoom 2× ou 3× en reculant un peu, et tenez le téléphone parallèle au cadran. La photo sera plus fidèle à la vraie taille de la montre, ce qui aide les autres collectionneurs à juger comment elle tombe.

### Pourquoi régler sa montre sur 10 h 10 pour la photo ?

Les aiguilles en V dégagent le logo et les compteurs, et encadrent le cadran de façon équilibrée. C'est une convention des photos de marque, mais rien n'oblige à la suivre : choisissez simplement une heure qui ne cache aucun détail important.
$faq$
where lang = 'fr' and slug = 'photographier-montre-smartphone' and position('## Questions fréquentes' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Frequently asked questions

### What's the best light for photographing a watch?

Soft, indirect daylight: near a window out of direct sun, or outdoors in the shade. It limits reflections on the crystal and keeps dial colours true. Avoid the flash and ceiling spotlights, which create harsh reflections.

### Why does my watch look bigger in photos?

Because your phone's wide-angle lens enlarges whatever is close to it. Use the 2× or 3× lens and step back a little, holding the phone parallel to the dial. The photo will be truer to the watch's real size, which helps other collectors judge how it wears.

### Why set a watch to 10:10 for photos?

Hands in a V shape keep the logo and sub-dials clear and frame the dial evenly. It's a convention from brand photography, not a rule: just pick a time that doesn't hide any important detail.
$faq$
where lang = 'en' and slug = 'how-to-photograph-watch-smartphone' and position('## Frequently asked questions' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Questions fréquentes

### Que veut dire « full set » pour une montre ?

« Full set » signifie que la montre est vendue avec tout ce qui l'accompagnait à l'achat : boîte d'origine, carte de garantie, facture, livrets, étiquettes et maillons supplémentaires. À l'inverse, « montre seule » signifie qu'aucun de ces éléments n'est fourni.

### Une montre sans papiers vaut-elle moins cher ?

Souvent, oui, surtout pour les modèles récents et recherchés des grandes marques, pour lesquels les acheteurs attendent un full set. L'écart est en général plus faible sur les montres anciennes, dont les papiers ont souvent disparu, et sur les montres abordables.

### Peut-on publier le numéro de série dans une annonce ?

Non, ne le publiez jamais en entier : il peut servir à fabriquer de faux papiers. Communiquez-le en privé à un acheteur sérieux, qui pourra le vérifier sur la page [Montres volées](/montres-volees) d'Arcora.
$faq$
where lang = 'fr' and slug = 'boite-et-papiers-montre' and position('## Questions fréquentes' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Frequently asked questions

### What does "full set" mean for a watch?

"Full set" means the watch comes with everything it was originally sold with: original box, warranty card, receipt, booklets, tags and spare links. "Watch only" means none of these are included.

### Is a watch without papers worth less?

Often, yes, especially for recent, sought-after models from major brands, where buyers expect a full set. The gap is usually smaller on vintage watches, whose papers have often gone missing, and on more affordable pieces.

### Should I post the serial number in a listing?

No, never post it in full: it can be used to fake papers. Share it privately with a serious buyer, who can check it on Arcora's [Stolen watches](/montres-volees) page.
$faq$
where lang = 'en' and slug = 'watch-box-and-papers' and position('## Frequently asked questions' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Questions fréquentes

### Mes montres sont-elles couvertes par mon assurance habitation ?

Souvent en partie seulement. Les contrats habitation couvrent les objets de valeur jusqu'à un plafond global et parfois un plafond par objet, et beaucoup ne couvrent pas les montres portées hors du domicile. Relisez vos conditions et, si besoin, déclarez vos montres ou souscrivez un contrat spécialisé.

### Quels justificatifs garder pour assurer une montre ?

La facture d'achat, la carte de garantie avec le numéro de série, des photos récentes (cadran, fond, profil, au poignet) et les factures d'entretien. Gardez-en une copie hors de chez vous : un dossier volé avec la montre ne sert à rien.

### Quel délai pour déclarer le vol d'une montre à son assureur ?

En France, la loi prévoit en général deux jours ouvrés pour déclarer un vol, sauf délai plus long prévu par le contrat. Portez plainte rapidement et suivez les étapes de notre guide [Montre volée : que faire](/magazine/montre-volee-que-faire/).
$faq$
where lang = 'fr' and slug = 'assurer-collection-montres' and position('## Questions fréquentes' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Frequently asked questions

### Are my watches covered by my home insurance?

Often only partly. Home policies cover valuables up to an overall limit, sometimes with a single-item limit, and many don't cover watches worn away from home. Re-read your policy and, if needed, declare your watches or take out a specialist valuables policy.

### What documents should I keep to insure a watch?

The purchase receipt, the warranty card with the serial number, recent photos (dial, caseback, profile, on the wrist) and service invoices. Keep a copy outside your home: a file stolen along with the watch is no use.

### How quickly must I report a stolen watch to my insurer?

Deadlines are short and vary by country and policy, sometimes just a couple of working days. Report it to the police quickly and follow the steps in our guide [Stolen watch: what to do](/en/magazine/stolen-watch-what-to-do/).
$faq$
where lang = 'en' and slug = 'insuring-watch-collection' and position('## Frequently asked questions' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Questions fréquentes

### Combien de secondes par jour est normal pour une montre automatique ?

Cela dépend du mouvement : quelques secondes par jour pour une montre bien réglée ou certifiée, jusqu'à une vingtaine de secondes, voire plus, pour certains mouvements d'entrée de gamme selon leur fabricant. Ce qui compte surtout, c'est que la marche reste stable dans le temps.

### Qu'est-ce qu'un chronomètre COSC ?

C'est une montre dont le mouvement a été testé par le Contrôle officiel suisse des chronomètres, dans plusieurs positions et températures. Pour obtenir la certification, sa marche moyenne doit rester entre −4 et +6 secondes par jour.

### Pourquoi ma montre se met-elle soudain à avancer beaucoup ?

La cause la plus fréquente est le magnétisme : haut-parleur, fermoir aimanté, coque de téléphone. Une montre aimantée avance souvent de plusieurs minutes par jour. Un horloger la démagnétise en quelques secondes ; mesurez-la avant et après avec le [timegrapher](/magazine/timegrapher-lire-mesure-montre/).
$faq$
where lang = 'fr' and slug = 'precision-montre-mecanique' and position('## Questions fréquentes' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Frequently asked questions

### How many seconds a day is normal for an automatic watch?

It depends on the movement: a few seconds a day for a well-regulated or certified watch, up to around twenty seconds or more for some entry-level movements, according to their makers. What matters most is that the rate stays stable over time.

### What is a COSC chronometer?

It's a watch whose movement has been tested by the Swiss Official Chronometer Testing Institute, in several positions and temperatures. To be certified, its average rate must stay between −4 and +6 seconds a day.

### Why has my watch suddenly started running fast?

The most common cause is magnetism: speakers, magnetic clasps, phone cases. A magnetised watch often gains several minutes a day. A watchmaker can demagnetise it in seconds; measure it before and after with a [timegrapher](/en/magazine/how-to-read-timegrapher/).
$faq$
where lang = 'en' and slug = 'mechanical-watch-accuracy' and position('## Frequently asked questions' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Questions fréquentes

### Comment savoir si une montre est vraie ?

Aucun signe isolé ne suffit : comparez le cadran, les gravures et le bracelet avec des photos officielles de la même référence, vérifiez la cohérence entre référence, numéro de série et papiers, et faites examiner le calibre par un horloger. C'est l'ensemble de ces vérifications qui rassure.

### Une trotteuse qui « saute » chaque seconde, est-ce une fausse montre ?

Sur une montre vendue comme mécanique, oui, c'est éliminatoire : une trotteuse qui avance par sauts d'une seconde indique un mouvement à quartz. Une trotteuse fluide ne prouve pas pour autant l'authenticité, car de nombreuses copies ont un mouvement mécanique.

### Les papiers prouvent-ils qu'une montre est authentique ?

Non. Les papiers aussi se falsifient, et de vrais papiers peuvent accompagner une fausse montre. Vérifiez que le numéro de série des papiers correspond à celui de la montre, puis contrôlez ce numéro sur la page [Montres volées](/montres-volees).
$faq$
where lang = 'fr' and slug = 'reperer-fausse-montre-occasion' and position('## Questions fréquentes' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Frequently asked questions

### How can I tell if a watch is genuine?

No single sign is enough: compare the dial, engravings and bracelet with official photos of the same reference, check that the reference, serial number and papers match, and have a watchmaker examine the movement. It's all these checks together that build confidence.

### Is a seconds hand that ticks once per second a sign of a fake?

On a watch sold as mechanical, yes, that's a deal-breaker: a seconds hand that jumps once a second means a quartz movement. A smooth sweep doesn't prove authenticity either, since many fakes use mechanical movements.

### Do papers prove a watch is authentic?

No. Papers get faked too, and genuine papers can come with a fake watch. Check that the serial number on the papers matches the one on the watch, then run that number through the [Stolen watches](/montres-volees) page.
$faq$
where lang = 'en' and slug = 'how-to-spot-fake-watch' and position('## Frequently asked questions' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Questions fréquentes

### Combien de montres faut-il pour une collection ?

Il n'y a pas de bon chiffre. Trois montres bien choisies (une pour tous les jours, une habillée, une de caractère) couvrent déjà presque toutes les situations. Au-delà, chaque nouvelle montre devrait avoir un rôle que les autres ne remplissent pas.

### Par quelle montre commencer une collection ?

Par une montre du quotidien : polyvalente, lisible, étanche à au moins 100 m, sur bracelet acier, d'une taille adaptée à votre poignet. C'est celle que vous porterez le plus, et elle vous apprendra ce que vous aimez vraiment. Notre guide sur [la taille de montre](/magazine/taille-montre-poignet/) aide à choisir.

### Comment savoir quelle montre vendre ?

Regardez ce que vous portez vraiment : une montre restée dans la boîte depuis des mois est la première candidate. Le carnet de portage d'Arcora le montre en un coup d'œil, et la vente finance souvent une pièce qui vous correspond mieux.
$faq$
where lang = 'fr' and slug = 'construire-collection-montres' and position('## Questions fréquentes' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Frequently asked questions

### How many watches make a collection?

There's no right number. Three well-chosen watches (one for every day, one dress watch, one with character) already cover almost every situation. Beyond that, each new watch should play a role the others don't.

### What watch should I start a collection with?

A daily wearer: versatile, legible, water-resistant to at least 100 m, on a steel bracelet, sized for your wrist. It's the one you'll wear most, and it will teach you what you really like. Our guide to [watch size](/en/magazine/watch-size-for-wrist/) helps you choose.

### How do I decide which watch to sell?

Look at what you actually wear: a watch that has stayed in its box for months is the first candidate. Arcora's wear log shows it at a glance, and the sale often funds a piece that suits you better.
$faq$
where lang = 'en' and slug = 'build-watch-collection' and position('## Frequently asked questions' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Questions fréquentes

### Qu'est-ce qu'un timegrapher ?

Un timegrapher, ou chronocomparateur, est un appareil qui écoute le tic-tac d'une montre mécanique avec un micro. En quelques secondes, il calcule sa marche en secondes par jour, son amplitude et son défaut de repère. C'est l'outil de diagnostic de base des horlogers.

### Peut-on mesurer la précision d'une montre avec son téléphone ?

Oui. Une application de timegrapher utilise le micro du téléphone pour mesurer la marche et le défaut de repère, montre posée contre le micro, au calme. L'amplitude, en revanche, demande en général un appareil dédié.

### Quelle amplitude est normale pour une montre automatique ?

À titre indicatif, autour de 270 à 310° pour une montre bien remontée, cadran vers le haut. Sous 200° environ juste après un remontage complet, c'est souvent le signe qu'une [révision](/magazine/reviser-montre-automatique/) approche.
$faq$
where lang = 'fr' and slug = 'timegrapher-lire-mesure-montre' and position('## Questions fréquentes' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Frequently asked questions

### What is a timegrapher?

A timegrapher is a device that listens to a mechanical watch tick through a microphone. Within seconds, it calculates the rate in seconds per day, the amplitude and the beat error. It's the watchmaker's basic diagnostic tool.

### Can I measure my watch's accuracy with my phone?

Yes. A timegrapher app uses your phone's microphone to measure rate and beat error, with the watch placed against the microphone in a quiet room. Amplitude, however, usually needs a dedicated machine.

### What amplitude is normal for an automatic watch?

As a rough guide, around 270–310° for a fully wound watch, dial up. Below about 200° right after a full wind is often a sign that a [service](/en/magazine/automatic-watch-service-interval/) is due.
$faq$
where lang = 'en' and slug = 'how-to-read-timegrapher' and position('## Frequently asked questions' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Questions fréquentes

### Comment vérifier si une montre est volée ?

Demandez le numéro de série au vendeur avant de payer, puis vérifiez-le sur la page [Montres volées](/montres-volees) d'Arcora et dans les registres spécialisés comme The Watch Register. Comparez-le aussi avec la garantie et la facture. Aucun registre n'est complet : restez attentif aux autres signaux d'alerte.

### Où trouver le numéro de série d'une montre ?

Il est gravé sur la montre, au dos du boîtier, entre les cornes ou sur le flanc selon les marques, et figure en général sur la carte de garantie. Notez-le dès l'achat avec la facture et des photos : le jour d'un vol, vous n'aurez plus la montre pour le relire.

### Que faire si j'ai acheté une montre volée sans le savoir ?

Ne la revendez pas. Contactez la police, conservez toutes les preuves de l'achat (annonce, messages, paiement) et renseignez-vous auprès d'un professionnel du droit sur vos recours contre le vendeur.
$faq$
where lang = 'fr' and slug = 'montre-volee-que-faire' and position('## Questions fréquentes' in body_md) = 0;

update public.magazine_articles
set body_md = rtrim(body_md) || E'\n\n' || $faq$## Frequently asked questions

### How can I check if a watch is stolen?

Ask the seller for the serial number before paying, then check it on Arcora's [Stolen watches](/montres-volees) page and on specialist registers such as The Watch Register. Compare it with the warranty card and receipt too. No register is complete, so watch for other warning signs.

### Where do I find a watch's serial number?

It's engraved on the watch, on the caseback, between the lugs or on the side of the case depending on the brand, and usually appears on the warranty card. Write it down when you buy, with the receipt and photos: after a theft, you won't have the watch to read it.

### What if I bought a stolen watch without knowing?

Don't sell it on. Contact the police, keep every proof of purchase (listing, messages, payment) and ask a legal professional about your options against the seller.
$faq$
where lang = 'en' and slug = 'stolen-watch-what-to-do' and position('## Frequently asked questions' in body_md) = 0;
