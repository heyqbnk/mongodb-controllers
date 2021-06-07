import {WithId} from 'mongodb';
import {TIf} from '../../types';
import {ISoftDeleteMixin, ITimestampsMixin} from './mixins';

/**
 * Applies MongoDB default fields. Additionally, applies fields depending on
 * mixins.
 */
export type TApplyMixins<Schema,
  UseTimestamps extends boolean,
  UseSoftDelete extends boolean> =
  WithId<Schema> &
  TIf<UseTimestamps, ITimestampsMixin, {}> &
  TIf<UseSoftDelete, Partial<ISoftDeleteMixin>, {}>;