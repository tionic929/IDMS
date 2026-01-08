<?php

namespace App\Http\Controllers;

use App\Models\Applicant as Student; // Assuming your application table is named Student
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DepartmentsController extends Controller
{
    public function getApplicantsByDepartments()
    {
        try {
            $courses = [
                'EMPLOYEE',
                'MASTERAL',
                'BSBA',
                'BSN',
                'BSCRIM',
                'BSED',
                'BSHM',
                'BSIT',
                'BSGE',
                'MIDWIFERY', 
                'AB', 
                'JD',
                'ABM',
                'ICT',
                'STEM',
                'HUMMS',
                'BEC'
            ];

            $groupedData = Student::whereIn('course', $courses)
                ->orderBy('last_name', 'asc') // Sort students alphabetically inside each group
                ->get()
                ->groupBy('course');

            $formattedData = $groupedData->map(function ($students, $course) {
                return [
                    'department' => $course,
                    'applicant_count' => $students->count(),
                    'students' => $students
                ];
            })
            ->sortBy(function ($item) use ($courses) {
                return array_search($item['department'], $courses);
            })->values();

            return response()->json([
                'success' => true,
                'total_departments' => $formattedData->count(),
                'data' => $formattedData
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Query Failed: ' . $e->getMessage()
            ], 500);
        }
    }
}