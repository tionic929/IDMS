<?php

namespace App\Http\Controllers;

use App\Models\CardLayout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CardLayoutController extends Controller
{
    /**
     * Display a listing of the templates.
     */
    public function index()
    {
        return response()->json(CardLayout::orderBy('created_at', 'desc')->get());
    }

    /**
     * Store a newly created template.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'front_config' => 'required|array',
            'back_config' => 'required|array',
        ]);

        $layout = CardLayout::create($validated);

        return response()->json($layout, 201);
    }

    /**
     * Update the specified template (Config/Layout).
     */
    public function update(Request $request, $id)
    {
        $layout = CardLayout::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'front_config' => 'required|array',
            'back_config' => 'required|array',
        ]);

        $layout->update($validated);

        return response()->json($layout);
    }

    public function destroy($id)
    {
        $layout = CardLayout::findOrFail($id);
        
        if ($layout->is_active) {
            return response()->json(['error' => 'Cannot delete the active template'], 400);
        }

        $layout->delete();
        return response()->json(['message' => 'Template deleted']);
    }

    public function duplicate($id)
    {
        $original = CardLayout::findOrFail($id);
        $newLayout = $original->replicate();
        $newLayout->name = $original->name . ' (Copy)';
        $newLayout->is_active = false;
        $newLayout->save();

        return response()->json($newLayout, 201);
    }
}