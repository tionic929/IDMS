<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User; // 1. Import the User Model
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use App\Models\ActivityLog;

class UsersController extends Controller
{
    /**
     * Display a listing of the resource (Read - All).
     * GET /users
     */
    public function index(Request $request)
    {
        $users = User::select('id', 'name', 'email', 'role', 'avatar', 'created_at', 'updated_at')
            ->paginate($request->query('per_page', 20));

        return response()->json($users, 200);
    }

    /**
     * Store a newly created resource in storage (Create).
     * POST /users
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'required|string|email|max:255|unique:users',
            'password'  => 'required|string|min:8',
            'role'      => ['required', 'string', Rule::in(['admin', 'applicant'])],
        ]);

        $user = User::create([
            'name'      => $validatedData['name'],
            'email'     => $validatedData['email'],
            'password'  => Hash::make($validatedData['password']),
            'role'      => $validatedData['role'],
        ]);

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'user' => auth()->user()?->name ?? 'System',
            'action' => 'User Added',
            'type' => 'system',
            'details' => "New {$user->role} '{$user->name}' was added to the system.",
            'status' => 'success',
            'ip' => request()->ip(),
        ]);

        return response()->json([
            'message' => 'User created successfully.', 
            'user' => $user
        ], 201);
    }

    public function show(string $id)
    {
        $user = User::findOrFail($id);
        
        return response()->json($user, 200);
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validatedData = $request->validate([
            'name'      => 'sometimes|required|string|max:255',
            'email'     => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password'  => 'nullable|string|min:8', 
            'role'      => ['sometimes', 'required', 'string', Rule::in(['admin', 'user'])],
        ]);
        
        if (isset($validatedData['password'])) {
            $validatedData['password'] = Hash::make($validatedData['password']);
        }
        
        // 6. Update the user
        $user->update($validatedData);

        // 7. Return success response
        return response()->json([
            'message' => 'User updated successfully.', 
            'user' => $user
        ], 200); // 200 OK
    }

    /**
     * Remove the specified resource from storage (Delete).
     * DELETE /users/{id}
     */
    public function destroy(string $id)
    {
        // Find the user. Laravel will automatically throw a 404 if not found.
        $user = User::findOrFail($id);

        // 8. Delete the user
        $user->delete();

        // 9. Return success response with no content
        return response()->json(['message' => 'User deleted successfully.'], 200);
    }

    public function updateProfile(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validatedData = $request->validate([
            'name'  => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($validatedData);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($request->hasFile('image')) {
            // Delete old avatar if exists
            if ($user->avatar) {
                // Remove asset URL part if present to get relative path
                $relative = str_replace(asset('storage/'), '', $user->avatar);
                Storage::disk('public')->delete($relative);
            }

            $image = $request->file('image');
            $fileName = time() . '_avatar_' . $user->id . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('avatars', $fileName, 'public');
            
            // Store relative path in DB
            $user->update(['avatar' => $path]);

            return response()->json([
                'url' => url('/api/proxy-image?path=' . urlencode($path)),
                'avatar' => $path,
                'message' => 'Avatar uploaded successfully.'
            ]);
        }

        return response()->json(['error' => 'No image uploaded'], 400);
    }
    
    // The 'create' and 'edit' methods are typically used for rendering HTML forms 
    public function create() { /* empty for API */ }
    public function edit(string $id) { /* empty for API */ }
}