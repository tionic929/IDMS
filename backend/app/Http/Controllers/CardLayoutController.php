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

    /**
     * Set a specific template as the 'Active' one.
     */
    public function activate($id)
    {
        try {
            DB::beginTransaction();

            // 1. Deactivate all existing templates
            CardLayout::where('is_active', true)->update(['is_active' => false]);

            // 2. Activate the selected one
            $layout = CardLayout::findOrFail($id);
            $layout->is_active = true;
            $layout->save();

            DB::commit();

            return response()->json(['message' => 'Template activated successfully', 'layout' => $layout]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Activation failed'], 500);
        }
    }

    /**
     * Remove the specified template.
     */
    public function destroy($id)
    {
        $layout = CardLayout::findOrFail($id);
        
        if ($layout->is_active) {
            return response()->json(['error' => 'Cannot delete the active template'], 400);
        }

        $layout->delete();
        return response()->json(['message' => 'Template deleted']);
    }
}