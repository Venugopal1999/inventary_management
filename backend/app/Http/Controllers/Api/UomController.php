<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Uom;
use Illuminate\Http\Request;

class UomController extends Controller
{
    public function index()
    {
        $uoms = Uom::all();
        return response()->json($uoms);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:uoms,name',
            'symbol' => 'required|string|max:10|unique:uoms,symbol',
            'base_ratio' => 'required|numeric|min:0',
        ]);

        $uom = Uom::create($validated);
        return response()->json($uom, 201);
    }

    public function show($id)
    {
        $uom = Uom::findOrFail($id);
        return response()->json($uom);
    }

    public function update(Request $request, $id)
    {
        $uom = Uom::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:uoms,name,' . $id,
            'symbol' => 'sometimes|required|string|max:10|unique:uoms,symbol,' . $id,
            'base_ratio' => 'sometimes|required|numeric|min:0',
        ]);

        $uom->update($validated);
        return response()->json($uom);
    }

    public function destroy($id)
    {
        $uom = Uom::findOrFail($id);
        $uom->delete();
        return response()->json(['message' => 'UOM deleted successfully']);
    }
}
