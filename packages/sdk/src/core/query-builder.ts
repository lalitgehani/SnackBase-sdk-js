import { RecordService } from './record-service';
import { BaseRecord, RecordListResponse } from '../types/record';
import { FilterOperator, FilterExpression, SortDirection, SortExpression } from '../types/query';

/**
 * Fluent interface for building complex queries.
 */
export class QueryBuilder<T = any> {
  private _fields: string[] = [];
  private _expand: string[] = [];
  private _filterParts: string[] = [];
  private _sortParts: string[] = [];
  private _page = 1;
  private _perPage = 30;
  private _skip = 0;
  private _limit = 30; // Default limit
  private _useLegacyPagination = false; // To track if manual skip/limit was used

  constructor(
    private service: RecordService,
    private collection: string
  ) {}

  /**
   * Specify fields to return.
   * @param fields Array of field names or comma-separated string
   */
  select(fields: string | string[]): this {
    if (Array.isArray(fields)) {
      this._fields = [...this._fields, ...fields];
    } else {
      this._fields.push(fields);
    }
    return this;
  }

  /**
   * Expand related records.
   * @param relations Array of relation names or comma-separated string
   */
  expand(relations: string | string[]): this {
    if (Array.isArray(relations)) {
      this._expand = [...this._expand, ...relations];
    } else {
      this._expand.push(relations);
    }
    return this;
  }

  /**
   * Add a filter condition.
   * @param field Field name
   * @param operator Filter operator
   * @param value Value to compare against
   */
  filter(field: string, operator: FilterOperator, value?: any): this;
  
  /**
   * Add a raw filter string.
   * @param filterString Raw filter string (e.g., "age > 21")
   */
  filter(filterString: string): this;

  filter(fieldOrString: string, operator?: FilterOperator, value?: any): this {
    if (operator === undefined) {
      // Raw string mode
      this._filterParts.push(`(${fieldOrString})`);
    } else {
      // Structured mode
      let expression = '';
      const formattedValue = this.formatValue(value);

      switch (operator) {
        case '=':
          expression = `${fieldOrString} = ${formattedValue}`;
          break;
        case '!=':
          expression = `${fieldOrString} != ${formattedValue}`;
          break;
        case '>':
          expression = `${fieldOrString} > ${formattedValue}`;
          break;
        case '>=':
          expression = `${fieldOrString} >= ${formattedValue}`;
          break;
        case '<':
          expression = `${fieldOrString} < ${formattedValue}`;
          break;
        case '<=':
          expression = `${fieldOrString} <= ${formattedValue}`;
          break;
        case '~':
          expression = `${fieldOrString} ~ ${formattedValue}`;
          break;
        case '!~':
          expression = `${fieldOrString} !~ ${formattedValue}`;
          break;
        case '?=':
          expression = `${fieldOrString} ?= ${formattedValue}`; // Is empty
          break;
        case '?!=':
          expression = `${fieldOrString} ?!= ${formattedValue}`; // Is not empty
          break;
        default:
          expression = `${fieldOrString} = ${formattedValue}`;
      }
      this._filterParts.push(expression);
    }
    return this;
  }

  /**
   * Add sorting.
   * @param field Field name
   * @param direction 'asc' or 'desc' (default: 'asc')
   */
  sort(field: string, direction: SortDirection = 'asc'): this {
    const prefix = direction === 'desc' ? '-' : '+'; // + is optional but good for clarity in builder, API expects - for desc, nothing for asc usually but we can use +/-
    // API Spec says: "Accepts sort (field with +/- prefix)"
    // So for asc we can use + or just the field name. Let's use standard API convention.
    // If direction is asc, just field name (or +field). If desc, -field.
    // Let's stick to: +field for asc, -field for desc to be explicit if API supports it, otherwise just field for asc.
    // Assumption: API supports +field or just field. Let's use standard SnackBase convention: -createdVal, createdVal
    
    let sortStr = field;
    if (direction === 'desc') {
      sortStr = `-${field}`;
    } else {
      sortStr = `+${field}`; // Using + for explicit ascending if supported, acts as standard
    }
    
    this._sortParts.push(sortStr);
    return this;
  }

  /**
   * Set limit (and optionally skip).
   * Note: Using limit/skip switches to manual offset pagination.
   * @param limit Max records
   * @param skip Records to skip
   */
  limit(limit: number): this {
    this._limit = limit;
    this._useLegacyPagination = true;
    return this;
  }

  /**
   * Set skip.
   * Note: Using limit/skip switches to manual offset pagination.
   * @param skip Records to skip
   */
  skip(skip: number): this {
    this._skip = skip;
    this._useLegacyPagination = true;
    return this;
  }

  /**
   * Set page number and page size.
   * @param page Page number (1-based)
   * @param perPage Records per page
   */
  page(page: number, perPage: number = 30): this {
    this._page = page;
    this._perPage = perPage;
    this._useLegacyPagination = false;
    return this;
  }

  /**
   * Execute query and get list of records.
   */
  async get(): Promise<RecordListResponse<T>> {
    const params: any = {};

    if (this._fields.length > 0) {
      params.fields = this._fields.join(',');
    }

    if (this._expand.length > 0) {
      params.expand = this._expand.join(',');
    }

    if (this._filterParts.length > 0) {
      // Join all parts with AND
      params.filter = this._filterParts.join(' && ');
    }

    if (this._sortParts.length > 0) {
      params.sort = this._sortParts.join(',');
    }

    if (this._useLegacyPagination) {
      params.skip = this._skip;
      params.limit = this._limit;
    } else {
      // Convert page/perPage to skip/limit
      // skip = (page - 1) * perPage
      // limit = perPage
      if (this._page < 1) this._page = 1;
      params.skip = (this._page - 1) * this._perPage;
      params.limit = this._perPage;
    }

    return this.service.list<T>(this.collection, params);
  }

  /**
   * Execute query and get the first matching record.
   */
  async first(): Promise<(T & BaseRecord) | null> {
    this.limit(1);
    this.skip(0); // Reset skip for first()
    const result = await this.get();
    return result.items.length > 0 ? result.items[0] : null;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "\\'")}'`; // Basic escaping
    }
    return String(value);
  }
}
