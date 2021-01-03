export type TAnyObject = { [key: string]: any };
export type TDefaultSchema = TAnyObject;

/**
 * Field specification for index creation.
 */
export type TFieldSpec<Schema extends TDefaultSchema> =
  | keyof Schema
  | { [key in keyof Schema | string]?: -1 | 1 | 'text' | any };

export type TFlattenIfArray<T> = T extends Array<infer R> ? R : T;