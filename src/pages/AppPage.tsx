// client/src/pages/AppPage.tsx
// import React from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import styles from './AppPage.module.css';

// Import du composant DetailedFeatureSection
import DetailedFeatureSection from '../components/DetailedFeatureSection/DetailedFeatureSection';


import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Données pour les sections de fonctionnalités détaillées
const detailedFeaturesData = [
  {
    id: 'gestion',
    // L'icône peut être utilisée si vous souhaitez un petit rappel visuel près du titre,
    // mais pour un look luxe, on pourrait s'en passer ou l'intégrer très subtilement.
    // icon: '⚙️',
    // title: 'Gestion de Collection Intelligente', // <<< LIGNE DUPLIQUÉE À SUPPRIMER OU COMMENTER
    subtitle: 'Précision & Savoir-Faire Numérique',
    title: 'Gestion de Collection Intelligente', // <<< CONSERVER CELLE-CI
    description: 'Cataloguez chaque pièce avec une précision inégalée. Ajoutez vos montres manuellement, bénéficiez du scan OCR pour les références, ou laissez notre IA identifier vos modèles par photo. Suivez l\'historique d\'achat, l\'état, la valeur estimée (via API externes) et recevez des rappels d\'entretien personnalisés. Chaque détail compte, de la provenance aux anecdotes personnelles.',
    imagePlaceholder: '[Image: Interface épurée de gestion de collection sur tablette]',
    imageAlt: 'Interface de gestion de collection de montres de luxe',
  },
  {
    id: 'suivi',
    title: 'Suivi & Entretien d\'Excellence',
    subtitle: 'Sérénité & Longévité Assurées',
    description: 'Ne manquez plus jamais une révision importante. Notre carnet d’entretien digital enregistre chaque intervention et vous envoie des rappels pour les changements de pile, huilages, etc. Bénéficiez de conseils personnalisés adaptés à la nature de vos montres, qu\'elles soient automatiques, vintage ou à quartz, pour préserver leur valeur et leur éclat.',
    imagePlaceholder: '[Image: Notification de rappel d\'entretien sur un smartphone élégant]',
    imageAlt: 'Fonctionnalité de suivi et entretien de montres de luxe',
  },
  {
    id: 'communaute',
    title: 'Communauté & Partage Exclusif',
    subtitle: 'Connexions & Inspiration Raffinées',
    description: 'Connectez-vous avec d\'autres connaisseurs. Créez votre profil de collectionneur (public ou privé), partagez vos plus belles pièces dans une galerie communautaire au design soigné, et échangez via les likes et commentaires. Participez à des défis thématiques et des expositions virtuelles pour célébrer votre passion commune dans un cadre privilégié.',
    imagePlaceholder: '[Image: Galerie communautaire élégante avec photos de montres de haute qualité]',
    imageAlt: 'Fonctionnalité de communauté et partage social pour collectionneurs de luxe',
  },
  {
    id: 'marche',
    title: 'Décisions de Marché Éclairées',
    subtitle: 'Expertise & Opportunités Stratégiques',
    description: 'Naviguez sur notre marketplace intégrée, un espace de confiance pour trouver la perle rare ou proposer vos pièces à d\'autres membres qualifiés. Créez votre wishlist, recevez des alertes ciblées, et consultez l\'estimation de valeur marchande en temps réel ainsi que l\'historique des fluctuations de prix pour des transactions avisées.',
    imagePlaceholder: '[Image: Interface de la marketplace et graphiques de valeur]',
    imageAlt: 'Fonctionnalité de marketplace et suivi de valeur de montres de luxe',
  },
  {
    id: 'ressources',
    title: 'Ressources & Savoir Horloger',
    subtitle: 'Culture & Connaissance Approfondies',
    description: 'Devenez un expert reconnu. Accédez à des mini-fiches pédagogiques sur les marques prestigieuses, les calibres de renom et les mouvements complexes. Explorez notre glossaire illustré, testez vos connaissances avec des quiz élégants, et restez informé des dernières actualités du secteur horloger, filtrées selon vos préférences.',
    imagePlaceholder: '[Image: Page de ressources avec une fiche pédagogique au design épuré]',
    imageAlt: 'Fonctionnalité de ressources et apprentissage sur l\'horlogerie de luxe',
  },
  {
    id: 'securite',
    title: 'Sécurité & Confidentialité Optimales',
    subtitle: 'Protection & Discrétion Garanties',
    description: 'Votre collection est un trésor, sa sécurité est notre priorité. Profitez d\'un mode privé pour masquer certaines pièces, d\'une sauvegarde cloud chiffrée de pointe pour protéger vos données, et de la possibilité d\'exporter l\'intégralité de votre collection en PDF ou CSV pour vos archives personnelles ou vos assurances.',
    imagePlaceholder: '[Image: Icône de bouclier stylisée symbolisant la sécurité des données]',
    imageAlt: 'Fonctionnalité de sécurité et confidentialité des données de collection de luxe',
  },
  {
    id: 'bonus',
    title: 'Expériences Bonus Uniques',
    subtitle: 'Innovation & Touche Personnelle',
    description: 'Explorez des fonctionnalités avant-gardistes comme l\'essayage virtuel de montres en réalité augmentée pour visualiser un modèle à votre poignet avec un réalisme saisissant. Intégrez l\'application avec votre Apple Watch pour des notifications et complications utiles, et affichez votre "montre du jour" grâce à notre widget mobile personnalisable et discret.',
    imagePlaceholder: '[Image: Démonstration de l\'essayage en RA et widget mobile]',
    imageAlt: 'Fonctionnalités bonus comme la réalité augmentée pour montres de luxe',
  }
];

