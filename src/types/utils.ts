/**
 * Conditional type.
 */
export type TIf<Condition, IfTrue, IfFalse> = Condition extends true
  ? IfTrue : IfFalse;

/**
 * Flattens in case when T is Array.
 */
export type TFlattenIfArray<T> = T extends Array<infer R> ? R : T;