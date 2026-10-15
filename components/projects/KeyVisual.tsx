import { useId, type CSSProperties } from 'react';
import type { ProjectKeyVisual } from '@/data/projects';
import { svgMarkup } from '@/lib/svg-markup';
import {
  projectVisualCopy as copy,
  projectVisualDefinitions,
  projectVisualGeometry as geometry,
  type ProjectVisualDefinition,
} from '@/content/project-visuals';

export interface KeyVisualProps {
  kind: ProjectKeyVisual;
  projectTitle: string;
  className?: string;
  /** Disable legend tab stops when the entire media is inside a navigation link. */
  interactive?: boolean;
  /** Isolate RSC diagrams retained at different route/cover locations. */
  idScope?: string;
}

function Flow({ definition, arrowId, packets }: {
  definition: ProjectVisualDefinition; arrowId: string; packets: boolean;
}) {
  return <>
    {definition.edges.map((edge, index) => <g key={edge.id}>
      <path className={`kv-line kv-flow-edge${edge.branch ? ' kv-branch' : ''}`} d={edge.path}
        pathLength={1} markerEnd={`url(#${arrowId})`} data-kv-from={edge.from} data-kv-to={edge.to}
        style={{ '--kv-delay': `${index * 90}ms` } as CSSProperties} />
      {packets && <circle className={`kv-packet${edge.branch ? ' kv-packet-branch' : ''}`} r="4"
        style={{ offsetPath: `path('${edge.path}')`, '--kv-delay': `${1000 + index * 370}ms` } as CSSProperties} />}
    </g>)}
    {definition.nodes.map(node => <g className="kv-node" key={node.id} data-kv-node={node.id}>
      <rect className="kv-outline" x={node.x} y={node.y} width={node.width} height={node.height} rx="2" />
      <text className="kv-label" x={node.x + node.width / 2} y={node.y + node.height / 2}
        textAnchor="middle" dominantBaseline="central">
        {node.lines.map((line, index) => <tspan key={line} x={node.x + node.width / 2}
          dy={index === 0 ? `${-(node.lines.length - 1) * 0.55}em` : '1.1em'}>{line}</tspan>)}
      </text>
    </g>)}
  </>;
}

function Geo() {
  return <>
    {Array.from({ length: 10 }, (_, index) => <path key={`column-${index}`} className="kv-grid" d={`M${64 + index * 44} 80V366`} />)}
    {Array.from({ length: 7 }, (_, index) => <path key={`row-${index}`} className="kv-grid" d={`M64 ${80 + index * 44}H460`} />)}
    <circle className="kv-search-area" cx="220" cy="224" r="94" />
    <circle className="kv-line kv-radius" cx="220" cy="224" r="94" pathLength={1} />
    {geometry.geo.points.map(([x, y], index) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6"
      className={geometry.geo.nearby.some(value => value === index) ? 'kv-point kv-nearby' : 'kv-point'} />)}
    <circle className="kv-point kv-origin" cx="220" cy="224" r="8" />
    <circle className="kv-cluster-ring" cx="404" cy="311" r="29" />
    {geometry.geo.clusterPoints.map(([x, y]) => <circle key={`${x}-${y}`} className="kv-point kv-cluster-point" cx={x} cy={y} r="4" />)}
    <text className="kv-label kv-label-small" x="64" y="50">{copy.geo.search}</text>
    <text className="kv-label kv-label-small" x="156" y="390">{copy.geo.nearby}</text>
    <text className="kv-label kv-label-small" x="363" y="390">{copy.geo.cluster}</text>
    <path className="kv-grid" d="M504 104V350" />
    <text className="kv-label kv-label-small" x="530" y="124">{copy.geo.order}</text>
    {geometry.geo.orderWidths.map((width, index) => <rect key={width} className="kv-order-bar" x="530" y={164 + index * 60} width={width} height="8" />)}
  </>;
}

