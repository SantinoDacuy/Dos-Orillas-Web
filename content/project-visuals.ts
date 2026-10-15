import type { ProjectKeyVisual } from '@/data/projects';

export interface VisualNode {
  readonly id: string;
  readonly label: string;
  readonly lines: readonly string[];
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface VisualEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly path: string;
  readonly branch?: boolean;
}

export interface ProjectVisualDefinition {
  readonly title: string;
  readonly description: string;
  readonly nodes: readonly VisualNode[];
  readonly edges: readonly VisualEdge[];
  readonly legend: readonly { readonly id: string; readonly label: string }[];
}

export const projectVisualCopy = {
  label: 'ESQUEMA CONCEPTUAL',
  geo: {
    search: 'BÚSQUEDA GEOGRÁFICA',
    nearby: 'CERCANOS',
    order: 'POPULARIDAD',
    cluster: 'CLUSTER',
  },
  clusters: {
    characteristics: 'CARACTERÍSTICAS',
    prototypes: 'PROTOTIPOS',
    newPrototype: 'NUEVO PROTOTIPO',
    variety: 'VARIEDAD',
    quality: 'CALIDAD',
  },
  warehouse: {
    fact: 'HECHOS',
    dimension: 'DIMENSIÓN',
    etl: 'ETL',
    model: 'MODELO',
    dashboards: 'DASHBOARDS',
    incomplete: 'a completar',
  },
} as const;

