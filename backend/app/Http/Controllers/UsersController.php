<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User; // 1. Import the User Model
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;

class UsersController extends Controller
{
    /**
     * Display a listing of the resource (Read - All).
     * GET /users
     */
    public function index()
    {
        // Fetch all users and return them as a JSON response.
        $users = User::all();

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
        return response()->json(['message' => 'User deleted successfully.'], 204); // 204 No Content
    }
    
    // The 'create' and 'edit' methods are typically used for rendering HTML forms 
    // in traditional web apps, but are usually left empty or removed for pure APIs.
    public function create() { /* empty for API */ }
    public function edit(string $id) { /* empty for API */ }
}