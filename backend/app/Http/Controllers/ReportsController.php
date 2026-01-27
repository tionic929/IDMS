<?php

namespace App\Http\Controllers;

use App\Models\Items;
use App\Models\Applicant as Student;

use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportsController extends Controller
{
    public function verifyIdNumber(Request $request)
    {
        $request->validate([
            'id_number' => 'required|string',
        ]);

        $idNumber = trim($request->input('id_number'));

        // Find the record in the imported items table
        $record = Items::where('id_number', $idNumber)->first();

        if (!$record) {
            return response()->json([
                'valid' => false, 
                'message' => 'ID Number not recognized. Please check your entry or contact the registrar.'
            ], 404);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Student record found!',
            'data' => [
                'firstName'    => $record->first_name,
                'middleName'   => $record->middle_name,
                'lastName'     => $record->last_name,
                'course'       => $record->course,
                'year_level'   => $record->year_level,
                'section'      => $record->section,
                'email'        => $record->email,
            ]
        ], 200);
    }
        
    public function getImportedReports(Request $request){
        $search = $request->query('search');
        $query = Items::select(
            'id',
            'id_number',
            DB::raw("TRIM(CONCAT(first_name, ' ', IFNULL(middle_name, ''), ' ', last_name)) as name"),
            'course',
            'validation_date',
        )
        ->orderBy('id', 'asc');
            
        if ($search) {
            $query->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('id', $search)
                    ->orWhere('id_number', 'LIKE', "%{$search}%");
                } else {
                    $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("CONCAT(last_name, ' ', first_name) LIKE ?", ["%{$search}%"])
                    ->orWhere('course', 'LIKE', "%{$search}%");
                }
            });
        }

        $paginated = $query->paginate(10);

        $paginated->getCollection()->transform(function ($item){
            $item->formatted_date = $item->validation_date 
            ? Carbon::parse($item->validation_date)->format('M d, Y') 
            : 'N/A'; 
            return $item;
        });
        
        return response()->json($paginated);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:5120', 
        ]);

        // 1. Increase execution time for this specific request
        set_time_limit(300); // 5 minutes

        $file = $request->file('file');

        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            $header = array_shift($rows);
            $importData = [];

            foreach ($rows as $row) {
                if (empty($row[1])) continue; // Skip if ID Number (col 1) is empty

                // 2. Prepare data for bulk upsert instead of calling the DB inside the loop
                $importData[] = [
                    'id_number'       => (string)$row[1],
                    // 'has_card'        => false,
                    'last_name'       => $row[2] ?? null,
                    'first_name'      => $row[3] ?? null,
                    'middle_name'     => $row[4] ?? null,
                    'sex'             => $row[5] ?? null,
                    'course'          => $row[6] ?? null,
                    'year_level'      => $row[7] ?? null,
                    'units'           => $row[8] ?? null,
                    'section'         => $row[9] ?? null,
                    'email'           => $row[10] ?? null,
                    'contact_no'      => $row[11] ?? null,
                    'birth_date'      => !empty($row[12]) ? date('Y-m-d', strtotime($row[12])) : null,
                    'citizen'         => $row[13] ?? null,
                    'lrn'             => $row[14] ?? null,
                    'strand'          => $row[15] ?? null,
                    'validation_date' => $row[16] ?? null,
                    // 'created_at'      => now(),
                    // 'updated_at'      => now(),
                ];
            }

            // 3. Perform a Bulk Upsert
            // First arg: The data
            // Second arg: The unique column to check (id_number)
            // Third arg: Columns to update if the id_number already exists
            if (!empty($importData)) {
                DB::beginTransaction();
                
                // Process in chunks of 500 to be safe with memory
                foreach (array_chunk($importData, 500) as $chunk) {
                    Items::upsert($chunk, ['id_number'], [
                        'last_name', 'first_name', 'middle_name', 'sex', 'course', 
                        'year_level', 'units', 'section', 'email', 'contact_no', 
                        'birth_date', 'citizen', 'lrn', 'strand', 'validation_date'
                    ]);
                }
                
                DB::commit();
            }

            return response()->json(['message' => 'Success'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            // Log the error for debugging
            \Log::error("Import Error: " . $e->getMessage());
            return response()->json(['error' => 'Import Error: ' . $e->getMessage()], 500);
        }
    }
}
