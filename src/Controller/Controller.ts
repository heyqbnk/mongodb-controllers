import {
  Collection,
  FilterQuery,
  OptionalId, WithId,
} from 'mongodb';
import {
  IController,
  TAnyObject,
  TCreateIndex,
  TDropIndex,
  TCreateOne,
  TInsertOne,
  ITimestamps,
  TCreateMany,
  TInsertMany,
  TCountDocuments,
  TCreateOneData,
  TDeleteOneOrMany,
  TDistinct,
  TApplyFlags,
  TDeleteByIdOrIds,
  TFindById,
  TFindByIds,
  TFind,
  TFindOne,
  TUpdateOneOrMany,
  TUpdateById, TController, ITimestampsController,
} from './types';
import {getIndexName} from './utils';

interface IControllerOptions<Schema extends TAnyObject,
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
  /**
   * Enables controller console messages.
   * @default false
   */
  debug?: boolean;
}

type TControllerOptions<Schema extends TAnyObject,
  UseTimestamps extends boolean,
  UseSoftDelete extends boolean> =
  | Collection<Schema>
  | IControllerOptions<Schema, UseTimestamps, UseSoftDelete>;

/**
 * Creates controller class.
 * @param {TControllerOptions<Schema, UseTimestamps, UseSoftDelete>} collectionNameOrOptions
 * @returns {{new(): IController<Schema, UseTimestamps, UseSoftDelete>, prototype: IController<Schema, UseTimestamps, UseSoftDelete>}}
 * @constructor
 */
