import {
  Collection,
  FilterQuery,
  OptionalId, WithId,
} from 'mongodb';
import {
  IController,
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

  return class Controller
    implements IController<Schema, UseTimestamps, UseSoftDelete> {
    /**
     * Current controller collection.
     * @type {Collection<Schema>}
     * @protected
     */
    protected collection = collection;
    /**
     * Is controller using timestamps.
     * @type {boolean}
     * @protected
     */
    protected useTimestamps = useTimestamps;
    /**
     * Is controller using soft deletion.
     * @type {boolean}
     * @protected
     */
    protected useSoftDelete = useSoftDelete;

    /**
     * Returns mixin depending on soft deletion mode.
     * @param {boolean} includeDeleted
     * @returns {{deletedAt: {$exists: boolean}} | {}}
     * @protected
     */
    protected useSoftDeleteMixin(includeDeleted = false) {
      return this.useSoftDelete && !includeDeleted
        ? {deletedAt: {$exists: false}}
        : {};
    }

    /**
     * Returns update part of timestamps mixin.
     * @returns {{updatedAt: Date} | {}}
     * @protected
     */
    protected useTimestampUpdateMixin() {
      return this.useTimestamps
        ? {updatedAt: new Date()}
        : {};
    }

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
      const {includeDeleted} = findOptions || {};

      return collection.countDocuments({
        ...this.useSoftDeleteMixin(includeDeleted),
        ...query,
      } as FilterQuery<Schema>, options);
    };

    createOne: TCreateOne<Schema> = (data: TCreateOneData<Schema>) => {
      const now = new Date();

      return this.insertOne({createdAt: now, updatedAt: now, ...data}) as
        Promise<WithId<Schema> & ITimestampsMixin>;
    };

    createMany: TCreateMany<Schema> = items => {
      const now = new Date();
      const preparedItems = items
        .map<OptionalId<Schema> & Partial<ITimestampsMixin>>(item => ({
          ...item,
          createdAt: item.createdAt === undefined ? now : item.createdAt,
          updatedAt: item.updatedAt === undefined ? now : item.updatedAt,
        }));

      return this.insertMany(preparedItems) as
        Promise<(WithId<Schema> & ITimestampsMixin)[]>;
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
      const {includeDeleted} = findOptions || {};

      return collection.distinct(key, {
        ...this.useSoftDeleteMixin(includeDeleted),
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
      if (this.useSoftDelete) {
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
          ...this.useSoftDeleteMixin(includeDeleted),
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
      const {includeDeleted} = findOptions || {};

      return this.collection.updateOne(
        {
          ...this.useSoftDeleteMixin(includeDeleted),
          ...this.useTimestampUpdateMixin(),
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
          ...this.useSoftDeleteMixin(includeDeleted),
          ...this.useTimestampUpdateMixin(),
          ...query,
        }, update, options,
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
}
