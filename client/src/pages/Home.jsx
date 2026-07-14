import { Link } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';

// Icônes SVG légères
const Icons = {
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Wrench: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Refresh: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
};

const services = [
  {
    title: 'Achat',
    description: 'Smartphones et tablettes Apple neufs ou reconditionnés avec garantie locale.',
    icon: <Icons.Phone />,
    link: '/achat'
  },
  {
    title: 'Réparation',
    description: 'Diagnostic rapide et réparation Apple avec pièces de qualité.',
    icon: <Icons.Wrench />,
    link: '/reparation'
  },
  {
    title: 'Échange',
    description: 'Reprise avantageuse de votre ancien téléphone pour un modèle récent.',
    icon: <Icons.Refresh />,
    link: '/echange'
  }
];

const features = [
  { label: 'Expertise', value: 'Spécialistes Apple à Lomé.', highlight: true },
  { label: 'Rapidité', value: 'Réponse et suivi sous 24h.', highlight: false },
  { label: 'WhatsApp', value: 'Conversation directe et assistée.', highlight: true },
  { label: 'Prix', value: 'Offres honnêtes et sans surprise.', highlight: false }
];

function Home({ phoneNumber = '+22800000000' }) {
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
  const whatsappLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=Bonjour%20ELI%27S%20BUSINESS%20CENTER%20-%20J%27ai%20une%20question`
    : '#';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero Section */}
        <section className="grid gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Texte principal – Carte vitrée */}
          <header className="space-y-6 rounded-[40px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl shadow-slate-200/40 p-10 lg:p-14 transition-all duration-500 hover:shadow-slate-300/50">
            <span className="inline-flex rounded-full bg-brand/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-brand border border-brand/20">
              ELI'S BUSINESS CENTER
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Spécialiste Apple pour achat, réparation et échange
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-700">
              Nous aidons les clients à trouver, réparer ou échanger leur téléphone Apple avec rapidité, transparence et suivi direct via WhatsApp.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#2f1c50] hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
              >
                Contactez-nous sur WhatsApp
              </a>
              <Link
                to="/achat"
                className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/80 backdrop-blur-md px-6 py-3 text-sm font-semibold text-slate-800 transition-all duration-300 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Voir le catalogue
              </Link>
            </div>  

            {/* Mini cartes mission / assistance – vitrées */}
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-3xl bg-white/60 backdrop-blur-lg border border-white/50 p-5 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Notre mission</h2>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Proposer une expérience simple et rapide pour vos besoins Apple, du diagnostic à la reprise.
                </p>
              </article>
              <article className="rounded-3xl bg-white/60 backdrop-blur-lg border border-white/50 p-5 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Assistance</h2>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Une réponse claire sous 24h, directement par WhatsApp.
                </p>
              </article>
            </div>
          </header>

          {/* Pourquoi nous choisir – vitré */}
          <aside className="rounded-[36px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl p-8 transition-all duration-500">
            <div className="space-y-5">
              <div className="rounded-3xl bg-slate-900/5 backdrop-blur-md p-6">
                <h2 className="text-xl font-semibold text-slate-900">Pourquoi nous choisir ?</h2>
                <ul className="mt-4 space-y-3 text-slate-700" role="list">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    Expertise locale Apple pour appareils récents et anciens.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    Devis rapide et réparation de qualité avec pièces fiables.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    Suivi personnalisé et propositions transparentes.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    Accompagnement simple pour achat, réparation et échange.
                  </li>
                </ul>
              </div>

              {/* Grille de caractéristiques */}
              <div className="grid gap-4 sm:grid-cols-2">
                {features.map(({ label, value, highlight }) => (
                  <article
                    key={label}
                    className={`rounded-3xl p-5 backdrop-blur-md border transition-colors duration-300 ${
                      highlight
                        ? 'bg-gold/10 border-gold/30'
                        : 'bg-white/50 border-white/60'
                    }`}
                  >
                    <h3 className={`text-sm font-semibold uppercase ${highlight ? 'text-gold' : 'text-slate-800'}`}>
                      {label}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{value}</p>
                  </article>
                ))}
              </div>
            </div>
          </aside>
        </section>

        {/* Section Services – cartes vitrées */}
        <section className="py-10" aria-labelledby="services-title">
          <h2 id="services-title" className="sr-only">Nos services</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.title}
                className="group rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-white/80 focus-within:ring-2 focus-within:ring-brand"
              >
                <ServiceCard {...service} icon={service.icon} />
                <Link
                  to={service.link}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-800 transition-colors group-hover:text-gold focus:outline-none"
                >
                  En savoir plus
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Call to Action – fond sombre vitré */}
        <footer className="rounded-[36px] bg-slate-900/80 backdrop-blur-xl border border-white/10 text-white p-10 text-center shadow-2xl sm:p-14">
          <h2 className="text-3xl font-semibold">Prêt à échanger ou réparer votre appareil ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-200">
            Notre équipe est disponible sur WhatsApp pour vous conseiller et vous envoyer un devis rapide. Contactez-nous dès maintenant.
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-semibold text-slate-900 transition-all duration-300 hover:bg-orange-400 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Contacter sur WhatsApp
          </a>
        </footer>
      </div>
    </div>
  );
}

export default Home;