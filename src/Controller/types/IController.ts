import {TApplyMixins} from './utils';
import {
  TCreateIndex,
  TCreateMany,
  TCreateOne,
  TUpdateById,
  TUpdateOneOrMany,
  TFindOne,
  TFind,
  TFindByIds,
  TFindById,
  TDeleteByIdOrIds,
  TDistinct,
  TDeleteOneOrMany,
  TCountDocuments,
  TInsertMany,
  TInsertOne,
  TDropIndex,
} from './methods';
import {Collection} from 'mongodb';
import {TIf} from '../../types';
import {ISoftDeleteMixin, ITimestampsMixin} from './mixins';

export type TDefaultSchema<UseTimestamps, UseSoftDelete> = {_id: any} &
  TIf<UseTimestamps, ITimestampsMixin, {}> &
  TIf<UseSoftDelete, Partial<ISoftDeleteMixin>, {}>;

export interface IController<Schema extends TDefaultSchema<UseTimestamps, UseSoftDelete>,
  UseTimestamps extends boolean,
  UseSoftDelete extends boolean> {
  /**
   * Wrapped collection.
   */
  readonly collection: Collection<Schema>;
  /**
   * Creates index.
   */
  createIndex: TCreateIndex<Schema>;
  /**
   * Counts documents.
   */
  countDocuments: TCountDocuments<Schema, UseSoftDelete>;
  /**
   * Creates entity with specified createdAt and updatedAt fields.
   */
  createOne: TCreateOne<Schema>;
  /**
   * Works the same as createMany but with many entities.
   */
  createMany: TCreateMany<Schema>
  /**
   * Deletes single entity.
   */
  deleteOne: TDeleteOneOrMany<Schema, UseSoftDelete>;
  /**
   * Deletes many entities.
   */
  deleteMany: TDeleteOneOrMany<Schema, UseSoftDelete>;
  /**
   * Deletes entity by ID.
   */
  deleteById: TDeleteByIdOrIds<Schema, UseSoftDelete, false>;
  /**
   * Deletes entities by IDS.
   */
  deleteByIds: TDeleteByIdOrIds<Schema, UseSoftDelete, true>;
  /**
   * Returns distinct values by key and query.
   */
  distinct: TDistinct<Schema, UseSoftDelete>;
  /**
   * Drops index.
   */
  dropIndex: TDropIndex<Schema>;
  /**
   * Finds entity by its ID.
   */
  findById: TFindById<Schema, UseSoftDelete>;
  /**
   * Finds entities by their IDs.
   */
  findByIds: TFindByIds<Schema, UseSoftDelete>;
  /**
   * Returns entities by query.
   */
  find: TFind<Schema, UseSoftDelete>;
  /**
   * Returns single entity by query.
   */
  findOne: TFindOne<Schema, UseSoftDelete>;
  /**
   * Inserts new entity.
   */
  insertOne: TInsertOne<Schema>;
  /**
   * Inserts new entities.
   */
  insertMany: TInsertMany<Schema>;
  /**
   * Updates single entity by query.
   */
  updateOne: TUpdateOneOrMany<Schema, UseSoftDelete, false>;
  /**
   * Updates many entities by query.
   */
  updateMany: TUpdateOneOrMany<Schema, UseSoftDelete, true>;
  /**
   * Update entity by its ID.
   */
  updateById: TUpdateById<Schema, UseSoftDelete>;
}

/**
 * Class returned from Controller function.
 */
export interface IControllerConstructor<Schema extends TApplyMixins<{},
  UseTimestamps,
  UseSoftDelete>,
  UseTimestamps extends boolean,
  UseSoftDelete extends boolean>
  extends IController<Schema, UseTimestamps, UseSoftDelete> {
  new(): {},
  prototype: {},
}