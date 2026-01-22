import { describe, it, expectTypeOf } from 'vitest';
import { 
  InferSchema, 
  CollectionRecord, 
  ListResponse, 
  Filter 
} from './utils';
import { FieldDefinition } from './collection';

describe('Type Generation Utilities', () => {
  it('should infer record type from schema', () => {
    // Define a schema as const
    const postSchema = [
      { name: 'title', type: 'text', required: true },
      { name: 'views', type: 'number', required: false },
      { name: 'isActive', type: 'boolean' },
      { name: 'tags', type: 'multi_select' }
    ] as const satisfies readonly FieldDefinition[];

    // Generate type
    type Post = InferSchema<typeof postSchema>;

    // Verify type structure
    expectTypeOf<Post>().toMatchTypeOf<{
      title: string;
      views?: number | null | undefined;
      isActive?: boolean | null | undefined;
      tags?: string[] | null | undefined;
    }>();

    // Verify required vs optional
    expectTypeOf<Post['title']>().toBeString();
    expectTypeOf<Post['views']>().toBeNullable();
  });

  it('should create CollectionRecord with system fields', () => {
    interface User {
      name: string;
      email: string;
    }

    type UserRecord = CollectionRecord<User>;

    expectTypeOf<UserRecord>().toMatchTypeOf<{
      id: string;
      created_at: string;
      updated_at: string;
      name: string;
      email: string;
    }>();
  });

  it('should create ListResponse', () => {
    interface User {
      name: string;
    }
    type UserResponse = ListResponse<User>;

    expectTypeOf<UserResponse>().toMatchTypeOf<{
      items: (User & { id: string })[];
      total: number;
    }>();
  });

  it('should create typed Filter', () => {
    interface User {
      name: string;
      age: number;
    }

    type UserFilter = Filter<User>;

    // Should allow known fields
    const validFilter: UserFilter = {
      name: 'John',
      age: 20
    };

    // Should allow unknown fields (system fields or complex queries)
    const complexFilter: UserFilter = {
      name: 'John',
      'created_at >= ': '2023-01-01'
    };
    
    expectTypeOf(validFilter).toBeObject();
    expectTypeOf(complexFilter).toBeObject();
  });
});
