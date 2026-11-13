/**
 * Value labels (architecture v1.1 section 7). Adapted, as an idea only, from the frozen lab's
 * provenance labels (see PROVENANCE.md): a result is never more trustworthy than its weakest input.
 */
export const VALUE_LABELS = ['approved', 'target', 'candidate', 'derived'] as const;
export type ValueLabel = (typeof VALUE_LABELS)[number];

/** Strength order: approved > target > derived > candidate. A derived value takes the weakest input label. */
const STRENGTH: Record<ValueLabel, number> = { approved: 3, target: 2, derived: 1, candidate: 0 };

export interface Labelled<T> {
  readonly value: T;
  readonly label: ValueLabel;
  readonly range?: readonly [number, number];
  readonly hypothesis?: string;
  readonly note?: string;
}

export function weakestLabel(...labels: ValueLabel[]): ValueLabel {
  if (labels.length === 0) return 'candidate';
  return labels.reduce((weakest, l) => (STRENGTH[l] < STRENGTH[weakest] ? l : weakest));
}
