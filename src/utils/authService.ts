/**
 * Utility untuk berkomunikasi dengan Auth Service
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  nip: string;
  type: string;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch data user dari auth service berdasarkan userId.
 * Mengembalikan null jika user tidak ditemukan atau request gagal.
 */
export async function fetchAuthUser(userId: string): Promise<AuthUser | null> {
  const baseUrl = process.env.AUTH_SERVICE_URL;

  if (!baseUrl) {
    console.warn("[authService] AUTH_SERVICE_URL is not set, skipping user fetch");
    return null;
  }

  try {
    const url = `${baseUrl}/api/users/${userId}`;
    const response = await fetch(url, {
      headers: {
        "X-Service-Name": "sim-iku",
        "X-Internal-Key": process.env.INTERNAL_SERVICE_KEY ?? "",
      },
    });

    if (!response.ok) {
      console.warn(`[authService] Failed to fetch user ${userId}: HTTP ${response.status}`);
      return null;
    }

    const body = await response.json() as { success: boolean; data: AuthUser };

    if (!body.success || !body.data) {
      return null;
    }

    return body.data;
  } catch (err) {
    console.error(`[authService] Error fetching user ${userId}:`, err);
    return null;
  }
}

/**
 * Fetch beberapa user sekaligus secara paralel dari auth service.
 * Mengembalikan Map<userId, AuthUser | null>.
 */
export async function fetchAuthUsers(userIds: string[]): Promise<Map<string, AuthUser | null>> {
  const uniqueIds = [...new Set(userIds)];
  const results = await Promise.all(
    uniqueIds.map(async (id) => ({ id, user: await fetchAuthUser(id) }))
  );

  const map = new Map<string, AuthUser | null>();
  for (const { id, user } of results) {
    map.set(id, user);
  }
  return map;
}
