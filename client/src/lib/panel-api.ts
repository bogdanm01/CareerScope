import { fetchJson, getApiBaseUrl, type FetchJsonOptions, HttpError } from './http';

export type ApiPagination = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
  pagination?: ApiPagination;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

const unwrapApiResponse = <T>(payload: ApiResponse<T>) => {
  if (!payload.success) {
    throw new HttpError(payload.message, 400, payload.code);
  }

  return payload;
};

export const apiGet = async <T>(path: string, options: Omit<FetchJsonOptions, 'body'> = {}) => {
  const payload = await fetchJson<ApiResponse<T>>(path, options);
  return unwrapApiResponse(payload);
};

export const apiPost = async <T>(path: string, body?: Record<string, unknown>) => {
  const payload = await fetchJson<ApiResponse<T>>(path, {
    method: 'POST',
    body,
  });

  return unwrapApiResponse(payload);
};

export const apiPatch = async <T>(path: string, body?: Record<string, unknown>) => {
  const payload = await fetchJson<ApiResponse<T>>(path, {
    method: 'PATCH',
    body,
  });

  return unwrapApiResponse(payload);
};

export const apiPut = async <T>(path: string, body?: Record<string, unknown>) => {
  const payload = await fetchJson<ApiResponse<T>>(path, {
    method: 'PUT',
    body,
  });

  return unwrapApiResponse(payload);
};

export const apiDelete = async <T>(path: string) => {
  const payload = await fetchJson<ApiResponse<T>>(path, {
    method: 'DELETE',
  });

  return unwrapApiResponse(payload);
};

const readUploadErrorMessage = async (response: Response) => {
  const text = await response.text().catch(() => '');

  if (text) {
    try {
      const payload = JSON.parse(text) as Partial<ApiErrorResponse>;

      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message;
      }
    } catch {
      // fall through to raw response text
    }
  }

  return text.trim() || response.statusText || 'Request failed';
};

export const apiUpload = async <T>(path: string, formData: FormData) => {
  const baseUrl = getApiBaseUrl();
  const url = baseUrl.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${path}` : new URL(path, baseUrl).toString();
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw new HttpError(await readUploadErrorMessage(response), response.status);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return unwrapApiResponse(payload);
};
