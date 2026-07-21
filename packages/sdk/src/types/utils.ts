import { BaseRecord, RecordListResponse } from './record';
import { FieldDefinition } from './collection';

/**
 * Generic record type with system fields.
 * Use this to define your record interfaces.
 * 
 * @example
 * interface Post {
 *   title: string;
 *   content: string;
 *   views: number;
 * }
 * type PostRecord = CollectionRecord<Post>;
 */
export type CollectionRecord<T> = T & BaseRecord;

/**
 * Paginated list response type alias.
 */
export type ListResponse<T> = RecordListResponse<T>;

/**
 * Filter object type for a collection.
 * Allows filtering by fields of T.
 * 
 * This is a basic typed filter. For complex MongoDB-style queries, 
 * you might need more flexible types.
 */
export type Filter<T> = {
  [P in keyof T]?: any;
} & {
    [key: string]: any;
};

/**
 * Helper to map FieldType strings to TypeScript types.
 * Aligned with backend FieldType enum.
 */
export type FieldTypeToTs<T extends string> = 
  T extends 'text' ? string :
  T extends 'number' ? number :
  T extends 'boolean' ? boolean :
  T extends 'date' ? string :
  T extends 'datetime' ? string :
  T extends 'email' ? string :
  T extends 'url' ? string :
  T extends 'json' ? any :
  T extends 'reference' ? string | string[] :
  T extends 'file' ? string | Record<string, any> :
  T extends 'computed' ? string | number | boolean | null :
  any;

/**
 * Infers a record type from a schema definition (array of FieldDefinition).
 * Note: The schema array must be defined `as const` to work correctly.
 * 
 * @example
 * const postSchema = [
 *   { name: 'title', type: 'text' },
 *   { name: 'views', type: 'number' }
 * ] as const;
 * 
 * type Post = InferSchema<typeof postSchema>;
 * // Result: { title: string; views: number }
 */
export type InferSchema<T extends readonly FieldDefinition[]> = {
  [K in T[number] as K['name']]: FieldTypeToTs<K['type']> | (K['required'] extends true ? never : undefined | null);
};
