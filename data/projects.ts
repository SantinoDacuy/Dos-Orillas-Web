export type ProjectCategoryId = "web-ecommerce" | "sistemas" | "datos" | "ia" | "arquitectura";
export type ProjectContext = "academico" | "personal" | "cliente";
export type ProjectAuthorId = "santino" | "tobias";
export type ProjectKeyVisual = "event-flow" | "geo" | "clusters" | "dw-structure" | "commerce-flow";

export interface MediaRef {
  src: string | null;
  alt: string;
  width: number;
  height: number;
  focal?: [number, number];
}

export interface Project {
  slug: string;
  title: string;
  titleLines: string[];
  year: number | null;
  categoryLabel: string;
  categories: ProjectCategoryId[];
  context: ProjectContext;
  description: string;
  intro: string | null;
  challenge: string | null;
  approach: string | null;
  solution: string | null;
  result: string | null;
  technologies: string[];
  authors: ProjectAuthorId[];
  cover: MediaRef;
  gallery: MediaRef[];
  keyVisual: ProjectKeyVisual | null;
  tone: { bg: string; fg: string };
  featured: boolean;
  order: number;
  liveUrl: string | null;
  githubUrl: string | null;
}

export const projects: readonly Project[] = [
  {
    slug: "mate-unico",
    title: "Mate Único",
    titleLines: ["MATE", "ÚNICO"],
    year: null,
    categoryLabel: "E-commerce / Sistemas",
    categories: ["web-ecommerce", "sistemas"],
    context: "personal",
    description: "Experiencia de comercio electrónico desarrollada alrededor de una tienda especializada en mates y combos.",
    intro: null, challenge: null, approach: null, solution: null, result: null,
    technologies: ["React (Router)", "Node.js/Express", "PostgreSQL", "Strapi", "API de Mercado Pago", "Google OAuth", "Figma", "UML"],
    authors: ["santino"],
    cover: { src: null, alt: "", width: 2400, height: 1500 },
    gallery: [],
    keyVisual: "commerce-flow",
    tone: { bg: "#10263E", fg: "#F2EEE6" },
    featured: true, order: 1, liveUrl: null, githubUrl: null,
  },
  {
    slug: "gestion-aeroportuaria",
    title: "Gestión Aeroportuaria",
    titleLines: ["GESTIÓN", "AEROPORTUARIA"],
    year: null,
    categoryLabel: "Backend / Datos / Geolocalización",
    categories: ["sistemas", "datos"],
    context: "personal",
    description: "Sistema para gestionar y explorar información de aeropuertos.",
    intro: null, challenge: null, approach: null, solution: null, result: null,
    technologies: ["API REST", "MongoDB", "Redis", "Leaflet", "Docker", "Docker Compose"],
    authors: ["santino"],
    cover: { src: null, alt: "", width: 2400, height: 1500 },
    gallery: [],
    keyVisual: "geo",
    tone: { bg: "#071725", fg: "#F2EEE6" },
    featured: true, order: 2, liveUrl: null, githubUrl: null,
  },
  {
    slug: "clasificador-de-frutas",
    title: "Clasificador de Frutas",
    titleLines: ["CLASIFICADOR", "DE FRUTAS"],
    year: null,
    categoryLabel: "Inteligencia Artificial",
    categories: ["ia", "datos"],
    context: "personal",
    description: "Clasificación con red ART1 (Carpenter-Grossberg).",
    intro: null, challenge: null, approach: null, solution: null, result: null,
    technologies: ["ART1 (Carpenter-Grossberg)"],
    authors: ["santino"],
    cover: { src: null, alt: "", width: 2400, height: 1500 },
    gallery: [],
    keyVisual: "clusters",
    tone: { bg: "#10263E", fg: "#F2EEE6" },
    featured: true, order: 3, liveUrl: null, githubUrl: null,
  },
  {
    slug: "retail-vision",
    title: "Retail Vision",
    titleLines: ["RETAIL", "VISION"],
    year: null,
    categoryLabel: "Datos / Visualización",
    categories: ["datos"],
    context: "academico",
    description: "Data Warehouse y BI.",
    intro: null, challenge: null, approach: null, solution: null, result: null,
    technologies: ["PostgreSQL", "Tableau"],
    authors: ["santino"],
    cover: { src: null, alt: "", width: 2400, height: 1500 },
    gallery: [],
    keyVisual: "dw-structure",
    tone: { bg: "#071725", fg: "#F2EEE6" },
    featured: true, order: 4, liveUrl: null, githubUrl: null,
  },
  {
    slug: "transacciones-en-tiempo-real",
    title: "Transacciones en Tiempo Real",
    titleLines: ["TRANSACCIONES", "EN TIEMPO REAL"],
    year: null,
    categoryLabel: "Arquitectura / Sistemas distribuidos",
    categories: ["arquitectura", "sistemas"],
    context: "personal",
    description: "Next.js, KafkaJS, arquitectura orientada a eventos, topics, comandos, eventos, DLQ, Server-Sent Events y timeline en tiempo real.",
    intro: null, challenge: null, approach: null, solution: null, result: null,
    technologies: ["Next.js", "KafkaJS", "Server-Sent Events"],
    authors: ["santino"],
    cover: { src: null, alt: "", width: 2400, height: 1500 },
    gallery: [],
    keyVisual: "event-flow",
    tone: { bg: "#10263E", fg: "#F2EEE6" },
    featured: true, order: 5, liveUrl: null, githubUrl: null,
  },
];

export const projectContentFlags: Readonly<Record<string, readonly string[]>> = {
  "mate-unico": ["CONFIRMAR contexto; nunca presentarlo como cliente comercial", "CONFIRMAR tecnologías y funcionalidades contempladas"],
  "gestion-aeroportuaria": ["CONFIRMAR contexto personal o académico"],
  "clasificador-de-frutas": ["CONFIRMAR contexto personal o académico", "CONFIRMAR dos corridas encadenadas (variedad y calidad)", "CONFIRMAR limitaciones documentadas"],
  "retail-vision": ["CONFIRMAR modelo en estrella con cuatro tablas de hechos", "CONFIRMAR pipeline ETL, dashboards e informe", "CONFIRMAR hallazgos de integridad de datos", "No publicar nombres de compañeros sin autorización expresa"],
  "transacciones-en-tiempo-real": ["CONFIRMAR contexto personal o académico"],
};

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getNextProject(slug: string): Project | null {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index < 0 || projects.length === 0) return null;
  return projects[(index + 1) % projects.length] ?? null;
}

export function getProjectCoverPath(project: Pick<Project, "slug">): string {
  return `/projects/${project.slug}/cover.webp`;
}
