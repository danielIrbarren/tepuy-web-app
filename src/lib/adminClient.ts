"use client";

export class AdminApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

type ErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

type FetchAdminOptions = {
  fallbackMessage?: string;
  onUnauthorized?: () => void;
};

async function parseAdminError(
  response: Response,
  fallbackMessage: string
) {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return new AdminApiError(
      payload.error?.message ?? fallbackMessage,
      response.status,
      payload.error?.code
    );
  } catch {
    return new AdminApiError(fallbackMessage, response.status);
  }
}

export async function fetchAdmin(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchAdminOptions = {}
) {
  const response = await fetch(input, init);

  if (response.status === 401) {
    options.onUnauthorized?.();
  }

  if (!response.ok) {
    throw await parseAdminError(
      response,
      options.fallbackMessage ?? "Error en la operación administrativa."
    );
  }

  return response;
}

export async function fetchAdminJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchAdminOptions = {}
) {
  const response = await fetchAdmin(input, init, options);
  return (await response.json()) as T;
}

export async function logoutAdmin(onComplete?: () => void) {
  try {
    await fetch("/api/admin/logout", { method: "DELETE" });
  } finally {
    onComplete?.();
  }
}
