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
import {TAnySchema, TFlattenIfArray, TIf} from '../../types';
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
export type TCreateIndex<Schema extends TAnySchema> =
  (fieldOrSpec: TFieldSpec<Schema>, options?: IndexOptions) => Promise<string>;

/* countDocuments */
export type TCountDocuments<Schema extends TAnySchema,
  UseSoftDelete extends boolean> =
  (
    query?: FilterQuery<Schema>,
    options?: MongoCountPreferences,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<number>;

/* createOne */
export type TCreateOneData<Schema extends TAnySchema> =
  Omit<OptionalId<Schema>, keyof ITimestampsMixin> & Partial<ITimestampsMixin>;

type TCreateOneResult<Schema extends TAnySchema> =
  WithId<Schema>
  & ITimestampsMixin;

export type TCreateOne<Schema extends TAnySchema> =
  (data: TCreateOneData<Schema>) => Promise<TCreateOneResult<Schema>>

/* createMany */
export type TCreateMany<Schema extends TAnySchema> =
  (data: TCreateOneData<Schema>[]) => Promise<TCreateOneResult<Schema>[]>;

/* dropIndex */
export type TDropIndex<Schema extends TAnySchema> = (
  indexNameOrFieldSpec: string | TFieldSpec<Schema>,
  options?: CommonOptions & { maxTimeMS?: number },
) => Promise<void>;

/* findById */
export type TFindById<Schema extends TAnySchema,
  UseSoftDelete extends boolean> =
  <T = Schema>(
    id: ObjectId,
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<Schema | null>;

/* findByIds */
export type TFindByIds<Schema extends TAnySchema,
  UseSoftDelete extends boolean> =
  <T = Schema>(
    ids: ObjectId[],
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<Schema[]>;

/* find */
export type TFind<Schema extends TAnySchema, UseSoftDelete extends boolean> =
  <T = Schema>(
    query?: FilterQuery<Schema>,
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<T[]>;

/* findOne */
export type TFindOne<Schema extends TAnySchema,
  UseSoftDelete extends boolean> =
  <T = Schema>(
    query?: FilterQuery<Schema>,
    options?: FindOneOptions<T extends Schema ? Schema : T>,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<T | null>;

/* updateOne / updateMany */
export type TUpdateOneOrMany<Schema extends TAnySchema,
  UseSoftDelete extends boolean,
  UseMany extends boolean> = (
  query: FilterQuery<Schema>,
  update: UpdateQuery<Schema> | Partial<Schema>,
  options?: TIf<UseMany, UpdateManyOptions, UpdateOneOptions>,
  findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
) => Promise<UpdateWriteOpResult>;

/* updateById */
export type TUpdateById<Schema extends TAnySchema,
  UseSoftDelete extends boolean> = (
  id: ObjectId,
  update: UpdateQuery<Schema> | Partial<Schema>,
  options?: UpdateOneOptions,
  findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
) => Promise<UpdateWriteOpResult>;

/* deleteOne */
export type TDeleteOneOrMany<Schema extends TAnySchema,
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
export type TDistinct<Schema extends TAnySchema,
  UseSoftDelete extends boolean> =
  <Key extends keyof Schema>(
    key: Exclude<Key, number | symbol>,
    query?: FilterQuery<Schema>,
    options?: MongoDistinctPreferences,
    findOptions?: TIf<UseSoftDelete, ISoftDeleteFindOptions, never>,
  ) => Promise<TFlattenIfArray<Schema[Key]>[]>;

/* insertOne */
export type TInsertOne<Schema extends TAnySchema> =
  (item: OptionalId<Schema>) => Promise<WithId<Schema>>;

/* insertMany */
export type TInsertMany<Schema extends TAnySchema> =
  (items: OptionalId<Schema>[]) => Promise<WithId<Schema>[]>;