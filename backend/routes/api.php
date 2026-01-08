<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\ApplicantsController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\DepartmentsController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

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

    Route::post('/import', [ReportsController::class, 'import']);

    Route::middleware('role:admin')
        ->prefix('admin')
        ->group(function () {
            // Route::get('/applications', [AdminApplicationController::class, 'index']);
            // Route::get('/applications/{id}', [AdminApplicationController::class, 'show']);
            // Route::put('/applications/{id}/approve', [AdminApplicationController::class, 'approve']);
        });
});
