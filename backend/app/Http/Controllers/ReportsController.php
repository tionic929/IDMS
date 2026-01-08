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
            'file' => 'required|mimes:xlsx,xls|max:5120', // 5MB Limit
        ]);

        $file = $request->file('file');

        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(); // Converts the entire sheet to a nested array

            // Remove the header row
            $header = array_shift($rows);

            $importData = [];

            DB::beginTransaction();

            foreach ($rows as $row) {
                
                if (empty($row[0])) continue; // Skip empty rows

                Items::updateOrCreate(
                ['id_number' => (string)$row[1]],
                [
                    'has_card'         => false,
                    'last_name'        => $row[2],
                    'first_name'       => $row[3],
                    'middle_name'      => $row[4], // Assuming middle_initial in DB
                    'sex'              => $row[5],
                    'course'           => $row[6],
                    'year_level'       => $row[7],
                    'units'            => $row[8],
                    'section'          => $row[9],
                    'email'            => $row[10],
                    'contact_no' => $row[11], // Mapping 'contact_no' from excel to your DB field
                    'birth_date'       => !empty($row[12]) ? date('Y-m-d', strtotime($row[12])) : null,
                    'citizen'          => $row[13],
                    'lrn'              => $row[14],
                    'strand'           => $row[15],
                    'validation_date'  => $row[16],
                ]
            );
                // Student::updateOrCreate(
                //     ['id_number' => (string)$row[0]], // Match by ID Number
                //     [
                //         'has_card'       => false,
                //         'first_name'     => $row[1],
                //         'middle_initial' => $row[2] ? substr($row[2], 0, 1) : null,
                //         'last_name'      => $row[3],
                //         'course'         => $row[4],
                //         'address'        => $row[5],
                //         'guardian_name'  => $row[6],
                //         'guardian_contact'  => $row[7],
                //     ]
                // );
            }

            DB::commit();
            return response()->json(['message' => 'Success'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Import Error: ' . $e->getMessage()], 500);
        }
    }
}