export function Controller<Schema extends TApplyFlags<{},
  UseTimestamps,
  UseSoftDelete>,
  UseTimestamps extends boolean = false,
  UseSoftDelete extends boolean = false>(
  collectionNameOrOptions: TControllerOptions<Schema,
    UseTimestamps,
    UseSoftDelete>,
): TController<Schema, UseTimestamps, UseSoftDelete> {
  let collection: Collection<Schema>;
  let useTimestamps = false;
  let useSoftDelete = false;

  if ('collection' in collectionNameOrOptions) {
    const {
      collection: _collection,
      useTimestamps: _useTimestamps = false,
      useSoftDelete: _useSoftDelete = false,
    } = collectionNameOrOptions;
    collection = _collection;
    useTimestamps = _useTimestamps;
    useSoftDelete = _useSoftDelete;
  }

  class Controller
    implements IController<Schema, UseTimestamps, UseSoftDelete> {
    protected collection = collection;

    createIndex: TCreateIndex<Schema> = (fieldOrSpec, options) => {
      const indexName = options?.name || getIndexName(fieldOrSpec);

      return this.collection.createIndex(fieldOrSpec, {
        ...options,
        name: indexName,
      });
    };

    countDocuments: TCountDocuments<Schema, UseSoftDelete> = (
      query,
      options,
      findOptions,
    ) => {
      const {includeDeleted = false} = findOptions || {};

      return collection.countDocuments({
        ...(useSoftDelete && !includeDeleted
          ? {deletedAt: {$exists: false}}
          : {}),
        ...query,
      } as FilterQuery<Schema>, options);
    };

    deleteOne: TDeleteOneOrMany<Schema, UseSoftDelete> = (
      filter,
      options,
      findOptions,
    ) => {
      if (useSoftDelete) {
        const {includeDeleted = false} = findOptions || {};

        return collection.updateOne(
          {
            ...(includeDeleted ? {} : {deletedAt: {$exists: false}}),
            ...filter,
          } as FilterQuery<Schema>,
          {$set: {deletedAt: new Date()}} as any,
        );
      }
      return collection.deleteOne(filter, options) as any;
    };

    deleteMany: TDeleteOneOrMany<Schema, UseSoftDelete> = (
      filter,
      options,
      findOptions,
    ) => {
      if (useSoftDelete) {
        const {includeDeleted = false} = findOptions || {};

        return collection.updateMany(
          {
            ...(includeDeleted ? {} : {deletedAt: {$exists: false}}),
            ...filter,
          } as FilterQuery<Schema>,
          {$set: {deletedAt: new Date()}} as any,
        );
      }
      return collection.deleteMany(filter, options) as any;
    };

    deleteById: TDeleteByIdOrIds<UseSoftDelete, false> = (
      id,
      options,
      findOptions,
    ) => {
      return this.deleteOne(
        {_id: id} as FilterQuery<Schema>,
        options,
        findOptions,
      ) as any;
    };

    deleteByIds: TDeleteByIdOrIds<UseSoftDelete, true> = (
      ids,
      options,
      findOptions,
    ) => {
      return this.deleteMany(
        {_id: {$in: ids}} as FilterQuery<Schema>,
        options,
        findOptions,
      ) as any;
    };

    distinct: TDistinct<Schema, UseSoftDelete> = (
      key,
      query,
      options,
      findOptions,
    ) => {
      const {includeDeleted = false} = findOptions || {};

      return collection.distinct(key, {
        ...(useSoftDelete && !includeDeleted
          ? {deletedAt: {$exists: false}}
          : {}),
        ...query,
      } as FilterQuery<Schema>, options);
    };

    dropIndex: TDropIndex<Schema> = (indexNameOrFieldSpec, options) => {
      const indexName = typeof indexNameOrFieldSpec === 'string'
        ? indexNameOrFieldSpec
        : getIndexName(indexNameOrFieldSpec);

      return this.collection.dropIndex(indexName, options);
    };

    findById: TFindById<Schema, UseSoftDelete> = async (
      id,
      options,
      findOptions,
    ) => {
      const {includeDeleted = false} = findOptions || {};
      const entity = await this
        .collection
        .findOne({_id: id} as FilterQuery<Schema>);

      if (entity === null) {
        return null;
      }
      if (useSoftDelete) {
        return ('deletedAt' in entity) && !includeDeleted ? null : entity;
      }
      return entity;
    };

    findByIds: TFindByIds<Schema, UseSoftDelete> = async (
      ids,
      options,
      findOptions,
    ) => {
      if (ids.length === 0) {
        return [];
      }
      const {includeDeleted = false} = findOptions || {};
      const items = await this
        .collection
        .find(
          {_id: {$in: ids}} as FilterQuery<Schema>,
          {limit: ids.length, ...(options || {})} as any,
        )
        .toArray();

      if (items.length === 0) {
        return [];
      }
      if (!useSoftDelete || includeDeleted) {
        return items;
      }
      return items.filter(item => !('deletedAt' in item));
    };

    find: TFind<Schema, UseSoftDelete> = (
      query,
      options,
      findOptions,
    ) => {
      const {includeDeleted = false} = findOptions || {};

      return this
        .collection
        .find({
          ...(useSoftDelete && !includeDeleted
            ? {deletedAt: {$exists: false}}
            : {}),
          ...query,
        } as FilterQuery<Schema>, options)
        .toArray();
    };

    findOne: TFindOne<Schema, UseSoftDelete> = (
      query,
      options,
      findOptions,
    ) => {
      return this
        .find(query, {...options, limit: 1}, findOptions)
        .then(([item]) => item || null);
    };

    insertOne: TInsertOne<Schema> = async item => {
      const {insertedId} = await this.collection.insertOne(item);

      return {...item, _id: insertedId} as WithId<Schema>;
    };

    insertMany: TInsertMany<Schema> = async items => {
      const {insertedIds} = await this.collection.insertMany(items);
      const result: WithId<Schema>[] = [];

      for (const idx in insertedIds) {
        result.push({...items[idx], _id: insertedIds[idx]} as WithId<Schema>);
      }
      return result;
    };

    updateOne: TUpdateOneOrMany<Schema, UseSoftDelete, false> = (
      query,
      update,
      options,
      findOptions,
    ) => {
      const {includeDeleted = false} = findOptions || {};

      return this.collection.updateOne(
        {
          ...(useSoftDelete && !includeDeleted
            ? {deletedAt: {$exists: false}}
            : {}),
          ...query,
        }, update, options,
      );
    };

    updateMany: TUpdateOneOrMany<Schema, UseSoftDelete, true> = (
      query,
      update,
      options,
      findOptions,
    ) => {
      const {includeDeleted = false} = findOptions || {};

      return this.collection.updateMany(
        {
          ...(useSoftDelete && !includeDeleted
            ? {deletedAt: {$exists: false}}
            : {}),
          ...query,
        },
        update,
        options,
      );
    };

    updateById: TUpdateById<Schema, UseSoftDelete> = (
      id,
      update,
      options,
      findOptions,
    ) => {
      return this.updateOne(
        {_id: id} as FilterQuery<Schema>,
        update,
        options,
        findOptions,
      );
    };
  }

  if (useTimestamps) {
    return class TimestampsController
      extends Controller
      implements ITimestampsController<Schema, UseTimestamps, UseSoftDelete> {
      createOne: TCreateOne<Schema> = (data: TCreateOneData<Schema>) => {
        const now = new Date();

        return this.insertOne({createdAt: now, updatedAt: now, ...data}) as
          Promise<WithId<Schema> & ITimestamps>;
      };

      createMany: TCreateMany<Schema> = items => {
        const now = new Date();
        const preparedItems = items.map(
          ({createdAt = now, updatedAt = now, ...rest}) => ({
            createdAt,
            updatedAt,
            ...rest,
          }),
        ) as (OptionalId<Schema> & Partial<ITimestamps>)[];

        return this.insertMany(preparedItems) as
          Promise<(WithId<Schema> & ITimestamps)[]>;
      };
    } as any;
  }

  return Controller as any;
}
