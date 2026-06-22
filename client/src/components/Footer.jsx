import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';

function Footer({ phoneNumber }) {
  const year = new Date().getFullYear();
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="ELI'S BUSINESS CENTER" className="h-10 w-auto" />
            <span className="text-xl font-semibold text-white">ELI'S BUSINESS CENTER</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-slate-300">
            Vente, réparation et échange de téléphones Apple. Toute la communication se fait par WhatsApp.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-white">Liens rapides</h3>
          <ul className="mt-3 space-y-2 text-slate-300">
            <li><Link to="/" className="hover:text-white">Accueil</Link></li>
            <li><Link to="/vente" className="hover:text-white">Vente</Link></li>
            <li><Link to="/reparation" className="hover:text-white">Réparation</Link></li>
            <li><Link to="/echange" className="hover:text-white">Échange</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-semibold text-white">Contact</h3>
          <p className="mt-3 text-sm text-slate-300">Lomé, TOGO</p>
          <p className="mt-2 text-sm text-slate-300">
            <a href={`tel:${phoneNumber}`} className="hover:text-white">{phoneNumber}</a>
          </p>
          <p className="mt-2 text-sm text-slate-300">
            <a href={`https://wa.me/${cleanPhone}?text=Bonjour%20ELI%27S`} target="_blank" rel="noreferrer" className="hover:text-white">
              WhatsApp
            </a>
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-8 text-center text-sm text-slate-500 sm:px-6">
        © {year} ELI'S BUSINESS CENTER. Toute la communication se fait par WhatsApp.
      </div>
    </footer>
  );
}

export default Footer;
