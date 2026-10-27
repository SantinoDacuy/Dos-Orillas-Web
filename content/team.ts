/** Equipo: los dos cofundadores. Las especialidades salen de cada perfil (no repiten el stack de herramientas). */
export const teamCopy = {
  kicker: "Equipo",
  /** El segundo tramo va con degradado. */
  title: ["Dos miradas,", "un mismo equipo"],
  contactLabel: "Contactar",
  contactHref: "mailto:dosorillasestudio@gmail.com",
  members: [
    {
      id: "santino", number: "01", name: "Santino Dacuy", ghost: "SANTINO",
      role: "Frontend, UX & arquitectura digital",
      education: "Analista en Sistemas · Licenciatura en Sistemas de Información en curso",
      bio: "Diseña y desarrolla interfaces digitales de alto impacto visual, con foco en la experiencia de usuario y en arquitecturas frontend modernas y reactivas",
      focus: ["Diseño de interfaces", "Experiencia de usuario", "Arquitectura frontend", "Animación web"],
      image: "/personajes/santino.png",
    },
    {
      id: "tobias", number: "02", name: "Tobías Carballo", ghost: "TOBÍAS",
      role: "Backend, sistemas & arquitectura de datos",
      education: "Analista en Sistemas · Licenciatura en Sistemas de Información en curso",
      bio: "Arquitectura de servidores, modelado de bases de datos relacionales y no relacionales, automatización de flujos de trabajo e integraciones de software a medida",
      focus: ["Arquitectura backend", "Modelado de datos", "Automatización de procesos", "Integraciones a medida"],
      image: "/personajes/tobias.png",
    },
  ],
} as const;
