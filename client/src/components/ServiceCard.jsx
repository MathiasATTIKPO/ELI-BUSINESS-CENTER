function ServiceCard({ title, description, icon }) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gold/10 text-2xl text-gold">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-night">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export default ServiceCard;
