import { describe, it, expect } from 'vitest';
import { rewriteFilterFields, rewriteSortField, pbFilter } from '../filter-rewriter.js';

describe('rewriteFilterFields', () => {
  it('rewrites bare created → created_at', () => {
    expect(rewriteFilterFields("created > '2024-01-01'")).toBe("created_at > '2024-01-01'");
  });

  it('rewrites bare updated → updated_at', () => {
    expect(rewriteFilterFields("updated = '2024'")).toBe("updated_at = '2024'");
  });

  it('does NOT rewrite created_at (already correct)', () => {
    expect(rewriteFilterFields("created_at > '2024'")).toBe("created_at > '2024'");
  });

  it('does NOT rewrite created_by', () => {
    expect(rewriteFilterFields("created_by = 'abc'")).toBe("created_by = 'abc'");
  });

  it('does NOT rewrite updated_at', () => {
    expect(rewriteFilterFields("updated_at < '2025'")).toBe("updated_at < '2025'");
  });

  it('does NOT rewrite field name appearing inside quoted string value', () => {
    expect(rewriteFilterFields("status = 'created'")).toBe("status = 'created'");
  });

  it('rewrites both created and updated in compound filter', () => {
    expect(rewriteFilterFields("created > '2024' && updated < '2025'")).toBe(
      "created_at > '2024' && updated_at < '2025'",
    );
  });

  it('does not double-rewrite already-correct fields in a mixed expression', () => {
    // created_at should not become created_at_at
    expect(rewriteFilterFields("created_at > '2024' && created < '2025'")).toBe(
      "created_at > '2024' && created_at < '2025'",
    );
  });

  it('rewrites created in expression with double-quoted value', () => {
    expect(rewriteFilterFields('created > "2025-01-01"')).toBe('created_at > "2025-01-01"');
  });

  it('rewrites updated in expression with @now token', () => {
    expect(rewriteFilterFields('updated = @now')).toBe('updated_at = @now');
  });

  it('passes through a filter with no PocketBase-specific field names unchanged', () => {
    expect(rewriteFilterFields('title = "hello" && status != "archived"')).toBe(
      'title = "hello" && status != "archived"',
    );
  });

  it('throws TypeError when given a non-string input', () => {
    expect(() => rewriteFilterFields({ status: 'active' } as any)).toThrow(TypeError);
    expect(() => rewriteFilterFields(null as any)).toThrow(TypeError);
  });
});

describe('rewriteSortField', () => {
  it('rewrites -created → -created_at', () => {
    expect(rewriteSortField('-created')).toBe('-created_at');
  });

  it('rewrites +updated → +updated_at', () => {
    expect(rewriteSortField('+updated')).toBe('+updated_at');
  });

  it('rewrites bare created → created_at', () => {
    expect(rewriteSortField('created')).toBe('created_at');
  });

  it('leaves unrelated field unchanged', () => {
    expect(rewriteSortField('title')).toBe('title');
  });

  it('leaves -title unchanged', () => {
    expect(rewriteSortField('-title')).toBe('-title');
  });
});

describe('pbFilter', () => {
  it('interpolates string placeholders with single quotes', () => {
    const result = pbFilter('title ~ {:title}', { title: 'hello' });
    expect(result).toBe("title ~ 'hello'");
  });

  it('interpolates boolean values without quotes', () => {
    const result = pbFilter('active = {:v}', { v: true });
    expect(result).toBe('active = true');
  });

  it('interpolates number values without quotes', () => {
    const result = pbFilter('count > {:n}', { n: 5 });
    expect(result).toBe('count > 5');
  });

  it('interpolates Date values as ISO string with single quotes', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const result = pbFilter('created >= {:created}', { created: date });
    expect(result).toBe("created_at >= '2024-01-01T00:00:00.000Z'");
  });

  it('interpolates multiple params and rewrites field names', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const result = pbFilter('title ~ {:title} && created >= {:created}', {
      title: 'hello',
      created: date,
    });
    expect(result).toBe("title ~ 'hello' && created_at >= '2024-01-01T00:00:00.000Z'");
  });

  it('works without params (only field rewriting)', () => {
    const result = pbFilter("created > '2024-01-01'");
    expect(result).toBe("created_at > '2024-01-01'");
  });

  it('leaves unknown placeholders as-is', () => {
    const result = pbFilter('title ~ {:missing}', {});
    expect(result).toBe('title ~ {:missing}');
  });

  it('throws TypeError when raw filter template is not a string', () => {
    expect(() => pbFilter(42 as any)).toThrow(TypeError);
  });
});
