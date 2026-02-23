export interface TrendData {
  month: string;
  count: number;
}

export interface Department {
  name: string;
  total: number;
  percentage: number;
}

export interface DashboardData {
  summary: {
    total_records: number;
    new_this_week: number;
    issued_cards: number;
    user_growth: string;
  };
  trends: TrendData[];
  departments: {
    full_list: Department[];
    highest: Department;
  };
}