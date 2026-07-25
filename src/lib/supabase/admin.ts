type InsertResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

type StorageUploadResponse = {
  path?: string;
  publicUrl?: string;
  error?: string;
  status: number;
};

type StorageDownloadResponse = {
  body?: ArrayBuffer;
  contentType?: string;
  error?: string;
  status: number;
};

type StorageDeleteResponse = {
  error?: string;
  status: number;
};

type StorageSignedUrlResponse = {
  signedUrl?: string;
  error?: string;
  status: number;
};

export type SelectResponse<T> = {
  data?: T[];
  error?: string;
  status: number;
};

type RpcResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

function supabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

export function hasSupabaseAdminConfig() {
  const { url, serviceRoleKey } = supabaseConfig();
  return Boolean(url && serviceRoleKey);
}

export async function insertSupabaseRecord<T extends Record<string, unknown>>(table: string, payload: T): Promise<InsertResponse<T>> {
  const { url, serviceRoleKey } = supabaseConfig();

  if (!url || !serviceRoleKey) {
    return {
      status: 503,
      error: "Supabase is not configured on the server. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    };
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });

  const result = (await response.json().catch(() => null)) as T[] | { message?: string; details?: string; hint?: string } | null;

  if (!response.ok) {
    const message =
      result && !Array.isArray(result)
        ? [result.message, result.details, result.hint].filter(Boolean).join(" ")
        : "Supabase insert failed.";

    return { status: response.status, error: message || "Supabase insert failed." };
  }

  return { status: response.status, data: Array.isArray(result) ? result[0] : undefined };
}

export async function selectSupabaseRecords<T extends Record<string, unknown>>(table: string, query: string): Promise<SelectResponse<T>> {
  const { url, serviceRoleKey } = supabaseConfig();

  if (!url || !serviceRoleKey) {
    return {
      status: 503,
      error: "Supabase is not configured on the server. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    };
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}?${query}`, {
    method: "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  const result = (await response.json().catch(() => null)) as T[] | { message?: string; details?: string; hint?: string } | null;

  if (!response.ok) {
    const message =
      result && !Array.isArray(result)
        ? [result.message, result.details, result.hint].filter(Boolean).join(" ")
        : "Supabase select failed.";

    return { status: response.status, error: message || "Supabase select failed." };
  }

  return { status: response.status, data: Array.isArray(result) ? result : [] };
}

export async function updateSupabaseRecord<T extends Record<string, unknown>>(
  table: string,
  filter: string,
  payload: T
): Promise<InsertResponse<T>> {
  const { url, serviceRoleKey } = supabaseConfig();

  if (!url || !serviceRoleKey) {
    return {
      status: 503,
      error: "Supabase is not configured on the server. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    };
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });

  const result = (await response.json().catch(() => null)) as T[] | { message?: string; details?: string; hint?: string } | null;

  if (!response.ok) {
    const message =
      result && !Array.isArray(result)
        ? [result.message, result.details, result.hint].filter(Boolean).join(" ")
        : "Supabase update failed.";

    return { status: response.status, error: message || "Supabase update failed." };
  }

  return { status: response.status, data: Array.isArray(result) ? result[0] : undefined };
}

export async function callSupabaseRpc<T>(
  functionName: string,
  payload: Record<string, unknown>
): Promise<RpcResponse<T>> {
  const { url, serviceRoleKey } = supabaseConfig();

  if (!url || !serviceRoleKey) {
    return {
      status: 503,
      error: "Supabase is not configured on the server. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    };
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = (await response.json().catch(() => null)) as T | { message?: string; details?: string; hint?: string } | null;

  if (!response.ok) {
    const message =
      result && typeof result === "object" && "message" in result
        ? [result.message, result.details, result.hint].filter(Boolean).join(" ")
        : "Supabase RPC call failed.";

    return { status: response.status, error: message || "Supabase RPC call failed." };
  }

  return { status: response.status, data: result as T };
}

export async function uploadSupabaseStorageObject({
  bucket,
  path,
  contentType,
  body,
  publicUrl = true
}: {
  bucket: string;
  path: string;
  contentType: string;
  body: ArrayBuffer;
  publicUrl?: boolean;
}): Promise<StorageUploadResponse> {
  const { url, serviceRoleKey } = supabaseConfig();

  if (!url || !serviceRoleKey) {
    return {
      status: 503,
      error: "Supabase Storage is not configured on the server. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    };
  }

  const cleanUrl = url.replace(/\/$/, "");
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const response = await fetch(`${cleanUrl}/storage/v1/object/${bucket}/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": contentType,
      "x-upsert": "true"
    },
    body
  });

  const result = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;

  if (!response.ok) {
    return {
      status: response.status,
      error: result?.message || result?.error || "Supabase Storage upload failed."
    };
  }

  return {
    status: response.status,
    path,
    publicUrl: publicUrl ? `${cleanUrl}/storage/v1/object/public/${bucket}/${encodedPath}` : undefined
  };
}

