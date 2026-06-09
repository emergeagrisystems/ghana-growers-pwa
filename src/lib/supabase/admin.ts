type InsertResponse<T> = {
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
