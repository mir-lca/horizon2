import { ContainerTypes } from "@/lib/cosmos-config";

const DEFAULT_API_BASE = "/api";

function getApiBase() {
  if (typeof window !== "undefined" && (window as any).HORIZON_API_BASE_URL) {
    return (window as any).HORIZON_API_BASE_URL;
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE;
}

function buildUrl(path: string) {
  return `${getApiBase()}${path}`;
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json();
}

const containerEndpoints: Record<ContainerTypes, string> = {
  [ContainerTypes.PROJECTS]: "/projects",
  [ContainerTypes.BUSINESS_UNITS]: "/business-units",
  [ContainerTypes.RESOURCES]: "/resources",
  [ContainerTypes.COMPETENCES]: "/competences",
};

export const apiService = {
  async getAll<T>(container: ContainerTypes): Promise<T[]> {
    return fetchJson<T[]>(containerEndpoints[container]);
  },

  async getById<T>(container: ContainerTypes, id: string): Promise<T> {
    return fetchJson<T>(`${containerEndpoints[container]}/${id}`);
  },

  async upsert<T extends { id?: string }>(container: ContainerTypes, item: T): Promise<T> {
    if (item.id) {
      const result = await fetchJson<T>(`${containerEndpoints[container]}/${item.id}`, {
        method: "PUT",
        body: JSON.stringify(item),
      });
      return result;
    }

    const result = await fetchJson<T>(containerEndpoints[container], {
      method: "POST",
      body: JSON.stringify(item),
    });
    return result;
  },

  async delete(container: ContainerTypes, id: string): Promise<void> {
    await fetchJson(`${containerEndpoints[container]}/${id}`, { method: "DELETE" });
  },
};
