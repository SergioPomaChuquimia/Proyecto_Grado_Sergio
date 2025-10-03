<?php

namespace App\Http\Controllers;

use App\Models\Hijo;
use Illuminate\Http\Request;

class HijoController extends Controller
{
    public function index()
    {
        return response()->json(Hijo::with('personals:id,name,email')->orderByDesc('id')->get());
    }

     public function store(Request $request)
    {
        // Validar el campo 'ci' para que sea único
        $data = $request->validate([
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'grado' => 'nullable|string|max:50',
            'fecha_nac' => 'nullable|date',
            'estado' => 'nullable|in:activo,inactivo',
            'ci' => 'required|string|max:20|unique:hijos,ci', // Validación única para el campo ci
            'personal_ids' => 'required|array|min:1|max:4',
            'personal_ids.*' => 'distinct|integer|exists:personals,id',
        ]);

        $hijo = Hijo::create($data);

        $hijo->personals()->sync($data['personal_ids']);

        return response()->json($hijo->load('personals:id,name,email'), 201);
    }


    public function show($id)
    {
        return response()->json(Hijo::with('personals:id,name,email')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $hijo = Hijo::findOrFail($id);
        
        // Validación de ci único, excluyendo el registro actual
        $data = $request->validate([
            'nombre' => 'sometimes|required|string|max:100',
            'apellido' => 'sometimes|required|string|max:100',
            'grado' => 'nullable|string|max:50',
            'fecha_nac' => 'nullable|date',
            'estado' => 'nullable|in:activo,inactivo',
            'ci' => 'sometimes|required|string|max:20|unique:hijos,ci,' . $id,  // Validación única para el campo ci, excluyendo el id actual
            'personal_ids' => 'sometimes|array|min:1|max:4',
            'personal_ids.*' => 'distinct|integer|exists:personals,id',
        ]);

        $hijo->update($data);

        if (isset($data['personal_ids'])) {
            $hijo->personals()->sync($data['personal_ids']);
        }

        return response()->json($hijo->load('personals:id,name,email'));
    }

    public function destroy($id)
    {
        Hijo::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
