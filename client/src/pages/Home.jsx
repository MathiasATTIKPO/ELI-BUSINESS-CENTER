import { Link } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';

const services = [
  {
    title: 'Vente',
    description: 'Smartphones et tablettes Apple neufs ou reconditionnés avec garantie locale.',
    icon: '📱',
    link: '/vente'
  },
  {
    title: 'Réparation',
    description: 'Diagnostic rapide et réparation Apple avec pièces de qualité.',
    icon: '🔧',
    link: '/reparation'
  },
  {
    title: 'Échange',
    description: 'Reprise avantageuse de votre ancien téléphone pour un modèle récent.',
    icon: '🔄',
    link: '/echange'
  }
];

function Home({ phoneNumber }) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanPhone}?text=Bonjour%20ELI%27S%20BUSINESS%20CENTER%20-%20J%27ai%20une%20question`;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6 rounded-[40px] bg-white p-10 shadow-2xl ring-1 ring-slate-200/60 lg:p-14">
          <span className="inline-flex rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">ELI'S BUSINESS CENTER</span>
          <h1 className="text-4xl font-bold tracking-tight text-night sm:text-5xl">Spécialiste Apple pour vente, réparation et échange</h1>
          <p className="max-w-2xl text-base leading-8 text-slate-700">Nous aidons les clients à trouver, réparer ou échanger leur téléphone Apple avec rapidité, transparence et service WhatsApp dédié.</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#2f1c50]">
              Contactez-nous sur WhatsApp
            </a>
            <Link to="/vente" className="inline-flex items-center justify-center rounded-full border border-brand bg-white px-6 py-3 text-sm font-semibold text-brand transition hover:bg-brand/5">
              Voir le catalogue
            </Link>
          </div>
        </div>

        <div className="rounded-[36px] bg-white p-8 shadow-lg">
          <div className="space-y-5">
            <div className="rounded-3xl bg-night/5 p-6">
              <h2 className="text-xl font-semibold text-night">Pourquoi nous choisir ?</h2>
              <ul className="mt-4 space-y-3 text-slate-600">
                <li>• Expertise Apple locale pour appareils récents et anciens.</li>
                <li>• Devis rapide et réponse sous 24h sur WhatsApp.</li>
                <li>• Suivi personnalisé et prix transparent.</li>
                <li>• Service simple pour vente, réparation et échange.</li>
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-gold/10 p-5">
                <p className="text-sm font-semibold uppercase text-gold">Expertise</p>
                <p className="mt-2 text-sm text-slate-600">Spécialistes Apple et accessibilité locale.</p>
              </div>
              <div className="rounded-3xl bg-night/5 p-5">
                <p className="text-sm font-semibold uppercase text-night">Rapidité</p>
                <p className="mt-2 text-sm text-slate-600">Réponses et devis sous 24h.</p>
              </div>
              <div className="rounded-3xl bg-gold/10 p-5">
                <p className="text-sm font-semibold uppercase text-gold">WhatsApp</p>
                <p className="mt-2 text-sm text-slate-600">Suivi direct et conversation facile.</p>
              </div>
              <div className="rounded-3xl bg-night/5 p-5">
                <p className="text-sm font-semibold uppercase text-night">Prix</p>
                <p className="mt-2 text-sm text-slate-600">Offres claires et estimations honnêtes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 py-10 md:grid-cols-3">
        {services.map((service) => (
          <div key={service.title} className="rounded-[32px] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <ServiceCard {...service} />
            <Link to={service.link} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-night hover:text-gold">
              En savoir plus →
            </Link>
          </div>
        ))}
      </div>

      <div className="rounded-[36px] bg-night text-white p-10 text-center shadow-2xl sm:p-14">
        <h2 className="text-3xl font-semibold">Prêt à échanger ou réparer votre appareil ?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-200">Notre équipe est disponible sur WhatsApp pour vous conseiller et vous envoyer un devis rapide. Contactez-nous dès maintenant.</p>
        <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-semibold text-night transition hover:bg-orange-400">
          Contacter sur WhatsApp
        </a>
      </div>
    </section>
  );
}

export default Home;
