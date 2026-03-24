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
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\HistoryExportController;
use App\Http\Controllers\NotificationController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::get('/proxy-image', function (Request $request) {
    $path = $request->query('path');
    if (!Storage::disk('public')->exists($path))
        return response()->json(['error' => 'File not found'], 404);

    return Storage::disk('public')->response($path);
})->name('proxy.image');

Route::post('/login', [AuthController::class , 'login'])->name('login');
Route::post('/register', [AuthController::class , 'register'])->name('register');
Route::post('/students', [ApplicantsController::class , 'store'])->name('applicants.store');

Route::resource('users', UsersController::class);
Route::get('/get-departments', [DepartmentsController::class , 'getApplicantsByDepartments']);
Route::post('/reports/verify', [ReportsController::class , 'verifyIdNumber']);
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/students', [ApplicantsController::class , 'index']);

    Route::post('/logout', [AuthController::class , 'logout']);

    // User Profile Routes
    Route::put('/user/profile', [UsersController::class, 'updateProfile']);
    Route::post('/user/avatar', [UsersController::class, 'uploadAvatar']);

    Route::get('/total-applicants', [ApplicantsController::class , 'applicantsReport']);

    Route::get('/paginated-applicants', [ApplicantsController::class , 'paginatedApplicants']);
    Route::get('/archived-applicants', [ApplicantsController::class , 'getArchived']);
    Route::get('/all-imported-reports', [ReportsController::class , 'getImportedReports']);

    Route::put('/applicant/{student}/toggle', [ApplicantsController::class , 'toggleHasCard']);
    Route::post('/applicant/{id}/archive', [ApplicantsController::class , 'archive']);
    Route::post('/applicant/{id}/reject', [ApplicantsController::class, 'reject']);
    Route::delete('/applicant/{student}', [ApplicantsController::class , 'destroy']);
    Route::post('/confirm-applicant/{studentId}', [ApplicantsController::class , 'updateApplicantsExcelFile']);
    Route::post('/confirm/{studentId}', [ApplicantsController::class , 'confirm']);
    Route::post('/send-softcopy-email', [ApplicantsController::class , 'sendSoftcopyEmail']);

    Route::get('/analytics/dashboard', [AnalyticsController::class , 'getDashboardStats']);
    Route::get('/analytics/export', [AnalyticsController::class , 'exportSpreadsheet']);

    // Notification Routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Activity Logs
    Route::get('/activity-logs', [App\Http\Controllers\ActivityLogController::class, 'index']);

    // FOR ID CARD DESIGNER

    Route::prefix('card-layouts')->group(function () {
            Route::get('/', [CardLayoutController::class , 'index']);
            Route::post('/', [CardLayoutController::class , 'store']);
            Route::put('/{id}', [CardLayoutController::class , 'update']);
            Route::delete('/{id}', [CardLayoutController::class , 'destroy']);
            Route::post('/{id}/duplicate', [CardLayoutController::class , 'duplicate']);
            Route::post('/upload-logo', [CardLayoutController::class , 'uploadLogo']);
        }
        );

        Route::get('/history/export', [HistoryExportController::class, 'exportCsv']);

        Route::get('/applicants/{id}/card-preview', [ApplicantsController::class , 'getPreview']);

        Route::post('/import', [ReportsController::class , 'import']);

        Route::middleware('role:admin')
            ->prefix('admin')
            ->group(function () {
        // Route::get('/applications', [AdminApplicationController::class, 'index']);
        // Route::get('/applications/{id}', [AdminApplicationController::class, 'show']);
        // Route::put('/applications/{id}/approve', [AdminApplicationController::class, 'approve']);
        }
        );
    });
