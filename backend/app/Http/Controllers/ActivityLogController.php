<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::orderBy('created_at', 'desc');

        // Optional filtering by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Search in action or details
        if ($request->has('query')) {
            $search = $request->query('query');
            $query->where(function($q) use ($search) {
                $q->where('action', 'LIKE', "%{$search}%")
                  ->orWhere('details', 'LIKE', "%{$search}%")
                  ->orWhere('user', 'LIKE', "%{$search}%");
            });
        }

        $logs = $query->paginate(20);

        // Format for frontend (to match the expected schema if possible, or adapt frontend)
        $logs->getCollection()->transform(function($log) {
            return [
                'id' => $log->id,
                'type' => $log->type,
                'user' => $log->user,
                'action' => $log->action,
                'date' => $log->created_at->diffForHumans(),
                'status' => $log->status,
                'details' => $log->details,
                'ip' => $log->ip,
                'created_at' => $log->created_at->toDateTimeString(),
            ];
        });

        return response()->json($logs);
    }
}
