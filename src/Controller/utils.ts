import {TFieldSpec} from './types';
import {TAnySchema} from '../types';

/**
 * Creates index name based on its specification.
 * @param {TFieldSpec<Schema>} fieldOrSpec
 * @returns {string}
 */
export function getIndexName<Schema extends TAnySchema>(
  fieldOrSpec: TFieldSpec<Schema>
): string {
  if (typeof fieldOrSpec === 'string') {
    return fieldOrSpec;
  }
  return Object
    .entries(fieldOrSpec)
    .sort(([aField], [bField]) => aField.localeCompare(bField))
    .reduce<string>((acc, [field, sort], idx) => {
      const prefix = idx === 0 ? '' : (acc + ',');

      return prefix + field + ':' + sort;
    }, '');
}