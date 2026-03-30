<?php

namespace App\Http\Controllers;

use App\Models\CardApplication as Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DepartmentsController extends Controller
{
    public function getApplicantsByDepartments(Request $request)
    {
        try {
            $courses = [
                'EMPLOYEE','MASTERAL','BSBA','BSN','BSCRIM','BSED','BSHM','BSIT',
                'BSGE','MIDWIFERY','AB','JD','ABM','ICT','STEM','HUMMS','BEC'
            ];

            $selectedDept = $request->query('department', $courses[0]);
            $search       = trim($request->query('search', ''));
            $cursor       = $request->query('cursor'); 

            $counts = Cache::remember('dept_counts', 3600, function () use ($courses) {
                // Students counts by course - Use a clean query to avoid GROUP BY issues with joinDetails scope
                $counts = DB::table('card_applications')
                    ->join('students', 'card_applications.student_id', '=', 'students.id')
                    ->join('courses', 'students.course_id', '=', 'courses.id')
                    ->where('students.type', 'student')
                    ->whereIn('courses.name', $courses)
                    ->where('card_applications.is_archived', false)
                    ->groupBy('courses.name')
                    ->pluck(DB::raw('COUNT(*) as applicant_count'), 'courses.name');

                // Total employee count (regardless of their department-based course name)
                $employeeCount = DB::table('card_applications')
                    ->join('students', 'card_applications.student_id', '=', 'students.id')
                    ->where('students.type', 'employee')
                    ->where('card_applications.is_archived', false)
                    ->count();

                $allCounts = $counts->toArray();
                $allCounts['EMPLOYEE'] = $employeeCount;
                
                return $allCounts;
            });

            $cacheVersion = Cache::get('students_cache_v', 1);
            $cacheKey = sprintf(
                'students_v%s_%s_c%s_s%s',
                $cacheVersion,
                $selectedDept,
                $cursor ?? 'start',
                md5($search)
            );

            $data = Cache::remember($cacheKey, 600, function () use ($selectedDept, $search, $cursor) {
                $query = Student::joinDetails()->select(
                        'card_applications.id',
                        'students.id_number',
                        'students.first_name',
                        'students.last_name',
                        'courses.name as course',
                        'card_applications.created_at',
                        'students.guardian_name',
                        'students.address',
                        'card_applications.has_card'
                    );

                if ($selectedDept === 'EMPLOYEE') {
                    $query->where('students.type', 'employee');
                } else {
                    $query->where('courses.name', $selectedDept)
                          ->where('students.type', 'student');
                }

                if ($search !== '') {
                    $query->where(function ($q) use ($search) {
                        $q->where('students.first_name', 'like', "%{$search}%")
                          ->orWhere('students.last_name', 'like', "%{$search}%")
                          ->orWhere('students.id_number', 'like', "%{$search}%");
                    });
                }

                // 🔒 Deterministic ordering for cursor pagination
                $paginated = $query
                    ->orderBy('card_applications.id')
                    ->cursorPaginate(
                        10,
                        ['*'],
                        'cursor',
                        $cursor
                    );

                return [
                    'items' => $paginated->items(),
                    'pagination' => [
                        'next_cursor' => optional($paginated->nextCursor())->encode(),
                        'prev_cursor' => optional($paginated->previousCursor())->encode(),
                        'has_more'    => $paginated->hasMorePages(),
                        'per_page'    => $paginated->perPage(),
                    ]
                ];
            });

            $sidebarData = collect($courses)->map(function ($course) use ($counts) {
                return [
                    'department'      => $course,
                    'applicant_count' => $counts[$course] ?? 0,
                ];
            });

            return response()->json([
                'success'             => true,
                'sidebar'             => $sidebarData,
                'selected_department' => $selectedDept,
                'students'            => $data['items'],
                'pagination'          => $data['pagination'],
            ], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Query Failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
