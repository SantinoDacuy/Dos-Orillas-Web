export const featuredProjectsCopy = {
  previous: 'Proyecto anterior',
  next: 'Siguiente proyecto',
  scroll: 'DESLIZÁ PARA VER',
  collectionLabel: 'Carrusel de proyectos seleccionados',
  interactionHint: 'FLECHAS O DESLIZÁ PARA RECORRER',
  coverLabel: (title: string) => `Ver proyecto: ${title}`,
  selectLabel: (title: string) => `Ir al proyecto: ${title}`,
  announcement: (index: number, total: number, title: string) => `${index} de ${total}: ${title}`,
} as const;
