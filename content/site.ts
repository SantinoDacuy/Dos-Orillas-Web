import type { ProjectContext } from "@/data/projects";

export type Locale = "es-AR";
export type ChapterId = "estudio" | "soluciones" | "proyectos" | "equipo" | "contacto";

export interface NavigationItem {
  id: ChapterId;
  href: `#${ChapterId}`;
  label: string;
  menuLabel: string;
  number: string;
}

export interface ContentMedia {
  src: string;
  width: number;
  height: number;
  alt: string;
  focal?: [number, number];
}

export interface SiteConfig {
  locale: Locale;
  name: string;
  email: string;
  emailHref: string;
  instagram: { label: string; handle: string; url: string };
  location: { city: string; region: string; country: string; countryCode: string; label: string };
  timeZone: string;
  availability: string | null;
  coverage: string | null;
  workModality: string | null;
  projectContextLabels: Record<ProjectContext, string>;
  metadata: { title: string; description: string };
}

export const siteConfig: SiteConfig = {
  locale: "es-AR",
  name: "Dos Orillas Estudio",
  email: "dosorillasestudio@gmail.com",
  emailHref: "mailto:dosorillasestudio@gmail.com",
  instagram: {
    label: "Instagram",
    handle: "@dosorillas.estudio",
    url: "https://www.instagram.com/dosorillas.estudio/",
  },
  location: {
    city: "Concepción del Uruguay",
    region: "Entre Ríos",
    country: "Argentina",
    countryCode: "AR",
    label: "Concepción del Uruguay · Entre Ríos · Argentina",
  },
  timeZone: "America/Argentina/Buenos_Aires",
  availability: null,
  coverage: null,
  workModality: null,
  projectContextLabels: {
    academico: "Proyecto académico",
    personal: "Caso de estudio",
    cliente: "Caso de estudio",
  },
  metadata: {
    title: "Dos Orillas Estudio — Soluciones digitales",
    description:
      "Diseñamos y desarrollamos soluciones digitales para negocios. Web, sistemas, automatización y datos desde Concepción del Uruguay.",
  },
};

export const navigationItems: readonly NavigationItem[] = [
  { id: "estudio", href: "#estudio", label: "Estudio", menuLabel: "Estudio", number: "01" },
  { id: "soluciones", href: "#soluciones", label: "Soluciones", menuLabel: "Soluciones", number: "02" },
  { id: "proyectos", href: "#proyectos", label: "Proyectos", menuLabel: "Proyectos", number: "03" },
  { id: "equipo", href: "#equipo", label: "Equipo", menuLabel: "Equipo", number: "04" },
  { id: "contacto", href: "#contacto", label: "Conversemos →", menuLabel: "Conversemos", number: "05" },
];

export const chapters = [
  { id: "estudio", number: "01", label: "ESTUDIO", sections: ["estudio", "distancia", "manifiesto"] },
  { id: "soluciones", number: "02", label: "SOLUCIONES", sections: ["soluciones", "proceso"] },
  { id: "proyectos", number: "03", label: "PROYECTOS", sections: ["proyectos", "todos-los-proyectos"] },
  { id: "equipo", number: "04", label: "EQUIPO", sections: ["el-estudio", "equipo", "herramientas"] },
  { id: "contacto", number: "05", label: "CONTACTO", sections: ["hablemos", "contacto", "footer"] },
] as const;

export const brandCopy = {
  wordmark: "DOS ORILLAS",
  wordmarkParts: ["DOS", "ORILLAS"],
  studio: "ESTUDIO",
  accessibleName: "Dos Orillas Estudio",
  philosophy: "Primero entendemos. Después hacemos.",
  marquee: "DOS ORILLAS — DOS ORILLAS —",
} as const;

