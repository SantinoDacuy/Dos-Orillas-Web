export const HOME_GRID_LIMIT = 8;

export interface ProjectGridLayout {
  row: number;
  columnStart: number;
  columnSpan: number;
  ratio: string;
  offsetLevel: number;
  side: 'left' | 'right';
  speed: number | null;
}

const slots = [
  { row: 0, columnStart: 1, columnSpan: 7, offsetLevel: 0 },
  { row: 0, columnStart: 8, columnSpan: 5, offsetLevel: 1 },
  { row: 1, columnStart: 1, columnSpan: 5, offsetLevel: 1 },
  { row: 1, columnStart: 6, columnSpan: 7, offsetLevel: 0 },
  { row: 2, columnStart: 1, columnSpan: 4, offsetLevel: 0 },
  { row: 2, columnStart: 5, columnSpan: 4, offsetLevel: 1 },
  { row: 2, columnStart: 9, columnSpan: 4, offsetLevel: 2 },
] as const;
const ratios = ['4 / 5', '16 / 10', '1 / 1', '3 / 2'] as const;
const speeds: Readonly<Record<number, number>> = { 1: .96, 2: 1.04, 4: .98 };

/** Seven slots form three rows: [7|5], [5|7], [4|4|4]. */
export function getProjectGridLayout(index: number): ProjectGridLayout {
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const slot = slots[safeIndex % slots.length]!;
  return {
    row: Math.floor(safeIndex / slots.length) * 3 + slot.row + 1,
    columnStart: slot.columnStart,
    columnSpan: slot.columnSpan,
    ratio: ratios[safeIndex % ratios.length]!,
    offsetLevel: slot.offsetLevel,
    side: safeIndex % 2 === 0 ? 'left' : 'right',
    // At most three cards move, even if the index page later contains many more.
    speed: speeds[safeIndex] ?? null,
  };
}

export function projectGridSizes(columnSpan: number): string {
  return `(min-width: 1024px) ${Math.ceil(columnSpan / 12 * 100)}vw, (min-width: 640px) 88vw, 88vw`;
}
