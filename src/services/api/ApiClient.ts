import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { apiConfig } from "@/config/api.config";

import { tokenStore } from "./token-store";
import type { ApiErrorResponse } from "./types";

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

class ApiClient {
  private static instance: ApiClient;
  private readonly client: AxiosInstance;
  private refreshPromise: Promise<string | null> | null = null;

  private constructor() {
    this.client = axios.create({
      baseURL: apiConfig.baseURL,
      timeout: apiConfig.timeout,
      headers: apiConfig.headers,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }

    return ApiClient.instance;
  }

  get axios(): AxiosInstance {
    return this.client;
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = tokenStore.get();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as RetryableConfig | undefined;
        const isUnauthorized = error.response?.status === 401;

        if (!isUnauthorized || !originalRequest || originalRequest._retry) {
          return Promise.reject(this.normalizeError(error));
        }

        originalRequest._retry = true;

        try {
          const newToken = await this.refreshAccessToken();

          if (!newToken) {
            tokenStore.clear();
            return Promise.reject(this.normalizeError(error));
          }

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return this.client(originalRequest);
        } catch (refreshError) {
          tokenStore.clear();
          return Promise.reject(refreshError);
        }
      },
    );
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { accessToken: string };
      tokenStore.set(data.accessToken);
      return data.accessToken;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private normalizeError(error: AxiosError<ApiErrorResponse & { error?: string }>): Error {
    const data = error.response?.data;
    const message =
      data?.error ??
      data?.message ??
      error.message ??
      "An unexpected error occurred";

    return new Error(message);
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = ApiClient.getInstance();