export const heroCopy = {
  title: "Dos Orillas Estudio",
  titleParts: ["DOS", "ORILLAS"],
  studio: "ESTUDIO",
  philosophy: "Primero entendemos. Después hacemos.",
  philosophyLines: ["Primero entendemos.", "Después hacemos."],
  description: "Soluciones digitales pensadas desde el problema, no desde la herramienta.",
  primaryCta: { label: "CONTANOS QUÉ QUERÉS RESOLVER →", href: "#contacto" },
  secondaryCta: { label: "VER PROYECTOS ↓", href: "#proyectos" },
  scrollHint: "DESLIZÁ PARA CRUZAR",
  orillaLabels: ["ORILLA 01", "ORILLA 02"],
  media: [
    { src: "/projects/_hero/orilla-1.webp", width: 2400, height: 3000, alt: "" },
    { src: "/projects/_hero/orilla-2.webp", width: 2400, height: 3000, alt: "" },
  ] satisfies ContentMedia[],
} as const;

export const distanceCopy = {
  title: "La distancia entre dos orillas",
  left: { label: "TU NEGOCIO", lines: ["TU", "NEGOCIO"], orilla: "ORILLA 01" },
  right: { label: "LA TECNOLOGÍA", lines: ["LA", "TECNOLOGÍA"], orilla: "ORILLA 02" },
  measure: "DISTANCIA",
  description: "Entre tener un problema y encontrar la herramienta correcta hay una distancia.",
  connection: "Ahí trabajamos nosotros.",
  statements: ["Entendemos el problema.", "Pensamos la solución.", "Construimos el puente."],
} as const;

export const loaderCopy = { orilla: "ORILLA", connected: "DOS ORILLAS" } as const;

export const accessibilityCopy = {
  skipLink: "Saltar al contenido",
  mainNavigation: "Principal",
  footerNavigation: "Navegación del pie",
  mobileMenu: "Menú principal",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
  backToTop: "Volver arriba",
  projectLink: (title: string): string => `Ir al proyecto ${title}`,
} as const;

export const motionCopy = {
  reduce: "Reducir movimiento",
  full: "Movimiento completo",
  cursor: { view: "VER", drag: "DRAG" },
} as const;

export const footerCopy = {
  wordmark: ["DOS ORILLAS", "ESTUDIO"],
  philosophy: "Primero entendemos. Después hacemos.",
  location: "Concepción del Uruguay · Entre Ríos · Argentina",
  clockCity: "CONCEPCIÓN DEL URUGUAY",
  clockZone: "ART",
  emailLabel: "Email",
  instagramLabel: "Instagram",
  copyright: "©",
  links: [
    { label: "Estudio", href: "#estudio" },
    { label: "Soluciones", href: "#soluciones" },
    { label: "Proyectos", href: "#proyectos" },
    { label: "Equipo", href: "#equipo" },
    { label: "Contacto", href: "#contacto" },
  ],
} as const;

export const manifestoCopy = {
  title: "Manifiesto",
  firstLines: ["NO HACEMOS", "TECNOLOGÍA", "PORQUE SÍ."],
  secondLines: ["LA HACEMOS", "CUANDO PUEDE", "MEJORAR ALGO."],
  description: "Hacemos que la tecnología se adapte al negocio, no al revés.",
  media: { src: "/images/river-delta.jpg", width: 1920, height: 1080, alt: "Vista aérea de los brazos del río y humedales de Entre Ríos" } satisfies ContentMedia,
} as const;

export const studioCopy = {
  title: "EL ESTUDIO",
  eyebrow: "01 · EL ESTUDIO",
  headline: ["DOS PERSONAS.", "DOS ORILLAS.", "UNA MISMA FORMA DE TRABAJAR."],
  coordinates: "32°29′S 58°14′W · CONCEPCIÓN DEL URUGUAY",
  lead: "Dos Orillas nace de una idea simple: antes de construir una solución, hay que entender realmente el problema.",
  paragraph: "Somos un estudio de soluciones digitales de Concepción del Uruguay, Entre Ríos. Trabajamos con negocios, comercios, emprendimientos y organizaciones que necesitan ordenar, mejorar o transformar alguna parte de su trabajo mediante tecnología.",
  paragraphs: [
    "Somos un estudio de soluciones digitales de Concepción del Uruguay, Entre Ríos. Trabajamos con negocios, comercios, emprendimientos y organizaciones que necesitan ordenar, mejorar o transformar alguna parte de su trabajo mediante tecnología.",
  ],
} as const;

