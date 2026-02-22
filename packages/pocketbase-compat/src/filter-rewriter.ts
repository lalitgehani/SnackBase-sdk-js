/**
 * Filter string field-name rewriting for PocketBase → SnackBase compatibility.
 *
 * PocketBase uses `created` / `updated` as field names; SnackBase uses `created_at` / `updated_at`.
 * These helpers rewrite PocketBase filter strings so SnackBase receives the correct field names.
 */

/**
 * Rewrites PocketBase filter field names to their SnackBase equivalents.
 *
 * Rules:
 * - `created` (word boundary, not followed by `_`) → `created_at`
 * - `updated` (word boundary, not followed by `_`) → `updated_at`
 * - Must NOT rewrite `created_at`, `created_by`, `updated_at`, `updated_by`
 * - Must NOT rewrite field names appearing inside quoted string values
 *
 * Strategy: two-pass approach
 * 1. Extract quoted string literals (replace with placeholders)
 * 2. Rewrite bare field names
 * 3. Restore quoted literals
 */
export function rewriteFilterFields(filter: string): string {
  // Pass 1: extract quoted literals and replace with placeholders
  const literals: string[] = [];
  const withPlaceholders = filter.replace(/'[^']*'|"[^"]*"/g, (match) => {
    const idx = literals.length;
    literals.push(match);
    return `__LITERAL_${idx}__`;
  });

  // Pass 2: rewrite bare field names
  // \bcreated\b(?!_) — word-boundary "created" not followed by underscore
  // \bupdated\b(?!_) — word-boundary "updated" not followed by underscore
  const rewritten = withPlaceholders
    .replace(/\bcreated\b(?!_)/g, 'created_at')
    .replace(/\bupdated\b(?!_)/g, 'updated_at');

  // Pass 3: restore quoted literals
  return rewritten.replace(/__LITERAL_(\d+)__/g, (_, idx) => literals[Number(idx)]);
}

/**
 * Rewrites a PocketBase sort expression field name to the SnackBase equivalent.
 *
 * Sort expressions are a single field, optionally prefixed with `+` or `-`.
 * Examples: `'-created'` → `'-created_at'`, `'+updated'` → `'+updated_at'`
 */
export function rewriteSortField(sort: string): string {
  // Handle prefix
  const prefix = sort.startsWith('-') ? '-' : sort.startsWith('+') ? '+' : '';
  const field = prefix ? sort.slice(1) : sort;

  if (field === 'created') return `${prefix}created_at`;
  if (field === 'updated') return `${prefix}updated_at`;
  return sort;
}

/**
 * Interpolates `{:paramName}` placeholders in a PocketBase filter string,
 * then rewrites field names for SnackBase.
 *
 * - String values are single-quoted in the output
 * - Date values are ISO-stringified and single-quoted
 * - Boolean and number values are NOT quoted
 *
 * @example
 * pbFilter("title ~ {:title} && created >= {:created}", { title: "hello", created: new Date("2024-01-01") })
 * // → "title ~ 'hello' && created_at >= '2024-01-01T00:00:00.000Z'"
 */
export function pbFilter(raw: string, params?: Record<string, any>): string {
  let result = raw;

  if (params) {
    result = result.replace(/\{:(\w+)\}/g, (_, key) => {
      if (!(key in params)) return `{:${key}}`;

      const val = params[key];
      if (val instanceof Date) {
        return `'${val.toISOString()}'`;
      }
      if (typeof val === 'string') {
        return `'${val}'`;
      }
      // boolean / number — not quoted
      return String(val);
    });
  }

  return rewriteFilterFields(result);
}
