import type { APIRequestContext, APIResponse } from "@playwright/test";
import { frameworkEnv } from "../../../config/env.config.js";

export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl = frameworkEnv.apiBaseUrl,
  ) {}

  async get(path: string): Promise<APIResponse> {
    return this.request.get(this.resolveUrl(path));
  }

  async post(path: string, data?: unknown): Promise<APIResponse> {
    return this.request.post(this.resolveUrl(path), { data });
  }

  private resolveUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return new URL(path, `${this.baseUrl}/`).toString();
  }
}