// Témoignages pour le slider (inchangé)
const testimonialsData = [
  { id: 1, quote: "Enfin une application qui comprend vraiment les besoins des collectionneurs ! La gestion détaillée et les rappels d'entretien sont parfaits.", author: "Alexandre C.", title: "Collectionneur Exigeant", avatarPlaceholder: "AC" },
  { id: 2, quote: "La fonctionnalité de reconnaissance par IA est bluffante. J'ai pu cataloguer des pièces anciennes dont je ne trouvais plus la référence.", author: "Sophie L.", title: "Amatrice de Vintage", avatarPlaceholder: "SL" },
  { id: 3, quote: "Le suivi de valeur en temps réel m'a aidé à faire de très bonnes affaires. Indispensable pour qui s'intéresse à l'aspect investissement.", author: "Julien R.", title: "Investisseur Avisé", avatarPlaceholder: "JR" },
  { id: 4, quote: "J'adore la communauté ! Échanger avec d'autres passionnés et participer aux défis, c'est très motivant.", author: "Manon B.", title: "Membre Active", avatarPlaceholder: "MB" }
];


function AppPage() {
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 6000,
    pauseOnHover: true,
    adaptiveHeight: true,
    arrows: true,
  };

  return (
    <div className={styles.landingPage}>
      {/* --- Hero Section --- */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1>L'Écrin Numérique de Votre Passion</h1>
          <p>
            Gérez, valorisez et partagez votre collection d'exception avec une application à la hauteur de vos exigences.
          </p>
          <Link to="/signup" className={styles.ctaButton}>
            Découvrir l'Expérience
          </Link>
          <div className={styles.heroImagePlaceholder}>
            [Image : Composition visuelle élégante de montres et d'éléments de l'interface de l'application]
          </div>
        </div>
      </section>

      {/* --- Section d'introduction aux fonctionnalités --- */}
      <section className={`${styles.section} ${styles.introFeaturesSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Conçue pour les Connaisseurs</h2>
          <p className={styles.sectionSubtitle}>
            [Votre Marque] App transcende la simple gestion. C'est une invitation à vivre pleinement votre passion, avec des outils pensés pour chaque facette de votre collection.
          </p>
        </div>
      </section>

      {/* --- Sections de Fonctionnalités Détaillées --- */}
      {detailedFeaturesData.map((feature, index) => (
        <DetailedFeatureSection
          key={feature.id}
          id={feature.id}
          title={feature.title}
          subtitle={feature.subtitle}
          description={feature.description}
          imagePlaceholder={feature.imagePlaceholder}
          imageAlt={feature.imageAlt}
          imagePosition={index % 2 === 0 ? 'left' : 'right'}
          backgroundColor={(index) % 2 !== 0 ? 'light' : 'default'}
          isFirst={index === 0}
        />
      ))}


      {/* --- Social Proof/Testimonials Section --- */}
      <section className={`${styles.section} ${styles.testimonialSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>L'Avis de Nos Membres</h2>
          <p className={styles.sectionSubtitle}>
            Ils ont intégré [Votre Marque] App à leur quotidien de collectionneurs.
          </p>
          <div className={styles.testimonialSliderContainer}>
            <Slider {...sliderSettings}>
              {testimonialsData.map((testimonial) => (
                <div key={testimonial.id}>
                  <div className={styles.testimonialSlide}>
                    <div className={styles.testimonialAvatar}>
                      <span>{testimonial.avatarPlaceholder}</span>
                    </div>
                    <p className={styles.testimonialQuote}>"{testimonial.quote}"</p>
                    <div className={styles.testimonialAuthorInfo}>
                      <span className={styles.testimonialAuthorName}>{testimonial.author}</span>
                      <span className={styles.testimonialAuthorTitle}>{testimonial.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </section>

      {/* --- Pricing/Offer Section --- */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Rejoignez le Cercle</h2>
          <p className={styles.sectionSubtitle}>
            L'accès à l'expérience [Votre Marque] App est actuellement offert. Profitez d'un ensemble complet de fonctionnalités pour sublimer votre collection.
          </p>
          <Link
            to="/signup"
            className={styles.ctaButton}
            style={{backgroundColor: 'var(--primary-color)', color: 'var(--white)'}}
          >
            Créer Votre Compte Privilégié
          </Link>
        </div>
      </section>

      {/* --- Final CTA Section --- */}
      <section className={`${styles.section} ${styles.finalCta}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle} style={{color: 'var(--white)'}}>Votre Collection Mérite l'Excellence</h2>
          <p className={styles.sectionSubtitle} style={{color: 'rgba(255,255,255,0.85)'}}>
            Offrez à vos trésors l'écrin numérique qu'ils méritent. L'organisation devient un plaisir, la valorisation une évidence.
          </p>
          <Link to="/signup" className={styles.ctaButton}>
            S'inscrire et Découvrir
          </Link>
        </div>
      </section>
    </div>
  );
}

export default AppPage;
