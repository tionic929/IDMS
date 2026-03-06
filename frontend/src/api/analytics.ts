import api from '../api/axios';
import { type DashboardData } from '../types/analytics';

export interface DashboardFilters {
  days?: number;
  department?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Fetch dashboard data with optional filtering
 * @param filters - Optional filters for days, department, or date range
 * @returns Promise with dashboard data
 */
export const fetchDashboardData = async (filters?: DashboardFilters): Promise<DashboardData> => {
  try {
    const params = new URLSearchParams();

    if (filters?.days) {
      params.append('days', filters.days.toString());
    }
    if (filters?.department) {
      params.append('department', filters.department);
    }
    if (filters?.startDate) {
      params.append('start_date', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('end_date', filters.endDate);
    }

    const response = await api.get<DashboardData>(
      '/analytics/dashboard',
      {
        params: Object.fromEntries(params.entries())
      }
    );

    // Validate response structure
    if (!response.data.summary) {
      throw new Error('Invalid dashboard data structure');
    }

    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    throw error;
  }
};

/**
 * Refetch dashboard data (for refresh button)
 */
export const refreshDashboardData = async (filters?: DashboardFilters): Promise<DashboardData> => {
  return fetchDashboardData(filters);
};

/**
 * Export dashboard data to CSV format (legacy, kept for compatibility)
 * @param data - Dashboard data to export
 * @param filters - Optional filters applied
 */
export const exportDashboardAsCSV = (
  data: DashboardData,
  filters?: DashboardFilters
): void => {
  try {
    const headers = ['Metric', 'Value'];
    const rows: string[][] = [
      headers,
      ['Total Records', data.summary.total_records.toString()],
      ['New This Week', data.summary.new_this_week.toString()],
      ['Issued Cards', data.summary.issued_cards.toString()],
      ['User Growth', data.summary.user_growth.toString()],
      [''],
      ['Department', 'Count', 'Percentage'],
      ...data.departments.full_list.map(dept => [
        dept.name,
        dept.total.toString(),
        `${dept.percentage}%`
      ])
    ];

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export CSV:', error);
    throw error;
  }
};

/**
 * Export a formatted XLSX spreadsheet from the backend.
 * Includes full student records with names, status, course, and date range.
 */
export const exportSpreadsheet = async (
  filters?: DashboardFilters
): Promise<void> => {
  try {
    const params = new URLSearchParams();

    if (filters?.startDate) {
      params.append('start_date', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('end_date', filters.endDate);
    }
    if (filters?.department) {
      params.append('department', filters.department);
    }
    if (filters?.days && !filters?.startDate) {
      // Compute start_date from days if no explicit start_date
      const d = new Date();
      d.setDate(d.getDate() - filters.days);
      params.append('start_date', d.toISOString().split('T')[0]);
      params.append('end_date', new Date().toISOString().split('T')[0]);
    }

    const response = await api.get('/analytics/export', {
      params: Object.fromEntries(params.entries()),
      responseType: 'blob',
    });

    // Extract filename from content-disposition header or use fallback
    const disposition = response.headers['content-disposition'];
    let fileName = `IDMS-Export-${new Date().toISOString().split('T')[0]}.xlsx`;
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match?.[1]) {
        fileName = match[1].replace(/['"]/g, '');
      }
    }

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export spreadsheet:', error);
    throw error;
  }
};