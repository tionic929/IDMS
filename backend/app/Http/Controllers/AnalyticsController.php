<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Applicant as Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Get dashboard statistics with optional filtering
     * 
     * Query Parameters:
     * - days: int (1-365) - Filter data for last N days
     * - department: string - Filter by specific course/department
     * - start_date: Y-m-d - Filter from start date
     * - end_date: Y-m-d - Filter to end date
     */
    public function getDashboardStats(Request $request)
    {
        try {
            // Validate and sanitize inputs
            $days = $request->query('days', 30);
            $days = min(max((int)$days, 1), 365); // Clamp between 1-365
            
            $department = $request->query('department');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');

            // Build date filters
            $dateFrom = Carbon::now()->subDays($days);
            
            if ($startDate) {
                try {
                    $dateFrom = Carbon::createFromFormat('Y-m-d', $startDate);
                } catch (\Exception $e) {
                    return response()->json(['error' => 'Invalid start_date format (use Y-m-d)'], 422);
                }
            }

            $dateTo = Carbon::now();
            if ($endDate) {
                try {
                    $dateTo = Carbon::createFromFormat('Y-m-d', $endDate)->endOfDay();
                } catch (\Exception $e) {
                    return response()->json(['error' => 'Invalid end_date format (use Y-m-d)'], 422);
                }
            }

            // ===== 1. SUMMARY CARDS WITH FILTERS =====
            $applicantsQuery = Student::whereBetween('created_at', [$dateFrom, $dateTo]);
            
            // Apply department filter if specified
            if ($department) {
                $applicantsQuery->where('course', $department);
            }

            $totalApplicants = $applicantsQuery->count();
            
            // New this week (still use fixed week calculation)
            $newApplicantsThisWeek = Student::where('created_at', '>=', Carbon::now()->startOfWeek())
                ->when($department, function($q) use ($department) {
                    return $q->where('course', $department);
                })
                ->count();
            
            $issuedCards = $applicantsQuery->where('has_card', true)->count();
            
            $newUsers = User::where('created_at', '>=', Carbon::now()->startOfWeek())->count();

            // ===== 2. TRENDS OVER TIME (DYNAMIC BASED ON DAYS) =====
            // Fixed: Don't group by calculated columns, only by the date format
            $trends = Student::select(
                DB::raw("DATE_FORMAT(created_at, '%b %Y') as month"),
                DB::raw('COUNT(id) as count')
            )
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->when($department, function($q) use ($department) {
                return $q->where('course', $department);
            })
            ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"), DB::raw("DATE_FORMAT(created_at, '%b %Y')"))
            ->orderBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"), 'asc')
            ->get()
            ->map(function($trend) {
                return [
                    'month' => $trend->month,
                    'count' => (int)$trend->count
                ];
            });

            // ===== 3. DEPARTMENT ANALYSIS WITH FILTERS =====
            $deptQuery = Student::select('course as department', DB::raw('count(*) as total'))
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->groupBy('course')
                ->orderBy('total', 'desc');
            
            // If department filter applied, only show that department
            if ($department) {
                $deptQuery->where('course', $department);
            }

            $deptStats = $deptQuery->get();

            $totalCount = $deptStats->sum('total');

            $processedDepts = $deptStats->map(function($dept) use ($totalCount) {
                return [
                    'name' => $dept->department ?? 'Unassigned',
                    'total' => (int)$dept->total,
                    'percentage' => $totalCount > 0 ? round(($dept->total / $totalCount) * 100, 1) : 0
                ];
            })->values(); // Reset keys

            return response()->json([
                'summary' => [
                    'total_records' => $totalApplicants,
                    'new_this_week' => $newApplicantsThisWeek,
                    'issued_cards' => $issuedCards,
                    'user_growth' => $newUsers
                ],
                'trends' => $trends->toArray(),
                'departments' => [
                    'full_list' => $processedDepts->toArray(),
                    'highest' => $processedDepts->first() ?? [
                        'name' => 'N/A',
                        'total' => 0,
                        'percentage' => 0
                    ],
                    'lowest' => $processedDepts->last() ?? [
                        'name' => 'N/A',
                        'total' => 0,
                        'percentage' => 0
                    ]
                ],
                'filters_applied' => [
                    'days' => $days,
                    'department' => $department,
                    'start_date' => $dateFrom->format('Y-m-d'),
                    'end_date' => $dateTo->format('Y-m-d')
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get available departments for filtering
     */
    public function getDepartments()
    {
        try {
            $departments = Student::distinct()
                ->pluck('course')
                ->filter() // Remove nulls
                ->sort()
                ->values();

            return response()->json([
                'departments' => $departments->toArray()
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get detailed statistics for a specific department
     */
    public function getDepartmentStats($department, Request $request)
    {
        try {
            $days = min(max((int)$request->query('days', 30), 1), 365);
            $dateFrom = Carbon::now()->subDays($days);

            $stats = Student::where('course', $department)
                ->whereBetween('created_at', [$dateFrom, Carbon::now()])
                ->select(
                    DB::raw('COUNT(id) as total'),
                    DB::raw('SUM(CASE WHEN has_card = true THEN 1 ELSE 0 END) as card_issued'),
                    DB::raw('SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_this_week')
                )
                ->first();

            return response()->json([
                'department' => $department,
                'stats' => [
                    'total' => (int)($stats->total ?? 0),
                    'cards_issued' => (int)($stats->card_issued ?? 0),
                    'new_this_week' => (int)($stats->new_this_week ?? 0),
                    'card_rate' => $stats->total > 0 
                        ? round(($stats->card_issued / $stats->total) * 100, 1) 
                        : 0
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getTrendData(Request $request)
    {
        try {
            $days = min(max((int)$request->query('days', 30), 1), 365);
            $department = $request->query('department');
            $format = $request->query('format', 'json'); // json or csv

            $trends = Student::select(
                DB::raw("DATE(created_at) as date"),
                DB::raw('COUNT(id) as count'),
                DB::raw('SUM(CASE WHEN has_card = true THEN 1 ELSE 0 END) as cards_issued')
            )
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->when($department, function($q) use ($department) {
                return $q->where('course', $department);
            })
            ->groupBy(DB::raw("DATE(created_at)"))
            ->orderBy('date', 'asc')
            ->get();

            if ($format === 'csv') {
                return $this->formatAsCSV($trends, $department);
            }

            return response()->json([
                'data' => $trends,
                'count' => $trends->count(),
                'period_days' => $days,
                'department' => $department
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Format trend data as CSV
     */
    private function formatAsCSV($data, $department = null)
    {
        $csv = "date,count,cards_issued\n";
        foreach ($data as $row) {
            $csv .= "{$row->date},{$row->count},{$row->cards_issued}\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="trends-' . now()->format('Y-m-d') . '.csv"'
        ]);
    }
}