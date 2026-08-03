import { HttpClient, HttpMethod } from './http-client';

export interface FunctionInvokeOptions {
  body?: unknown;
  headers?: Record<string, string>;
  method?: HttpMethod;
  path?: string;
  query?: Record<string, string | number | boolean | undefined>;
}

export interface FunctionInvokeResult<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  executionId?: string;
}

/**
 * Client for invoking SnackBase Functions at /api/v1/f/{accountSlug}/{slug}.
 */
export class FunctionsService {
  constructor(
    private http: HttpClient,
    private getAccountSlug: () => string | undefined,
  ) {}

  /**
   * Invoke a deployed function by slug.
   *
   * Account slug is resolved from the authenticated account, or from
   * config.defaultAccount when used as a slug override.
   */
  async invoke<T = unknown>(
    slug: string,
    options: FunctionInvokeOptions = {},
  ): Promise<FunctionInvokeResult<T>> {
    const accountSlug = this.getAccountSlug();
    if (!accountSlug) {
      throw new Error(
        'FunctionsService.invoke requires an account slug. Authenticate first or set defaultAccount to the account slug.',
      );
    }

    const method: HttpMethod = options.method || 'POST';
    const pathSuffix = options.path
      ? options.path.startsWith('/')
        ? options.path
        : `/${options.path}`
      : '';
    const url = `/api/v1/f/${accountSlug}/${slug}${pathSuffix}`;

    const response = await this.http.request<T>({
      method,
      url,
      body: options.body,
      headers: options.headers,
      params: options.query,
    });

    const headers: Record<string, string> = {};
    if (response.headers && typeof response.headers.forEach === 'function') {
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
    }

    const executionId =
      headers['x-function-execution-id'] ||
      (typeof response.headers?.get === 'function'
        ? response.headers.get('x-function-execution-id') || undefined
        : undefined);

    return {
      data: response.data as T,
      status: response.status,
      headers,
      executionId: executionId || undefined,
    };
  }
}
