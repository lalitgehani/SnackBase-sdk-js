import type { SnackBaseClient } from '@snackbase/sdk';
import { wrap, NotSupportedError } from './errors';
import type { CompatError } from './types';

/** Supabase-compatible collection result shape */
export interface SupabaseCollectionResult<T> {
  data: T[] | T | null;
  error: CompatError | null;
  count?: number | null;
}

type FilterEntry = {
  column: string;
  operator: string;
  value: unknown;
};

type PendingOp = 'insert' | 'update' | 'upsert' | 'delete';

/**
 * Formats a single filter entry as a SnackBase filter string.
 * e.g. { column: 'status', operator: 'eq', value: 'published' } → "status='published'"
 */
function formatFilterEntry(f: FilterEntry): string {
  const v = f.value;

  switch (f.operator) {
    case 'eq':
      return `${f.column}='${v}'`;
    case 'neq':
      return `${f.column}!='${v}'`;
    case 'gt':
      return `${f.column}>'${v}'`;
    case 'gte':
      return `${f.column}>='${v}'`;
    case 'lt':
      return `${f.column}<'${v}'`;
    case 'lte':
      return `${f.column}<='${v}'`;
    case 'like':
    case 'ilike':
      return `${f.column}~'${v}'`;
    case 'in': {
      const vals = Array.isArray(v) ? v.join(',') : String(v);
      return `${f.column} IN (${vals})`;
    }
    default:
      return `${f.column}='${v}'`;
  }
}

/**
 * Extracts the ID value from a filter list (column === 'id', operator === 'eq').
 * Used for update/delete operations where Supabase uses `.eq('id', id)`.
 */
function extractIdFilter(filters: FilterEntry[]): string | undefined {
  const idFilter = filters.find((f) => f.column === 'id' && f.operator === 'eq');
  return idFilter ? String(idFilter.value) : undefined;
}

/**
 * Lazy query builder that mirrors Supabase's PostgREST builder pattern.
 * No network call is made until the builder is `await`-ed.
 *
 * @example
 * const { data, error } = await supabase.from('posts').select('*').eq('status', 'published').limit(10);
 */
