/**
 * Applications API Client
 */
import { Application, ApplicationStatus, PriorityLevel } from '../types/application.types.js';
import { API_ENDPOINTS } from '../../../config/api.config.js';

const API_BASE = API_ENDPOINTS.APPLICATIONS;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('applytrack_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const applicationsApi = {
  async list(filters?: { status?: string; search?: string }): Promise<{ applications: Application[]; totalCount: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    try {
      const res = await fetch(`${API_BASE}?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const cached = localStorage.getItem('applytrack_applications');
        const apps = cached ? JSON.parse(cached) : [];
        return { applications: apps, totalCount: apps.length };
      }
      const json = await res.json();
      if (json.data?.applications && !filters?.status && !filters?.search) {
        localStorage.setItem('applytrack_applications', JSON.stringify(json.data.applications));
      }
      return json.data || { applications: [], totalCount: 0 };
    } catch {
      const cached = localStorage.getItem('applytrack_applications');
      const apps = cached ? JSON.parse(cached) : [];
      return { applications: apps, totalCount: apps.length };
    }
  },

  async getMetrics(): Promise<Record<string, number>> {
    const res = await fetch(`${API_BASE}/metrics`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json.data || {};
  },

  async getById(id: string): Promise<Application | null> {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json.data || null;
  },

  async create(data: {
    companyName: string;
    roleTitle: string;
    companyDomain?: string;
    jobUrl?: string;
    location?: string;
    salaryRange?: string;
    priority?: PriorityLevel;
    notes?: string;
    source?: string;
    status?: ApplicationStatus;
    stageDueDate?: string;
  }): Promise<Application> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || json.error || `Server error (${res.status}): Failed to create application`);
    }
    return json.data;
  },

  async updateStatus(id: string, status: ApplicationStatus): Promise<Application> {
    const res = await fetch(`${API_BASE}/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    return json.data;
  },

  async update(id: string, data: Partial<Application>): Promise<Application> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return json.data;
  },

  async archive(id: string): Promise<void> {
    await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  async batchArchive(ids: string[]): Promise<{ count: number }> {
    const res = await fetch(`${API_BASE}/batch-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids })
    });
    const json = await res.json();
    return json.data || { count: 0 };
  },

  async syncGmail(): Promise<{ syncedCount: number; message: string }> {
    const res = await fetch(`${API_BASE}/sync-gmail`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({})
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || json.error || `Server error (${res.status}): Failed to sync Gmail`);
    }
    return json.data || { syncedCount: 0, message: json.message || 'Sync complete' };
  }
};

export default applicationsApi;
