<?php

namespace App\Http\Controllers;

use App\Events\ApplicationSubmitted;
use App\Models\Applicant as Student;
use App\Models\CardApplication;
use App\Models\Course;
use App\Models\User;
use App\Models\ActivityLog;
use App\Notifications\SubmissionNotification;
use Illuminate\Support\Facades\Notification;

use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

use App\Http\Resources\ApplicantCardResource;
use App\Mail\IDCardSoftcopyMail;
use Illuminate\Support\Facades\Mail;

class ApplicantsController extends Controller
{
    public function index()
    {
        $totalQueue = CardApplication::active()
            ->join('students', 'card_applications.student_id', '=', 'students.id')
            ->whereNull('students.deleted_at')
            ->where('has_card', false)
            ->count();

        $queueList = CardApplication::with(['student.course'])->active()
            ->join('students', 'card_applications.student_id', '=', 'students.id')
            ->whereNull('students.deleted_at')
            ->where('has_card', false)
            ->select('card_applications.*')
            ->orderBy('card_applications.created_at', 'asc')
            ->limit(10)
            ->get();

        $history = CardApplication::with(['student.course'])->active()
            ->join('students', 'card_applications.student_id', '=', 'students.id')
            ->whereNull('students.deleted_at')
            ->where('has_card', true)
            ->select('card_applications.*')
            ->orderBy('card_applications.updated_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'totalQueue' => $totalQueue,
            'queueList' => $this->formatApplications($queueList),
            'history' => $this->formatApplications($history)
        ], 200);
    }

    public function confirm($studentId)
    {
        try {
            $student = Student::findOrFail($studentId);
            $application = $student->latestApplication;

            if (!$application) {
                return response()->json(['message' => 'No active application found.'], 404);
            }

            // 2. Perform the update: Set to approved but keep has_card false
            $application->update(['application_status' => 'approved']);

            // 3. Log the successful card confirmation for audit purposes
            Log::info("ID Card confirmed for Student ID: {$studentId}", [
                'student_name' => $student->full_name,
                'confirmed_at' => now()
            ]);

            // 4. Notify idtechv2 webhook
            try {
                $v2Url = config('services.idtechv2.url');
                \Illuminate\Support\Facades\Http::timeout(10)->post("{$v2Url}/api/applications/{$student->id_number}/approve");
            } catch (\Exception $e) {
                Log::warning('Failed to sync approval to idtechv2', ['error' => $e->getMessage()]);
            }

            // Log activity
            ActivityLog::create([
                'user_id' => auth()->id(),
                'user' => auth()->user()?->name ?? 'System',
                'action' => 'Applicant Confirmed',
                'type' => 'card_issuance',
                'details' => "Application for {$student->full_name} ({$student->id_number}) has been marked as CONFIRMED.",
                'status' => 'info',
                'ip' => request()->ip(),
            ]);

            $formatted = $this->formatApplications(collect([$application]))->first();

            return response()->json([
                'message' => 'Student card status updated successfully',
                'student' => $formatted
            ], 200);

        } catch (ModelNotFoundException $e) {
            // Log that someone tried to update a non-existent ID
            Log::warning("Attempted to confirm card for non-existent Student ID: {$studentId}");

            return response()->json([
                'message' => 'Student not found.'
            ], 404);

        } catch (Exception $e) {
            // Log any other unexpected errors (database down, etc.)
            Log::error("Failed to update card status for Student ID: {$studentId}", [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'An internal error occurred while updating the card status.'
            ], 500);
        }
    }

    public function issue($studentId)
    {
        try {
            $student = Student::findOrFail($studentId);
            $application = $student->latestApplication;

            if (!$application) {
                return response()->json(['message' => 'No active application found.'], 404);
            }

            // Set to issued and has_card to true
            $application->update(['has_card' => true, 'application_status' => 'issued']);

            // Log the successful card issuance
            Log::info("ID Card issued physically for Student ID: {$studentId}", [
                'student_name' => $student->full_name,
                'issued_at' => now()
            ]);

            // Log activity
            ActivityLog::create([
                'user_id' => auth()->id(),
                'user' => auth()->user()?->name ?? 'System',
                'action' => 'ID Card Issued',
                'type' => 'card_issuance',
                'details' => "ID Card for {$student->full_name} ({$student->id_number}) has been PRINTED and marked as ISSUED.",
                'status' => 'success',
                'ip' => request()->ip(),
            ]);

            $formatted = $this->formatApplications(collect([$application]))->first();

            return response()->json([
                'message' => 'Student card marked as issued',
                'student' => $formatted
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Student not found.'], 404);
        } catch (Exception $e) {
            return response()->json(['message' => 'An internal error occurred while updating the card status.'], 500);
        }
    }

    public function getPreview($id)
    {
        $student = Student::findOrFail($id);
        return response()->json([
            'data' => new ApplicantCardResource($student)
        ]);
    }

    private function formatApplications($paginator)
    {
        return $paginator->map(function ($app) {
            $student = $app->student;

            return [
                'id' => $student->id ?? $app->student_id,
                'application_id' => $app->id,
                'id_number' => $student->id_number ?? 'N/A',
                'full_name' => ($student->first_name ?? '') . ' ' . ($student->last_name ?? ''),
                'first_name' => $student->first_name ?? 'Unknown',
                'middle_initial' => $student->middle_initial ?? '',
                'last_name' => $student->last_name ?? '',
                'manual_full_name' => $student->manual_full_name ?? '',
                'email' => $student->email ?? '',
                'course' => ($student && $student->course) ? $student->course->name : '',
                'type' => $student->type ?? Student::TYPE_STUDENT,
                'department' => $student->department ?? '',
                'address' => $student->address ?? '',
                'guardian_name' => $student->guardian_name ?? '',
                'guardian_contact' => $student->guardian_contact ?? '',
                'id_picture' => $app->id_picture,
                'signature_picture' => $app->signature_picture,
                'payment_proof' => $app->payment_proof,
                'has_card' => $app->has_card,
                'application_status' => $app->application_status ?? 'pending',

                'created_at' => $app->created_at,
                'formatted_date' => $app->created_at ? $app->created_at->format('M d, Y') : null,
                'formatted_time' => $app->created_at ? $app->created_at->format('g:i A') : null,
            ];
        });
    }

    public function store(Request $request)
    {
        try {
            // Log the incoming request to see what's being received
            Log::info('New ID Application Request received', [
                'idNumber' => $request->idNumber,
                'has_id_picture' => $request->hasFile('id_picture'),
                'has_signature' => $request->hasFile('signature_picture'),
                'has_payment_proof' => $request->hasFile('payment_proof')
            ]);

            $validated = $request->validate([
                'idNumber' => 'required|string|max:255',
                'firstName' => 'required|string|max:255',
                'middleInitial' => 'nullable|string|max:1',
                'lastName' => 'required|string|max:255',
                'course' => 'required|string|max:255',
                'address' => 'required|string',
                'guardianName' => 'nullable|string|max:255',
                'guardianContact' => 'nullable|string|max:20',
                'guardian_name' => 'nullable|string|max:255',
                'guardian_contact' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'department' => 'nullable|string|max:255',
                'payment_type' => 'nullable|string|max:255',
                'id_picture' => 'nullable|file|mimes:jpeg,png,jpg,webp',
                'signature_picture' => 'nullable|image|mimes:jpeg,png,jpg,webp',
                'payment_proof' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf',
            ]);

            // Process and Log ID Picture
            $idPath = null;
            if ($request->hasFile('id_picture')) {
                $file = $request->file('id_picture');
                $idPath = $file->store('students/id_pictures', 'public');
                Log::info('ID Photo stored successfully', [
                    'original_name' => $file->getClientOriginalName(),
                    'stored_path' => $idPath
                ]);
            } else {
                Log::warning('ID Application received without id_picture');
            }

            // Process and Log Signature
            $sigPath = null;
            if ($request->hasFile('signature_picture')) {
                $file = $request->file('signature_picture');
                $sigPath = $file->store('students/signatures', 'public');
                Log::info('Signature stored successfully', [
                    'original_name' => $file->getClientOriginalName(),
                    'stored_path' => $sigPath
                ]);
            } else {
                Log::warning('ID Application received without signature_picture');
            }

            // Process and Log Payment Proof
            $paymentPath = null;
            if ($request->hasFile('payment_proof')) {
                $file = $request->file('payment_proof');
                $paymentPath = $file->store('students/payment_proofs', 'public');
                Log::info('Payment Proof stored successfully', [
                    'original_name' => $file->getClientOriginalName(),
                    'stored_path' => $paymentPath
                ]);
            } else {
                Log::warning('ID Application received without payment_proof');
            }

            $courseName = strtoupper($validated['course']);
            $type = Student::TYPE_STUDENT;

            if ($courseName === 'EMPLOYEE') {
                $type = Student::TYPE_EMPLOYEE;
                if (!empty($validated['department'])) {
                    $courseName = strtoupper($validated['department']);
                }
            }

            $courseModel = Course::firstOrCreate([
                'name' => $courseName
            ]);

            $id_number = strtoupper($validated['id_number'] ?? $validated['idNumber']);

            $student = Student::updateOrCreate(
                ['id_number' => $id_number],
                [
                    'first_name' => strtoupper($validated['firstName']),
                    'middle_initial' => strtoupper($validated['middleInitial'] ?? ''),
                    'last_name' => strtoupper($validated['lastName']),
                    'manual_full_name' => strtoupper($validated['manual_full_name'] ?? $validated['manual_fullname'] ?? $request->input('manual_full_name') ?? $request->input('manual_fullname') ?? ''),
                    'email' => strtolower($validated['email'] ?? ''),
                    'course_id' => $courseModel->id,
                    'type' => $type,
                    'department' => strtoupper($validated['department'] ?? ''),
                    'address' => strtoupper($validated['address']),
                    'guardian_name' => strtoupper($validated['guardianName'] ?? $validated['guardian_name'] ?? ''),
                    'guardian_contact' => $validated['guardianContact'] ?? $validated['guardian_contact'] ?? '',
                ]
            );

            // -----------------------------------------------------------------------
            // Remove any existing PENDING (unissued, non-archived) applications for
            // this student before inserting the new one. This prevents duplicate
            // entries in the queue when a student does a department shift or a
            // re-issuance. Already-issued (has_card = true) and archived applications
            // are intentionally left untouched so history is preserved.
            // -----------------------------------------------------------------------
            $replacedCount = CardApplication::where('student_id', $student->id)
                ->where('has_card', false)
                ->where('is_archived', false)
                ->delete();

            if ($replacedCount > 0) {
                Log::info("Replaced {$replacedCount} pending application(s) for Student ID: {$id_number} (re-issuance / department shift)");
            }

            $application = CardApplication::create([
                'student_id' => $student->id,
                'payment_type' => strtoupper($validated['payment_type'] ?? ''),
                'id_picture' => $idPath,
                'signature_picture' => $sigPath,
                'payment_proof' => $paymentPath,
            ]);

            Log::info('Student record created in database', [
                'db_id' => $student->id,
                'student_id' => $student->id_number,
                'full_name' => $student->first_name . ' ' . $student->last_name
            ]);

            Log::info('Attempting to broadcast ApplicationSubmitted for Student ID: ' . $student->id);

            // Re-map for events or emails if they expect a flat object
            $formattedApp = $this->formatApplications(collect([$application]))->first();

            broadcast(new ApplicationSubmitted((object) $formattedApp));

            // Notify Admins about new submission (Real-time)
            $admins = User::where('role', 'admin')->get();
            Notification::send($admins, new SubmissionNotification((object) $formattedApp));

            return response()->json([
                'message' => 'Student saved successfully',
                'data' => $formattedApp
            ], 201);

        } catch (\Exception $e) {
            Log::error('Student upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error saving student',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function toggleHasCard(Request $request, Student $student)
    {
        $request->validate([
            'field' => [
                'required',
                'string',
                Rule::in(['has_card']),
            ],
        ]);

        $field = $request->input('field');

        $student->{$field} = !$student->{$field};
        $student->save();

        return response()->json($student);
    }

    public function updateApplicantsExcelFile($studentId)
    {
        $student = Student::findOrFail($studentId);
        $application = $student->latestApplication;

        $courseName = strtoupper($student->course ? $student->course->name : 'UNKNOWN');
        $directory = storage_path('app/applicants_records');

        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        $path = $directory . '/' . $courseName . '/' . $courseName . '.xlsx';

        if (file_exists($path)) {
            $spreadsheet = IOFactory::load($path);
            $sheet = $spreadsheet->getActiveSheet();
        } else {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Define your specific headers
            $headers = [
                'A1' => 'ID NUMBER',
                'B1' => 'NAME',
                'C1' => 'COURSE',
                'D1' => 'IOE NAME',
                'E1' => 'ADDRESS',
                'F1' => 'CONTACT NO'
            ];

            foreach ($headers as $cell => $text) {
                $sheet->setCellValue($cell, $text);
            }

            // Style headers: Bold and Auto-size
            $sheet->getStyle('A1:F1')->getFont()->setBold(true);
            foreach (range('A', 'F') as $columnID) {
                $sheet->getColumnDimension($columnID)->setAutoSize(true);
            }
        }


        $nextRow = $sheet->getHighestRow() + 1;

        $name = $student->full_name;

        // Add the student data
        $sheet->setCellValue("A{$nextRow}", $student->id_number);
        $sheet->setCellValue("B{$nextRow}", $name);
        $sheet->setCellValue("C{$nextRow}", $courseName);
        $sheet->setCellValue("D{$nextRow}", $student->address);
        $sheet->setCellValue("E{$nextRow}", $student->guardian_name);
        $sheet->setCellValue("F{$nextRow}", $student->guardian_contact);

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $fp = fopen($path, 'wb');
        if (!$fp)
            throw new \Exception("Cannot open file for writing");
        if (flock($fp, LOCK_EX)) {
            $writer->save($fp);
            flock($fp, LOCK_UN);
        } else {
            throw new \Exception("Cannot lock file for writing");
        }
        fclose($fp);

        // Optional: mark as confirmed in DB
        if ($application) {
            $application->update(['has_card' => true]);
        }

        return response()->json(['message' => 'Applicant added to Excel and confirmed']);
    }

    public function paginatedApplicants(Request $request)
    {
        $search = $request->query('search');
        $query = CardApplication::with(['student.course'])->active()
            ->join('students', 'card_applications.student_id', '=', 'students.id')
            ->leftJoin('courses', 'students.course_id', '=', 'courses.id')
            ->whereNull('students.deleted_at')
            ->select('card_applications.*');

        // Dynamic sort
        $sortBy = $request->query('sort_by', '');
        $sortDir = in_array($request->query('sort_dir'), ['asc', 'desc']) ? $request->query('sort_dir') : 'asc';
        $sortMap = [
            'name' => 'students.last_name',
            'date' => 'card_applications.created_at',
            'course' => 'courses.name',
            'status' => 'card_applications.has_card',
        ];

        if (isset($sortMap[$sortBy])) {
            $query->orderBy($sortMap[$sortBy], $sortDir);
        } else {
            $query->orderBy('card_applications.id', 'asc');
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('card_applications.id', $search);
                }
                $q->orWhere('students.first_name', 'LIKE', "%{$search}%")
                    ->orWhere('students.last_name', 'LIKE', "%{$search}%")
                    ->orWhere('students.id_number', 'LIKE', "%{$search}%")
                    ->orWhere('students.guardian_contact', 'LIKE', "%{$search}%");
            });
        }

        // Status filter support
        $status = $request->query('status');
        if ($status === 'recently-issued') {
            $query->where('card_applications.has_card', true)
                ->where('card_applications.updated_at', '>=', Carbon::now()->subDays(7));
        } elseif ($status === 'issued') {
            $query->where('card_applications.has_card', true);
        } elseif ($status === 'pending') {
            $query->where('card_applications.has_card', false);
        }

        $paginated = $query->paginate(20);

        $paginated->setCollection($this->formatApplications($paginated->getCollection()));

        return response()->json($paginated);
    }

    public function applicantsReport()
    {
        $stats = DB::table('card_applications')
            ->join('students', 'card_applications.student_id', '=', 'students.id')
            ->whereNull('students.deleted_at')
            ->select(DB::raw("
            COUNT(*) as total,
            SUM(CASE WHEN has_card = 0 THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN has_card = 1 THEN 1 ELSE 0 END) as issued
        "))
            ->first();

        return response()->json([
            'applicantsReport' => (int) ($stats->total ?? 0),
            'pendingCount' => (int) ($stats->pending ?? 0),
            'issuedCount' => (int) ($stats->issued ?? 0),
        ]);
    }

    public function getDepartments()
    {
        $departments = [
            'Computer Science',
            'Information Technology',
            'Engineering',
            'Business Administration',
            'Education',
            'Nursing',
            'Architecture',
            'Arts and Sciences',
        ];

        return response()->json($departments);
    }

    public function archive($id)
    {
        try {
            $student = Student::findOrFail($id);
            if ($application = $student->latestApplication) {
                $application->update([
                    'is_archived' => true,
                    'archived_at' => now()
                ]);
            }

            // Notify applicant via email about the rejection
            if (!empty($student->email)) {
                try {
                    \Illuminate\Support\Facades\Mail::to($student->email)
                        ->send(new \App\Mail\ApplicationRejectedMail($student->full_name));
                } catch (\Exception $mailEx) {
                    \Illuminate\Support\Facades\Log::error('Failed to send rejection email', [
                        'student_id' => $id,
                        'error' => $mailEx->getMessage()
                    ]);
                }
            }

            // Log activity
            ActivityLog::create([
                'user_id' => auth()->id(),
                'user' => auth()->user()?->name ?? 'System',
                'action' => 'Applicant Archived',
                'type' => 'activity',
                'details' => "Applicant {$student->full_name} has been archived.",
                'status' => 'warning',
                'ip' => request()->ip(),
            ]);

            return response()->json([
                'message' => 'Applicant archived successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to archive applicant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500' // Reject reason
        ]);

        try {
            $student = Student::findOrFail($id);
            if ($application = $student->latestApplication) {
                $application->update([
                    'application_status' => 'rejected',
                    'rejection_reason' => $request->reason,
                    'is_archived' => true,
                    'archived_at' => now()
                ]);
            }

            // Notify applicant via email about the rejection
            if (!empty($student->email)) {
                try {
                    \Illuminate\Support\Facades\Mail::to($student->email)
                        ->send(new \App\Mail\ApplicationRejectedMail($student->full_name));
                } catch (\Exception $mailEx) {
                    \Illuminate\Support\Facades\Log::error('Failed to send rejection email', [
                        'student_id' => $id,
                        'error' => $mailEx->getMessage()
                    ]);
                }
            }

            // Sync with idtechv2
            try {
                $v2Url = config('services.idtechv2.url');
                \Illuminate\Support\Facades\Http::timeout(10)->post("{$v2Url}/api/applications/{$student->id_number}/reject", [
                    'reason' => $request->reason
                ]);
            } catch (\Exception $e) {
                Log::warning('Failed to sync rejection to idtechv2', ['error' => $e->getMessage()]);
            }

            // Log activity
            ActivityLog::create([
                'user_id' => auth()->id(),
                'user' => auth()->user()?->name ?? 'System',
                'action' => 'Applicant Rejected',
                'type' => 'activity',
                'details' => "Applicant {$student->full_name} has been rejected. Reason: {$request->reason}",
                'status' => 'error',
                'ip' => request()->ip(),
            ]);

            return response()->json([
                'message' => 'Applicant rejected successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reject applicant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getArchived(Request $request)
    {
        $search = $request->query('search');
        $query = CardApplication::with(['student.course'])->archived()
            ->join('students', 'card_applications.student_id', '=', 'students.id')
            ->leftJoin('courses', 'students.course_id', '=', 'courses.id')
            ->whereNull('students.deleted_at')
            ->select('card_applications.*');

        // Dynamic sort
        $sortBy = $request->query('sort_by', '');
        $sortDir = in_array($request->query('sort_dir'), ['asc', 'desc']) ? $request->query('sort_dir') : 'desc';
        $sortMap = [
            'name' => 'students.last_name',
            'date' => 'card_applications.archived_at',
            'course' => 'courses.name',
        ];

        if (isset($sortMap[$sortBy])) {
            $query->orderBy($sortMap[$sortBy], $sortDir);
        } else {
            $query->orderBy('card_applications.archived_at', 'desc');
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('card_applications.id', $search);
                }
                $q->orWhere('students.first_name', 'LIKE', "%{$search}%")
                    ->orWhere('students.last_name', 'LIKE', "%{$search}%")
                    ->orWhere('students.id_number', 'LIKE', "%{$search}%")
                    ->orWhere('students.guardian_contact', 'LIKE', "%{$search}%");
            });
        }

        $paginated = $query->paginate(20);
        $paginated->setCollection($this->formatApplications($paginated->getCollection()));

        return response()->json($paginated);
    }

    public function destroy($id)
    {
        try {
            $application = CardApplication::with('student')->findOrFail($id);
            $fullName = $application->student ? $application->student->full_name : 'Unknown';

            $application->delete();

            // Log activity
            ActivityLog::create([
                'user_id' => auth()->id(),
                'user' => auth()->user()?->name ?? 'System',
                'action' => 'Applicant Deleted',
                'type' => 'activity',
                'details' => "Application for {$fullName} was permanently deleted.",
                'status' => 'error',
                'ip' => request()->ip(),
            ]);

            return response()->json([
                'message' => 'Applicant permanently deleted'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting application', [
                'application_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to delete applicant'
            ], 500);
        }
    }

    public function sendSoftcopyEmail(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'student_name' => 'required|string',
                'image_data' => 'required|string', // Base64 string
            ]);

            Mail::to($validated['email'])->send(new IDCardSoftcopyMail(
                $validated['student_name'],
                $validated['image_data']
            ));

            return response()->json([
                'message' => 'Softcopy email sent successfully via backend'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to send softcopy email', [
                'error' => $e->getMessage(),
                'student' => $request->student_name ?? 'Unknown'
            ]);

            return response()->json([
                'message' => 'Failed to send email: ' . $e->getMessage()
            ], 500);
        }
    }

    public function restore($id)
    {
        try {
            $application = CardApplication::findOrFail($id);
            $application->update([
                'is_archived' => false,
                'archived_at' => null,
            ]);

            ActivityLog::create([
                'user_id' => auth()->id(),
                'user' => auth()->user()?->name ?? 'System',
                'action' => 'Applicant Restored',
                'type' => 'activity',
                'details' => "Application #{$id} has been restored from archive.",
                'status' => 'success',
                'ip' => request()->ip(),
            ]);

            return response()->json(['message' => 'Applicant restored successfully'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to restore applicant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateDetails(Request $request, $id)
    {
        try {
            $application = CardApplication::with('student')->findOrFail($id);
            $student = $application->student;

            if (!$student) {
                return response()->json(['message' => 'Student not found'], 404);
            }

            $fields = $request->only([
                'first_name', 'last_name', 'id_number',
                'guardian_name', 'guardian_contact', 'address', 'email'
            ]);

            // Handle full_name split into first/last
            if ($request->has('fullName') && !$request->has('first_name')) {
                $parts = explode(' ', trim($request->fullName), 2);
                $fields['first_name'] = $parts[0] ?? '';
                $fields['last_name'] = $parts[1] ?? '';
            }

            // Update course via the card application's linked course
            if ($request->has('course')) {
                $course = Course::where('name', $request->course)->first();
                if ($course) {
                    $student->course_id = $course->id;
                }
            }

            $student->fill(array_filter($fields, fn($v) => $v !== null));
            $student->save();

            // Handle photo upload
            if ($request->hasFile('photo_file')) {
                $path = $request->file('photo_file')->store('id_pictures', 'public');
                $student->update(['id_picture' => $path]);
            }

            // Handle signature upload
            if ($request->hasFile('signature_file')) {
                $path = $request->file('signature_file')->store('signatures', 'public');
                $student->update(['signature_picture' => $path]);
            }

            ActivityLog::create([
                'user_id' => auth()->id(),
                'user' => auth()->user()?->name ?? 'System',
                'action' => 'Details Updated',
                'type' => 'activity',
                'details' => "Details updated for {$student->full_name}.",
                'status' => 'info',
                'ip' => request()->ip(),
            ]);

            return response()->json(['message' => 'Details updated successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Error updating details', [
                'application_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to update details',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}