export const projectsCopy = {
  selected: "PROYECTOS SELECCIONADOS",
  all: "TODOS LOS PROYECTOS",
  view: "VER PROYECTO →",
  next: "SIGUIENTE PROYECTO",
  viewAll: "VER TODOS →",
  invitation: "¿Tu proyecto es el próximo? Contanos qué querés resolver →",
  back: "← Todos los proyectos",
  live: "VER EN VIVO ↗",
  code: "VER CÓDIGO ↗",
  conceptual: "ESQUEMA CONCEPTUAL",
  chapters: { overview: "Overview", challenge: "PROBLEMA", approach: "PROCESO", solution: "SOLUCIÓN", technologies: "TECNOLOGÍAS", gallery: "GALERÍA", result: "RESULTADO" },
  filters: { all: "Todos", "web-ecommerce": "Web & E-commerce", sistemas: "Sistemas", datos: "Datos", ia: "IA", arquitectura: "Arquitectura" },
  counter: (index: number, total: number): string => `${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
} as const;

export const finalCtaCopy = {
  lines: ["TENÉS UNA IDEA.", "UN PROBLEMA.", "O ALGO QUE PODRÍA", "FUNCIONAR MEJOR."],
  title: "HABLEMOS.",
  cta: { label: "CONTANOS QUÉ QUERÉS RESOLVER →", href: "#contacto" },
  location: "Dos Orillas Estudio · Concepción del Uruguay · Entre Ríos · Argentina",
} as const;

export const contactCopy = {
  title: "Conversemos",
  fields: { name: "Nombre", email: "Email", organization: "Negocio / empresa", message: "¿Qué querés resolver?" },
  helper: "No hace falta que tengas la solución. Contanos qué está pasando.",
  submit: "ENVIAR MENSAJE →",
  loading: "ENVIANDO…",
  errors: {
    name: "Necesitamos tu nombre para saber con quién hablamos.",
    email: "Revisá el email: parece que falta algo.",
    message: "Contanos aunque sea en una línea qué está pasando.",
    network: "No pudimos enviar el mensaje. Probá de nuevo o escribinos a dosorillasestudio@gmail.com.",
    summary: "Revisá estos campos.",
  },
  success: "Mensaje enviado. Gracias por escribirnos; lo leemos y te respondemos por email.",
  copyEmail: "Copiar email",
  emailCopied: "Email copiado",
  privacy: null as string | null,
  pendingPrivacy: "Usamos tus datos solo para responderte.",
} as const;

export const notFoundCopy = {
  title: "Este puente no llega a ningún lado.",
  cta: { label: "VOLVER AL INICIO →", href: "/" },
} as const;

export const keyVisualCopy = {
  "commerce-flow": { nodes: ["CATÁLOGO", "CARRITO", "PAGO", "ENVÍO"], branches: ["GOOGLE LOGIN", "MERCADO PAGO", "PANEL ADMIN"] },
  "event-flow": { nodes: ["API (Next.js)", "comandos", "Procesador", "eventos", "SSE", "Timeline"], branch: "DLQ" },
  geo: { nearby: "Búsqueda geográfica", ranking: "Ranking de popularidad", clustering: "Clustering" },
  clusters: { algorithm: "ART1 (Carpenter-Grossberg)", stages: ["Variedad", "Calidad"] },
  "dw-structure": { fact: "HECHOS", dimension: "DIMENSIÓN", stages: ["ETL", "modelo", "dashboards"], empty: "a completar" },
} as const;