export const projectVisualDefinitions = {
  'commerce-flow': {
    title: 'Flujo de comercio electrónico',
    description: 'Esquema conceptual: catálogo, carrito, pago y envío. Ramas de Google Login, Mercado Pago y panel de administración. No representa una captura del producto.',
    nodes: [
      { id: 'catalog', label: 'CATÁLOGO', lines: ['CATÁLOGO'], x: 40, y: 194, width: 140, height: 64 },
      { id: 'cart', label: 'CARRITO', lines: ['CARRITO'], x: 208, y: 194, width: 140, height: 64 },
      { id: 'payment', label: 'PAGO', lines: ['PAGO'], x: 376, y: 194, width: 140, height: 64 },
      { id: 'shipping', label: 'ENVÍO', lines: ['ENVÍO'], x: 544, y: 194, width: 140, height: 64 },
      { id: 'login', label: 'GOOGLE LOGIN', lines: ['GOOGLE', 'LOGIN'], x: 208, y: 56, width: 140, height: 82 },
      { id: 'mercado-pago', label: 'MERCADO PAGO', lines: ['MERCADO', 'PAGO'], x: 376, y: 320, width: 140, height: 82 },
      { id: 'admin', label: 'PANEL ADMIN', lines: ['PANEL', 'ADMIN'], x: 40, y: 320, width: 140, height: 82 },
    ],
    edges: [
      { id: 'catalog-cart', from: 'catalog', to: 'cart', path: 'M180 226H208' },
      { id: 'cart-payment', from: 'cart', to: 'payment', path: 'M348 226H376' },
      { id: 'payment-shipping', from: 'payment', to: 'shipping', path: 'M516 226H544' },
      { id: 'login-cart', from: 'login', to: 'cart', path: 'M278 138V194', branch: true },
      { id: 'payment-mercado', from: 'payment', to: 'mercado-pago', path: 'M446 258V320', branch: true },
      { id: 'catalog-admin', from: 'catalog', to: 'admin', path: 'M110 258V320', branch: true },
    ],
    legend: [
      { id: 'catalog', label: 'CATÁLOGO' }, { id: 'cart', label: 'CARRITO' },
      { id: 'payment', label: 'PAGO' }, { id: 'shipping', label: 'ENVÍO' },
      { id: 'login', label: 'GOOGLE LOGIN' }, { id: 'mercado-pago', label: 'MERCADO PAGO' },
      { id: 'admin', label: 'PANEL ADMIN' },
    ],
  },
  'event-flow': {
    title: 'Arquitectura orientada a eventos',
    description: 'Esquema conceptual: API de Next.js, topic de comandos, procesador, topic de eventos, Server-Sent Events y timeline. Una rama del procesador llega a DLQ. Los paquetes son ilustrativos; no representan transacciones medidas. Cada rótulo permite resaltar sus conexiones al recibir foco.',
    nodes: [
      { id: 'api', label: 'API (Next.js)', lines: ['API', '(Next.js)'], x: 38, y: 68, width: 172, height: 84 },
      { id: 'commands', label: 'topic comandos', lines: ['topic', 'comandos'], x: 274, y: 68, width: 172, height: 84 },
      { id: 'processor', label: 'Procesador', lines: ['Procesador'], x: 510, y: 68, width: 172, height: 84 },
      { id: 'events', label: 'topic eventos', lines: ['topic', 'eventos'], x: 510, y: 256, width: 172, height: 84 },
      { id: 'sse', label: 'SSE', lines: ['SSE'], x: 274, y: 256, width: 172, height: 84 },
      { id: 'timeline', label: 'Timeline', lines: ['Timeline'], x: 38, y: 256, width: 172, height: 84 },
      { id: 'dlq', label: 'DLQ', lines: ['DLQ'], x: 274, y: 166, width: 172, height: 64 },
    ],
    edges: [
      { id: 'api-commands', from: 'api', to: 'commands', path: 'M210 110H274' },
      { id: 'commands-processor', from: 'commands', to: 'processor', path: 'M446 110H510' },
      { id: 'processor-events', from: 'processor', to: 'events', path: 'M596 152V256' },
      { id: 'events-sse', from: 'events', to: 'sse', path: 'M510 298H446' },
      { id: 'sse-timeline', from: 'sse', to: 'timeline', path: 'M274 298H210' },
      { id: 'processor-dlq', from: 'processor', to: 'dlq', path: 'M550 152V198H446', branch: true },
    ],
    legend: [
      { id: 'api', label: 'API (Next.js)' }, { id: 'commands', label: 'topic comandos' },
      { id: 'processor', label: 'Procesador' }, { id: 'events', label: 'topic eventos' },
      { id: 'sse', label: 'SSE' }, { id: 'timeline', label: 'Timeline' }, { id: 'dlq', label: 'DLQ' },
    ],
  },
  geo: {
    title: 'Búsqueda geográfica y agrupación',
    description: 'Esquema conceptual sobre una retícula abstracta: un radio de búsqueda relaciona puntos cercanos, un círculo agrupa puntos y unas barras indican orden de popularidad sin valores. No corresponde a un mapa ni a coordenadas reales.',
    nodes: [], edges: [],
    legend: [
      { id: 'search', label: projectVisualCopy.geo.search }, { id: 'nearby', label: projectVisualCopy.geo.nearby },
      { id: 'order', label: projectVisualCopy.geo.order }, { id: 'cluster', label: projectVisualCopy.geo.cluster },
    ],
  },
  clusters: {
    title: 'Clasificación conceptual con ART1',
    description: 'Esquema conceptual de características binarias y asignación a prototipos. Un patrón sin coincidencia se vincula a un nuevo prototipo. Las etapas de variedad y calidad se muestran encadenadas. Sin porcentajes ni resultados de clasificación.',
    nodes: [], edges: [],
    legend: [
      { id: 'features', label: projectVisualCopy.clusters.characteristics },
      { id: 'prototypes', label: projectVisualCopy.clusters.prototypes },
      { id: 'new', label: projectVisualCopy.clusters.newPrototype },
      { id: 'variety', label: projectVisualCopy.clusters.variety }, { id: 'quality', label: projectVisualCopy.clusters.quality },
    ],
  },
  'dw-structure': {
    title: 'Modelo conceptual de Data Warehouse',
    description: 'Esquema conceptual en estrella: bloques de hechos y dimensiones sin campos inventados. El recorrido ETL, modelo y dashboards termina en ejes vacíos marcados a completar. No contiene KPIs ni datos del negocio.',
    nodes: [], edges: [],
    legend: [
      { id: 'facts', label: projectVisualCopy.warehouse.fact }, { id: 'dimensions', label: projectVisualCopy.warehouse.dimension },
      { id: 'etl', label: projectVisualCopy.warehouse.etl }, { id: 'model', label: projectVisualCopy.warehouse.model },
      { id: 'dashboards', label: projectVisualCopy.warehouse.dashboards }, { id: 'pending', label: projectVisualCopy.warehouse.incomplete },
    ],
  },
} as const satisfies Record<ProjectKeyVisual, ProjectVisualDefinition>;

// Abstract geometry only. These coordinates/patterns are not project data.
export const projectVisualGeometry = {
  geo: {
    points: [
      [112, 164], [160, 232], [220, 194], [264, 142], [290, 246],
      [352, 210], [372, 120], [430, 285], [138, 328], [322, 342],
    ],
    nearby: [1, 2, 4],
    orderWidths: [118, 86, 56],
    clusterPoints: [[390, 302], [414, 298], [406, 322]],
  },
  clusters: {
    rows: [
      [true, false, true, false, true],
      [true, false, true, false, true],
      [false, true, false, true, false],
      [true, true, false, false, true],
    ],
    prototypes: [
      [true, false, true, false, true],
      [false, true, false, true, false],
      [true, true, false, false, true],
    ],
    assignments: [0, 0, 1, 2],
  },
  warehouse: {
    dimensions: [[62, 80], [476, 80], [62, 224], [476, 224]],
    facts: [[260, 122], [338, 122], [260, 200], [338, 200]],
  },
} as const;
