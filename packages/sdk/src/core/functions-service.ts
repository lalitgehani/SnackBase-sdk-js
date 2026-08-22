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

export interface FunctionItem {
  id: string;
  account_id: string;
  slug: string;
  name: string;
  description: string | null;
  entrypoint: string;
  auth_required: boolean;
  enabled: boolean;
  status: string;
  active_version_id: string | null;
  grants: { capabilities?: string[] } | Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FunctionListResponse {
  items: FunctionItem[];
  total: number;
}

export interface FunctionVersion {
  id: string;
  function_id: string;
  version: number;
  dependencies: string[];
  sha256: string;
  env_path: string | null;
  created_by: string | null;
  created_at: string;
}

export interface FunctionBody {
  version_id: string;
  version: number;
  entrypoint: string;
  files: Record<string, string>;
  dependencies: string[];
  sha256: string;
}

export interface FunctionExecution {
  id: string;
  function_id: string;
  version_id: string | null;
  status: string;
  http_status: number;
  duration_ms: number | null;
  request_data: Record<string, unknown> | null;
  response_body: unknown;
  stdout: string | null;
  stderr: string | null;
  error_message: string | null;
  used_admin_client: boolean;
  executed_at: string;
}

export interface FunctionSecret {
  id: string;
  name: string;
  updated_at: string;
}

export interface FunctionStats {
  total: number;
  by_status: Record<string, number>;
  p50_ms: number | null;
  p95_ms: number | null;
  range: string;
}

export interface CreateFunctionPayload {
  name: string;
  slug: string;
  description?: string;
  auth_required?: boolean;
  entrypoint?: string;
}

export interface UpdateFunctionPayload {
  name?: string;
  description?: string;
  auth_required?: boolean;
  enabled?: boolean;
  status?: string;
  entrypoint?: string;
}

export interface DeployPayload {
  entrypoint?: string;
  dependencies?: string[];
  files: Record<string, string>;
}

export interface TestPayload {
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, unknown>;
}

/**
 * Client for SnackBase Functions — admin CRUD and runtime invoke.
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

  /** List functions (admin). */
  async list(limit = 100): Promise<FunctionListResponse> {
    const response = await this.http.get<FunctionListResponse>('/api/v1/functions', {
      params: { limit },
    });
    return response.data;
  }

  async get(slug: string): Promise<FunctionItem> {
    const response = await this.http.get<FunctionItem>(`/api/v1/functions/${slug}`);
    return response.data;
  }

  async create(data: CreateFunctionPayload): Promise<FunctionItem> {
    const response = await this.http.post<FunctionItem>('/api/v1/functions', data);
    return response.data;
  }

  async update(slug: string, data: UpdateFunctionPayload): Promise<FunctionItem> {
    const response = await this.http.patch<FunctionItem>(`/api/v1/functions/${slug}`, data);
    return response.data;
  }

  async delete(slug: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/functions/${slug}`);
    return { success: true };
  }

  async deploy(
    slug: string,
    data: DeployPayload,
  ): Promise<{ function: FunctionItem; version: FunctionVersion }> {
    const response = await this.http.post<{ function: FunctionItem; version: FunctionVersion }>(
      `/api/v1/functions/${slug}/deploy`,
      data,
    );
    return response.data;
  }

  async getBody(slug: string, versionId?: string): Promise<FunctionBody> {
    const response = await this.http.get<FunctionBody>(`/api/v1/functions/${slug}/body`, {
      params: versionId ? { version_id: versionId } : undefined,
    });
    return response.data;
  }

  async listVersions(slug: string): Promise<{ items: FunctionVersion[]; total: number }> {
    const response = await this.http.get<{ items: FunctionVersion[]; total: number }>(
      `/api/v1/functions/${slug}/versions`,
    );
    return response.data;
  }

  async activateVersion(slug: string, versionId: string): Promise<FunctionItem> {
    const response = await this.http.post<FunctionItem>(
      `/api/v1/functions/${slug}/versions/${versionId}/activate`,
    );
    return response.data;
  }

  async updateGrants(slug: string, grants: string[]): Promise<FunctionItem> {
    const response = await this.http.patch<FunctionItem>(`/api/v1/functions/${slug}/grants`, {
      grants,
    });
    return response.data;
  }

  async listExecutions(
    slug: string,
    limit = 50,
  ): Promise<{ items: FunctionExecution[]; total: number }> {
    const response = await this.http.get<{ items: FunctionExecution[]; total: number }>(
      `/api/v1/functions/${slug}/executions`,
      { params: { limit } },
    );
    return response.data;
  }

  async test(slug: string, data: TestPayload): Promise<Record<string, unknown>> {
    const response = await this.http.post<Record<string, unknown>>(
      `/api/v1/functions/${slug}/test`,
      data,
    );
    return response.data;
  }

  async stats(slug: string, range: '1h' | '24h' | '7d' = '24h'): Promise<FunctionStats> {
    const response = await this.http.get<FunctionStats>(`/api/v1/functions/${slug}/stats`, {
      params: { range },
    });
    return response.data;
  }

  async listSecrets(): Promise<{ items: FunctionSecret[]; total: number }> {
    const response = await this.http.get<{ items: FunctionSecret[]; total: number }>(
      '/api/v1/function-secrets',
    );
    return response.data;
  }

  async upsertSecret(name: string, value: string): Promise<FunctionSecret> {
    const response = await this.http.post<FunctionSecret>('/api/v1/function-secrets', {
      name,
      value,
    });
    return response.data;
  }

  async deleteSecret(name: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/function-secrets/${name}`);
    return { success: true };
  }
}
