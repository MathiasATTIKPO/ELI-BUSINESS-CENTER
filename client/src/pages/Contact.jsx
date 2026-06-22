// Icônes SVG
const ContactIcons = {
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
};

function Contact({ phoneNumber = '+22800000000' }) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanPhone}?text=Bonjour%20ELI%27S%20BUSINESS%20CENTER`;
  const email = 'eliagbanyo414@gmail.com';

  const contactDetails = [
    { icon: <ContactIcons.MapPin />, label: 'Adresse', value: 'Lomé, TOGO', href: null },
    { icon: <ContactIcons.Clock />, label: 'Horaires d’ouverture', value: ['Lundi-Samedi : 8h-22h', 'Dimanche : 10h-16h'], href: null },
    { icon: <ContactIcons.Phone />, label: 'Téléphone', value: phoneNumber, href: `tel:${phoneNumber}` },
    { icon: <ContactIcons.Mail />, label: 'Email', value: email, href: `mailto:${email}` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Informations de contact */}
          <div className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl p-8">
            <h1 className="text-3xl font-bold text-slate-900">Contactez-nous</h1>
            <p className="mt-4 text-slate-700">
              Retrouvez toutes les informations pour nous joindre et visiter notre boutique à Lomé.
            </p>

            <dl className="mt-8 space-y-6 text-slate-700">
              {contactDetails.map((item) => (
                <div key={item.label} className="flex gap-3">
                  <dt className="sr-only">{item.label}</dt>
                  <dd className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-gold" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{item.label}</h2>
                      {Array.isArray(item.value) ? (
                        item.value.map((line, idx) => (
                          <p key={idx} className="mt-1 text-slate-600">{line}</p>
                        ))
                      ) : item.href ? (
                        <a
                          href={item.href}
                          className="mt-1 inline-block text-slate-600 hover:text-gold transition-colors focus:outline-none focus:ring-2 focus:ring-brand rounded"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-1 text-slate-600">{item.value}</p>
                      )}
                    </div>
                  </dd>
                </div>
              ))}
              {/* WhatsApp séparé */}
              <div className="flex gap-3 pt-2">
                <span className="mt-0.5 shrink-0 text-gold" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">WhatsApp</h2>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#2f1c50] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                  >
                    Envoyer un message
                  </a>
                </div>
              </div>
            </dl>
          </div>

          {/* Carte */}
          <aside className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl p-8">
            <h2 className="text-xl font-semibold text-slate-900">Notre emplacement</h2>
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/60">
              <iframe
                title="Carte Google Maps ELI'S BUSINESS CENTER"
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4786.099943230664!2d1.1876229627244124!3d6.1955496038817826!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfr!2stg!4v1776769439517!5m2!1sfr!2stg"
                width="100%"
                height="280"
                className="border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default Contact;