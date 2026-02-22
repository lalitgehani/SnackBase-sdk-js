/**
 * RecordServiceCompat — PocketBase-compatible record CRUD bridge.
 *
 * Phase 2: getList, getFullList, getFirstListItem, getOne, create, update, delete.
 * Phase 3: authWithPassword, authWithOAuth2Code, authWithOAuth2, authRefresh,
 *   listAuthMethods, requestPasswordReset, confirmPasswordReset,
 *   requestVerification, confirmVerification, and unsupported stubs.
 * Phase 4 (realtime) stubs remain.
 */

import type { SnackBaseClient } from '@snackbase/sdk';
import type { ListResult, RecordModel, RecordAuthResponse, AuthMethodsList } from './types.js';
import { ClientResponseError, NotSupportedError, wrapThrow } from './errors.js';
import {
  toRecordModel,
  fromRecordModel,
  toListResult,
  toSnackListParams,
} from './normalizer.js';

export interface SendOptions {
  expand?: string | string[];
  fields?: string | string[];
  filter?: string;
  sort?: string;
  [key: string]: any;
}

export interface FullListOptions extends SendOptions {
  batch?: number;
}

export class RecordServiceCompat<M extends RecordModel = RecordModel> {
  constructor(
    private readonly snackbase: SnackBaseClient,
    public readonly collectionIdOrName: string,
  ) {}

  /**
   * Fetch a paginated list of records.
   */
  async getList<T extends RecordModel = M>(
    page = 1,
    perPage = 30,
    opts: SendOptions = {},
  ): Promise<ListResult<T>> {
    return wrapThrow(async () => {
      const params = toSnackListParams(page, perPage, opts);
      const result = await this.snackbase.records.list<T>(this.collectionIdOrName, params);
      return toListResult(result as any, this.collectionIdOrName, page, perPage) as ListResult<T>;
    });
  }

  /**
   * Fetch all records by looping getList until all items are retrieved.
   *
   * @param batchOrOpts - batch size (number) or options object with optional `batch` field
   * @param opts - options when batchOrOpts is a number
   */
  async getFullList<T extends RecordModel = M>(
    batchOrOpts?: number | FullListOptions,
    opts?: SendOptions,
  ): Promise<T[]> {
    let batchSize: number;
    let options: SendOptions;

    if (typeof batchOrOpts === 'number') {
      batchSize = batchOrOpts;
      options = opts ?? {};
    } else if (batchOrOpts && typeof batchOrOpts === 'object') {
      const { batch, ...rest } = batchOrOpts;
      batchSize = batch ?? 200;
      options = rest;
    } else {
      batchSize = 200;
      options = {};
    }

    const result: T[] = [];
    let page = 1;

    while (true) {
      const listResult = await this.getList<T>(page, batchSize, options);
      result.push(...listResult.items);
      if (result.length >= listResult.totalItems) break;
      page++;
    }

    return result;
  }

  /**
   * Fetch the first matching record. Throws ClientResponseError(404) if none found.
   */
  async getFirstListItem<T extends RecordModel = M>(
    filter: string,
    opts: SendOptions = {},
  ): Promise<T> {
    return wrapThrow(async () => {
      const listResult = await this.getList<T>(1, 1, { ...opts, filter });
      if (listResult.items.length === 0) {
        throw new ClientResponseError({
          status: 404,
          message: "The requested resource wasn't found.",
          data: { code: 404, message: "The requested resource wasn't found." },
        });
      }
      return listResult.items[0];
    });
  }

  /**
   * Fetch a single record by ID.
   */
  async getOne<T extends RecordModel = M>(id: string, opts: SendOptions = {}): Promise<T> {
    return wrapThrow(async () => {
      const params: { fields?: string | string[]; expand?: string | string[] } = {};
      if (opts.expand) params.expand = opts.expand;
      if (opts.fields) params.fields = opts.fields;
      const raw = await this.snackbase.records.get<T>(this.collectionIdOrName, id, params);
      return toRecordModel(raw as unknown as Record<string, any>, this.collectionIdOrName) as unknown as T;
    });
  }

