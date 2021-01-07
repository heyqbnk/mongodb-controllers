import {
  Collection,
  FilterQuery,
  OptionalId, WithId,
} from 'mongodb';
import {
  TCreateIndex,
  TDropIndex,
  TCreateOne,
  TInsertOne,
  TCreateMany,
  TInsertMany,
  TCountDocuments,
  TCreateOneData,
  TDeleteOneOrMany,
  TDistinct,
  TApplyMixins,
  TDeleteByIdOrIds,
  TFindById,
  TFindByIds,
  TFind,
  TFindOne,
  TUpdateOneOrMany,
  TUpdateById,
  IControllerConstructor,
  TControllerOptions,
  ITimestampsMixin,
} from './types';
import {getIndexName} from './utils';

/**
 * Creates controller class.
 * @returns {{new(): IController<Schema, UseTimestamps, UseSoftDelete>, prototype: IController<Schema, UseTimestamps, UseSoftDelete>}}
 * @constructor
 * @param collectionOrOptions
 */
export function Controller<Schema extends TApplyMixins<{},
  UseTimestamps,
  UseSoftDelete>,
  UseTimestamps extends boolean = false,
  UseSoftDelete extends boolean = false>(
  collectionOrOptions: TControllerOptions<Schema, UseTimestamps, UseSoftDelete>,
): IControllerConstructor<Schema, UseTimestamps, UseSoftDelete> {
  let collection: Collection<Schema>;
  let useTimestamps = false;
  let useSoftDelete = false;

  if ('collection' in collectionOrOptions) {
    const {
      collection: _collection,
      useTimestamps: _useTimestamps = false,
      useSoftDelete: _useSoftDelete = false,
    } = collectionOrOptions;
    collection = _collection;
    useTimestamps = _useTimestamps;
    useSoftDelete = _useSoftDelete;
  }

  const useSoftDeleteMixin = (includeDeleted = false) =>
    useSoftDelete && !includeDeleted ? {deletedAt: {$exists: false}} : {};

  const useTimestampUpdateMixin = () =>
    useTimestamps ? {updatedAt: new Date()} : {};

  const createIndex: TCreateIndex<Schema> = (fieldOrSpec, options) => {
    const indexName = options?.name || getIndexName(fieldOrSpec);

    return collection.createIndex(fieldOrSpec, {
      ...options,
      name: indexName,
    });
  };

  const countDocuments: TCountDocuments<Schema, UseSoftDelete> = (
    query,
    options,
    findOptions,
  ) => {
    const {includeDeleted} = findOptions || {};

    return collection.countDocuments({
      ...useSoftDeleteMixin(includeDeleted),
      ...query,
    } as FilterQuery<Schema>, options);
  };

  const insertOne: TInsertOne<Schema> = async item => {
    const {insertedId} = await collection.insertOne(item);

    return {...item, _id: insertedId} as WithId<Schema>;
  };

  const insertMany: TInsertMany<Schema> = async items => {
    const {insertedIds} = await collection.insertMany(items);
    const result: WithId<Schema>[] = [];

    for (const idx in insertedIds) {
      result.push({...items[idx], _id: insertedIds[idx]} as WithId<Schema>);
    }
    return result;
  };

  const createOne: TCreateOne<Schema> = (data: TCreateOneData<Schema>) => {
    const now = new Date();

    return insertOne({createdAt: now, updatedAt: now, ...data}) as
      Promise<WithId<Schema> & ITimestampsMixin>;
  };

  const createMany: TCreateMany<Schema> = items => {
    const now = new Date();
    const preparedItems = items
      .map<OptionalId<Schema> & Partial<ITimestampsMixin>>(item => ({
        ...item,
        createdAt: item.createdAt === undefined ? now : item.createdAt,
        updatedAt: item.updatedAt === undefined ? now : item.updatedAt,
      }));

    return insertMany(preparedItems) as
      Promise<(WithId<Schema> & ITimestampsMixin)[]>;
  };

  const deleteOne: TDeleteOneOrMany<Schema, UseSoftDelete> = (
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

  const deleteMany: TDeleteOneOrMany<Schema, UseSoftDelete> = (
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

  const deleteById: TDeleteByIdOrIds<UseSoftDelete, false> = (
    id,
    options,
    findOptions,
  ) => {
    return deleteOne(
      {_id: id} as FilterQuery<Schema>,
      options,
      findOptions,
    ) as any;
  };

  const deleteByIds: TDeleteByIdOrIds<UseSoftDelete, true> = (
    ids,
    options,
    findOptions,
  ) => {
    return deleteMany(
      {_id: {$in: ids}} as FilterQuery<Schema>,
      options,
      findOptions,
    ) as any;
  };

  const distinct: TDistinct<Schema, UseSoftDelete> = (
    key,
    query,
    options,
    findOptions,
  ) => {
    const {includeDeleted} = findOptions || {};

    return collection.distinct(key, {
      ...useSoftDeleteMixin(includeDeleted),
      ...query,
    } as FilterQuery<Schema>, options);
  };

  const dropIndex: TDropIndex<Schema> = (indexNameOrFieldSpec, options) => {
    const indexName = typeof indexNameOrFieldSpec === 'string'
      ? indexNameOrFieldSpec
      : getIndexName(indexNameOrFieldSpec);

    return collection.dropIndex(indexName, options);
  };

  const findById: TFindById<Schema, UseSoftDelete> = async (
    id,
    options,
    findOptions,
  ) => {
    const {includeDeleted = false} = findOptions || {};
    const entity = await collection.findOne({_id: id} as FilterQuery<Schema>);

    if (entity === null) {
      return null;
    }
    if (useSoftDelete) {
      return ('deletedAt' in entity) && !includeDeleted ? null : entity;
    }
    return entity;
  };

  const findByIds: TFindByIds<Schema, UseSoftDelete> = async (
    ids,
    options,
    findOptions,
  ) => {
    if (ids.length === 0) {
      return [];
    }
    const {includeDeleted = false} = findOptions || {};
    const items = await collection
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

  const find: TFind<Schema, UseSoftDelete> = (
    query,
    options,
    findOptions,
  ) => {
    const {includeDeleted = false} = findOptions || {};

    return collection
      .find({
        ...useSoftDeleteMixin(includeDeleted),
        ...query,
      } as FilterQuery<Schema>, options)
      .toArray();
  };

  const findOne: TFindOne<Schema, UseSoftDelete> = (
    query,
    options,
    findOptions,
  ) => {
    return find(query, {...options, limit: 1}, findOptions)
      .then(([item]) => item || null);
  };

  const updateOne: TUpdateOneOrMany<Schema, UseSoftDelete, false> = (
    query,
    update,
    options,
    findOptions,
  ) => {
    const {includeDeleted} = findOptions || {};

    return collection.updateOne(
      {
        ...useSoftDeleteMixin(includeDeleted),
        ...useTimestampUpdateMixin(),
        ...query,
      }, update, options,
    );
  };

  const updateMany: TUpdateOneOrMany<Schema, UseSoftDelete, true> = (
    query,
    update,
    options,
    findOptions,
  ) => {
    const {includeDeleted = false} = findOptions || {};

    return collection.updateMany(
      {
        ...useSoftDeleteMixin(includeDeleted),
        ...useTimestampUpdateMixin(),
        ...query,
      }, update, options,
    );
  };

  const updateById: TUpdateById<Schema, UseSoftDelete> = (
    id,
    update,
    options,
    findOptions,
  ) => {
    return updateOne(
      {_id: id} as FilterQuery<Schema>,
      update,
      options,
      findOptions,
    );
  };

  return class Controller {
    /**
     * Is controller using timestamps.
     * @type {boolean}
     * @protected
     */
    static readonly useTimestamps = useTimestamps;

    /**
     * Is controller using soft deletion.
     * @type {boolean}
     * @protected
     */
    static readonly useSoftDelete = useSoftDelete;

    /**
     * Returns mixin depending on soft deletion mode.
     * @type {(includeDeleted?: boolean) => {deletedAt: {$exists: boolean}} | {}}
     * @protected
     */
    protected static useSoftDeleteMixin = useSoftDeleteMixin;

    /**
     * Returns "update" part of timestamps mixin.
     * @type {() => {updatedAt: Date} | {}}
     * @protected
     */
    protected static useTimestampUpdateMixin = useTimestampUpdateMixin;

    static collection = collection;
    static createIndex = createIndex;
    static countDocuments = countDocuments;
    static createOne = createOne;
    static createMany = createMany;
    static deleteOne = deleteOne;
    static deleteMany = deleteMany;
    static deleteById = deleteById;
    static deleteByIds = deleteByIds;
    static distinct = distinct;
    static dropIndex = dropIndex;
    static findById = findById;
    static findByIds = findByIds;
    static find = find;
    static findOne = findOne;
    static insertOne = insertOne;
    static insertMany = insertMany;
    static updateOne = updateOne;
    static updateMany = updateMany;
    static updateById = updateById;
  };
}
