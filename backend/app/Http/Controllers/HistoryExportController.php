<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HistoryExportController extends Controller
{
    /**
     * Export history logs as CSV.
     * For now, this uses a structure matching the frontend mock logs.
     */
    public function exportCsv()
    {
        // Mock data for export (in a real app, this would query a logs table)
        $logs = [
            [1, 'submission', 'Julius Caesar', 'Submitted new application', '2026-03-15 10:00:00', 'success', '192.168.1.45'],
            [2, 'auth', 'Admin System', 'Failed login attempt detected', '2026-03-15 10:45:00', 'warning', '45.12.8.122'],
            [3, 'system', 'Database', 'Automatic backup completed', '2026-03-15 12:00:00', 'info', 'Internal'],
            [4, 'report', 'Admin User', 'Exported department statistics', '2026-03-15 15:00:00', 'success', '192.168.1.10'],
            [5, 'submission', 'Marcus Brutus', 'Updated profile details', '2026-03-14 09:00:00', 'success', '192.168.1.52'],
            [6, 'system', 'System', 'Application deployed to production', '2026-03-14 11:30:00', 'info', 'Internal'],
        ];

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=history_logs_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['ID', 'Type', 'User', 'Action', 'Date', 'Status', 'IP Address'];

        $callback = function() use($logs, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($logs as $log) {
                fputcsv($file, $log);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
