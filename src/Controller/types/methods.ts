import {TFieldSpec} from './misc';
import {
  CommonOptions, DeleteWriteOpResultObject,
  FilterQuery,
  FindOneOptions,
  IndexOptions,
  MongoCountPreferences, MongoDistinctPreferences,
  OptionalId,
  UpdateManyOptions,
  UpdateOneOptions,
  UpdateQuery,
  UpdateWriteOpResult,
  WithId,
} from 'mongodb';
import {ObjectId} from 'bson';
import {TFlattenIfArray, TIf} from '../../types';
import {ITimestampsMixin} from './mixins';

/**
 * Options which could be used while searching for entities in soft delete mode.
 */
interface ISoftDeleteFindOptions {
  /**
   * Should deleted entities be included.
   * @default false
   */
  includeDeleted?: boolean;
}

/* createIndex */
export type TCreateIndex<Schema> =
  (fieldOrSpec: TFieldSpec<Schema>, options?: IndexOptions) => Promise<string>;

/* countDocuments */
export type TCountDocuments<Schema,
  UseSoftDelete extends boolean> =
  (
    query?: FilterQuery<Schema>,
    options?: MongoCountPreferences,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<number>;

/* createOne */
export type TCreateOneData<Schema> =
  Omit<OptionalId<Schema>, keyof ITimestampsMixin> & Partial<ITimestampsMixin>;

type TCreateOneResult<Schema> =
  WithId<Schema>
  & ITimestampsMixin;

export type TCreateOne<Schema> =
  (data: TCreateOneData<Schema>) => Promise<TCreateOneResult<Schema>>

/* createMany */
export type TCreateMany<Schema> =
  (data: TCreateOneData<Schema>[]) => Promise<TCreateOneResult<Schema>[]>;

/* dropIndex */
export type TDropIndex<Schema> = (
  indexNameOrFieldSpec: string | TFieldSpec<Schema>,
  options?: CommonOptions & {maxTimeMS?: number},
) => Promise<void>;

/* findById */
export type TFindById<Schema,
  UseSoftDelete extends boolean> =
  <T = Schema>(
    id: ObjectId,
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<Schema | null>;

/* findByIds */
export type TFindByIds<Schema,
  UseSoftDelete extends boolean> =
  <T = Schema>(
    ids: ObjectId[],
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<Schema[]>;

/* find */
export type TFind<Schema, UseSoftDelete extends boolean> =
  <T = Schema>(
    query?: FilterQuery<Schema>,
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<T[]>;

/* findOne */
export type TFindOne<Schema,
  UseSoftDelete extends boolean> =
  <T = Schema>(
    query?: FilterQuery<Schema>,
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<T | null>;

/* updateOne / updateMany */
export type TUpdateOneOrMany<Schema,
  UseSoftDelete extends boolean,
  UseMany extends boolean> = (
  query: FilterQuery<Schema>,
  update: UpdateQuery<Schema> | Partial<Schema>,
  options?: TIf<UseMany, UpdateManyOptions, UpdateOneOptions>,
  findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
) => Promise<UpdateWriteOpResult>;

/* updateById */
export type TUpdateById<Schema extends {_id: any},
  UseSoftDelete extends boolean> = (
  id: Schema['_id'],
  update: UpdateQuery<Schema> | Partial<Schema>,
  options?: UpdateOneOptions,
  findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
) => Promise<UpdateWriteOpResult>;

/* deleteOne */
export type TDeleteOneOrMany<Schema,
  UseSoftDelete extends boolean> = (
  filter: FilterQuery<Schema>,
  options?: CommonOptions & {bypassDocumentValidation?: boolean},
  findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
) => Promise<TIf<UseSoftDelete,
  UpdateWriteOpResult,
  DeleteWriteOpResultObject>>;

/* deleteById / deleteByIds */
export type TDeleteByIdOrIds<Schema extends {_id: any},
  UseSoftDelete extends boolean,
  UseMany extends boolean> = (
  idOrIds: UseMany extends true ? Schema['_id'][] : Schema['_id'],
  options?: CommonOptions & {bypassDocumentValidation?: boolean},
  findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
) => Promise<TIf<UseSoftDelete,
  UpdateWriteOpResult,
  DeleteWriteOpResultObject>>;

/* distinct */
export type TDistinct<Schema,
  UseSoftDelete extends boolean> =
  <Key extends keyof Schema>(
    key: Exclude<Key, number | symbol>,
    query?: FilterQuery<Schema>,
    options?: MongoDistinctPreferences,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<TFlattenIfArray<Schema[Key]>[]>;

/* insertOne */
export type TInsertOne<Schema> =
  (item: OptionalId<Schema>) => Promise<WithId<Schema>>;

/* insertMany */
export type TInsertMany<Schema> =
  (items: OptionalId<Schema>[]) => Promise<WithId<Schema>[]>;