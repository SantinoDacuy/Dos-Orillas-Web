"use client";

import Timeline from "@/components/ui/timeline";

const settings = {
  textColor: "#F2EEE6",
  mutedTextColor: "#8FA6CF",
  activeColor: "#38BDF8",
  backgroundColor: "#071725",
  duration: 1.4,
};

export default function TimelineDemo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  return (
    <main className="bg-background text-foreground">
      {/* Lead-in so the pinned timeline has somewhere to scroll in from. */}
      <section className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#7FA6CF]">
          Proceso de trabajo
        </p>
        <h1 className="max-w-[18ch] text-4xl font-semibold leading-tight tracking-tight sm:text-6xl text-[#F2EEE6]">
          Cuatro etapas, un recorrido horizontal.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-[#8FA6CF]">
          Deslizá hacia abajo: la sección se fija, el eje central avanza y cada
          etapa revela su rumbo a medida que cruza el centro de la pantalla.
        </p>
        <span className="mt-2 animate-bounce text-[#7FA6CF]">&darr;</span>
      </section>

      {/* Realistic usage: custom copy, a branded accent, tuned reveal speed. */}
      <Timeline
        title="CÓMO TRABAJAMOS"
        subtitle="No empezamos construyendo. Empezamos escuchando."
        periodLabel="PROCESO · 01 — 04"
        backgroundColor={s.backgroundColor}
        textColor={s.textColor}
        mutedTextColor={s.mutedTextColor}
        activeColor={s.activeColor}
        imageUrl="/images/river-delta.jpg"
        imageAlt="Vista aérea de los humedales del río Uruguay"
        duration={s.duration}
      />

      <section className="flex h-screen items-center justify-center px-6 text-center text-sm text-[#8FA6CF]">
        Desde entender el problema real hasta construir el puente digital.
      </section>
    </main>
  );
}
