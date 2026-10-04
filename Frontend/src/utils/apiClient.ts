const rawBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");
export const API_BASE_URL = rawBaseUrl.endsWith("/api/v1") ? rawBaseUrl : `${rawBaseUrl}/api/v1`;

export interface ApiFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  token?: string | null;
  credentials?: RequestCredentials;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code?: string; message: string; details?: any };
  pagination?: any;
}

export async function fetchApi<T>(path: string, options: ApiFetchOptions = {}): Promise<ApiResponse<T>> {
  const { token, body, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(fetchOptions.headers || {}),
  };

  const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  let finalBody: BodyInit | undefined = undefined;
  if (body !== undefined && body !== null) {
    if (isFormData || typeof body === "string") {
      finalBody = body;
    } else {
      finalBody = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      body: finalBody,
      headers,
      credentials: "include",
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.success) {
      const errorMsg = json?.error?.message || json?.message || `Request failed with status ${response.status}`;
      return {
        success: false,
        error: { message: errorMsg },
      };
    }

    return {
      success: true,
      data: json.data as T,
      pagination: json.pagination,
    };
  } catch (err: any) {
    return {
      success: false,
      error: { message: err?.message || "Network request failed" },
    };
  }
}
