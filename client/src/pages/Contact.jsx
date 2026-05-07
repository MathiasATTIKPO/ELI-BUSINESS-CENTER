function Contact({ phoneNumber }) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanPhone}?text=Bonjour%20ELI%27S%20BUSINESS%20CENTER`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-night">Contactez-nous</h1>
          <p className="mt-4 text-slate-600">Retrouvez toutes les informations pour nous joindre et visiter notre boutique à Dakar.</p>

          <div className="mt-8 space-y-6 text-slate-700">
            <div>
              <h2 className="text-lg font-semibold text-night">Adresse</h2>
              <p className="mt-2">Lomé, TOGO</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-night">Horaires d’ouverture</h2>
              <p className="mt-2">Lundi-Samedi : 8h-22h</p>
              <p>Dimanche : 10h-16h</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-night">Téléphone</h2>
              <a href={`tel:${phoneNumber}`} className="mt-2 inline-block text-sm font-semibold text-night hover:text-gold">{phoneNumber}</a>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-night">WhatsApp</h2>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#2f1c50]">
                Envoyer un message sur WhatsApp
              </a>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-night">Email</h2>
              <p className="mt-2 text-slate-600">eliagbanyo414@gmail.com</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-night">Notre emplacement</h2>
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
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
        </div>
      </div>
    </section>
  );
}

export default Contact;
