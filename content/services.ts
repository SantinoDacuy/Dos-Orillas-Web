import type { ContentMedia } from "@/content/site";

export type ServiceId = "web" | "sistemas" | "automatizacion" | "datos";

export interface Service {
  id: ServiceId;
  number: string;
  name: string;
  title: string;
  description: string;
  media: ContentMedia;
}

export const servicesCopy = {
  title: "Soluciones",
  /** El titular de la sección; el segundo tramo va con degradado. */
  subtitle: ["La herramienta viene", "después del problema"],
} as const;

export const services: readonly Service[] = [
  { id: "web", number: "01", name: "WEB", title: "Web & e-commerce", description: "Sitios web, experiencias digitales y tiendas pensadas para cumplir un objetivo real", media: { src: "/projects/_services/web.webp", width: 1400, height: 1750, alt: "" } },
  { id: "sistemas", number: "02", name: "SISTEMAS", title: "Sistemas a medida", description: "Herramientas adaptadas a la forma en que funciona cada negocio", media: { src: "/projects/_services/sistemas.webp", width: 1400, height: 1750, alt: "" } },
  { id: "automatizacion", number: "03", name: "AUTOMATIZACIÓN", title: "Automatización & integraciones", description: "Conectar herramientas, eliminar tareas repetitivas y ordenar procesos", media: { src: "/projects/_services/automatizacion.webp", width: 1400, height: 1750, alt: "" } },
  { id: "datos", number: "04", name: "DATOS", title: "Datos & organización", description: "Transformar información dispersa en información útil para tomar decisiones", media: { src: "/projects/_services/datos.webp", width: 1400, height: 1750, alt: "" } },
];