export class SnackbaseQueryBuilder<T = Record<string, unknown>>
  implements Promise<SupabaseCollectionResult<T>>
{
  readonly [Symbol.toStringTag] = 'SnackbaseQueryBuilder';

  private _select?: string;
  private _filters: FilterEntry[] = [];
  private _order?: { column: string; ascending: boolean };
  private _limit?: number;
  private _skip?: number;
  private _isSingle = false;
  private _pendingOp?: PendingOp;
  private _pendingData?: unknown;
  private _selectCount?: 'exact' | 'planned' | 'estimated' | null;

  constructor(
    private readonly snackbase: SnackBaseClient,
    private readonly collection: string,
  ) {}

  // ── Projections ─────────────────────────────────────────────────────────────

  select(
    columns?: string,
    options?: { count?: 'exact' | 'planned' | 'estimated' | null },
  ): this {
    this._select = columns;
    this._selectCount = options?.count;
    return this;
  }

  // ── Filters ──────────────────────────────────────────────────────────────────

  eq(column: string, value: unknown): this {
    this._filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this._filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this._filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this._filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this._filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this._filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column: string, pattern: string): this {
    this._filters.push({ column, operator: 'like', value: pattern });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this._filters.push({ column, operator: 'ilike', value: pattern });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this._filters.push({ column, operator: 'in', value: values });
    return this;
  }

  // ── Pagination / Ordering ────────────────────────────────────────────────────

  order(column: string, options?: { ascending?: boolean }): this {
    this._order = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number): this {
    this._limit = count;
    return this;
  }

  range(from: number, to: number): this {
    this._skip = from;
    this._limit = to - from + 1;
    return this;
  }

  // ── Result modifiers ─────────────────────────────────────────────────────────

  single(): this {
    this._isSingle = true;
    return this;
  }

  /** No-op — just for TypeScript typing. */
  returns<_U>(): this {
    return this;
  }

  // ── Mutations ─────────────────────────────────────────────────────────────────

  insert(data: unknown): this {
    this._pendingOp = 'insert';
    this._pendingData = data;
    return this;
  }

  update(data: unknown): this {
    this._pendingOp = 'update';
    this._pendingData = data;
    return this;
  }

  upsert(data: unknown): this {
    this._pendingOp = 'upsert';
    this._pendingData = data;
    return this;
  }

  delete(): this {
    this._pendingOp = 'delete';
    return this;
  }

  // ── Unsupported ──────────────────────────────────────────────────────────────

  rpc(): never {
    throw new NotSupportedError('from().rpc');
  }

  // ── Execution (thenable) ─────────────────────────────────────────────────────

  /**
   * Builds the filter string from accumulated filter entries.
   * Multiple filters are joined with AND.
   */
  private _buildFilterString(): string | undefined {
    if (this._filters.length === 0) return undefined;
    // For mutations (update/delete), exclude the 'id' filter from the filter string
    // since we extract it separately for the record ID
    const relevantFilters =
      this._pendingOp === 'update' || this._pendingOp === 'delete'
        ? this._filters.filter((f) => !(f.column === 'id' && f.operator === 'eq'))
        : this._filters;
    if (relevantFilters.length === 0) return undefined;
    return relevantFilters.map(formatFilterEntry).join(' AND ');
  }

  /**
   * Builds the sort string from the order state.
   * Ascending: 'col', Descending: '-col'.
   */
  private _buildSortString(): string | undefined {
    if (!this._order) return undefined;
    return this._order.ascending ? this._order.column : `-${this._order.column}`;
  }

  /**
   * Parses field list from select string.
   * e.g. "id, title, body" → ["id", "title", "body"]
   * '*' or undefined → undefined (return all fields)
   */
  private _buildFields(): string[] | undefined {
    if (!this._select || this._select.trim() === '*') return undefined;
    return this._select.split(',').map((f) => f.trim());
  }

  /**
   * Internal execution — translates accumulated state into a RecordService call.
   */
  private _execute(): Promise<SupabaseCollectionResult<T>> {
    const op = this._pendingOp;

    // ── INSERT ────────────────────────────────────────────────────────────────
    if (op === 'insert') {
      return wrap<T[]>(async () => {
        const data = this._pendingData;
        if (Array.isArray(data)) {
          // Bulk insert — create each record
          const results = await Promise.all(
            data.map((item: unknown) => this.snackbase.records.create<T>(this.collection, item as Partial<T>)),
          );
          return results;
        }
        const created = await this.snackbase.records.create<T>(this.collection, data as Partial<T>);
        return [created];
      });
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    if (op === 'update') {
      return wrap<T[]>(async () => {
        const id = extractIdFilter(this._filters);
        if (!id) {
          throw new Error(
            'QueryBuilder: .update() requires a preceding .eq("id", id) filter to identify the record.',
          );
        }
        const updated = await this.snackbase.records.patch<T>(
          this.collection,
          id,
          this._pendingData as Partial<T>,
        );
        return [updated];
      });
    }

    // ── UPSERT ────────────────────────────────────────────────────────────────
    if (op === 'upsert') {
      return wrap<T[]>(async () => {
        const data = this._pendingData as Record<string, unknown>;
        const id = (data?.id as string) ?? extractIdFilter(this._filters);
        if (id) {
          // Try patch (update) first
          try {
            const updated = await this.snackbase.records.patch<T>(
              this.collection,
              id,
              data as Partial<T>,
            );
            return [updated];
          } catch (_e) {
            // If record doesn't exist, fall through to create
          }
        }
        const created = await this.snackbase.records.create<T>(this.collection, data as Partial<T>);
        return [created];
      });
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (op === 'delete') {
      return wrap<T[]>(async () => {
        const id = extractIdFilter(this._filters);
        if (!id) {
          throw new Error(
            'QueryBuilder: .delete() requires a preceding .eq("id", id) filter to identify the record.',
          );
        }
        await this.snackbase.records.delete(this.collection, id);
        return [];
      });
    }

    // ── SELECT (default) ─────────────────────────────────────────────────────
    return this._executeSelect();
  }

  /** Executes a SELECT query, handling `.single()` and count. */
  private _executeSelect(): Promise<SupabaseCollectionResult<T>> {
    const isSingle = this._isSingle;

    if (isSingle) {
      // Return a single item or a "No rows" error
      return (async (): Promise<SupabaseCollectionResult<T>> => {
        try {
          const res = await this.snackbase.records.list<T>(this.collection, {
            filter: this._buildFilterString(),
            sort: this._buildSortString(),
            fields: this._buildFields(),
            skip: this._skip,
            limit: 1,
          });
          if (res.items.length === 0) {
            return {
              data: null,
              error: { message: 'No rows found', code: 'PGRST116' },
              count: 0,
            };
          }
          return { data: res.items[0] as unknown as T, error: null, count: res.total };
        } catch (err: unknown) {
          const e = err as { message?: string; statusCode?: number; status?: number; code?: string };
          return {
            data: null,
            error: {
              message: e?.message ?? 'Unknown error',
              status: e?.statusCode ?? e?.status,
              code: e?.code,
            },
          };
        }
      })();
    }

    return wrap<T[]>(async () => {
      const res = await this.snackbase.records.list<T>(this.collection, {
        filter: this._buildFilterString(),
        sort: this._buildSortString(),
        fields: this._buildFields(),
        skip: this._skip,
        limit: this._limit,
      });
      return res.items as (T & { id: string; account_id: string; created_at: string; updated_at: string })[];
    }).then((result) => {
      // Attach count when requested
      return {
        ...result,
        count: this._selectCount ? undefined : null,
      };
    });
  }

  // Promise interface — makes the builder await-able
  then<TResult1 = SupabaseCollectionResult<T>, TResult2 = never>(
    onFulfilled?: ((value: SupabaseCollectionResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this._execute().then(onFulfilled, onRejected);
  }

  catch<TResult = never>(
    onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<SupabaseCollectionResult<T> | TResult> {
    return this._execute().catch(onRejected);
  }

  finally(onFinally?: (() => void) | null): Promise<SupabaseCollectionResult<T>> {
    return this._execute().finally(onFinally);
  }
}
