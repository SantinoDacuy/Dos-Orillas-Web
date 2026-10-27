export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  visual: "separate" | "think" | "build" | "connect";
}

export const processCopy = {
  title: "CÓMO TRABAJAMOS",
  subtitle: ["No empezamos construyendo", "Empezamos escuchando"],
} as const;

export const processSteps: readonly ProcessStep[] = [
  { number: "01", title: "NOS CONTÁS", description: "Entendemos qué está pasando y qué necesitás resolver", visual: "separate" },
  { number: "02", title: "LO PENSAMOS", description: "Analizamos el problema antes de elegir herramientas", visual: "think" },
  { number: "03", title: "LO CONSTRUIMOS", description: "Diseñamos y desarrollamos una solución adecuada", visual: "build" },
  { number: "04", title: "LO PONEMOS A ANDAR", description: "Implementamos, probamos y acompañamos el funcionamiento", visual: "connect" },
];
