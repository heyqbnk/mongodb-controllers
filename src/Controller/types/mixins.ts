/**
 * Fields which are added to entity when timestamps are used.
 */
export interface ITimestampsMixin {
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
 * Fields which are added to entity when soft deletion is used.
 */
export interface ISoftDeleteMixin {
  /**
   * Date when entity was deleted.
   */
  deletedAt: Date;
}