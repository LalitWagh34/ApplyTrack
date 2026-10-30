/**
 * Follow-Ups API Client
 */
import { PendingFollowUp, FollowUpDraft } from '../types/followup.types.js';
import { API_ENDPOINTS } from '../../../config/api.config.js';

const API_BASE = API_ENDPOINTS.FOLLOWUPS;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('applytrack_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const followupsApi = {
  async getPending(): Promise<PendingFollowUp[]> {
    const res = await fetch(`${API_BASE}/pending`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json.data || [];
  },

  async generateDraft(
    id: string,
    tone: 'polite_nudge' | 'value_add' | 'polite_breakup' = 'polite_nudge'
  ): Promise<FollowUpDraft> {
    const res = await fetch(`${API_BASE}/${id}/draft`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tone })
    });
    if (!res.ok) {
      throw new Error(`Failed to generate draft: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json?.data) {
      throw new Error('No draft data returned');
    }
    return json.data;
  },

  async dismiss(id: string, snoozeDays = 7): Promise<void> {
    await fetch(`${API_BASE}/${id}/dismiss`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ snoozeDays })
    });
  },

  async markSent(id: string, draftBody?: string): Promise<void> {
    await fetch(`${API_BASE}/${id}/sent`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ draftBody })
    });
  }
};

export default followupsApi;
