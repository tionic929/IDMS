<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Applicant as Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

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
                }
                catch (\Exception $e) {
                    return response()->json(['error' => 'Invalid start_date format (use Y-m-d)'], 422);
                }
            }

            $dateTo = Carbon::now();
            if ($endDate) {
                try {
                    $dateTo = Carbon::createFromFormat('Y-m-d', $endDate)->endOfDay();
                }
                catch (\Exception $e) {
                    return response()->json(['error' => 'Invalid end_date format (use Y-m-d)'], 422);
                }
            }

            // ===== 1. SUMMARY CARDS WITH FILTERS =====
            $applicantsQuery = Student::active()->whereBetween('created_at', [$dateFrom, $dateTo]);

            // Apply department filter if specified
            if ($department) {
                $applicantsQuery->where('course', $department);
            }

            $totalApplicants = $applicantsQuery->count();

            // New this week (still use fixed week calculation)
            $newApplicantsThisWeek = Student::active()->where('created_at', '>=', Carbon::now()->startOfWeek())
                ->when($department, function ($q) use ($department) {
                return $q->where('course', $department);
            })
                ->count();

            $issuedCards = $applicantsQuery->where('has_card', true)->count();

            $newUsers = User::where('created_at', '>=', Carbon::now()->startOfWeek())->count();

            // Pending trend: compare pending count this week vs last week
            $pendingThisWeek = Student::where('has_card', false)
                ->where('created_at', '>=', Carbon::now()->startOfWeek())
                ->when($department, fn($q) => $q->where('course', $department))
                ->count();
            $pendingLastWeek = Student::where('has_card', false)
                ->whereBetween('created_at', [
                Carbon::now()->subWeek()->startOfWeek(),
                Carbon::now()->subWeek()->endOfWeek()
            ])
                ->when($department, fn($q) => $q->where('course', $department))
                ->count();
            $pendingDelta = $pendingThisWeek - $pendingLastWeek;
            $pendingDirection = $pendingDelta > 0 ? 'up' : ($pendingDelta < 0 ? 'down' : 'flat');

            // ===== 2. TRENDS OVER TIME (DYNAMIC BASED ON DAYS) =====
            // Fixed: Don't group by calculated columns, only by the date format
            $trends = Student::select(
                DB::raw("DATE_FORMAT(created_at, '%b %Y') as month"),
                DB::raw('COUNT(id) as count')
            )
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->when($department, function ($q) use ($department) {
                return $q->where('course', $department);
            })
                ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"), DB::raw("DATE_FORMAT(created_at, '%b %Y')"))
                ->orderBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"), 'asc')
                ->get()
                ->map(function ($trend) {
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

            $processedDepts = $deptStats->map(function ($dept) use ($totalCount) {
                return [
                'name' => $dept->department ?? 'Unassigned',
                'total' => (int)$dept->total,
                'percentage' => $totalCount > 0 ? round(($dept->total / $totalCount) * 100, 1) : 0
                ];
            })->values(); // Reset keys

            return response()->json([
                'summary' => [
                    'total_applications' => $totalApplicants,
                    'new_this_week' => $newApplicantsThisWeek,
                    'issued_cards' => $issuedCards,
                    'pending_applications' => $totalApplicants - $issuedCards,
                    'user_growth' => $newUsers,
                    'pending_trend' => [
                        'direction' => $pendingDirection,
                        'delta' => abs($pendingDelta),
                    ],
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

        }
        catch (\Exception $e) {
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
        }
        catch (\Exception $e) {
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
        }
        catch (\Exception $e) {
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
                ->when($department, function ($q) use ($department) {
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
        }
        catch (\Exception $e) {
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

    /**
     * Export a formatted XLSX spreadsheet.
     *
     * Query Parameters:
     *  - type:       'summary' | 'full' | 'students' (default: full)
     *  - start_date: Y-m-d
     *  - end_date:   Y-m-d
     *  - department: string (course filter)
     *  - sort_by:    'name' | 'date' | 'course' | 'status' (default: name)
     *  - sort_dir:   'asc' | 'desc' (default: asc)
     */
    public function exportSpreadsheet(Request $request)
    {
        try {
            // --- Parse filters ---
            $type = $request->query('type', 'full'); // 'summary' or 'full'
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $department = $request->query('department');
            $sortBy = $request->query('sort_by', 'name');
            $sortDir = $request->query('sort_dir', 'asc');

            $dateFrom = $startDate
                ?Carbon::createFromFormat('Y-m-d', $startDate)->startOfDay()
                : null;

            $dateTo = $endDate
                ?Carbon::createFromFormat('Y-m-d', $endDate)->endOfDay()
                : null;

            // If no dates provided, use all-time
            $isAllTime = !$dateFrom && !$dateTo;
            if (!$dateFrom)
                $dateFrom = Carbon::create(2000, 1, 1)->startOfDay();
            if (!$dateTo)
                $dateTo = Carbon::now()->endOfDay();

            // --- Sort mapping ---
            $orderColumn = match ($sortBy) {
                    'date' => 'created_at',
                    'course' => 'course',
                    'status' => 'has_card',
                    default => 'last_name',
                };

            // --- Query students ---
            $students = Student::whereBetween('created_at', [$dateFrom, $dateTo])
                ->when($department, fn($q) => $q->where('course', $department))
                ->orderBy($orderColumn, $sortDir)
                ->when($sortBy === 'name', fn($q) => $q->orderBy('first_name', $sortDir))
                ->get();

            // --- Aggregates ---
            $totalRecords = $students->count();
            $issuedCount = $students->where('has_card', true)->count();
            $pendingCount = $totalRecords - $issuedCount;
            $grouped = $students->groupBy('course');

            // ============================================================
            //  REUSABLE STYLES
            // ============================================================
            $spreadsheet = new Spreadsheet();

            $headerFill = [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E293B'],
            ];
            $headerFont = [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
            ];
            $thinBorder = [
                'borderStyle' => Border::BORDER_THIN,
                'color' => ['rgb' => 'CBD5E1'],
            ];
            $allBorders = [
                'outline' => $thinBorder,
                'inside' => $thinBorder,
            ];
            $zebraFill = [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F8FAFC'],
            ];

            // Helper closure: write a student table on any sheet
            $writeStudentTable = function ($sheet, $studentList, $startRow) use ($headerFont, $headerFill, $allBorders, $zebraFill) {
                $cols = ['A' => '#', 'B' => 'ID NUMBER', 'C' => 'FULL NAME', 'D' => 'COURSE', 'E' => 'STATUS', 'F' => 'DATE APPLIED'];
                foreach ($cols as $col => $label) {
                    $sheet->setCellValue("{$col}{$startRow}", $label);
                }
                $sheet->getStyle("A{$startRow}:F{$startRow}")->applyFromArray([
                    'font' => $headerFont, 'fill' => $headerFill,
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                ]);

                $row = $startRow + 1;
                foreach ($studentList as $idx => $student) {
                    $fullName = trim(
                        $student->first_name . ' ' .
                        ($student->middle_initial ? $student->middle_initial . '. ' : '') .
                        $student->last_name
                    );
                    $sheet->setCellValue("A{$row}", $idx + 1);
                    $sheet->setCellValue("B{$row}", $student->id_number);
                    $sheet->setCellValue("C{$row}", $fullName);
                    $sheet->setCellValue("D{$row}", $student->course ?: 'Unassigned');
                    $sheet->setCellValue("E{$row}", $student->has_card ? 'ISSUED' : 'PENDING');
                    $sheet->setCellValue("F{$row}", $student->created_at ? $student->created_at->format('M d, Y') : 'N/A');

                    if ($idx % 2 === 1) {
                        $sheet->getStyle("A{$row}:F{$row}")->applyFromArray(['fill' => $zebraFill]);
                    }
                    $row++;
                }
                if ($row > $startRow + 1) {
                    $sheet->getStyle("A{$startRow}:F" . ($row - 1))->applyFromArray(['borders' => $allBorders]);
                }
                foreach (['A', 'B', 'C', 'D', 'E', 'F'] as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
                $sheet->freezePane('A' . ($startRow + 1));
                return $row;
            };

            // ──────────────────────────────────────────────────────
            //  SHEET 1 — SUMMARY  (always included)
            // ──────────────────────────────────────────────────────
            $summary = $spreadsheet->getActiveSheet();
            $summary->setTitle('Summary');

            $summary->setCellValue('A1', 'IDMS EXPORT REPORT');
            $summary->getStyle('A1')->getFont()->setBold(true)->setSize(16);
            $summary->mergeCells('A1:E1');

            $summary->setCellValue('A2', 'Generated:');
            $summary->setCellValue('B2', Carbon::now()->format('M d, Y  g:i A'));
            $summary->getStyle('A2')->getFont()->setBold(true);

            $summary->setCellValue('A3', 'Date Range:');
            $summary->setCellValue('B3', $isAllTime ? 'All Time' : ($dateFrom->format('M d, Y') . '  —  ' . $dateTo->format('M d, Y')));
            $summary->getStyle('A3')->getFont()->setBold(true);

            $r = 4;
            if ($department) {
                $summary->setCellValue("A{$r}", 'Department:');
                $summary->setCellValue("B{$r}", $department);
                $summary->getStyle("A{$r}")->getFont()->setBold(true);
                $r++;
            }

            // Overall statistics
            $r++;
            $summary->setCellValue("A{$r}", 'OVERALL STATISTICS');
            $summary->getStyle("A{$r}")->getFont()->setBold(true)->setSize(12);
            $summary->mergeCells("A{$r}:C{$r}");
            $r++;
            foreach ([['Total Applicants', $totalRecords], ['Issued (Card Printed)', $issuedCount], ['Pending', $pendingCount]] as [$label, $val]) {
                $summary->setCellValue("A{$r}", $label);
                $summary->setCellValue("B{$r}", $val);
                $summary->getStyle("A{$r}")->getFont()->setBold(true);
                $r++;
            }

            // Department breakdown with issued/pending per dept
            $r += 2;
            $summary->setCellValue("A{$r}", 'DEPARTMENT BREAKDOWN');
            $summary->getStyle("A{$r}")->getFont()->setBold(true)->setSize(12);
            $summary->mergeCells("A{$r}:E{$r}");
            $r++;

            $deptHeaderRow = $r;
            foreach (['A' => 'DEPARTMENT', 'B' => 'TOTAL', 'C' => 'ISSUED', 'D' => 'PENDING', 'E' => 'PERCENTAGE'] as $col => $label) {
                $summary->setCellValue("{$col}{$r}", $label);
            }
            $summary->getStyle("A{$r}:E{$r}")->applyFromArray([
                'font' => $headerFont, 'fill' => $headerFill,
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
            ]);
            $r++;

            foreach ($grouped as $deptName => $deptStudents) {
                $dt = $deptStudents->count();
                $di = $deptStudents->where('has_card', true)->count();
                $pct = $totalRecords > 0 ? round(($dt / $totalRecords) * 100, 1) : 0;
                $summary->setCellValue("A{$r}", $deptName ?: 'Unassigned');
                $summary->setCellValue("B{$r}", $dt);
                $summary->setCellValue("C{$r}", $di);
                $summary->setCellValue("D{$r}", $dt - $di);
                $summary->setCellValue("E{$r}", $pct . '%');
                $r++;
            }
            if ($r > $deptHeaderRow + 1) {
                $summary->getStyle("A{$deptHeaderRow}:E" . ($r - 1))->applyFromArray(['borders' => $allBorders]);
            }
            foreach (['A', 'B', 'C', 'D', 'E'] as $col) {
                $summary->getColumnDimension($col)->setAutoSize(true);
            }

            // ──────────────────────────────────────────────────────
            //  STUDENT / FULL REPORT — additional sheets
            // ──────────────────────────────────────────────────────
            if ($type === 'full' || $type === 'students') {
                $allSheet = $spreadsheet->createSheet();
                $allSheet->setTitle('All Students');
                $writeStudentTable($allSheet, $students->values(), 1);
            }

            if ($type === 'full') {
                // Per-Department sheets
                foreach ($grouped as $deptName => $deptStudents) {
                    $title = mb_substr($deptName ?: 'Unassigned', 0, 31);
                    $title = preg_replace('/[\\\\\/*\?\[\]\:]/', '-', $title);

                    $deptSheet = $spreadsheet->createSheet();
                    $deptSheet->setTitle($title);

                    $dt = $deptStudents->count();
                    $di = $deptStudents->where('has_card', true)->count();

                    $deptSheet->setCellValue('A1', strtoupper($deptName ?: 'UNASSIGNED'));
                    $deptSheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
                    $deptSheet->mergeCells('A1:F1');

                    $deptSheet->setCellValue('A2', 'Total: ' . $dt);
                    $deptSheet->setCellValue('B2', 'Issued: ' . $di);
                    $deptSheet->setCellValue('C2', 'Pending: ' . ($dt - $di));
                    $deptSheet->getStyle('A2:C2')->getFont()->setBold(true)->setSize(10);

                    $writeStudentTable($deptSheet, $deptStudents->values(), 4);
                }
            }

            // For students-only, remove the Summary sheet
            if ($type === 'students') {
                $spreadsheet->removeSheetByIndex(0);
                $spreadsheet->setActiveSheetIndex(0);
            }

            // ============================================================
            //  OUTPUT
            // ============================================================
            if ($type !== 'students') {
                $spreadsheet->setActiveSheetIndex(0);
            }

            $prefix = match ($type) {
                    'summary' => 'IDMS-Summary',
                    'students' => 'IDMS-Students',
                    default => 'IDMS-Report',
                };
            $dateSuffix = $isAllTime ? 'AllTime' : ($dateFrom->format('Ymd') . '-' . $dateTo->format('Ymd'));
            $fileName = $prefix . '-' . $dateSuffix . '.xlsx';

            $temp = tempnam(sys_get_temp_dir(), 'xlsx');
            $writer = new Xlsx($spreadsheet);
            $writer->save($temp);

            return response()->download($temp, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);

        }
        catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}