export async function downloadSupabaseStorageObject({
  bucket,
  path
}: {
  bucket: string;
  path: string;
}): Promise<StorageDownloadResponse> {
  const { url, serviceRoleKey } = supabaseConfig();

  if (!url || !serviceRoleKey) {
    return {
      status: 503,
      error: "Supabase Storage is not configured on the server. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    };
  }

  const cleanUrl = url.replace(/\/$/, "");
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const response = await fetch(`${cleanUrl}/storage/v1/object/${bucket}/${encodedPath}`, {
    method: "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;

    return {
      status: response.status,
      error: result?.message || result?.error || "Supabase Storage download failed."
    };
  }

  return {
    status: response.status,
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? undefined
  };
}

export async function deleteSupabaseStorageObject({
  bucket,
  path
}: {
  bucket: string;
  path: string;
}): Promise<StorageDeleteResponse> {
  const { url, serviceRoleKey } = supabaseConfig();

  if (!url || !serviceRoleKey) {
    return {
      status: 503,
      error: "Supabase Storage is not configured on the server. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    };
  }

  const cleanUrl = url.replace(/\/$/, "");
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const response = await fetch(`${cleanUrl}/storage/v1/object/${bucket}/${encodedPath}`, {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  });

  if (!response.ok && response.status !== 404) {
    const result = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;

    return {
      status: response.status,
      error: result?.message || result?.error || "Supabase Storage delete failed."
    };
  }

  return { status: response.status };
}

export async function createSupabaseStorageSignedUrl({
  bucket,
  path,
  expiresIn = 300
}: {
  bucket: string;
  path: string;
  expiresIn?: number;
}): Promise<StorageSignedUrlResponse> {
  const { url, serviceRoleKey } = supabaseConfig();

  if (!url || !serviceRoleKey) {
    return {
      status: 503,
      error: "Supabase Storage is not configured on the server."
    };
  }

  const cleanUrl = url.replace(/\/$/, "");
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const response = await fetch(`${cleanUrl}/storage/v1/object/sign/${bucket}/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expiresIn: Math.min(600, Math.max(60, expiresIn)) }),
    cache: "no-store"
  });
  const result = (await response.json().catch(() => null)) as {
    signedURL?: string;
    signedUrl?: string;
    message?: string;
    error?: string;
  } | null;

  if (!response.ok) {
    return {
      status: response.status,
      error: result?.message || result?.error || "Private media preview could not be created."
    };
  }

  const signedPath = result?.signedURL ?? result?.signedUrl;
  if (!signedPath) {
    return { status: 502, error: "Private media preview could not be created." };
  }

  return {
    status: response.status,
    signedUrl: signedPath.startsWith("http") ? signedPath : `${cleanUrl}${signedPath.startsWith("/") ? "" : "/"}${signedPath}`
  };
}
