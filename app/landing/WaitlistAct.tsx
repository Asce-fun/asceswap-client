import { FadeUp } from "./FadeUp";
import { WaitlistForm } from "./WaitlistForm";

export function WaitlistAct() {
  return (
    <section id="waitlist" className="px-5 py-32 text-center sm:px-8">
      <div className="mx-auto max-w-3xl">
        <FadeUp>
          <p className="font-mono text-[11px] tracking-[0.28em] text-[#2ee59d]">
            EARLY ACCESS
          </p>
          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-[#f2f5f3] sm:text-4xl">
            The first markets open soon.
          </h2>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-[#8a96a3]">
            Tell us the number you&apos;re exposed to. The ones people ask for
            get opened first.
          </p>
        </FadeUp>

        <FadeUp delay={0.1}>
          <WaitlistForm />
        </FadeUp>
      </div>
    </section>
  );
}
