import {TAnyObject, TFieldSpec, TFlattenIfArray} from './shared';
import {
  CommonOptions, DeleteWriteOpResultObject,
  FilterQuery,
  FindOneOptions, IndexOptions, MongoCountPreferences, MongoDistinctPreferences,
  ObjectId,
  OptionalId, UpdateManyOptions, UpdateOneOptions,
  UpdateQuery, UpdateWriteOpResult, WithId,
} from 'mongodb';
import {TIf} from '../../types';

/**
 * Timestamps fields.
 */
export interface ITimestamps {
  /**
   * Date when entity was updated.
   */
  updatedAt: Date;

  /**
   * Date when entity was created.
   */
  createdAt: Date;
}

/**
 * Soft delete fields.
 */
interface ISoftDelete {
  /**
   * Date when entity was deleted.
   */
  deletedAt: Date;
}

/**
 * Options which could be used while searching for entities in soft delete mode.
 */
export interface ISoftDeleteFindOptions {
  /**
   * Should deleted entities be included.
   * @default false
   */
  includeDeleted?: boolean;
}

/**
 * Applies MongoDB default fields. Additionally, applies fields depending on
 * timestamps and soft delete.
 */
export type TApplyFlags<Schema extends TAnyObject,
  UseTimestamps extends boolean,
  UseSoftDelete extends boolean> =
  WithId<Schema> &
  TIf<UseTimestamps, ITimestamps, {}> &
  TIf<UseSoftDelete, Partial<ISoftDelete>, {}>;

/* createIndex */
export type TCreateIndex<Schema extends TAnyObject> =
  (fieldOrSpec: TFieldSpec<Schema>, options?: IndexOptions) => Promise<string>;

/* countDocuments */
export type TCountDocuments<Schema extends TAnyObject,
  UseSoftDelete extends boolean> =
  (
    query?: FilterQuery<Schema>,
    options?: MongoCountPreferences,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<number>;

/* createOne */
export type TCreateOneData<Schema extends TAnyObject> =
  OptionalId<Schema> & Partial<ITimestamps>;

type TCreateOneResult<Schema extends TAnyObject> = WithId<Schema> & ITimestamps;

export type TCreateOne<Schema extends TAnyObject> =
  (data: TCreateOneData<Schema>) => Promise<TCreateOneResult<Schema>>

/* createMany */
export type TCreateMany<Schema extends TAnyObject> =
  (data: TCreateOneData<Schema>[]) => Promise<TCreateOneResult<Schema>[]>;

/* dropIndex */
export type TDropIndex<Schema extends TAnyObject> = (
  indexNameOrFieldSpec: string | TFieldSpec<Schema>,
  options?: CommonOptions & { maxTimeMS?: number },
) => Promise<void>;

/* findById */
export type TFindById<Schema extends TAnyObject,
  UseSoftDelete extends boolean> =
  <T = Schema>(
    id: ObjectId,
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<Schema | null>;

/* findByIds */
export type TFindByIds<Schema extends TAnyObject,
  UseSoftDelete extends boolean> =
  <T = Schema>(
    ids: ObjectId[],
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<Schema[]>;

/* find */
export type TFind<Schema extends TAnyObject, UseSoftDelete extends boolean> =
  <T = Schema>(
    query?: FilterQuery<Schema>,
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<T[]>;

/* findOne */
export type TFindOne<Schema extends TAnyObject,
  UseSoftDelete extends boolean> =
  <T = Schema>(
    query?: FilterQuery<Schema>,
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<T | null>;

/* updateOne / updateMany */
export type TUpdateOneOrMany<Schema extends TAnyObject,
  UseSoftDelete extends boolean,
  UseMany extends boolean> = (
  query: FilterQuery<Schema>,
  update: UpdateQuery<Schema> | Partial<Schema>,
  options?: TIf<UseMany, UpdateManyOptions, UpdateOneOptions>,
  findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
) => Promise<UpdateWriteOpResult>;

/* updateById */
export type TUpdateById<Schema extends TAnyObject,
  UseSoftDelete extends boolean> = (
  id: ObjectId,
  update: UpdateQuery<Schema> | Partial<Schema>,
  options?: UpdateOneOptions,
  findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
) => Promise<UpdateWriteOpResult>;

/* deleteOne */
export type TDeleteOneOrMany<Schema extends TAnyObject,
  UseSoftDelete extends boolean> = (
  filter: FilterQuery<Schema>,
  options?: CommonOptions & { bypassDocumentValidation?: boolean },
  findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
) => Promise<TIf<UseSoftDelete,
  UpdateWriteOpResult,
  DeleteWriteOpResultObject>>;

/* deleteById / deleteByIds */
export type TDeleteByIdOrIds<UseSoftDelete extends boolean,
  UseMany extends boolean> = (
  idOrIds: UseMany extends true ? ObjectId[] : ObjectId,
  options?: CommonOptions & { bypassDocumentValidation?: boolean },
  findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
) => Promise<TIf<UseSoftDelete,
  UpdateWriteOpResult,
  DeleteWriteOpResultObject>>;

/* distinct */
export type TDistinct<Schema extends TAnyObject,
  UseSoftDelete extends boolean> =
  <Key extends keyof Schema>(
    key: Exclude<Key, number | symbol>,
    query?: FilterQuery<Schema>,
    options?: MongoDistinctPreferences,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<TFlattenIfArray<Schema[Key]>[]>;

/* insertOne */
export type TInsertOne<Schema extends TAnyObject> =
  (item: OptionalId<Schema>) => Promise<WithId<Schema>>;

/* insertMany */
export type TInsertMany<Schema extends TAnyObject> =
  (items: OptionalId<Schema>[]) => Promise<WithId<Schema>[]>;

export interface IController<Schema extends TApplyFlags<{},
  UseTimestamps,
  UseSoftDelete>,
  UseTimestamps extends boolean,
  UseSoftDelete extends boolean> {
  /**
   * Creates index.
   */
  createIndex: TCreateIndex<Schema>;

  /**
   * Counts documents.
   */
  countDocuments: TCountDocuments<Schema, UseSoftDelete>;

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
  deleteById: TDeleteByIdOrIds<UseSoftDelete, false>;

  /**
   * Deletes entities by IDS.
   */
  deleteByIds: TDeleteByIdOrIds<UseSoftDelete, true>;

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

export interface ITimestampsController<Schema extends TApplyFlags<{},
  UseTimestamps,
  UseSoftDelete>,
  UseTimestamps extends boolean,
  UseSoftDelete extends boolean>
  extends IController<Schema, UseTimestamps, UseSoftDelete>{
  createOne: TCreateOne<Schema>;
  createMany: TCreateMany<Schema>
}

export type TController<Schema extends TApplyFlags<{},
  UseTimestamps,
  UseSoftDelete>,
  UseTimestamps extends boolean,
  UseSoftDelete extends boolean> =
  TIf<UseTimestamps,
    {
      new(): ITimestampsController<Schema, UseTimestamps, UseSoftDelete>,
      prototype: ITimestampsController<Schema, UseTimestamps, UseSoftDelete>,
    },
    {
      new(): IController<Schema, UseTimestamps, UseSoftDelete>,
      prototype: IController<Schema, UseTimestamps, UseSoftDelete>,
    }>;