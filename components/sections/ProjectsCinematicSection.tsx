import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getProjectBySlug } from '@/data/projects';
import { ProjectMedia } from '@/components/projects/ProjectMedia';
import { ProjectCoverTransition } from '@/components/motion/ProjectTransitions';
import { ProjectsMotion } from './ProjectsMotion';

export interface ShowcaseProject {
  id: string;
  categoria: string;
  titulo: string;
  problema?: string;
  solucion?: string;
  descripcion: string;
  stack: string[];
  stackCompleto: string[];
  imagen: string;
  alt: string;
  href: string;
  nombreCorto: string;
  contactQuery: string;
}

// 5 curated flagship projects for Dos Orillas Estudio
export const SHOWCASE_PROJECTS: readonly ShowcaseProject[] = [
  {
    id: 'mate-unico',
    categoria: 'E-COMMERCE / SISTEMAS',
    titulo: 'Mate Único',
    // TODO: reemplazar por problema/solución final cuando el cliente los provea
    descripcion: 'Tienda digital especializada con checkout integrado, catálogo dinámico y panel de administración en tiempo real.',
    stack: ['React', 'Node.js', 'PostgreSQL', 'Mercado Pago', 'Tailwind'],
    stackCompleto: ['React (Router)', 'Node.js/Express', 'PostgreSQL', 'Strapi', 'API de Mercado Pago', 'Google OAuth'],
    imagen: '/projects/mate-unico/cover.webp',
    alt: 'Plataforma e-commerce Mate Único',
    href: '/projects/mate-unico',
    nombreCorto: 'Mate Único',
    contactQuery: 'ecommerce',
  },
  {
    id: 'gestion-aeroportuaria',
    categoria: 'BACKEND / DATOS / GEOLOCALIZACIÓN',
    titulo: 'Gestión Aeroportuaria',
    // TODO: reemplazar por problema/solución final cuando el cliente los provea
    descripcion: 'Plataforma geoespacial para monitoreo de tráfico aéreo e infraestructura con visualización interactiva y APIs.',
    stack: ['API REST', 'MongoDB', 'Redis', 'Leaflet', 'Docker'],
    stackCompleto: ['API REST', 'MongoDB', 'Redis', 'Leaflet', 'Docker', 'Docker Compose'],
    imagen: '/projects/gestion-aeroportuaria/cover.webp',
    alt: 'Sistema de Gestión Aeroportuaria con mapas interactivos',
    href: '/projects/gestion-aeroportuaria',
    nombreCorto: 'Aeropuertos',
    contactQuery: 'sistemas',
  },
  {
    id: 'clasificador-de-frutas',
    categoria: 'INTELIGENCIA ARTIFICIAL',
    titulo: 'Clasificador de Frutas',
    // TODO: reemplazar por problema/solución final cuando el cliente los provea
    descripcion: 'Red neuronal ART1 aplicada a la clasificación automática y control de calidad visual en procesos industriales.',
    stack: ['Python', 'Redes Neuronales', 'ART1', 'Computer Vision'],
    stackCompleto: ['Python', 'ART1 (Carpenter-Grossberg)', 'Redes Neuronales', 'Computer Vision'],
    imagen: '/projects/clasificador-de-frutas/cover.webp',
    alt: 'Clasificador de frutas con algoritmo neuronal ART1',
    href: '/projects/clasificador-de-frutas',
    nombreCorto: 'Clasificador IA',
    contactQuery: 'ia',
  },
  {
    id: 'retail-vision',
    categoria: 'DATOS / BUSINESS INTELLIGENCE',
    titulo: 'Retail Vision',
    // TODO: reemplazar por problema/solución final cuando el cliente los provea
    descripcion: 'Arquitectura de Data Warehouse y dashboards analíticos para la toma de decisiones comerciales estratégicas.',
    stack: ['PostgreSQL', 'Tableau', 'Data Warehouse', 'ETL Pipeline', 'SQL'],
    stackCompleto: ['PostgreSQL', 'Tableau', 'Data Warehouse', 'ETL Pipeline', 'SQL'],
    imagen: '/projects/retail-vision/cover.webp',
    alt: 'Dashboard de métricas comerciales Retail Vision',
    href: '/projects/retail-vision',
    nombreCorto: 'Retail Vision',
    contactQuery: 'datos',
  },
  {
    id: 'transacciones-en-tiempo-real',
    categoria: 'ARQUITECTURA / SISTEMAS DISTRIBUIDOS',
    titulo: 'Transacciones en Tiempo Real',
    // TODO: reemplazar por problema/solución final cuando el cliente los provea
    descripcion: 'Arquitectura orientada a eventos con Kafka y SSE para procesamiento transaccional resiliente y timeline en vivo.',
    stack: ['Next.js', 'Apache Kafka', 'Event-Driven', 'SSE', 'Node.js'],
    stackCompleto: ['Next.js', 'KafkaJS', 'Apache Kafka', 'Server-Sent Events', 'Event-Driven Architecture'],
    imagen: '/projects/transacciones-en-tiempo-real/cover.webp',
    alt: 'Arquitectura de eventos y transacciones en tiempo real',
    href: '/projects/transacciones-en-tiempo-real',
    nombreCorto: 'Tiempo Real',
    contactQuery: 'arquitectura',
  },
];