function Clusters({ arrowId }: { arrowId: string }) {
  return <>
    <text className="kv-label kv-label-small" x="60" y="54">{copy.clusters.characteristics}</text>
    <text className="kv-label kv-label-small" x="430" y="54">{copy.clusters.prototypes}</text>
    {geometry.clusters.rows.map((row, rowIndex) => <g key={`row-${rowIndex}`}>
      {row.map((active, column) => <rect key={column} className={`kv-cell${active ? ' kv-cell-active' : ''}`}
        x={62 + column * 40} y={84 + rowIndex * 64} width="26" height="26"
        style={{ '--kv-delay': `${rowIndex * 150 + column * 50}ms` } as CSSProperties} />)}
      <path className={`kv-line${rowIndex === 3 ? ' kv-branch' : ''}`} pathLength={1}
        d={`M268 ${97 + rowIndex * 64}C340 ${97 + rowIndex * 64},350 ${101 + (geometry.clusters.assignments[rowIndex] ?? 0) * 84},422 ${101 + (geometry.clusters.assignments[rowIndex] ?? 0) * 84}`}
        markerEnd={`url(#${arrowId})`} />
    </g>)}
    {geometry.clusters.prototypes.map((prototype, rowIndex) => <g key={`prototype-${rowIndex}`}
      className={rowIndex === 2 ? 'kv-new-prototype' : undefined}>
      {prototype.map((active, column) => <rect key={column} className={`kv-cell${active ? ' kv-cell-active' : ''}`}
        x={430 + column * 40} y={88 + rowIndex * 84} width="26" height="26" />)}
    </g>)}
    <text className="kv-label kv-label-small" x="430" y="326">{copy.clusters.newPrototype}</text>
    <path className="kv-grid" d="M62 350H656" />
    <text className="kv-label" x="146" y="408">{copy.clusters.variety}</text>
    <path className="kv-line" pathLength={1} d="M312 400H416" markerEnd={`url(#${arrowId})`} />
    <text className="kv-label" x="456" y="408">{copy.clusters.quality}</text>
  </>;
}

function Warehouse({ arrowId }: { arrowId: string }) {
  return <>
    {geometry.warehouse.dimensions.map(([x, y]) => <g key={`${x}-${y}`}>
      <path className="kv-line" pathLength={1} d={`M${x < 300 ? x + 178 : x} ${y + 32}L${x < 300 ? 260 : 410} ${y < 160 ? 159 : 237}`} />
      <rect className="kv-outline" x={x} y={y} width="178" height="64" />
      <text className="kv-label kv-label-small" x={x + 89} y={y + 32} textAnchor="middle" dominantBaseline="central">{copy.warehouse.dimension}</text>
    </g>)}
    {geometry.warehouse.facts.map(([x, y]) => <g key={`${x}-${y}`}>
      <rect className="kv-outline kv-fact" x={x} y={y} width="72" height="72" />
      <text className="kv-label kv-label-tiny" x={x + 36} y={y + 36} textAnchor="middle" dominantBaseline="central">{copy.warehouse.fact}</text>
    </g>)}
    <text className="kv-label kv-label-small" x="62" y="354">{copy.warehouse.etl}</text>
    <path className="kv-line" pathLength={1} d="M116 348H166" markerEnd={`url(#${arrowId})`} />
    <text className="kv-label kv-label-small" x="178" y="354">{copy.warehouse.model}</text>
    <path className="kv-line" pathLength={1} d="M282 348H328" markerEnd={`url(#${arrowId})`} />
    <text className="kv-label kv-label-small" x="340" y="354">{copy.warehouse.dashboards}</text>
    <path className="kv-outline" d="M548 316V380H598M620 316V380H670" />
    <text className="kv-label kv-label-tiny" x="608" y="414" textAnchor="middle">{copy.warehouse.incomplete}</text>
  </>;
}

/** Complete server markup. The optional motion island is mounted separately. */
export function KeyVisual({ kind, projectTitle, className = '', interactive = true, idScope = 'visual' }: KeyVisualProps) {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const safeScope = idScope.replace(/[^a-zA-Z0-9_-]/g, '-');
  const id = `kv-${safeScope}-${instanceId}`;
  const definition: ProjectVisualDefinition = projectVisualDefinitions[kind];
  const arrowId = `${id}-arrow`;
  const body = kind === 'commerce-flow' || kind === 'event-flow'
    ? Flow({ definition, arrowId, packets: kind === 'event-flow' })
    : kind === 'geo' ? Geo()
      : kind === 'clusters' ? Clusters({ arrowId })
        : Warehouse({ arrowId });
  return <figure className={`key-visual ${className}`} data-key-visual={kind} id={id}>
    <figcaption className="kv-caption">
      <span className="kv-concept-label">{copy.label}</span>
      <span className="sr-only">{projectTitle}: {definition.title}</span>
    </figcaption>
    <svg className="kv-svg" viewBox="0 0 720 450" width="720" height="450" role="img"
      aria-labelledby={`${id}-title ${id}-description`} focusable="false">
      <title id={`${id}-title`}>{`${projectTitle}: ${definition.title}`}</title>
      <desc id={`${id}-description`}>{definition.description}</desc>
      <defs><marker id={arrowId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M1 1L7 4L1 7" className="kv-arrow" />
      </marker></defs>
      <g aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgMarkup(body) }} />
    </svg>
    <ul className="kv-legend" aria-label={definition.title}>
      {definition.legend.map(item => <li key={item.id}>
        <span data-kv-key={item.id} tabIndex={kind === 'event-flow' && interactive ? 0 : undefined}
          aria-describedby={kind === 'event-flow' && interactive ? `${id}-note` : undefined}>{item.label}</span>
      </li>)}
    </ul>
    <p id={`${id}-note`} className="sr-only">{definition.description}</p>
  </figure>;
}
