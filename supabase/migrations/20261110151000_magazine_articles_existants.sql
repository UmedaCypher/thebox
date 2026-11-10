-- =============================================================================
-- Magazine : reprise des articles existants dans le backoffice (une seule fois).
-- Les images de couverture restent celles du dépôt (cover_path « local:… »).
-- Se relance sans risque : un article déjà présent (même langue, même adresse) n'est pas modifié.
-- =============================================================================

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('en', 'automatic-watch-service-interval', 'watch-service-interval', 'How often should you service an automatic watch?', 'Full service, water-resistance checks, batteries: how often to service a mechanical or quartz watch, and the warning signs you shouldn''t ignore.', 'Care', 'Arcora',
$md$A mechanical watch is a tiny machine: dozens of parts turning non-stop, lubricated by a few drops of oil. Over time those oils dry out and parts wear. A service puts everything back in shape before wear turns into real damage.

## The short answer: every 5 to 10 years

There's no single interval. Each manufacturer gives its own recommendation, and it ranges **from roughly 5 to 10 years** depending on the brand, the movement and when the watch was made. Recent watches, with more modern oils and materials, generally go longer between services than older ones.

The right habit: check the brand's recommendation in the warranty booklet or on its website, then log the date of every service.

## What happens during a full service?

The watchmaker fully strips the movement, cleans every part, replaces worn components, re-lubricates, reassembles and regulates the timekeeping. Gaskets are replaced and water resistance is tested. Depending on the workshop, the case and bracelet may be cleaned or polished: say so if you do **not** want polishing, because it softens the case edges and can reduce the value of a collector's piece.

Expect a few weeks without your watch, sometimes several months at a major brand's service centre.

## Maintenance between services

- **Water resistance.** Gaskets age even if the watch never sees water. If you swim with it, a pressure test every one to two years is a simple, inexpensive precaution.
- **The battery, for quartz watches.** It usually lasts several years. Replace it as soon as the watch stops: a dead battery left inside can leak and damage the movement.
- **Strap or bracelet.** A steel bracelet can be cleaned with lukewarm water and a soft brush (if the watch is water-resistant and the crown is screwed down). Replace a leather strap as soon as it starts to crack.

## Warning signs you shouldn't ignore

Don't wait for the scheduled date if you notice any of these:

1. **The watch gains or loses far more time than before**, consistently.
2. **The power reserve drops**: the watch stops sooner than usual when you take it off.
3. **Condensation under the crystal**: moisture got in, act quickly.
4. **An unusual noise** or grinding when you move your wrist.
5. **A stiff crown** that catches or won't screw down properly.

## Why keep a record of every service

A complete service history reassures buyers and supports the resale price: it shows the watch has been looked after. Keep the invoices and note the date, the workshop, what was done and the cost for each job.

In Arcora, every watch has a **Service** tab: log full services, pressure tests and battery changes, and the app reminds you when the next service is due (Premium feature). When the day comes to sell, the whole history is ready to share.

## In short

- Full service every **5 to 10 years**, following the brand's recommendation.
- Water-resistance check every **1 to 2 years** if you wear the watch in water.
- A watch that drifts, stops early or fogs up should be seen right away.
- Keep a record of every service: it's value for later.
$md$, 'local:ecrin-boite-a-montres-ouverte.webp', 'Open wooden watch box with six burgundy velvet cushions', null, 'published', '2026-11-04')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('en', 'build-watch-collection', 'watch-collection-building', 'How to build a coherent watch collection: think in roles', 'Daily wearer, dress watch, sports watch, beater: how to build a coherent collection, avoid duplicates and buy based on what you actually wear.', 'Guides', 'Arcora',
$md$Collections rarely start with a plan. You buy a first watch, then a second because it looked great, then a third because it was on sale. A few years later you own five black divers on steel bracelets and nothing to wear with a suit. Thinking in roles helps you avoid that trap: before asking "which watch?", ask "what for?".

## Think in roles, not models

The idea is simple: every watch in your collection should have a job in your life. The most common roles are:

- **The daily wearer.** The one you put on without thinking, at the office or at the weekend. Versatile, legible, reasonably tough, sensibly sized.
- **The dress watch.** Thin, discreet, often on a leather strap, slipping under a shirt cuff. For weddings, interviews and dinners.
- **The sports or tool watch.** Diver, chronograph, GMT, pilot's watch: a watch built for a specific function and to take a few more knocks.
- **The beater.** The one you wear in the garden, hiking or doing DIY without a second thought. Often quartz or an affordable model.

Some collectors add more personal roles on top: a travel watch with a second time zone, a family heirloom, the special piece that only comes out on Sundays.

![Three watches on a desk: a Longines chronograph on black leather, a dress watch with a silver dial on beige suede and a Tudor Black Bay on a steel bracelet](../images/longines-grand-seiko-tudor-black-bay-bureau.webp "Three watches, three clearly distinct roles: chronograph, dress watch and tool watch.")

## The three-watch collection

It's the formula most often recommended for getting started, and for many collectors it's enough for life:

1. **A daily wearer** on a steel bracelet, with a clean dial and at least 100 m of water resistance.
2. **A dress watch** on leather, thinner, without unnecessary complications.
3. **A watch with character**: a chronograph, a diver or a GMT, depending on your taste and activities.

Three well-chosen watches cover almost every situation. And each one gets enough wrist time that you actually wear it, which stops being true past a certain collection size.

A popular variation swaps the dress watch for a beater, for people who never wear a suit. The rule stays the same: each watch should cover a situation the others handle badly.

## Avoid duplicates

A duplicate is the watch you buy because you like it, but which does exactly the same job as one already in your box. A few questions to ask before buying:

- **In what situation will I wear it** instead of a watch I already own?
- **Is it a different style**, or just a different dial colour?
- **Is it the same size**, the same bracelet, the same function?
- **Which one would I sell** if I could only keep one of the two?

If you can't clearly answer the first question, it's probably a duplicate. That's not forbidden: some collectors happily own nothing but divers, and that's a coherent collection too. What matters is that it's a choice rather than an accident.

![Open watch box holding, among others, a Seiko 5 GMT, two Tissot PRX, several Casio and G-Shock watches, a Fossil and an Apple Watch](../images/boite-a-montres-seiko-tissot-prx-casio-g-shock.webp "A well-filled box: it's up to you to decide which watches really play a different role.")

## Budget tiers

A coherent collection can be built at any price level. What changes is how you spread the budget.

- **Starting out, a few hundred euros per watch.** Entry-level Japanese and Swiss brands, as well as microbrands, offer very solid automatic and quartz watches. It's the ideal way to find out what you really like: size, style, strap.
- **The middle tier, roughly one to a few thousand euros.** Better finishing, in-house or certified movements, and stronger value retention on some models.
- **High-end.** Here every purchase is a commitment. It's best to have already learned, with more affordable watches, what you actually wear.

One effective approach: spend more on the watch you'll wear most often, and stay sensible on the ones that rarely come out. A dress watch worn four times a year doesn't need the same budget as your daily wearer.

Remember the hidden costs too: servicing a mechanical watch, insurance above a certain value, spare straps.

## Look at what you really wear

This is the most useful advice and the least followed. We think we know which watches we wear, but memory plays tricks. The latest purchase feels like it's on your wrist all the time; the one sleeping at the back of the box for eight months is forgotten.

For a few months, note down the watch you wear every day. The results are often surprising:

- one watch worn most of the time, which may deserve a more accomplished version;
- two or three watches that almost never come out, whose sale could fund a more considered purchase;
- a role you thought was important but which doesn't match your actual life.

That data is worth more than any list of "must-have watches". It tells you what to buy, and above all what to sell.

## Sell to collect better

A coherent collection isn't frozen. Selling a watch you don't wear isn't a failure: it's the healthiest way to let your collection evolve without growing endlessly. Many collectors adopt a "one in, one out" rule once they reach the number of watches that suits them.

## Your watches in Arcora

In Arcora, Wrist Check lets you log the watch you're wearing each day, with streaks that reward consistency. After a few weeks you can clearly see which watches live on your wrist and which ones sleep. And if one of them no longer has a place, you can list it on the Market, between members and with no commission.

## In short

- Think in roles: daily, dress, sports or tool, beater.
- Three well-chosen watches cover almost every situation.
- Before buying, ask in which situation the new watch will replace the others.
- Put the budget into the watch you wear most.
- Track what you really wear, then sell what never comes out.
$md$, 'local:collection-montres-seiko-tissot-citizen-alignees.webp', 'Eight Tissot, Seiko and Citizen watches lined up on a brown leather surface, on steel, leather and fabric straps', null, 'published', '2026-11-10')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('en', 'how-to-photograph-watch-smartphone', 'watch-wrist-photo', 'How to take a great wrist shot with your smartphone', 'Light, angle, lens, settings: a simple method for great wrist shots of your watch with your phone, with no extra gear and no heavy editing.', 'Photography', 'Arcora',
$md$A great wrist shot doesn't need an expensive camera or a studio. Your phone is more than enough, as long as you take care of four things: light, angle, a clean watch and a few simple settings.

## 1. Light: soft and indirect

This matters more than anything else. A watch crystal reflects everything, and a polished dial can turn into a white blob in direct sun.

- **Stand near a window**, without the sun hitting the watch directly. An overcast day is ideal: the light is soft and even.
- **Skip the flash** and overhead lights, which create harsh reflections and off colours.
- **Outdoors, find some shade** or shoot late in the day, when the light is warmer and lower.
- **Tilt your wrist slightly** until the reflection leaves the crystal. A few degrees is enough.

## 2. Angle and lens: avoid distortion

Phones default to a wide-angle lens, which enlarges whatever is close and shrinks the rest. The result: the watch looks bigger than it is, and the bracelet bends.

- **Use the 2× or 3× lens** if your phone has one, and step back a little.
- **Otherwise, step back and crop** afterwards rather than pushing the phone right up to the watch.
- **Hold the phone parallel to the dial**, or slightly above it. A steep side angle squashes the proportions.

It's also about honesty: on the Arcora gallery, other collectors look at your photo to judge how a watch will wear on their wrist. A distortion-free shot genuinely helps them.

## 3. A clean watch

Every detail shows in a sharp photo.

- **Wipe the crystal** with a microfibre cloth: fingerprints and dust stand out a lot.
- **Clean a steel bracelet** if needed, especially between the links.
- **Set the time** so the logo and sub-dials stay clear. The classic 10:10 works for exactly that reason.

## 4. Pose and background

- **Keep your wrist relaxed**, hand slightly loose. A tense wrist shows tendons and rotates the watch.
- **Pick a simple background**: a sleeve, denim, a wooden table. The eye should go to the watch.
- **Leave some space** around your wrist so you can crop.

![Rectangular dress watch with a silver dial on a black leather strap, worn on the wrist](../images/montre-habillee-rectangulaire-poignet-bracelet-cuir.webp "A neutral background and soft light are all it takes to show off the dial and strap.")

## 5. Phone settings

- **Tap the dial on screen** to focus on it.
- **Lower the exposure a little** (slide your finger down on most phones): a slightly dark image beats a blown-out dial.
- **Turn off portrait mode** for close-ups: the artificial blur often cuts badly around the lugs and strap.
- **Take several shots**, varying the angle slightly, and keep the best one.

## 6. Editing: keep it light

A small tweak to brightness, contrast and framing is plenty. Avoid filters that shift colours: a blue dial should stay the same blue, especially if the photo helps someone choose.

## Share it on the gallery

Once you have a shot you like, add it to your watch in Arcora and post it to the wrist gallery with your wrist size. Other members can filter by wrist size and say whether the watch looks small, perfect or large on you: the best way to help someone who's on the fence.

## In short

1. Soft, indirect daylight, no flash.
2. 2× lens or step back, phone parallel to the dial.
3. Clean crystal and bracelet, well-chosen time.
4. Focus on the dial, exposure slightly down.
5. Light editing, true colours.
$md$, 'local:rolex-yacht-master-poignet-lumiere-naturelle.webp', 'Rolex Yacht-Master with a grey dial on the wrist, shot in natural light', 'Soft daylight, a sharp dial and a sleeve in the background: the recipe for a good wrist shot.', 'published', '2026-11-05')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('en', 'how-to-spot-fake-watch', 'fake-watch-check', 'How to spot a fake watch before buying pre-owned', 'Price, photos, papers, serial number, calibre: the red flags and checks to run before buying a pre-owned watch from a private seller.', 'Guides', 'Arcora',
$md$Buying a pre-owned watch from a private seller is often the best way to find the piece you want at a fair price. It's also where counterfeits circulate, some of them very convincing. The good news: most scams can be spotted before you even see the watch, as long as you take the time to check. Here's a four-step method, from the listing to the handover.

## Red flags in the listing

Before you look at the dial, look at the context. The same warning signs come up again and again:

- **A price well below the market.** A sought-after watch doesn't sell for 40% less than everywhere else without a reason. Compare several listings of the same model, in the same condition and with the same level of papers.
- **Photos that aren't the seller's own.** Images that are too perfect, white catalogue backgrounds, or pictures that turn up elsewhere with a reverse image search.
- **A vague backstory.** "Gift, never worn", "inherited it, don't know much about watches": not a problem in itself, but it shouldn't replace precise answers.
- **Urgency.** "Several buyers interested", "I'm leaving tomorrow": pressure is there to stop you checking.
- **Refusing to meet**, or insisting on remote payment by instant bank transfer or another method that's hard to dispute.

A single one of these proves nothing. Two or three together should make you slow down considerably.

## Ask for the right photos

An honest seller has no trouble taking a few extra pictures. Ask for:

1. **The watch next to a note** with your first name and today's date. It's simple proof that they actually have it in hand.
2. **A sharp close-up of the dial**, without glare. Printing should be crisp, even and perfectly aligned. Look at the indices, the hands and the date magnifier if the model has one.
3. **The caseback and case sides**, for engravings and overall condition.
4. **The clasp and links**, often less carefully finished on copies.
5. **A short video** of the seconds hand and of setting the time.

![Rolex Datejust with a chocolate dial and fluted bezel on a Jubilee bracelet, resting on a wooden table](../images/rolex-datejust-cadran-chocolat-bracelet-jubile.webp "A sharp close-up of the dial is already enough to judge the quality of the printing and the magnifier.")

Then compare with the brand's official photos **for the same reference**, or with examples sold by reputable dealers. The differences are often in the details: a typeface slightly too bold, a dial colour that never existed for that reference, a date that sits off-centre in its window, a bezel that doesn't match the model.

Keep one important limit in mind: the best copies today are hard to tell apart from photos, even for a trained eye. Photos are mainly there to weed out bad listings, not to give a watch a final seal of approval.

## Check that everything adds up: reference, serial, papers

A genuine watch tells a consistent story. A counterfeit often gives itself away through a mismatch between its parts.

- **The reference** (the model number) should match exactly what you see: size, material, dial, bezel, bracelet. A reference that never existed with that dial is a strong warning sign.
- **The serial number** should be consistent with the stated era and identical on the watch and the warranty card. Ask for it privately rather than in a public listing, and never publish your own: it can be used to fake papers.
- **Papers** aren't absolute proof. They get forged too, and genuine papers can travel with a fake watch. Check that the retailer's name, the date and the reference are plausible. An invoice from an authorised dealer or from the brand's service centre is a plus.
- **The caseback.** If the model normally has a solid caseback and the listing shows a display back, or vice versa, ask why.

## The calibre has the final word

The inside is where the difference is hardest to hide. Every model uses a specific calibre documented by the brand. A counterfeit almost always uses a different movement, even when the outside is very close.

![Display caseback of a Tissot watch showing an automatic movement with its engraved rotor](../images/tissot-fond-transparent-mouvement-automatique.webp "With a display caseback, compare the visible movement with the calibre listed for the reference.")

A few pointers:

- **Look up the reference's calibre** before you see the watch: its general layout, the rotor, the engravings, the functions.
- **The seconds hand isn't enough.** A hand that jumps once a second means quartz, which rules out a watch sold as mechanical. But many copies are automatic, so a smooth sweep proves nothing.
- **Every function should work as intended**: quick-set date, independent GMT hand, a chronograph that starts, stops and resets cleanly.

On a watch with a solid caseback, only a watchmaker can open the case and check the calibre. It's the most reliable check available to a private buyer.

## Meet at a watchmaker

For any significant purchase, suggest completing the sale **at an independent watchmaker or a dealer** willing to examine the watch. Expect to pay a small fee for their time; it's usually money well spent. They can open the caseback, identify the calibre, check overall condition and sometimes measure accuracy.

An honest seller will generally agree, perhaps splitting the cost. A flat refusal is an answer in itself.

Some brands also offer checks through their service centres, with varying lead times and costs. It takes longer, but it's the most authoritative opinion.

## Questions to ask the seller

Ask them in writing before you meet, and keep the conversation:

- How long have you owned the watch, and where was it bought?
- Has it been serviced? By whom, and do you have the invoice?
- What calibre does it use?
- Which parts have been replaced (dial, hands, crystal, bracelet)?
- What exactly comes with it: box, warranty card, receipt, links?
- Are you happy for a watchmaker to check it before payment?

The answers matter, but how precise they are matters even more. Someone who knows their watch answers quickly and directly.

## Paying and closing the deal safely

- **Never pay before seeing the watch**, especially with an irreversible method.
- **Hand over in person**, in a public place or at the watchmaker's.
- **Write a simple receipt**: date, reference, serial number, price, names and signatures of both parties.
- **Be wary of last-minute banker's drafts or cheques**, especially late on a weekend: confirm them with the issuing bank before handing anything over.

## Buying on Arcora

On Arcora's Market, sales happen between members with no commission, and you talk to the seller through the in-app messaging, so you keep a written record of every question and answer. Each listing is linked to a watch page where the seller can fill in the reference, the calibre and what they have in terms of box and papers. That makes comparisons easier, but it doesn't replace a watchmaker's eye: for an important piece, keep the habit of meeting at a workshop.

## In short

- A price that's too low, borrowed photos and urgency should make you slow down.
- Ask for dated, sharp photos of the dial, caseback and clasp.
- Check that reference, serial number, papers and calibre all match.
- Papers don't prove everything: only a watchmaker can confirm the movement.
- No remote payment before you've seen the watch.
$md$, 'local:etal-montres-bon-marche-marche.webp', 'Market stall covered in inexpensive watches with gold, silver and black dials', null, 'published', '2026-11-10')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('en', 'insuring-watch-collection', 'watch-collection-insurance', 'Insuring your watch collection: how to prepare', 'Home insurance limits, cover away from home, supporting documents: what to check and prepare so you''re properly covered if a watch is lost or stolen.', 'Value', 'Arcora',
$md$Many collectors assume their watches are covered by their home insurance. Sometimes that's true; often it's only partly true. And when a theft happens, what makes the difference isn't just the policy: it's the file you can hand over.

*This article gives general pointers. Terms vary a lot from one policy and one country to another: always check yours with your insurer.*

## 1. Re-read your home insurance policy

Home policies usually cover "valuables", but with limits. Look in your policy documents for:

- **the overall limit** for valuables, often a fixed amount or a percentage of your contents cover;
- **the single-item limit**, which can be far below the price of one watch;
- **the security requirements**: locks, alarm, a safe for higher amounts;
- **cover away from home**: many policies only cover watches inside your home, not on your wrist while travelling or out and about;
- **how claims are settled**: purchase price, replacement value, value set by an expert…

If your collection exceeds those limits, you have two options: declare the watches to your insurer to adjust your policy, or take out a specialist valuables policy, which often also covers watches worn outside.

## 2. Build a file for each watch

After a loss, your insurer will ask you to prove each watch's existence, authenticity and value. Prepare now:

- **the purchase receipt** (or a bank statement if you don't have one);
- **the warranty card or certificate**, with the serial number;
- **recent, sharp photos**: dial, caseback, profile, and a wrist shot proving the watch is yours;
- **service invoices**, which document condition and history;
- **a professional valuation** for the most expensive or vintage pieces, if your insurer requires one.

Keep a copy of all this **somewhere other than your home** (online, with a relative): a file stored in the drawer that was burgled is no use.

## 3. Keep values up to date

Pre-owned watch prices move. A watch bought ten years ago may be worth much more, or less, today. If your policy pays out based on a declared value, review it regularly, say once a year and after every purchase.

## 4. Everyday good habits

- **Don't post your watches alongside your address or identifiable details** on social media.
- **Avoid wearing a very expensive watch** in situations where you wouldn't walk around holding a wad of cash.
- **When travelling**, check that your policy covers the watch away from home and abroad.
- **If a watch is stolen**, report it to the police quickly and notify your insurer within the deadline in your policy. Also register the serial number with stolen-watch databases.

## Build your inventory with Arcora

In Arcora, each watch already brings together its photos, reference, estimated value and service log. With Premium, the **insurance export** creates a PDF inventory in one click, with a photo, the reference and the declared value of each watch: the document to hand to your insurer, or keep somewhere safe.

## In short

1. Check your policy's limits, conditions and cover away from home.
2. Gather the receipt, warranty, photos and service invoices for each watch.
3. Keep a copy of the file outside your home.
4. Update values at least once a year.
$md$, 'local:zenith-squelette-ceramique-blanche-poignet.webp', 'Zenith skeleton watch with a white ceramic case, worn on the wrist', null, 'published', '2026-11-05')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('en', 'mechanical-watch-accuracy', 'mechanical-watch-accuracy', 'Mechanical watch accuracy: what''s normal and how to measure it', 'Seconds per day, COSC chronometers, position, temperature, magnetism: what affects a mechanical watch''s accuracy and how to measure it yourself.', 'Care', 'Arcora',
$md$Your automatic watch has gained a few seconds this week. Is that normal? Should you worry? A mechanical watch will never be as accurate as a quartz, and that's entirely expected. But there's a difference between normal drift and a sign that a service is due, and it's worth knowing how to tell them apart.

## What "seconds per day" means

A mechanical watch's accuracy is expressed in **seconds per day** (s/d). A watch running at +5 s/d gains five seconds in 24 hours; one at −3 s/d loses three.

This daily deviation is also called the **rate**. It's never perfectly stable: it varies with how you wear the watch, how it rests overnight, the temperature and how wound the mainspring is. That's why standards talk about an **average daily rate**, measured over several days and in several conditions.

For a sense of scale: a watch that drifts 10 s/d builds up roughly a minute of error per week. For many owners that's perfectly acceptable, as long as they reset the time now and then.

## Typical tolerances

There's no single "normal" accuracy: it all depends on the calibre and how finely it's regulated.

- **Entry-level movements** are often specified by their makers with fairly wide tolerances. Seiko, for example, lists −35 to +45 s/d for its 4R automatic calibres. In practice many examples do much better, but that range is all the brand guarantees.
- **Mid-range movements** are regulated more finely, with tighter stated tolerances.
- **Certified chronometers** meet a specific standard, described below.

The right reflex: look up the official specification for your watch's calibre. That's what tells you whether your watch is within spec.

## Chronometers, COSC and brand certifications

"**Chronometer**" isn't just a marketing word. In Switzerland it refers to a watch whose movement has passed testing by the **COSC** (the official Swiss chronometer testing institute). The movement is tested over several days, in different positions and at three temperatures. For a typical-size mechanical movement, the required average daily rate is between **−4 and +6 s/d**, along with other criteria on consistency.

![Display caseback of a Tissot watch marked Chronomètre, showing the automatic movement](../images/tissot-fond-transparent-mouvement-automatique.webp "The chronometer marking indicates a movement tested to an official accuracy standard.")

Some brands go further with their own certifications, often after casing, meaning the complete watch rather than the bare movement. Rolex, for example, states −2/+2 s/d for its "Superlative Chronometer" watches. Omega has some of its "Master Chronometer" watches certified by the Swiss Federal Institute of Metrology (METAS), with tests that include resistance to magnetism.

Bear in mind that these tolerances apply under test conditions. On the wrist, the same watch's rate can vary a little without that indicating a fault.

## What affects accuracy

**Position.** The regulating organ, the balance and hairspring, doesn't behave in exactly the same way when the watch is flat, crown down or crown up. That's why the rate differs between wearing and resting. A trick collectors know well: if your watch runs a little fast, try resting it overnight in a position where it loses time, dial up or crown down for example. Test over a few nights to find the right one.

**Temperature.** Cold and heat slightly change the properties of the hairspring and the oils. Modern alloys greatly reduce the effect, but a watch left in a car in high summer or on a windowsill in winter may drift differently.

**Power reserve.** A well-wound mainspring delivers more consistent force than a nearly empty one. An automatic that isn't worn much, or a hand-wound watch near the end of its reserve, can see its rate change. A watch worn regularly, or wound every morning, behaves more consistently.

**Magnetism.** This is the most common cause of sudden, large drift. Speakers, magnetic bag clasps, phone cases, laptops, tablets: magnets are everywhere. A magnetised hairspring sticks to itself and the watch often starts running very fast, sometimes by several minutes a day. The good news: a watchmaker can demagnetise it in seconds, usually for a small fee.

**Shocks.** A drop or a hard knock can upset the regulation or even damage a pivot. If the rate changes abruptly after an impact, have it checked.

![Close-up of the black dial of an Omega Seamaster Professional, with the hands blurred in motion](../images/omega-seamaster-professional-cadran-detail.webp "Sudden drift with no obvious knock often has a simple cause: magnetism.")

## How to measure your watch's accuracy

**The simple method: compare with a reference time.** No equipment needed.

1. Open a reliable time source synchronised with an atomic clock: a dedicated website, or your smartphone's clock, which sets itself from the network.
2. Set your watch to the exact time, stopping the seconds hand if your calibre allows it.
3. Every day, at roughly the same time, note the difference in seconds.
4. Keep going for at least five to seven days, wearing the watch normally.
5. Divide the total difference by the number of days: that's your average rate.

A measurement over a single day doesn't mean much. The weekly average is what reflects your real-life use.

**The instant method: the timegrapher.** Watchmakers use a device called a timegrapher, which listens to the watch's ticking and shows within seconds the rate, the balance amplitude and the beat error (the asymmetry between the two halves of each oscillation). There are smartphone apps that take a similar measurement using the phone's microphone. They're less precise than a workshop instrument and sensitive to background noise, but they give a good indication and let you compare positions.

## When should you worry?

A watch that stays stable within its tolerance, even a wide one, is fine. What should alert you is **change**:

- the rate gets clearly worse compared with your previous measurements;
- the watch suddenly starts running very fast (think magnetism first);
- the power reserve drops at the same time;
- the rate becomes very erratic from one day to the next.

In these cases, demagnetising or regulating may be enough. But if the watch hasn't been serviced for a long time, it's often a sign that the oils are ageing and a full service is due. That's where a history of your measurements becomes valuable: it shows whether the drift is new or gradual.

## Track your measurements in Arcora

In Arcora you can log accuracy measurements on each watch's page and follow how they evolve over time, alongside its service history. A timegrapher-style measuring feature is being added to take this further. The day your watch starts drifting, you'll know straight away whether it's new.

## In short

- Accuracy is measured in seconds per day, averaged over several days.
- A COSC chronometer must hold an average rate of −4 to +6 s/d in testing.
- Position, temperature, power reserve and magnetism all affect the rate.
- Measure over a week by comparing with a reference time.
- What matters is the trend: new drift deserves a visit to the watchmaker.
$md$, 'local:rolex-air-king-cadran-noir-livre-ancien.webp', 'Rolex Air-King with a black dial and engine-turned bezel on an Oyster bracelet, resting on an old red-bound book', null, 'published', '2026-11-10')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('en', 'watch-box-and-papers', 'watch-box-papers', 'Box and papers: why they matter for your watch', 'Full set, warranty card, receipt, tags: what box and papers really include, why they matter at resale and how to store them properly.', 'Value', 'Arcora',
$md$On pre-owned watch listings, one phrase comes up everywhere: "box and papers", or "full set". For many buyers it's a deciding factor. Here's what it really covers, why it matters and how to avoid losing value without realising it.

## What "box and papers" means

The term covers everything that came with the watch when it was sold. Depending on the brand and the era, that can include:

- **the original box**, often with an outer cardboard box;
- **the warranty card or certificate**, which usually shows the serial number and date of sale;
- **the purchase receipt** from the retailer;
- **booklets and manuals**;
- **hang tags** and sometimes the protective stickers;
- **spare bracelet links**, which are easy to forget.

"Full set" means everything is there; "watch only" means nothing is.

## Why it matters

**Proof of authenticity and origin.** A warranty card that matches the watch's serial number reassures buyers: it links the watch to an official sale. It's not an absolute guarantee (papers get faked too), but it's one more reason to trust.

**History.** The date and place of purchase tell the watch's story. Add an up-to-date service record and you have a "documented" watch, which collectors value.

**Manufacturer warranty.** On a recent watch, the warranty card often lets a second owner benefit from the remaining warranty. Check the brand's terms.

**Resale value.** This is the most concrete point. On sought-after models from major brands, the price gap between a full set and a watch-only example can be significant. It's usually smaller on vintage watches, where papers have often gone missing, and on more affordable pieces.

## How to store them properly

- **Keep everything in one place**, away from damp and light. Cardboard and leather boxes age badly in basements and attics.
- **Keep spare links and small parts** in a bag labelled with the watch's name.
- **Scan or photograph the papers** as soon as you buy. If they get lost, you'll still have a record for insurance.
- **Don't travel with papers and watch together**: if one is stolen, you keep the other.

## Be careful with the serial number

The serial number is on the warranty card and on the watch. **Never post it in full** in a listing or on social media: it can be used to fake papers for another watch. Blur it in your photos and only share it with a serious buyer at the time of sale.

## What if you've lost them?

Don't panic: a watch without papers is still a watch. Some brands will issue a certificate or an archive extract after inspection, usually for a fee. A recent service invoice from an authorised service centre also provides a form of proof. And for vintage watches, missing papers are common and matter less.

## Record it in your collection

In Arcora, each watch has a **Box & papers** field: log what you have today. On the Market, buyers can filter listings by this criterion, and your watch page already shows everything on the day you sell.

## In short

- "Box and papers" = box, warranty card, receipt, booklets, tags and spare links.
- They reassure buyers about origin, document the watch's history and support resale value.
- Store them somewhere dry, photograph them and never publish the serial number.
$md$, 'local:ecrin-boite-a-montres-fermee.webp', 'Closed wooden watch box on a dark background', null, 'published', '2026-11-05')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('en', 'watch-size-for-wrist', 'watch-size-wrist', 'What watch size fits my wrist? The complete guide', 'Case diameter, lug-to-lug, thickness: how to pick the right watch size for your wrist, with a sizing chart and a simple way to measure at home.', 'Guides', 'Arcora',
$md$A watch can look stunning in photos and wrong the moment it's on your wrist. Too big and it overhangs and slides around; too small and it disappears. The good news: the right size isn't guesswork. You can measure it. Here's the method, the reference points and the traps to avoid.

## Start by measuring your wrist

Two measurements matter, and most people forget the second one.

**Wrist circumference.** Wrap a soft tape measure just above your wrist bone, where you wear your watch. No tape? A strip of paper marked with a pen, then laid against a ruler, works just as well.

**The width of the top of your wrist.** Lay a ruler across your wrist and measure the flat part from edge to edge. That's the surface the watch actually sits on, and it decides whether a watch fits or overhangs.

## The number that really matters: lug-to-lug

Everyone looks at case diameter. But it's the **lug-to-lug** distance, from the tip of one lug to the tip of the other, that makes or breaks the fit.

The rule is simple: **lug-to-lug should not exceed the width of the top of your wrist.** If the lugs hang over the edge, the strap floats in mid-air and the watch looks too big, whatever its diameter.

That's why a 40 mm watch with short lugs can wear better than a 38 mm watch with long ones. Good spec sheets list lug-to-lug; if not, forums and review videos usually mention it.

## Sizing chart by wrist circumference

These ranges are starting points for a classic watch (round case, thin bezel). They don't replace trying one on.

| Wrist circumference | Suggested diameter | Suggested lug-to-lug |
|---|---|---|
| Under 6 in (15 cm) | 34–37 mm | up to 42 mm |
| 6–6.5 in (15–16.5 cm) | 36–39 mm | up to 46 mm |
| 6.5–7 in (16.5–18 cm) | 38–42 mm | up to 49 mm |
| 7–7.7 in (18–19.5 cm) | 40–44 mm | up to 52 mm |
| Over 7.7 in (19.5 cm) | 42 mm and up | over 52 mm |

## What changes how big a watch looks

Two watches with the same diameter can wear very differently. A few things matter a lot:

- **The bezel.** A dive or tachymeter bezel shrinks the dial, so the watch looks smaller. A thin bezel gives all the space to the dial, so it looks bigger.
- **Dial colour.** Light dials (white, silver, cream) look larger; black or navy dials look tighter.
- **Thickness.** Above roughly 13–14 mm, a watch catches on cuffs and looks chunky even at a sensible diameter.
- **Case shape.** A cushion or square case takes up more room than a round case of the same diameter.
- **Strap or bracelet.** A steel bracelet adds visual weight; a slim leather strap or a NATO lightens the whole thing.

![Omega Speedmaster with a silver dial and green tachymeter bezel, worn on the wrist](../images/omega-speedmaster-lunette-tachymetre-poignet.webp "The tachymeter bezel frames the dial, so the watch looks more compact than its 42 mm.")

## Trends and personal taste

Watches grew through the 2000s, then came back to more restrained sizes: many recent releases sit between 36 and 40 mm. You don't have to follow the trend. Some people want a watch that gets noticed, others one that slips under a cuff. The guidelines above are there to avoid an unbalanced look, not to dictate a style.

## The best test: compare on wrists like yours

Official photos are shot on unknown wrists, often with lenses that distort proportions. The most reliable check is to see the watch **on a wrist the same size as yours**.

That's exactly what the Arcora wrist gallery is for: every photo shows the owner's wrist size, and you can filter by brand and by wrist size. Before you buy, you see how the watch really wears.

## In short

1. Measure your wrist circumference **and** the width of the top of your wrist.
2. Check that lug-to-lug doesn't exceed that width.
3. Use the chart as a starting point, then factor in bezel, dial and thickness.
4. Look at photos on wrists your size before you decide.
$md$, 'local:tudor-prince-date-chrono-poignet.webp', 'Tudor Prince Date chronograph with a burgundy dial on a steel bracelet, worn on the wrist', 'A 40 mm Tudor chronograph on the wrist.', 'published', '2026-11-05')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('fr', 'assurer-collection-montres', 'watch-collection-insurance', 'Assurer sa collection de montres : bien préparer son dossier', 'Contrat habitation, plafonds, garanties hors domicile, justificatifs : ce qu''il faut vérifier et préparer pour être vraiment couvert en cas de vol ou de perte.', 'Valeur', 'Arcora',
$md$Beaucoup de collectionneurs pensent que leurs montres sont couvertes par leur assurance habitation. C'est parfois vrai, souvent en partie seulement. Et le jour d'un vol, ce qui fait la différence, ce n'est pas seulement le contrat : c'est le dossier que vous pouvez présenter.

*Cet article donne des repères généraux. Les conditions varient beaucoup d'un contrat à l'autre : vérifiez toujours les vôtres avec votre assureur.*

## 1. Relisez votre contrat habitation

Les contrats habitation couvrent généralement les « objets de valeur », mais avec des limites. Cherchez dans vos conditions générales et particulières :

- **le plafond global** pour les objets de valeur, souvent exprimé en montant ou en pourcentage du capital mobilier ;
- **le plafond par objet**, qui peut être bien inférieur au prix d'une seule montre ;
- **les conditions de protection** exigées : serrures, alarme, coffre-fort pour les montants élevés ;
- **la couverture hors domicile** : beaucoup de contrats ne couvrent les montres que chez vous, pas au poignet en voyage ou dans la rue ;
- **le mode d'indemnisation** : valeur d'achat, valeur de remplacement, valeur à dire d'expert…

Si votre collection dépasse ces plafonds, deux options : déclarer les montres à votre assureur pour adapter le contrat, ou souscrire un contrat spécialisé pour les objets de valeur, qui couvre souvent aussi les montres portées à l'extérieur.

## 2. Constituez un dossier pour chaque montre

En cas de sinistre, l'assureur vous demandera de prouver l'existence, l'authenticité et la valeur de chaque montre. Préparez dès maintenant :

- **la facture d'achat** (ou un relevé bancaire à défaut) ;
- **la carte de garantie ou le certificat**, avec le numéro de série ;
- **des photos récentes et nettes** : cadran, fond, profil, et une photo au poignet qui prouve que la montre est à vous ;
- **les factures d'entretien**, qui documentent l'état et l'historique ;
- **une expertise** pour les pièces les plus chères ou anciennes, si votre assureur la demande.

Conservez une copie de tout ça **ailleurs que chez vous** (en ligne, chez un proche) : un dossier rangé dans le tiroir qui a été cambriolé ne sert à rien.

## 3. Mettez la valeur à jour

Le prix des montres d'occasion évolue. Une montre achetée il y a dix ans peut valoir beaucoup plus, ou moins, aujourd'hui. Si votre contrat indemnise selon une valeur déclarée, pensez à la réviser régulièrement, par exemple une fois par an, et après chaque achat.

## 4. Les bons réflexes au quotidien

- **Ne publiez pas vos montres avec votre adresse ou des détails identifiables** sur les réseaux sociaux.
- **Évitez de porter une montre très chère** dans les situations où vous ne le feriez pas avec une liasse de billets à la main.
- **En voyage**, vérifiez que votre contrat couvre la montre hors du domicile et hors de France.
- **En cas de vol**, portez plainte rapidement et prévenez votre assureur dans le délai prévu au contrat. Signalez aussi le numéro de série aux bases de montres volées.

## Préparez votre inventaire avec Arcora

Dans Arcora, chaque montre réunit déjà ses photos, sa référence, sa valeur estimée et son carnet d'entretien. Avec l'option Premium, l'**export assurance** produit en un clic un inventaire PDF avec une photo, la référence et la valeur déclarée de chaque montre : le document à remettre à votre assureur, ou à garder en lieu sûr.

## En résumé

1. Vérifiez les plafonds, les conditions et la couverture hors domicile de votre contrat.
2. Réunissez facture, garantie, photos et factures d'entretien pour chaque montre.
3. Gardez une copie du dossier hors de chez vous.
4. Mettez les valeurs à jour au moins une fois par an.
$md$, 'local:zenith-squelette-ceramique-blanche-poignet.webp', 'Montre Zenith squelette à boîtier en céramique blanche, portée au poignet', null, 'published', '2026-11-05')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('fr', 'boite-et-papiers-montre', 'watch-box-papers', 'Boîte et papiers : pourquoi ils comptent pour votre montre', 'Full set, garantie, facture, étiquettes : ce que regroupent les « boîte et papiers » d''une montre, pourquoi ils pèsent à la revente et comment bien les conserver.', 'Valeur', 'Arcora',
$md$Sur les annonces de montres d'occasion, une mention revient partout : « boîte et papiers », ou *full set* en anglais. Pour un acheteur, c'est souvent un critère décisif. Voici ce que ces mots recouvrent vraiment, pourquoi ils comptent et comment éviter de perdre de la valeur sans le savoir.

## Ce que l'on appelle « boîte et papiers »

Le terme regroupe tout ce qui accompagnait la montre à l'achat. Selon les marques et les époques, on y trouve :

- **la boîte d'origine**, souvent avec une boîte extérieure en carton ;
- **la carte ou le certificat de garantie**, qui indique en général le numéro de série et la date de vente ;
- **la facture d'achat** du revendeur ;
- **les livrets et notices** d'utilisation ;
- **les étiquettes** (hang tags) et parfois les protections plastiques ;
- **les maillons supplémentaires** du bracelet, qu'on oublie souvent.

On parle de *full set* quand tout est là, et de « montre seule » quand il n'y a rien.

## Pourquoi c'est important

**La preuve d'authenticité et d'origine.** Une garantie qui correspond au numéro de série de la montre rassure l'acheteur : elle relie la montre à une vente officielle. Ce n'est pas une garantie absolue (les papiers aussi se falsifient), mais c'est un élément de confiance de plus.

**L'historique.** La date et le lieu d'achat racontent l'histoire de la montre. Avec un carnet d'entretien à jour, on obtient une montre « documentée », ce que les collectionneurs apprécient.

**La garantie constructeur.** Sur une montre récente, la carte de garantie permet souvent de bénéficier de la garantie restante après un achat d'occasion. Vérifiez les conditions de la marque.

**La valeur à la revente.** C'est le point le plus concret. Sur les modèles recherchés des grandes marques, l'écart de prix entre une montre complète et une montre seule peut être important. Il est généralement plus faible sur les montres anciennes, pour lesquelles les papiers ont souvent disparu, et sur les montres plus abordables.

## Comment bien les conserver

- **Rangez tout au même endroit**, à l'abri de l'humidité et de la lumière. Les cartons et le cuir des boîtes vieillissent mal à la cave ou au grenier.
- **Gardez les maillons et petites pièces** dans un sachet étiqueté avec le nom de la montre.
- **Scannez ou photographiez les papiers** dès l'achat. En cas de perte, vous aurez au moins une trace pour l'assurance.
- **Ne rangez pas les papiers avec la montre** en voyage : si on vous vole l'une, vous gardez les autres.

## Attention au numéro de série

Le numéro de série figure sur la garantie et sur la montre. **Ne le publiez jamais en entier** sur une annonce ou un réseau social : il peut servir à fabriquer de faux papiers pour une autre montre. Floutez-le sur vos photos, et ne le communiquez qu'à un acheteur sérieux, au moment de la vente.

## Et si vous les avez perdus ?

Pas de panique : une montre sans papiers reste une montre. Certaines marques délivrent, après examen, un certificat ou un extrait d'archives, en général payant. Une facture de révision récente d'un service agréé apporte aussi une forme de preuve. Et pour une montre ancienne, l'absence de papiers est courante et pèse moins.

## Notez-le dans votre collection

Dans Arcora, la fiche de chaque montre a un champ **Boîte et papiers** : notez ce que vous possédez dès aujourd'hui. Sur le Marché, les acheteurs peuvent filtrer les annonces selon ce critère, et votre fiche montre déjà tout le jour où vous vendez.

## En résumé

- « Boîte et papiers » = boîte, garantie, facture, livrets, étiquettes et maillons.
- Ils rassurent sur l'origine, documentent l'histoire et soutiennent le prix de revente.
- Rangez-les au sec, photographiez-les et ne publiez jamais le numéro de série.
$md$, 'local:ecrin-boite-a-montres-fermee.webp', 'Écrin à montres en bois fermé, posé sur un fond sombre', null, 'published', '2026-11-05')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('fr', 'construire-collection-montres', 'watch-collection-building', 'Bâtir une collection de montres cohérente : la méthode des rôles', 'Montre de tous les jours, habillée, sport, montre à tout faire : comment bâtir une collection cohérente, éviter les doublons et acheter selon vos vrais usages.', 'Guides', 'Arcora',
$md$Une collection commence rarement par un plan. On achète une première montre, puis une deuxième parce qu'elle était belle, puis une troisième parce qu'elle était en promotion. Quelques années plus tard, on se retrouve avec cinq plongeuses noires sur bracelet acier et aucune montre à mettre avec un costume. La méthode des rôles sert à éviter ce piège : avant de se demander « quelle montre ? », on se demande « pour quoi faire ? ».

## Penser en rôles plutôt qu'en modèles

L'idée est simple : chaque montre de votre collection doit avoir une fonction dans votre vie. Les rôles les plus courants :

- **La montre du quotidien.** Celle que vous mettez sans réfléchir, au bureau comme le week-end. Polyvalente, lisible, assez robuste, de taille raisonnable.
- **La montre habillée.** Fine, discrète, souvent sur bracelet cuir, qui glisse sous une manche de chemise. Pour les mariages, les entretiens, les dîners.
- **La montre sport ou outil.** Plongeuse, chronographe, GMT, montre de pilote : une montre pensée pour une fonction précise et pour encaisser un peu plus.
- **La montre à tout faire** (*beater*). Celle que l'on porte au jardin, en randonnée, au bricolage, sans aucune inquiétude. Souvent un quartz ou un modèle abordable.

À ces quatre rôles s'ajoutent parfois des rôles plus personnels : la montre de voyage avec un second fuseau, la montre de famille, la pièce coup de cœur que l'on ne porte que le dimanche.

![Trois montres posées sur un bureau : un chronographe Longines sur cuir noir, une montre habillée à cadran argenté sur suède beige et une Tudor Black Bay sur bracelet acier](../images/longines-grand-seiko-tudor-black-bay-bureau.webp "Trois montres, trois rôles bien distincts : chronographe, montre habillée et montre outil.")

## La collection à trois montres

C'est la formule la plus souvent recommandée pour démarrer, et pour beaucoup de collectionneurs, elle suffit pour la vie :

1. **Une montre de tous les jours** sur bracelet acier, cadran sobre, étanche à au moins 100 m.
2. **Une montre habillée** sur cuir, plus fine, sans fonctions superflues.
3. **Une montre de caractère** : un chronographe, une plongeuse ou une GMT, selon vos goûts et vos activités.

Trois montres bien choisies couvrent la quasi-totalité des situations. Et elles laissent chacune assez de temps au poignet pour que vous les portiez vraiment, ce qui n'est plus le cas au-delà d'une certaine taille de collection.

Une variante populaire consiste à remplacer la montre habillée par une montre à tout faire, pour ceux qui ne portent jamais de costume. La règle reste la même : chaque montre doit couvrir une situation que les autres couvrent mal.

## Éviter les doublons

Le doublon, c'est la montre que vous achetez parce qu'elle vous plaît, mais qui fait exactement le même travail qu'une autre déjà dans votre boîte. Quelques questions à vous poser avant d'acheter :

- **Dans quelle situation vais-je la porter** plutôt qu'une montre que j'ai déjà ?
- **Est-ce un style différent** ou seulement une couleur de cadran différente ?
- **Est-ce le même gabarit**, le même bracelet, la même fonction ?
- **Laquelle vendrais-je** si je ne pouvais en garder qu'une des deux ?

Si vous n'avez pas de réponse claire à la première question, c'est probablement un doublon. Ce n'est pas interdit : certains collectionneurs assument une collection entièrement composée de plongeuses, et c'est une collection cohérente elle aussi. Ce qui compte, c'est que ce soit un choix plutôt qu'un accident.

![Coffret à montres ouvert contenant notamment une Seiko 5 GMT, deux Tissot PRX, plusieurs Casio et G-Shock, une Fossil et une Apple Watch](../images/boite-a-montres-seiko-tissot-prx-casio-g-shock.webp "Une boîte bien remplie : à vous de voir quelles montres jouent vraiment un rôle différent.")

## Les paliers de budget

Une collection cohérente peut se construire à tous les niveaux de prix. Ce qui change, c'est la façon de répartir le budget.

- **Pour démarrer, quelques centaines d'euros par montre.** Les marques japonaises et suisses d'entrée de gamme, ainsi que les microbrands, offrent des montres automatiques et quartz très honnêtes. C'est l'idéal pour découvrir ce que vous aimez vraiment : taille, style, bracelet.
- **Le palier intermédiaire, de l'ordre de un à quelques milliers d'euros.** Finitions plus soignées, mouvements de manufacture ou certifiés, meilleure tenue de la valeur sur certains modèles.
- **Le haut de gamme.** Ici, chaque achat est un engagement. Mieux vaut avoir déjà compris, avec des montres plus abordables, ce que vous portez réellement.

Une approche efficace : investir davantage dans la montre que vous porterez le plus souvent, et rester raisonnable sur celles qui sortent rarement. Une montre habillée portée quatre fois par an n'a pas besoin du même budget que votre montre quotidienne.

Pensez aussi aux coûts cachés : la révision d'une montre mécanique, l'assurance au-delà d'une certaine valeur, les bracelets de rechange.

## Regardez ce que vous portez vraiment

C'est le conseil le plus utile et le moins suivi. On croit savoir quelles montres on porte, mais la mémoire trompe. La montre achetée récemment semble omniprésente, celle qui dort au fond de la boîte depuis huit mois est oubliée.

Pendant quelques mois, notez chaque jour la montre que vous portez. Les résultats surprennent souvent :

- une montre portée la grande majorité du temps, qui mérite peut-être une version plus aboutie ;
- deux ou trois montres qui ne sortent presque jamais, et dont la vente financerait un achat plus réfléchi ;
- un rôle que vous pensiez important mais qui ne correspond pas à votre vie réelle.

Ces données valent plus que n'importe quelle liste de « montres incontournables ». Elles vous disent quoi acheter, et surtout quoi vendre.

## Vendre pour mieux collectionner

Une collection cohérente n'est pas figée. Vendre une montre que vous ne portez pas n'est pas un échec : c'est la façon la plus saine de faire évoluer votre collection sans la laisser grossir indéfiniment. Beaucoup de collectionneurs appliquent la règle « une qui rentre, une qui sort » une fois atteint le nombre de montres qui leur convient.

## Vos montres dans Arcora

Dans Arcora, le Wrist Check vous permet de noter chaque jour la montre que vous portez, avec des séries qui récompensent la régularité. Au bout de quelques semaines, vous voyez clairement quelles montres vivent au poignet et lesquelles dorment. Et si l'une d'elles n'a plus sa place, vous pouvez la proposer sur le Marché, entre membres et sans commission.

## En résumé

- Pensez en rôles : quotidien, habillée, sport ou outil, montre à tout faire.
- Trois montres bien choisies couvrent presque toutes les situations.
- Avant d'acheter, demandez-vous dans quelle situation la nouvelle montre remplacera les autres.
- Mettez le budget dans la montre que vous portez le plus.
- Notez ce que vous portez vraiment, puis vendez ce qui ne sort jamais.
$md$, 'local:collection-montres-seiko-tissot-citizen-alignees.webp', 'Huit montres Tissot, Seiko et Citizen alignées sur un fond en cuir marron, sur bracelets acier, cuir et toile', null, 'published', '2026-11-10')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('fr', 'photographier-montre-smartphone', 'watch-wrist-photo', 'Comment photographier sa montre au poignet avec un smartphone', 'Lumière, angle, objectif, réglages : la méthode pour réussir une belle photo de montre au poignet avec votre téléphone, sans matériel ni retouche lourde.', 'Photo', 'Arcora',
$md$Une belle photo au poignet (le fameux *wrist shot*) ne demande ni appareil coûteux ni studio. Votre téléphone suffit largement, à condition de soigner quatre choses : la lumière, l'angle, la propreté de la montre et quelques réglages simples.

## 1. La lumière : douce et indirecte

C'est le réglage le plus important. Un verre de montre réfléchit tout, et un cadran poli peut devenir une tache blanche en plein soleil.

- **Placez-vous près d'une fenêtre**, sans que le soleil tape directement sur la montre. Une journée nuageuse est idéale : la lumière est douce et uniforme.
- **Évitez le flash** et les éclairages de plafond, qui créent des reflets durs et des couleurs fausses.
- **En extérieur, cherchez l'ombre** ou profitez de la fin de journée, quand la lumière est plus chaude et plus basse.
- **Inclinez légèrement le poignet** jusqu'à ce que le reflet quitte le verre. Quelques degrés suffisent.

## 2. L'angle et l'objectif : éviter la déformation

Les téléphones utilisent par défaut un objectif grand-angle, qui grossit ce qui est proche et rétrécit le reste. Résultat : la montre paraît plus grosse qu'en vrai, et le bracelet se tord.

- **Utilisez le zoom 2× ou 3×** si votre téléphone en a un, en reculant un peu.
- **Sinon, reculez et recadrez** ensuite plutôt que de coller le téléphone à la montre.
- **Tenez le téléphone parallèle au cadran**, ou légèrement au-dessus. Une vue trop de côté écrase les proportions.

C'est aussi une question d'honnêteté : sur la galerie Arcora, d'autres collectionneurs regardent votre photo pour juger de la taille d'une montre sur leur poignet. Une photo sans déformation leur rend vraiment service.

## 3. Une montre propre

Le moindre détail se voit sur une photo nette.

- **Essuyez le verre** avec un chiffon microfibre : traces de doigts et poussières ressortent énormément.
- **Nettoyez le bracelet métal** si besoin, notamment entre les maillons.
- **Réglez l'heure** sur une position qui dégage le logo et les compteurs. Le classique 10 h 10 fonctionne pour cette raison.

## 4. La pose et l'arrière-plan

- **Gardez le poignet détendu**, la main légèrement relâchée. Un poignet crispé fait ressortir les tendons et tourne la montre.
- **Choisissez un fond simple** : une manche, un jean, une table en bois. L'œil doit aller à la montre.
- **Laissez un peu d'espace** autour du poignet pour pouvoir recadrer.

![Montre habillée rectangulaire au cadran argenté sur bracelet cuir noir, portée au poignet](../images/montre-habillee-rectangulaire-poignet-bracelet-cuir.webp "Un fond neutre et une lumière douce suffisent à mettre en valeur le cadran et le bracelet.")

## 5. Les réglages du téléphone

- **Touchez le cadran à l'écran** pour faire la mise au point dessus.
- **Baissez un peu l'exposition** (glissez le doigt vers le bas sur la plupart des téléphones) : il vaut mieux une image légèrement sombre qu'un cadran brûlé.
- **Désactivez le mode portrait** pour les gros plans : le flou artificiel découpe souvent mal les cornes et le bracelet.
- **Prenez plusieurs photos** en variant légèrement l'angle, et gardez la meilleure.

## 6. La retouche : légère

Un léger ajustement de la luminosité, du contraste et du recadrage suffit. Évitez les filtres qui changent les couleurs : un cadran bleu doit rester du même bleu, surtout si la photo aide quelqu'un à choisir.

## Partagez-la sur la galerie

Une fois la photo réussie, ajoutez-la à votre montre dans Arcora et publiez-la sur la galerie au poignet avec votre tour de poignet. Les autres membres peuvent filtrer par taille de poignet et indiquer si la montre leur paraît petite, parfaite ou grande sur vous : c'est le meilleur moyen d'aider quelqu'un qui hésite.

## En résumé

1. Lumière du jour indirecte, sans flash.
2. Zoom 2× ou recul, téléphone parallèle au cadran.
3. Verre et bracelet propres, heure bien choisie.
4. Mise au point sur le cadran, exposition un peu baissée.
5. Retouche légère, couleurs fidèles.
$md$, 'local:rolex-yacht-master-poignet-lumiere-naturelle.webp', 'Rolex Yacht-Master au cadran gris portée au poignet, photographiée en lumière naturelle', 'Lumière du jour indirecte, cadran net, manche en arrière-plan : la recette d''un bon wrist shot.', 'published', '2026-11-05')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('fr', 'precision-montre-mecanique', 'mechanical-watch-accuracy', 'Précision d''une montre mécanique : comprendre et mesurer', 'Secondes par jour, chronomètre COSC, position, température, magnétisme : ce qui influence la précision d''une montre mécanique et comment la mesurer vous-même.', 'Entretien', 'Arcora',
$md$Votre montre automatique a pris quelques secondes d'avance cette semaine. Est-ce normal ? Faut-il s'inquiéter ? Une montre mécanique ne sera jamais aussi précise qu'un quartz, et c'est tout à fait attendu. Mais entre une dérive normale et le signe qu'une révision approche, il y a une différence qu'il est utile de savoir lire.

## Ce que veut dire « secondes par jour »

La précision d'une montre mécanique s'exprime en **secondes par jour** (s/j). Une montre à +5 s/j prend cinq secondes d'avance en vingt-quatre heures ; une montre à −3 s/j en perd trois.

On parle aussi de **marche** : c'est ce même écart quotidien. Ce chiffre n'est jamais parfaitement stable. Il varie selon la façon dont vous portez la montre, sa position la nuit, la température et l'état de charge du ressort. C'est pour cela que les normes parlent de **marche moyenne** mesurée sur plusieurs jours et dans plusieurs conditions.

Pour se donner un ordre de grandeur : une montre qui dérive de 10 s/j accumule environ une minute de décalage par semaine. Pour beaucoup de propriétaires, c'est parfaitement acceptable, à condition de remettre l'heure de temps en temps.

## Les tolérances courantes

Il n'existe pas de précision « normale » unique : tout dépend du calibre et de son niveau de réglage.

- **Les mouvements d'entrée de gamme** sont souvent annoncés par leur fabricant avec des tolérances assez larges. Seiko, par exemple, indique pour ses calibres automatiques 4R une plage de −35 à +45 s/j. En pratique, beaucoup d'exemplaires font bien mieux, mais la marque ne garantit que cette plage.
- **Les mouvements de gamme intermédiaire** sont réglés plus finement, et leurs tolérances annoncées sont plus serrées.
- **Les chronomètres certifiés** répondent à une norme précise, décrite ci-dessous.

Le bon réflexe : chercher la spécification officielle du calibre de votre montre. C'est elle qui dit si votre montre est « dans les clous ».

## Chronomètre, COSC et certifications de marque

Le mot **chronomètre** n'est pas un simple argument commercial. En Suisse, il désigne une montre dont le mouvement a passé les tests du **COSC** (Contrôle officiel suisse des chronomètres). Le mouvement y est testé pendant plusieurs jours, dans différentes positions et à trois températures. Pour un mouvement mécanique de taille courante, la marche moyenne journalière exigée est comprise entre **−4 et +6 s/j**, avec d'autres critères sur la régularité.

![Fond transparent d'une montre Tissot portant la mention Chronomètre, laissant voir le mouvement automatique](../images/tissot-fond-transparent-mouvement-automatique.webp "La mention chronomètre indique un mouvement testé selon une norme officielle de précision.")

Certaines marques vont plus loin avec leurs propres certifications, souvent après emboîtage, c'est-à-dire la montre entière et non le mouvement seul. Rolex annonce par exemple −2/+2 s/j pour ses montres « Superlative Chronometer ». Omega fait certifier une partie de ses montres « Master Chronometer » par l'institut fédéral suisse de métrologie (METAS), avec des tests qui incluent la résistance au magnétisme.

Attention : ces tolérances s'appliquent dans des conditions de test. Au poignet, la marche d'une même montre peut varier un peu, sans que cela signale un défaut.

## Ce qui influence la précision

**La position.** L'organe régulateur, le balancier-spiral, ne se comporte pas exactement de la même façon selon que la montre est à plat, couronne en bas ou couronne en haut. C'est pour cela que la marche n'est pas la même portée ou posée. Astuce connue des collectionneurs : si votre montre avance un peu, essayez de la poser la nuit dans une position où elle retarde, cadran en haut ou couronne en bas par exemple. Testez sur quelques nuits pour trouver la bonne.

**La température.** Le froid et la chaleur modifient légèrement les propriétés du spiral et des huiles. Les alliages modernes limitent fortement cet effet, mais une montre laissée dans une voiture en plein été ou sur un rebord de fenêtre en hiver peut dériver différemment.

**La réserve de marche.** Un ressort bien armé donne une force plus régulière qu'un ressort presque vide. Une montre automatique peu portée, ou une montre à remontage manuel en fin de réserve, peut voir sa marche changer. Une montre portée régulièrement, ou remontée chaque matin, se comporte de façon plus stable.

**Le magnétisme.** C'est la cause la plus fréquente d'une dérive soudaine et importante. Haut-parleurs, fermoirs de sacs aimantés, coques de téléphone, ordinateurs portables, tablettes : les aimants sont partout. Un spiral aimanté colle sur lui-même et la montre se met souvent à avancer fortement, parfois de plusieurs minutes par jour. Bonne nouvelle : un horloger la démagnétise en quelques secondes, souvent pour une somme modique.

**Les chocs.** Une chute ou un choc violent peut dérégler la montre, voire endommager un pivot. Si la marche change brutalement après un choc, faites-la vérifier.

![Gros plan sur le cadran noir d'une Omega Seamaster Professional, avec les aiguilles floues en mouvement](../images/omega-seamaster-professional-cadran-detail.webp "Une dérive brutale, sans choc apparent, a souvent une cause simple : le magnétisme.")

## Comment mesurer la précision de votre montre

**La méthode simple : comparer à une heure de référence.** Pas besoin d'équipement.

1. Ouvrez une source d'heure fiable, synchronisée sur une horloge atomique : un site spécialisé ou l'heure de votre smartphone, qui se règle automatiquement sur le réseau.
2. Mettez votre montre à l'heure exacte, en arrêtant la trotteuse si votre calibre le permet.
3. Chaque jour, à peu près à la même heure, notez l'écart en secondes.
4. Continuez au moins cinq à sept jours, en portant la montre normalement.
5. Divisez l'écart total par le nombre de jours : vous obtenez votre marche moyenne.

Une mesure sur une seule journée ne veut pas dire grand-chose. C'est la moyenne sur une semaine qui reflète votre usage réel.

**La méthode instantanée : le chronocomparateur.** Les horlogers utilisent un appareil, appelé *timegrapher*, qui écoute le tic-tac de la montre et affiche en quelques secondes la marche, l'amplitude du balancier et le défaut de repère (l'écart entre les deux battements). Il existe des applications pour smartphone qui font une mesure du même type avec le micro du téléphone. Elles sont moins précises qu'un appareil d'atelier, sensibles au bruit ambiant, mais elles donnent une bonne indication et permettent de comparer les positions.

## Quand faut-il s'inquiéter ?

Une montre qui reste stable dans sa tolérance, même si celle-ci est large, va bien. Ce qui doit vous alerter, c'est le **changement** :

- la marche se dégrade nettement par rapport à vos mesures précédentes ;
- la montre se met soudain à avancer beaucoup (pensez d'abord au magnétisme) ;
- la réserve de marche diminue en même temps ;
- la marche devient très irrégulière d'un jour à l'autre.

Dans ces cas, une démagnétisation ou un réglage peut suffire. Mais si la montre n'a pas été révisée depuis longtemps, c'est souvent le signe que les huiles vieillissent et qu'une révision complète approche. C'est là que l'historique de vos mesures devient précieux : il permet de voir si la dérive est récente ou progressive.

## Suivre vos mesures dans Arcora

Dans Arcora, vous pouvez noter vos mesures de précision sur la fiche de chaque montre et suivre leur évolution dans le temps, à côté de son historique d'entretien. Une fonction de mesure façon chronocomparateur est en cours d'ajout pour aller plus loin. Le jour où votre montre dérive, vous saurez immédiatement si c'est nouveau.

## En résumé

- La précision se mesure en secondes par jour, en moyenne sur plusieurs jours.
- Un chronomètre COSC doit tenir une marche moyenne de −4 à +6 s/j en test.
- Position, température, réserve de marche et magnétisme influencent la marche.
- Mesurez sur une semaine en comparant à une heure de référence.
- Ce qui compte, c'est l'évolution : une dérive nouvelle mérite une visite chez l'horloger.
$md$, 'local:rolex-air-king-cadran-noir-livre-ancien.webp', 'Rolex Air-King à cadran noir et lunette guillochée sur bracelet Oyster, posée sur un livre ancien relié en rouge', null, 'published', '2026-11-10')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('fr', 'reperer-fausse-montre-occasion', 'fake-watch-check', 'Fausse montre : comment la repérer avant d''acheter d''occasion', 'Prix, photos, papiers, numéro de série, calibre : les signaux d''alerte et les vérifications à faire avant d''acheter une montre d''occasion entre particuliers.', 'Guides', 'Arcora',
$md$Acheter une montre d'occasion entre particuliers, c'est souvent la meilleure façon de trouver la pièce que l'on cherche à un prix raisonnable. C'est aussi là que circulent les contrefaçons, parfois très réussies. Bonne nouvelle : la plupart des arnaques se repèrent avant même de voir la montre, à condition de prendre le temps de vérifier. Voici une méthode en quatre étapes, de l'annonce jusqu'à la remise en main propre.

## Les signaux d'alerte dans l'annonce

Avant de regarder le cadran, regardez le contexte. Les mêmes indices reviennent très souvent :

- **Un prix nettement sous le marché.** Une montre recherchée ne se vend pas 40 % moins cher que partout ailleurs sans raison. Comparez avec plusieurs annonces du même modèle, au même état et avec le même niveau de papiers.
- **Des photos qui ne sont pas celles du vendeur.** Images trop parfaites, fond blanc de catalogue, ou photos que l'on retrouve ailleurs avec une recherche d'image inversée.
- **Une histoire floue.** « Cadeau jamais porté », « héritage, je n'y connais rien » : ce n'est pas un problème en soi, mais cela ne doit pas remplacer des réponses précises.
- **L'urgence.** « Plusieurs acheteurs sur le coup », « je pars demain » : la pression sert à vous empêcher de vérifier.
- **Un refus de se rencontrer** ou une insistance pour un paiement à distance, par virement instantané ou par un moyen difficile à contester.

Un seul de ces signaux ne prouve rien. Deux ou trois ensemble doivent vous faire ralentir sérieusement.

## Demandez les bonnes photos

Un vendeur honnête n'a aucune difficulté à prendre quelques photos supplémentaires. Demandez :

1. **La montre à côté d'un papier** portant votre prénom et la date du jour. C'est la preuve simple qu'il l'a vraiment entre les mains.
2. **Le cadran de près, bien net**, sans reflet. Les impressions doivent être fines, régulières et parfaitement alignées. Regardez les index, les aiguilles, la loupe de date si le modèle en a une.
3. **Le fond de boîte et les flancs**, pour les gravures et l'état général.
4. **Le fermoir et les maillons**, souvent moins soignés sur les copies.
5. **Une courte vidéo** de la trotteuse et de la mise à l'heure.

![Montre Rolex Datejust à cadran chocolat et lunette cannelée sur bracelet Jubilé, posée sur une table en bois](../images/rolex-datejust-cadran-chocolat-bracelet-jubile.webp "Une photo rapprochée et nette du cadran permet déjà de juger la qualité des impressions et de la loupe.")

Comparez ensuite avec des photos officielles de la marque **pour la même référence**, ou avec des exemplaires vendus par des professionnels reconnus. Les différences portent souvent sur des détails : une typographie légèrement trop grasse, une couleur de cadran qui n'a jamais existé pour cette référence, une date mal centrée dans sa fenêtre, une lunette qui ne correspond pas au modèle.

Gardez en tête une limite importante : les meilleures copies actuelles sont difficiles à distinguer sur photo, même pour un œil exercé. Les photos servent surtout à éliminer les mauvaises annonces, pas à valider définitivement une montre.

## Vérifiez la cohérence : référence, série, papiers

Une montre authentique raconte une histoire cohérente. Une contrefaçon se trahit souvent par une incohérence entre ses éléments.

- **La référence** (le numéro du modèle) doit correspondre exactement à ce que vous voyez : taille, matériau, cadran, lunette, bracelet. Une référence qui n'a jamais existé avec ce cadran est un signal fort.
- **Le numéro de série** doit être cohérent avec l'époque annoncée et identique sur la montre et sur la garantie. Ne demandez pas au vendeur de le publier, mais demandez-le en privé, et ne publiez jamais le vôtre : il peut servir à fabriquer de faux papiers.
- **Les papiers** ne sont pas une preuve absolue. Ils se falsifient aussi, et de vrais papiers peuvent accompagner une fausse montre. Vérifiez que le nom du revendeur, la date et la référence sont plausibles. Une facture d'un revendeur agréé ou d'un service après-vente de la marque est un plus.
- **Le fond de boîte.** Si le modèle a normalement un fond plein et que l'annonce montre un fond transparent, ou l'inverse, posez la question.

## Le calibre, le juge de paix

C'est à l'intérieur que la différence est la plus difficile à cacher. Chaque modèle est équipé d'un calibre précis, documenté par la marque. Une contrefaçon utilise presque toujours un mouvement différent, même quand l'extérieur est très proche.

![Fond transparent d'une montre Tissot laissant voir un mouvement automatique avec sa masse oscillante gravée](../images/tissot-fond-transparent-mouvement-automatique.webp "Sur un fond transparent, comparez le mouvement visible avec le calibre annoncé pour la référence.")

Quelques repères :

- **Renseignez-vous sur le calibre** de la référence avant de voir la montre : sa forme générale, la masse oscillante, les gravures, les fonctions.
- **Le mouvement de la trotteuse ne suffit pas.** Une trotteuse qui avance par sauts d'une seconde indique un quartz, ce qui est éliminatoire sur une montre censée être mécanique. Mais beaucoup de copies sont automatiques : une trotteuse fluide ne prouve donc rien.
- **Les fonctions doivent toutes marcher comme prévu** : date rapide, aiguille GMT indépendante, chronographe qui démarre, s'arrête et revient à zéro proprement.

Sur une montre à fond plein, seul un horloger peut ouvrir le boîtier et vérifier le calibre. C'est la vérification la plus fiable qui existe pour un particulier.

## Rencontrez-vous chez un horloger

Pour un achat d'un certain montant, proposez de finaliser la vente **chez un horloger indépendant ou un revendeur** qui accepte d'examiner la montre. Comptez une petite somme pour son temps, souvent bien investie. Il pourra ouvrir le fond, identifier le calibre, contrôler l'état général et parfois mesurer la marche.

Un vendeur honnête accepte en général sans difficulté, éventuellement en partageant les frais. Un refus catégorique est en soi une réponse.

Certaines marques proposent aussi un contrôle en service après-vente, avec un délai et un coût variables. C'est plus long, mais c'est l'avis le plus solide.

## Les questions à poser au vendeur

Avant le rendez-vous, posez-les par écrit, et gardez la conversation :

- Depuis quand avez-vous la montre, et où a-t-elle été achetée ?
- A-t-elle été révisée ? Par qui, et avez-vous la facture ?
- Quel est son calibre ?
- Quelles pièces ont été remplacées (cadran, aiguilles, verre, bracelet) ?
- Qu'y a-t-il exactement avec la montre : boîte, garantie, facture, maillons ?
- Acceptez-vous un contrôle chez un horloger avant paiement ?

Les réponses comptent, mais leur précision compte encore plus. Une personne qui connaît sa montre répond vite et sans détour.

## Payer et conclure sans risque

- **Ne payez jamais avant d'avoir vu la montre**, surtout par un moyen irréversible.
- **Préférez une remise en main propre** dans un lieu public ou chez l'horloger.
- **Rédigez un reçu simple** : date, référence, numéro de série, prix, noms et signatures des deux parties.
- **Méfiez-vous des chèques de banque** remis à la dernière minute un soir de week-end : vérifiez-les auprès de la banque émettrice avant de remettre quoi que ce soit.

## Acheter sur Arcora

Sur le Marché d'Arcora, les ventes se font entre membres, sans commission, et vous échangez avec le vendeur par la messagerie de l'app : vous gardez une trace écrite de toutes vos questions et réponses. Chaque annonce est liée à une fiche montre où le vendeur peut renseigner la référence, le calibre et ce qu'il possède en boîte et papiers. Cela facilite les comparaisons, mais ne remplace pas l'œil d'un horloger : pour une pièce importante, gardez le réflexe du rendez-vous en atelier.

## En résumé

- Un prix trop bas, des photos empruntées et de l'urgence doivent vous faire ralentir.
- Demandez des photos datées, nettes, du cadran, du fond et du fermoir.
- Vérifiez la cohérence entre référence, numéro de série, papiers et calibre.
- Les papiers ne prouvent pas tout : seul un horloger peut confirmer le mouvement.
- Pas de paiement à distance avant d'avoir vu la montre.
$md$, 'local:etal-montres-bon-marche-marche.webp', 'Étal de marché couvert de montres bon marché à cadrans dorés, argentés et noirs', null, 'published', '2026-11-10')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('fr', 'reviser-montre-automatique', 'watch-service-interval', 'Tous les combien faut-il réviser une montre automatique ?', 'Révision complète, contrôle d''étanchéité, pile : à quelle fréquence entretenir une montre mécanique ou à quartz, et les signes qui doivent vous alerter.', 'Entretien', 'Arcora',
$md$Une montre mécanique est une petite machine : des dizaines de pièces qui tournent sans arrêt, lubrifiées par quelques gouttes d'huile. Avec le temps, ces huiles sèchent et les pièces s'usent. La révision sert à remettre tout cela à neuf avant que l'usure ne cause de vrais dégâts.

## La réponse courte : entre 5 et 10 ans

Il n'existe pas de fréquence unique. Chaque fabricant donne sa recommandation, et elle varie **d'environ 5 à 10 ans** selon les marques, les mouvements et l'époque de fabrication. Les montres récentes, avec des huiles et des matériaux plus modernes, tiennent en général plus longtemps que les montres anciennes.

Le bon réflexe : vérifier la recommandation de la marque dans le livret de garantie ou sur son site, puis noter la date de chaque révision.

## Que se passe-t-il pendant une révision complète ?

L'horloger démonte entièrement le mouvement, nettoie chaque pièce, remplace celles qui sont usées, relubrifie, remonte et règle la précision. Il change aussi les joints et teste l'étanchéité. Selon les ateliers, le boîtier et le bracelet peuvent être nettoyés ou polis : précisez si vous ne voulez **pas** de polissage, car il arrondit les arêtes et peut faire perdre de la valeur à une montre de collection.

Comptez en général quelques semaines d'immobilisation, parfois plusieurs mois dans les services après-vente des grandes marques.

## Les entretiens entre deux révisions

- **L'étanchéité.** Les joints vieillissent même si la montre ne voit jamais l'eau. Si vous nagez avec, un contrôle d'étanchéité tous les un à deux ans est une précaution simple et peu coûteuse.
- **La pile, pour les montres à quartz.** Elle dure généralement plusieurs années. Changez-la dès que la montre s'arrête : une pile vide laissée dans le boîtier peut couler et abîmer le mouvement.
- **Le bracelet.** Un bracelet métal se nettoie à l'eau tiède et à la brosse douce (si la montre est étanche, couronne vissée). Un cuir se remplace dès qu'il se fendille.

## Les signes qui doivent vous alerter

N'attendez pas l'échéance si vous remarquez l'un de ces symptômes :

1. **La montre avance ou retarde beaucoup plus qu'avant**, de façon régulière.
2. **La réserve de marche diminue** : la montre s'arrête plus vite qu'à l'habitude quand vous la posez.
3. **De la buée sous le verre** : de l'humidité est entrée, il faut agir vite.
4. **Un bruit inhabituel** ou un frottement en bougeant le poignet.
5. **Une couronne dure**, qui accroche ou ne se visse plus correctement.

## Pourquoi garder une trace de chaque entretien

Un historique d'entretien complet rassure un acheteur et pèse dans le prix à la revente : il prouve que la montre a été suivie. Conservez les factures et notez pour chaque intervention la date, l'atelier, ce qui a été fait et le coût.

Dans Arcora, chaque montre a son onglet **Entretien** : vous y notez révisions, contrôles et changements de pile, et l'app vous prévient quand la prochaine révision approche (fonction Premium). Le jour où vous vendez, tout l'historique est prêt à être montré.

## En résumé

- Révision complète tous les **5 à 10 ans** selon la recommandation de la marque.
- Contrôle d'étanchéité tous les **1 à 2 ans** si vous portez votre montre dans l'eau.
- Une montre qui dérive, s'arrête vite ou montre de la buée doit être vue sans attendre.
- Gardez une trace de chaque intervention : c'est de la valeur pour plus tard.
$md$, 'local:ecrin-boite-a-montres-ouverte.webp', 'Écrin à montres en bois ouvert, avec six coussins de velours bordeaux', null, 'published', '2026-11-04')
on conflict (lang, slug) do nothing;

insert into public.magazine_articles (lang, slug, translation_key, title, description, category, author, body_md, cover_path, cover_alt, cover_caption, status, published_at)
values ('fr', 'taille-montre-poignet', 'watch-size-wrist', 'Quelle taille de montre pour mon poignet ? Le guide complet', 'Diamètre, entre-cornes, épaisseur : comment choisir une montre à la bonne taille pour votre tour de poignet, avec un tableau de repères et la méthode pour mesurer.', 'Guides', 'Arcora',
$md$Une montre peut être magnifique en photo et ridicule une fois au poignet. Trop grande, elle déborde et bascule ; trop petite, elle se perd. Bonne nouvelle : la « bonne » taille ne se devine pas, elle se mesure. Voici la méthode, les repères et les pièges à éviter.

## Commencez par mesurer votre poignet

Deux mesures comptent, et la seconde est souvent oubliée.

**Le tour de poignet.** Enroulez un mètre de couturière juste au-dessus de l'os du poignet, là où vous portez la montre. Pas de mètre ? Une bande de papier marquée au stylo, puis posée sur une règle, fait très bien l'affaire.

**La largeur du dessus du poignet.** Posez une règle à plat sur le poignet et mesurez la partie plate, d'un bord à l'autre. C'est sur cette surface que la montre repose, et c'est elle qui décide si une montre « tient » ou déborde.

## Le chiffre qui compte vraiment : l'entre-cornes

Tout le monde regarde le diamètre du boîtier. C'est pourtant la distance **entre-cornes** (ou *lug-to-lug*), de l'extrémité d'une corne à l'autre, qui fait la différence.

La règle est simple : **l'entre-cornes ne doit pas dépasser la largeur du dessus de votre poignet.** Si les cornes débordent, le bracelet part dans le vide et la montre paraît trop grande, quel que soit son diamètre.

C'est pour ça qu'une montre de 40 mm aux cornes courtes peut mieux tomber qu'une montre de 38 mm aux cornes longues. Les fiches techniques sérieuses indiquent l'entre-cornes ; sinon, les forums et les vidéos de revue le mentionnent souvent.

## Les repères par tour de poignet

Ces fourchettes sont des points de départ pour une montre de forme classique (ronde, lunette fine). Elles ne remplacent pas un essai.

| Tour de poignet | Diamètre conseillé | Entre-cornes conseillé |
|---|---|---|
| Moins de 15 cm | 34 à 37 mm | jusqu'à 42 mm |
| 15 à 16,5 cm | 36 à 39 mm | jusqu'à 46 mm |
| 16,5 à 18 cm | 38 à 42 mm | jusqu'à 49 mm |
| 18 à 19,5 cm | 40 à 44 mm | jusqu'à 52 mm |
| Plus de 19,5 cm | 42 mm et plus | au-delà de 52 mm |

## Ce qui change la taille perçue

Deux montres de même diamètre peuvent paraître très différentes. Quelques facteurs jouent beaucoup :

- **La lunette.** Une lunette de plongée ou tachymétrique réduit la surface du cadran : la montre paraît plus petite. À l'inverse, une lunette fine laisse tout l'espace au cadran et la montre paraît plus grande.
- **La couleur du cadran.** Un cadran clair (blanc, argenté, crème) agrandit visuellement ; un cadran noir ou bleu nuit resserre.
- **L'épaisseur.** Au-delà de 13 à 14 mm, une montre accroche les manchettes et paraît massive, même avec un diamètre raisonnable.
- **La forme.** Un boîtier coussin ou carré occupe plus de place qu'un boîtier rond de même diamètre.
- **Le bracelet.** Un bracelet métal ajoute du volume ; un cuir fin ou un nato allège l'ensemble.

![Omega Speedmaster au cadran argenté et à la lunette tachymétrique verte, portée au poignet](../images/omega-speedmaster-lunette-tachymetre-poignet.webp "La lunette tachymétrique encadre le cadran : la montre paraît plus compacte que ses 42 mm.")

## Tendance et goût personnel

Les montres ont grossi dans les années 2000, avant de revenir vers des tailles plus mesurées : beaucoup de nouveautés récentes tournent autour de 36 à 40 mm. Rien n'oblige à suivre la tendance. Certains aiment une montre qui se remarque, d'autres une montre qui se glisse sous la manche. Les repères ci-dessus servent à éviter le déséquilibre, pas à dicter un style.

## Le meilleur test : comparer avec des poignets comme le vôtre

Les photos officielles sont prises sur des poignets inconnus, souvent avec un objectif qui déforme. Le plus fiable reste de voir la montre **sur un poignet de la même taille que le vôtre**.

C'est exactement ce que permet la galerie au poignet d'Arcora : chaque photo indique le tour de poignet de son auteur, et vous pouvez filtrer par marque et par taille de poignet. Avant d'acheter, vous voyez comment la montre tombe vraiment.

## En résumé

1. Mesurez votre tour de poignet **et** la largeur du dessus du poignet.
2. Vérifiez que l'entre-cornes ne dépasse pas cette largeur.
3. Servez-vous du tableau comme point de départ, puis tenez compte de la lunette, du cadran et de l'épaisseur.
4. Regardez des photos sur des poignets de votre taille avant de vous décider.
$md$, 'local:tudor-prince-date-chrono-poignet.webp', 'Chronographe Tudor Prince Date au cadran bordeaux, porté sur un bracelet acier au poignet', 'Un chronographe Tudor de 40 mm porté au poignet.', 'published', '2026-11-05')
on conflict (lang, slug) do nothing;