export interface ProjectsCinematicSectionProps {
  items?: readonly ShowcaseProject[];
  className?: string;
}

const two = (value: number) => String(value).padStart(2, '0');

export function ProjectsCinematicSection({ items = SHOWCASE_PROJECTS, className = '' }: ProjectsCinematicSectionProps) {
  const count = items.length;
  if (count === 0) return null;
  return <section id="proyectos" className={`pj ${className}`} data-scene="proyectos" data-cover-restore="native" data-theme="navy-deep" data-nav="dark" aria-labelledby="projects-title">
    <div className="pj-stage">
      {/* Atmósfera: la portada de cada proyecto, desenfocada, tiñe toda la escena. */}
      <div className="pj-atmosphere" aria-hidden="true">
        {items.map(item => <div className="pj-ambient" key={item.id}>
          <Image src={item.imagen} alt="" fill sizes="24vw" />
        </div>)}
        <span className="pj-vignette" />
        <span className="pj-grain" />
      </div>

      <header className="pj-head">
        <div className="pj-title-row">
          <h2 id="projects-title" className="pj-title"><span className="pj-line"><span className="pj-line-in">PROYECTOS.</span></span></h2>
        </div>
        <Link href="/projects" className="btn btn-ghost btn-sm pj-all" title="Ver el catálogo completo de proyectos">
          <span>Ver todos los proyectos ({two(count)})</span><span className="btn-icon" aria-hidden="true">↗</span>
        </Link>
      </header>

      <div className="pj-items">
        {items.map((item, index) => {
          const project = getProjectBySlug(item.id);
          const sourceId = `home:${item.id}`;
          const transition = { 'data-project-transition-link': item.id, 'data-project-transition-source': sourceId };
          return <article className="pj-item" key={item.id} data-project={item.id} style={{ '--i': index } as CSSProperties}>
            <div className="pj-info">
              <p className="pj-category mono">{item.categoria}</p>
              <h3 className="pj-name"><span className="pj-line"><span className="pj-line-in">{item.titulo}</span></span></h3>
              <p className="pj-summary">{item.descripcion}</p>
              <ul className="pj-pills" aria-label="Tecnologías">
                {item.stack.map(tech => <li className="pj-pill mono" key={tech}>{tech}</li>)}
              </ul>
              <div className="pj-actions">
                <a href={item.href} className="btn btn-primary btn-sm" {...transition}>
                  <span>Ver caso de estudio</span><span className="btn-icon" aria-hidden="true">→</span>
                </a>
                <a href="#contacto" className="btn btn-ghost btn-sm">
                  <span>Quiero algo así</span><span className="btn-icon" aria-hidden="true">→</span>
                </a>
              </div>
            </div>

            <div className="pj-card">
              <a className="pj-card-link" href={item.href} data-cursor="ver" aria-label={`Ver caso de estudio: ${item.titulo}`} {...transition}>
                <ProjectCoverTransition className="pj-cover" slug={item.id} role="source" sourceId={sourceId}>
                  <div className="pj-tilt">
                    {project
                      ? <ProjectMedia project={project} ratio="16 / 10" sizes="(min-width:1024px) 50vw, 92vw" className="pj-media" idScope={`pj-${item.id}`} />
                      : <Image src={item.imagen} alt={item.alt} width={2400} height={1500} sizes="(min-width:1024px) 50vw, 92vw" />}
                    <span className="pj-sheen" aria-hidden="true" />
                    <span className="pj-badge mono" aria-hidden="true">{two(index + 1)}</span>
                  </div>
                </ProjectCoverTransition>
              </a>
            </div>
          </article>;
        })}
      </div>

      {/* Controles del carrusel: riel de proyectos y flechas (se muestran con JS). */}
      <div className="pj-controls">
        <div className="pj-rail">
          <span className="pj-rail-fill" aria-hidden="true" />
          {items.map((item, index) => <button type="button" className="pj-rail-item mono" key={item.id} data-index={index}
            aria-label={`Ir al proyecto ${index + 1} de ${count}: ${item.nombreCorto}`}>
            <span className="pj-rail-num">{two(index + 1)}</span><span className="pj-rail-name">{item.nombreCorto}</span>
          </button>)}
        </div>
        <div className="pj-pager mono">
          <button type="button" className="pj-step pj-step-prev" data-step="-1" aria-label="Proyecto anterior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>
            <span className="pj-step-label" aria-hidden="true">Anterior</span>
          </button>
          <span className="pj-counter" aria-hidden="true"><b className="pj-counter-now">01</b><i>/</i><span>{two(count)}</span></span>
          <button type="button" className="pj-step pj-step-next" data-step="1" aria-label="Siguiente proyecto">
            <span className="pj-step-label" aria-hidden="true">Siguiente</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    </div>
    <ProjectsMotion />
  </section>;
}

export default ProjectsCinematicSection;
