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
 * Lazy query builder that mirrors Supabase's PostgREST builder pattern.
 * No network call is made until the builder is `await`-ed.
 *
 * Phase 1: Stub — `_execute()` returns NotSupportedError for all operations.
 * Phase 2: Full implementation wired to RecordService.
 *
 * @example
 * // Will work after Phase 2
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

  constructor(
    private readonly snackbase: SnackBaseClient,
    private readonly collection: string,
  ) {}

  // ── Projections ────────────────────────────────────────────────────────────

  select(_columns?: string, _options?: { count?: 'exact' | 'planned' | 'estimated' | null }): this {
    this._select = _columns;
    return this;
  }

  // ── Filters ────────────────────────────────────────────────────────────────

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

  // ── Pagination / Ordering ──────────────────────────────────────────────────

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

  // ── Result modifiers ───────────────────────────────────────────────────────

  single(): this {
    this._isSingle = true;
    return this;
  }

  /** No-op — just for TypeScript typing. */
  returns<_U>(): this {
    return this;
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

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

  // ── Unsupported ────────────────────────────────────────────────────────────

  rpc(): never {
    throw new NotSupportedError('from().rpc');
  }

  // ── Execution (thenable) ───────────────────────────────────────────────────

  /**
   * Internal execution — translates accumulated state into a RecordService call.
   * Phase 1: stub returning NotSupportedError.
   * Phase 2: full implementation using this.snackbase.records.
   */
  private _execute(): Promise<SupabaseCollectionResult<T>> {
    return wrap<T[]>(() =>
      Promise.reject(new NotSupportedError('from() query execution (Phase 2 not yet implemented)')),
    ) as Promise<SupabaseCollectionResult<T>>;
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
