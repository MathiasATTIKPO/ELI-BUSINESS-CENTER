import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import Products from './pages/Products';
import Repair from './pages/Repair';
import TradeIn from './pages/TradeIn';
import Tracking from './pages/Tracking';
import Contact from './pages/Contact';
import ResellerDashboard from './pages/reseller/Dashboard';
import VIPDashboard from './pages/vip/Dashboard';

function App() {
  const phoneNumber = '+22890178475';
  const whatsappText = "Bonjour ELI'S Business Center, je souhaite obtenir des informations sur vos services.   Merci ! ";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef2ff] via-[#f7f8ff] to-[#f8f9ff] text-slate-900">
      <Navbar phoneNumber={phoneNumber} />
      <main className="pt-24">
        <Routes>
          <Route path="/" element={<Home phoneNumber={phoneNumber} />} />
          <Route path="/achat" element={<Products phoneNumber={phoneNumber} />} />
          <Route path="/reparation" element={<Repair phoneNumber={phoneNumber} />} />
          <Route path="/echange" element={<TradeIn phoneNumber={phoneNumber} />} />
          <Route path="/suivi" element={<Tracking phoneNumber={phoneNumber} />} />
          <Route path="/contact" element={<Contact phoneNumber={phoneNumber} />} />
          <Route path="/reseller" element={<ResellerDashboard />} />
          <Route path="/vip" element={<VIPDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer phoneNumber={phoneNumber} />
      <WhatsAppButton phoneNumber={phoneNumber} text={whatsappText} />
    </div>
  );
}

export default App;
