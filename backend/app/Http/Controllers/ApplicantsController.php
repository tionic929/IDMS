<?php

namespace App\Http\Controllers;

use App\Events\ApplicationSubmitted;

use App\Models\Applicant as Student;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

use App\Http\Resources\ApplicantCardResource;

class ApplicantsController extends Controller
{
    public function index()
    {
        $queue = Student::where('has_card', false)
            ->orderBy('created_at', 'asc')
            ->paginate(5);

        $history = Student::where('has_card', true)
            ->orderBy('updated_at', 'desc')
            ->paginate(5);
        
        return response()->json([
            'queue' => $this->formatStudents($queue),
            'history' => $this->formatStudents($history)
        ], 200);
    }   

    public function confirm($studentId) {
    try {
        // 1. Find the student or throw a ModelNotFoundException
        $student = Student::findOrFail($studentId);

        // 2. Perform the update
        $student->update(['has_card' => true]);

        // 3. Log the successful card issuance for audit purposes
        Log::info("ID Card issued successfully for Student ID: {$studentId}", [
            'student_name' => $student->name, // Adjust based on your columns
            'issued_at' => now()
        ]);

        return response()->json([
            'message' => 'Student card status updated successfully',
            'student' => $student
        ], 200);

    } catch (ModelNotFoundException $e) {
        // Log that someone tried to update a non-existent ID
        Log::warning("Attempted to issue card for non-existent Student ID: {$studentId}");

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

    public function getPreview($id)
    {
        $student = Student::findOrFail($id);
        return response()->json([
            'data' => new ApplicantCardResource($student)
        ]);
    }

    private function formatStudents($collection){
        return $collection->map(function ($student) {
            $student->formatted_date = $student->created_at->format('M d, Y'); 
            $student->formatted_time = $student->created_at->format('g:i A');  
            return $student;
        });
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'idNumber' => 'required|string|max:255',
                'firstName' => 'required|string|max:255',
                'middleInitial' => 'nullable|string|max:1',
                'lastName' => 'required|string|max:255',
                'course' => 'required|string|max:255',
                'address' => 'required|string',
                'guardianName' => 'required|string|max:255',
                'guardianContact' => 'required|string|max:20',
                'id_picture' => 'nullable|file|mimes:jpeg,png,jpg',
                'signature_picture' => 'nullable|image|mimes:jpeg,png,jpg',
            ]);

            $idPath = $request->hasFile('id_picture')
                ? $request->file('id_picture')->store('students/id_pictures', 'public')
                : null;

            $sigPath = $request->hasFile('signature_picture')
                ? $request->file('signature_picture')->store('students/signatures', 'public')
                : null;

            $student = Student::create([
                'id_number' => strtoupper($validated['idNumber']),
                'first_name' => strtoupper($validated['firstName']),
                'middle_initial' => strtoupper($validated['middleInitial'] ?? ''),
                'last_name' => strtoupper($validated['lastName']),
                'course' => strtoupper($validated['course']),
                'address' => strtoupper($validated['address']),
                'guardian_name' => strtoupper($validated['guardianName']),
                'guardian_contact' => $validated['guardianContact'],
                'id_picture' => $idPath,
                'signature_picture' => $sigPath,
            ]);

            \Log::info('Attempting to broadcast ApplicationSubmitted for Student ID: ' . $student->id);
        
            broadcast(new ApplicationSubmitted($student))->toOthers();

            return response()->json(['message' => 'Student saved successfully'], 201);

        } catch (\Exception $e) {
            \Log::error('Student upload failed', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Error saving student',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function toggleHasCard(Request $request, Student $student)
    {
        $request->validate([
            'field' => ['required', 'string', Rule::in(['has_card']), 
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

        $courseName = strtoupper($student->course);
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

        $spreadsheet = IOFactory::load($path);
        $sheet = $spreadsheet->getActiveSheet();

        $nextRow = $sheet->getHighestRow() + 1;

        $firstName = $student->first_name;
        $middleInitial = $student->middle_initial; // could be null or empty
        $lastName = $student->last_name;

        $name = trim($firstName . ' ' . ($middleInitial ? $middleInitial . ' ' : '') . $lastName);

        // Add the student data
        $sheet->setCellValue("A{$nextRow}", $student->id_number);
        $sheet->setCellValue("B{$nextRow}", $name);
        $sheet->setCellValue("C{$nextRow}", $student->course);
        $sheet->setCellValue("D{$nextRow}", $student->address);
        $sheet->setCellValue("E{$nextRow}", $student->guardian_name);
        $sheet->setCellValue("F{$nextRow}", $student->guardian_contact);

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $fp = fopen($path, 'wb');
        if (!$fp) throw new \Exception("Cannot open file for writing");
        if (flock($fp, LOCK_EX)) {
            $writer->save($fp);
            flock($fp, LOCK_UN);
        } else {
            throw new \Exception("Cannot lock file for writing");
        }
        fclose($fp);

        // Optional: mark as confirmed in DB
        $student->update(['has_card' => true]);

        return response()->json(['message' => 'Applicant added to Excel and confirmed']);
    }

    public function paginatedApplicants(Request $request)
    {
        $search = $request->query('search');
        $query = Student::select(
            'id',
            'has_card',
            'id_number',
            'first_name',
            'middle_initial',
            'last_name',
            'course',
            'created_at',
            // 'address',
            // 'guardian_name',
            // 'guardian_contact',
            // 'id_picture',
            // 'signature_picture'
        )
        ->orderBy('id', 'asc');
            
        if ($search) {
            $query->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('id', $search);
                }
                $q->orWhere('first_name', 'LIKE', "%{$search}%")
                ->orWhere('last_name', 'LIKE', "%{$search}%")
                ->orWhere('id_number', 'LIKE', "%{$search}%")
                ->orWhere('guardian_contact', 'LIKE', "%{$search}%");
            });
        }

        $paginated = $query->paginate(20);

        $paginated->getCollection()->transform(function ($student){
            $student->formatted_date = $student->created_at ? $student->created_at->format('M d, Y') : 'N/A'; 
            $student->formatted_time = $student->created_at ? $student->created_at->format('g:i A') : 'N/A';
            return $student;
        });
        
        return response()->json($paginated);
    }

    public function applicantsReport(){
        $stats = DB::table('students')
        ->select(DB::raw("
            COUNT(*) as total,
            SUM(CASE WHEN has_card = 0 THEN 0 ELSE 1 END) as pending,
            SUM(CASE WHEN has_card = 1 THEN 1 ELSE 0 END) as issued
        "))
        ->first();

        return response()->json([
            'applicantsReport' => (int) $stats->total,
            'pendingCount'     => (int) $stats->pending,
            'issuedCount'      => (int) $stats->issued,
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
}