<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\ApplicantsController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\DepartmentsController;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\CardLayoutController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::get('/proxy-image', function (Request $request) {
    $path = $request->query('path');
    if (!Storage::disk('public')->exists($path)) return response()->json(['error' => 'File not found'], 404);
    
    return Storage::disk('public')->response($path);
});

Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/students', [ApplicantsController::class, 'store'])->name('applicants.store');

Route::resource('users', UsersController::class);
Route::get('/get-departments', [DepartmentsController::class, 'getApplicantsByDepartments']);
Route::post('/reports/verify', [ReportsController::class, 'verifyIdNumber']);
Route::middleware('auth:sanctum')->group(function () {
    
    Route::get('/students', [ApplicantsController::class, 'index']);
    
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/total-applicants', [ApplicantsController::class, 'applicantsReport']);

    Route::get('/paginated-applicants', [ApplicantsController::class, 'paginatedApplicants']);
    Route::get('/all-imported-reports', [ReportsController::class, 'getImportedReports']);
    
    Route::put('/applicant/{student}/toggle', [ApplicantsController::class, 'toggleHasCard']);
    Route::post('/confirm-applicant/{studentId}', [ApplicantsController::class, 'updateApplicantsExcelFile']);
    Route::post('/confirm/{studentId}', [ApplicantsController::class, 'confirm']);

    // FOR ID CARD DESIGNER

    Route::prefix('card-layouts')->group(function () {
        Route::get('/', [CardLayoutController::class, 'index']);
        Route::post('/', [CardLayoutController::class, 'store']);
        Route::put('/{id}', [CardLayoutController::class, 'update']);
        Route::delete('/{id}', [CardLayoutController::class, 'destroy']);
        Route::patch('/{id}/activate', [CardLayoutController::class, 'activate']);
    });

    Route::get('/applicants/{id}/card-preview', [ApplicantsController::class, 'getPreview']);

    Route::post('/import', [ReportsController::class, 'import']);

    Route::middleware('role:admin')
        ->prefix('admin')
        ->group(function () {
            // Route::get('/applications', [AdminApplicationController::class, 'index']);
            // Route::get('/applications/{id}', [AdminApplicationController::class, 'show']);
            // Route::put('/applications/{id}/approve', [AdminApplicationController::class, 'approve']);
        });
});
