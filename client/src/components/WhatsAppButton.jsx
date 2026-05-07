function WhatsAppButton({ phoneNumber, text }) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const link = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 inline-flex items-center justify-center rounded-full bg-brand p-4 text-white shadow-xl transition hover:bg-[#2f1c50] sm:bottom-8 sm:right-8"
      aria-label="Contacter sur WhatsApp"
    >
      <span className="text-lg">💬</span>
    </a>
  );
}

export default WhatsAppButton;
