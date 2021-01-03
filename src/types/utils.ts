/**
 * Conditional type.
 */
export type TIf<Condition, IfTrue, IfFalse> = Condition extends true
  ? IfTrue : IfFalse;