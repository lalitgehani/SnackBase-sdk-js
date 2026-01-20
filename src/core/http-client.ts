import { TimeoutError, NetworkError } from './errors';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: any;
  timeout?: number;
  signal?: AbortSignal;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  request: HttpRequest;
}

export type RequestInterceptor = (request: HttpRequest) => HttpRequest | Promise<HttpRequest>;
export type ResponseInterceptor = (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;
export type ErrorInterceptor = (error: any) => any | Promise<any>;

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Robust HTTP client wrapping the fetch API.
 */
export class HttpClient {
  private config: Required<HttpClientConfig>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: HttpClientConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  public addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  public async request<T = any>(req: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    let currentReq: HttpRequest = {
      url: req.url || '',
      method: req.method || 'GET',
      headers: req.headers || {},
      body: req.body,
      timeout: req.timeout ?? this.config.timeout,
      signal: req.signal,
    };

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      currentReq = await interceptor(currentReq);
    }

    const fullUrl = this.resolveUrl(currentReq.url);
    const controller = new AbortController();
    const { signal } = controller;

    if (currentReq.signal) {
      currentReq.signal.addEventListener('abort', () => controller.abort());
    }

    const timeoutId = setTimeout(() => controller.abort(), currentReq.timeout);

    let retryCount = 0;
    
    const executeFetch = async (): Promise<HttpResponse<T>> => {
      try {
        const fetchOptions: RequestInit = {
          method: currentReq.method,
          headers: currentReq.headers,
          body: currentReq.body ? JSON.stringify(currentReq.body) : undefined,
          signal,
        };

        const response = await fetch(fullUrl, fetchOptions);
        clearTimeout(timeoutId);

        let data: any;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        let httpResponse: HttpResponse<T> = {
          data,
          status: response.status,
          headers: response.headers,
          request: currentReq,
        };

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          httpResponse = await interceptor(httpResponse);
        }

        return httpResponse;
      } catch (error: any) {
        clearTimeout(timeoutId);

        let processedError = error;
        if (error.name === 'AbortError') {
          processedError = new TimeoutError(`Request timed out after ${currentReq.timeout}ms`);
        } else if (!(error instanceof Error)) {
          processedError = new NetworkError(error.message || 'Network request failed', error);
        }

        // Apply error interceptors
        for (const interceptor of this.errorInterceptors) {
          try {
            processedError = await interceptor(processedError);
          } catch (interceptorError) {
            processedError = interceptorError;
          }
        }

        // Retry logic
        if (this.shouldRetry(processedError, retryCount)) {
          retryCount++;
          const delay = this.calculateRetryDelay(retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeFetch();
        }

        throw processedError;
      }
    };

    return executeFetch();
  }

  public async get<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  public async post<T = any>(url: string, body?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', body });
  }

  public async put<T = any>(url: string, body?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', body });
  }

  public async patch<T = any>(url: string, body?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', body });
  }

  public async delete<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const base = this.config.baseUrl.endsWith('/') ? this.config.baseUrl : `${this.config.baseUrl}/`;
    const relative = url.startsWith('/') ? url.slice(1) : url;
    return `${base}${relative}`;
  }

  private shouldRetry(error: any, retryCount: number): boolean {
    if (retryCount >= this.config.maxRetries) {
      return false;
    }
    return error.retryable === true;
  }

  private calculateRetryDelay(retryCount: number): number {
    return this.config.retryDelay * Math.pow(2, retryCount - 1);
  }
}
