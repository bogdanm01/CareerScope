export class HttpError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

const DEFAULT_API_BASE_URL = 'http://localhost:5432';

export const getApiBaseUrl = () => import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_BASE_URL;

const buildUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();

  if (baseUrl.startsWith('/')) {
    return `${baseUrl.replace(/\/$/, '')}${path}`;
  }

  return new URL(path, baseUrl).toString();
};

const readErrorMessage = async (response: Response) => {
  const text = await response.text().catch(() => '');

  if (text) {
    try {
      const payload = JSON.parse(text) as Record<string, unknown>;
      const message = payload.message;

      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    } catch {
      // Fall through to the raw response text.
    }
  }

  return text.trim() || response.statusText || 'Request failed';
};

type FetchJsonOptions = Omit<RequestInit, 'body'> & {
  body?: Record<string, unknown>;
};

export const fetchJson = async <T>(path: string, options: FetchJsonOptions = {}) => {
  const response = await fetch(buildUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new HttpError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
