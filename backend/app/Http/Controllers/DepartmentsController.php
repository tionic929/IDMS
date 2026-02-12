<?php

namespace App\Http\Controllers;

use App\Models\Applicant as Student;
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
                return Student::select('course', DB::raw('COUNT(*) as applicant_count'))
                    ->whereIn('course', $courses)
                    ->groupBy('course')
                    ->pluck('applicant_count', 'course');
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
                $query = Student::select(
                        'id',
                        'id_number',
                        'first_name',
                        'last_name',
                        'course',
                        'created_at',
                        'guardian_name',
                        'address',
                        'has_card'
                    )
                    ->where('course', $selectedDept);

                if ($search !== '') {
                    $query->where(function ($q) use ($search) {
                        $q->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('id_number', 'like', "%{$search}%");
                    });
                }

                // 🔒 Deterministic ordering for cursor pagination
                $paginated = $query
                    ->orderBy('id')
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