  /**
   * Create a new record. Strips PocketBase-specific fields before sending.
   * Passes FormData through unchanged (for file uploads).
   */
  async create<T extends RecordModel = M>(
    bodyParams: Partial<T> | FormData,
    opts: SendOptions = {},
  ): Promise<T> {
    return wrapThrow(async () => {
      const data =
        bodyParams instanceof FormData
          ? bodyParams
          : fromRecordModel(bodyParams as Record<string, any>);
      const raw = await this.snackbase.records.create<T>(
        this.collectionIdOrName,
        data as Partial<T>,
      );
      return toRecordModel(raw as unknown as Record<string, any>, this.collectionIdOrName) as unknown as T;
    });
  }

  /**
   * Partially update a record (PATCH). Strips PocketBase-specific fields before sending.
   * Passes FormData through unchanged (for file uploads).
   */
  async update<T extends RecordModel = M>(
    id: string,
    bodyParams: Partial<T> | FormData,
    opts: SendOptions = {},
  ): Promise<T> {
    return wrapThrow(async () => {
      const data =
        bodyParams instanceof FormData
          ? bodyParams
          : fromRecordModel(bodyParams as Record<string, any>);
      const raw = await this.snackbase.records.patch<T>(
        this.collectionIdOrName,
        id,
        data as Partial<T>,
      );
      return toRecordModel(raw as unknown as Record<string, any>, this.collectionIdOrName) as unknown as T;
    });
  }

  /**
   * Delete a record. Returns true on success.
   */
  async delete(id: string, opts: SendOptions = {}): Promise<boolean> {
    return wrapThrow(async () => {
      await this.snackbase.records.delete(this.collectionIdOrName, id);
      return true;
    });
  }

  // --- Phase 3: Authentication methods ---

  /**
   * Authenticate with email/username and password.
   * Works for any collection name (e.g. 'users', 'admins').
   */
  async authWithPassword<T extends RecordModel = M>(
    emailOrUsername: string,
    password: string,
    _opts: SendOptions = {},
  ): Promise<RecordAuthResponse<T>> {
    return wrapThrow(async () => {
      await this.snackbase.auth.login({ email: emailOrUsername, password });
      const state = this.snackbase.internalAuthManager.getState();
      const token = state.token ?? '';
      const user = state.user;
      const record = user
        ? (toRecordModel(user as unknown as Record<string, any>, this.collectionIdOrName) as unknown as T)
        : ({} as T);
      return { record, token, meta: {} };
    });
  }

  /**
   * Exchange an OAuth2 authorization code for a session.
   * The popup-relay flow is not supported; use this code-exchange path instead.
   */
  async authWithOAuth2Code<T extends RecordModel = M>(
    provider: string,
    code: string,
    _codeVerifier: string,
    redirectURL: string,
    _createData?: Record<string, any>,
    _opts: SendOptions = {},
  ): Promise<RecordAuthResponse<T>> {
    return wrapThrow(async () => {
      await this.snackbase.auth.handleOAuthCallback({
        provider: provider as any,
        code,
        redirectUri: redirectURL,
        state: '',
      });
      const state = this.snackbase.internalAuthManager.getState();
      const token = state.token ?? '';
      const user = state.user;
      const record = user
        ? (toRecordModel(user as unknown as Record<string, any>, this.collectionIdOrName) as unknown as T)
        : ({} as T);
      return { record, token, meta: {} };
    });
  }

