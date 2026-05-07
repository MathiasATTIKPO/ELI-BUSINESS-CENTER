import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/logo.svg';

const navItems = [
  { label: 'Accueil', to: '/' },
  { label: 'Vente', to: '/vente' },
  { label: 'Réparation', to: '/reparation' },
  { label: 'Échange', to: '/echange' },
  { label: 'Suivi', to: '/suivi' },
  { label: 'Contact', to: '/contact' }
];

function Navbar({ phoneNumber }) {
  const [open, setOpen] = useState(false);
  const whatsappLink = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=Bonjour%20ELI%27S`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 text-night">
          <img src={logo} alt="ELI'S BUSINESS CENTER" className="h-10 w-auto" />
          <span className="hidden text-lg font-semibold md:inline-block">ELI'S</span>
        </Link>

        <button
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-2 text-night md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Ouvrir le menu"
        >
          <span className="text-lg">☰</span>
        </button>

        <nav className={`absolute inset-x-4 top-full mt-2 rounded-3xl bg-white p-6 shadow-lg transition-all duration-300 md:static md:mt-0 md:flex md:items-center md:bg-transparent md:p-0 md:shadow-none ${open ? 'block' : 'hidden'}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand text-white shadow-lg' : 'text-brand hover:bg-brand/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg md:mt-0 md:ml-4 hover:bg-[#2f1c50]"
          >
            <span>WhatsApp</span>
            <span>💬</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
