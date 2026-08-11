import Image from "next/image";

export default function DashboardHero() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-kraft-200 shadow-sm">
      <div className="relative h-72 sm:h-[30rem]">
        <Image
          src="/images/dashboard-hero.webp"
          alt=""
          aria-hidden="true"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-700/10 via-ink-700/20 to-ink-700/70" />

        <div className="absolute top-4 left-5">
          <span className="text-[10px] font-bold tracking-[0.3em] text-white/90 uppercase [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
            ◈ Panel de administracion
          </span>
        </div>
      </div>
    </div>
  );
}