  /**
   * Initiate OAuth2 login flow.
   * Fires `config.urlCallback(url)` with the authorization URL, then throws
   * NotSupportedError because the popup-relay mechanism is not supported.
   * Use `authWithOAuth2Code` after the redirect completes.
   */
  async authWithOAuth2<T extends RecordModel = M>(config: {
    provider: string;
    redirectUrl?: string;
    urlCallback?: (url: string) => void;
    scopes?: string[];
    [key: string]: any;
  }): Promise<RecordAuthResponse<T>> {
    const redirectUri = config.redirectUrl ?? '';
    try {
      const result = await this.snackbase.auth.getOAuthUrl(config.provider as any, redirectUri);
      if (config.urlCallback && result.url) {
        config.urlCallback(result.url);
      }
    } catch {
      // Ignore errors from URL generation — still throw NotSupportedError below
    }
    throw new NotSupportedError(
      'authWithOAuth2 popup-relay flow — use authWithOAuth2Code after the redirect instead',
    );
  }

  /**
   * Refresh the current auth session token.
   */
  async authRefresh<T extends RecordModel = M>(
    _opts: SendOptions = {},
  ): Promise<RecordAuthResponse<T>> {
    return wrapThrow(async () => {
      await this.snackbase.auth.refreshToken();
      const state = this.snackbase.internalAuthManager.getState();
      const token = state.token ?? '';
      const user = state.user;
      const record = user
        ? (toRecordModel(user as unknown as Record<string, any>, this.collectionIdOrName) as unknown as T)
        : ({} as T);
      return { record, token, meta: {} };
    });
  }

  /**
   * Returns a synthetic auth methods list: password enabled, OAuth enabled, MFA/OTP disabled.
   */
  async listAuthMethods(_opts: SendOptions = {}): Promise<AuthMethodsList> {
    return {
      mfa: { duration: 0, enabled: false, rule: '' },
      otp: { duration: 0, emailTemplate: {}, enabled: false, length: 0 },
      password: { enabled: true, identityFields: ['email'] },
      oauth2: { enabled: true, providers: [] },
    };
  }

  /**
   * Initiate password reset flow for a user email.
   * Returns true on success.
   */
  async requestPasswordReset(email: string, _opts: SendOptions = {}): Promise<boolean> {
    return wrapThrow(async () => {
      await this.snackbase.auth.forgotPassword({ email });
      return true;
    });
  }

  /**
   * Confirm a password reset using the token from the reset email.
   * Returns true on success.
   */
  async confirmPasswordReset(
    token: string,
    password: string,
    _passwordConfirm: string,
    _opts: SendOptions = {},
  ): Promise<boolean> {
    return wrapThrow(async () => {
      await this.snackbase.auth.resetPassword({ token, newPassword: password });
      return true;
    });
  }

  /**
   * Request a verification email for the currently authenticated user.
   * Requires an active session — throws ClientResponseError if not authenticated.
   */
  async requestVerification(_email: string, _opts: SendOptions = {}): Promise<boolean> {
    return wrapThrow(async () => {
      const state = this.snackbase.internalAuthManager.getState();
      if (!state.isAuthenticated) {
        throw new ClientResponseError({
          status: 401,
          message: 'requestVerification requires an authenticated session in SnackBase.',
        });
      }
      await this.snackbase.auth.resendVerificationEmail();
      return true;
    });
  }

  /**
   * Confirm email verification using the token from the verification email.
   * Returns true on success.
   */
  async confirmVerification(token: string, _opts: SendOptions = {}): Promise<boolean> {
    return wrapThrow(async () => {
      await this.snackbase.auth.verifyEmail(token);
      return true;
    });
  }

  // --- Unsupported auth methods ---

  requestEmailChange(): never {
    throw new NotSupportedError('requestEmailChange');
  }

  confirmEmailChange(): never {
    throw new NotSupportedError('confirmEmailChange');
  }

  requestOTP(): never {
    throw new NotSupportedError('requestOTP');
  }

  authWithOTP(): never {
    throw new NotSupportedError('authWithOTP');
  }

  impersonate(): never {
    throw new NotSupportedError('impersonate');
  }

  // --- Phase 4 stubs (realtime) ---

  subscribe(): never {
    throw new NotSupportedError('subscribe — will be available in Phase 4');
  }

  unsubscribe(): never {
    throw new NotSupportedError('unsubscribe — will be available in Phase 4');
  }
}
