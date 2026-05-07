import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';

function Footer({ phoneNumber }) {
  const year = new Date().getFullYear();
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="ELI'S BUSINESS CENTER" className="h-10 w-auto" />
            <span className="text-xl font-semibold text-night">ELI'S BUSINESS CENTER</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-slate-600">
            Vente, réparation et échange de téléphones Apple. Toute la communication se fait par WhatsApp.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-night">Liens rapides</h3>
          <ul className="mt-3 space-y-2 text-slate-600">
            <li><Link to="/" className="hover:text-night">Accueil</Link></li>
            <li><Link to="/vente" className="hover:text-night">Vente</Link></li>
            <li><Link to="/reparation" className="hover:text-night">Réparation</Link></li>
            <li><Link to="/echange" className="hover:text-night">Échange</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-semibold text-night">Contact</h3>
          <p className="mt-3 text-sm text-slate-600">Lomé, TOGO</p>
          <p className="mt-2 text-sm text-slate-600">
            <a href={`tel:${phoneNumber}`} className="hover:text-night">{phoneNumber}</a>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            <a href={`https://wa.me/${cleanPhone}?text=Bonjour%20ELI%27S`} target="_blank" rel="noreferrer" className="hover:text-night">
              WhatsApp
            </a>
          </p>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl px-4 text-center text-sm text-slate-500 sm:px-6">
        © {year} ELI'S BUSINESS CENTER. Toute la communication se fait par WhatsApp.
      </div>
    </footer>
  );
}

export default Footer;
