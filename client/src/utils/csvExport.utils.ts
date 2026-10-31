/**
 * CSV Export Utility
 * Converts tracked job applications into a clean, downloadable CSV file for Excel / Google Sheets
 */
import { Application } from '../features/applications/types/application.types.js';

export function exportApplicationsToCSV(applications: Application[]): void {
  if (!applications || applications.length === 0) {
    alert('No applications available to export.');
    return;
  }

  const headers = [
    'Company Name',
    'Role Title',
    'Status',
    'Priority',
    'Applied Date',
    'Stage Due Date',
    'Next Follow-Up Date',
    'Follow-Up Count',
    'Has Reply',
    'Job URL',
    'Location',
    'Salary Range',
    'Notes'
  ];

  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = applications.map((app) => [
    escapeCSV(app.companyName),
    escapeCSV(app.roleTitle),
    escapeCSV(app.status),
    escapeCSV(app.priority),
    escapeCSV(app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : ''),
    escapeCSV(app.stageDueDate ? new Date(app.stageDueDate).toLocaleDateString() : ''),
    escapeCSV(app.nextFollowUpDate ? new Date(app.nextFollowUpDate).toLocaleDateString() : ''),
    escapeCSV(app.followUpCount),
    escapeCSV(app.hasReply ? 'Yes' : 'No'),
    escapeCSV(app.jobUrl || ''),
    escapeCSV(app.location || ''),
    escapeCSV(app.salaryRange || ''),
    escapeCSV(app.notes || '')
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];

  link.setAttribute('href', url);
  link.setAttribute('download', `applytrack_applications_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
