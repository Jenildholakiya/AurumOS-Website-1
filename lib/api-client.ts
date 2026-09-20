/**
 * Safe JSON fetch for client components.
 *
 * A plain `res.json()` explodes with `Unexpected token '<' ... is not valid
 * JSON` whenever the server answers HTML instead of JSON — proxy 404s,
 * redirects swept to the login page, or platform error pages. This helper
 * reads text first and throws a clean, human-readable message instead, so
 * the UI never shows a raw SyntaxError.
 *
 * Usage:
 *   const { res, data } = await apiJson('/api/auth/login', { method: 'POST', ... });
 *   if (!res.ok || !data.ok) throw new Error(data?.error || 'Fallback message.');
 */
// `T` defaults to `any` — same ergonomics as the old `res.json()` calls,
// so existing `data?.error` / `data.user` access needs no churn.
export async function apiJson<T = any>(
  url: string,
  init?: RequestInit
): Promise<{ res: Response; data: T }> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }

  const text = await res.text().catch(() => '');
  if (!text) {
    throw new Error(
      res.ok
        ? 'Empty response from the server. Please try again.'
        : `Request failed (${res.status}). Please try again.`
    );
  }

  try {
    return { res, data: JSON.parse(text) as T };
  } catch {
    throw new Error('Service temporarily unavailable. Refresh the page and try again.');
  }
}
