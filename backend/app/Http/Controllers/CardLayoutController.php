<?php

namespace App\Http\Controllers;

use App\Models\CardLayout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
            'logo' => 'nullable|string',
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
            'logo' => 'sometimes|nullable|string',
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

    /**
     * Handle logo uploads for templates.
     */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $originalName = pathinfo($image->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = $image->getClientOriginalExtension();
            $sluggedName = Str::slug($originalName);
            $fileName = time() . '_' . $sluggedName . '.' . $extension;

            $path = $image->storeAs('logos', $fileName, 'public');

            return response()->json([
                'url' => route('proxy.image', ['path' => $path]),
                'path' => $path
            ]);
        }

        return response()->json(['error' => 'No image uploaded'], 400);
    }
}