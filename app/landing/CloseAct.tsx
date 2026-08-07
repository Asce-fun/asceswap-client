export function CloseAct() {
  return (
    <section className="px-5 pb-14 pt-10 sm:px-8">
      {/* Title case to match the header mark, sized to sit as a sign-off rather
          than bleed across the fold. */}
      <p
        aria-hidden="true"
        className="whitespace-nowrap text-center font-serif text-[clamp(30px,7vw,96px)] font-semibold leading-none tracking-wide text-[#8fb3a3]"
      >
        Asce<span className="text-[#2ee59d]">Swap</span>
      </p>
    </section>
  );
}
