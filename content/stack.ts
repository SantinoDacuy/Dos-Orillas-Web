/** Criterio & stack: una premisa y tres capas con sus herramientas. */
export const stackCopy = {
  kicker: "Criterio & stack",
  /** El segundo tramo va con degradado. */
  title: ["Las herramientas cambian", "El criterio no"],
  lead: "No llegamos con una herramienta predeterminada: analizamos el problema real, la escala requerida y los recursos para elegir la tecnología adecuada",
  layers: [
    {
      id: "interface", tag: "Interfaz", title: "Frontend & experiencia",
      description: "Interfaces interactivas, renderizado optimizado y sistemas de diseño consistentes",
      technologies: ["Next.js", "React", "TypeScript", "JavaScript", "GSAP", "Tailwind", "Figma"],
    },
    {
      id: "server", tag: "Servidor", title: "Backend & arquitectura",
      description: "APIs REST, pipelines de datos y entornos contenerizados listos para producción",
      technologies: ["Node.js", "Python", "APIs REST", "Supabase", "Docker", "AWS"],
    },
    {
      id: "data", tag: "Datos", title: "Bases de datos & caché",
      description: "Modelos de datos robustos, integridad relacional y almacenamiento de alta velocidad",
      technologies: ["PostgreSQL", "SQL", "Redis", "MongoDB"],
    },
  ],
} as const;
