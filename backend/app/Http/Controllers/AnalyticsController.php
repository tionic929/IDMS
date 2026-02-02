<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Applicant as Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function getDashboardStats()
    {
        try {
            // 1. Summary Cards
            $totalApplicants = Student::count();
            $newApplicantsThisWeek = Student::where('created_at', '>=', Carbon::now()->startOfWeek())->count();
            $issuedCards = Student::where('has_card', true)->count();
            $newUsers = User::where('created_at', '>=', Carbon::now()->startOfWeek())->count();

            // 2. Applicants Over Time (Last 6 Months)
            $trends = Student::select(
                DB::raw("DATE_FORMAT(created_at, '%b %Y') as month"),
                DB::raw('COUNT(id) as count'),
                DB::raw('MIN(created_at) as sort_date')
            )
            ->where('created_at', '>=', Carbon::now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('sort_date', 'asc')
            ->get();

            // 3. Department Analysis
            $deptStats = Student::select('course as department', DB::raw('count(*) as total'))
                ->groupBy('course')
                ->orderBy('total', 'desc')
                ->get(); // Ensure this is ->get()

            $totalCount = $deptStats->sum('total');

            $processedDepts = $deptStats->map(function($dept) use ($totalCount) {
                return [
                    'name' => $dept->department,
                    'total' => (int) $dept->total,
                    'percentage' => $totalCount > 0 ? round(($dept->total / $totalCount) * 100, 1) : 0
                ];
            });

            return response()->json([
                'summary' => [
                    'total_records' => $totalApplicants,
                    'new_this_week' => $newApplicantsThisWeek,
                    'issued_cards' => $issuedCards,
                    'user_growth' => $newUsers
                ],
                'trends' => $trends,
                'departments' => [
                    'full_list' => $processedDepts,
                    'highest' => $processedDepts->first() ?? ['name' => 'N/A', 'total' => 0, 'percentage' => 0],
                    'lowest' => $processedDepts->last() ?? ['name' => 'N/A', 'total' => 0, 'percentage' => 0],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}