import {Collection} from 'mongodb';

/**
 * Field specification for index creation.
 */
export type TFieldSpec<Schema> =
  | keyof Schema
  | { [key in keyof Schema | string]?: -1 | 1 | 'text' | any };

/**
 * Options which could be used to create controller class.
 */
export interface IControllerOptions<Schema,
  UseTimestamps extends boolean,
  UseSoftDelete extends boolean> {
  /**
   * Collection name.
   */
  collection: Collection<Schema>;
  /**
   * Should controller use timestamps. It adds such fields as "updatedAt: Date"
   * and "createdAt: Date" to schema.
   * @default false
   */
  useTimestamps?: UseTimestamps;
  /**
   * Should controller use soft delete. If adds such field as
   * "deletedAt?: Date". So, controller does not physically deletes documents
   * and just adds this field. Additionally, controller will be unable to find
   * these entities until special option is passed.
   * @default false
   */
  useSoftDelete?: UseSoftDelete;
}

/**
 * All types of options which could be used to create controller class.
 */
export type TControllerOptions<Schema,
  UseTimestamps extends boolean,
  UseSoftDelete extends boolean> =
  // Collection itself.
  | Collection<Schema>
  // Or options.
  | IControllerOptions<Schema, UseTimestamps, UseSoftDelete>;