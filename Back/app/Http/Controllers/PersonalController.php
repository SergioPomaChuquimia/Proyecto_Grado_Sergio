<?php

namespace App\Http\Controllers;

use App\Models\Personal;
use Illuminate\Http\Request;

class PersonalController extends Controller
{
  public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string',
            'email'     => 'required|email|unique:personals',
            'phone'     => 'nullable|string',
            'address'   => 'nullable|string',
            'embedding' => 'nullable|string',   // ya no es required
            'photo'     => 'required|string',
        ]);

        // Si embedding vino vacío o null, lo forzamos a cadena vacía
        $data['embedding'] = $data['embedding'] ?? '';

        $personal = Personal::create($data);

        return response()->json($personal, 201);
    }

    public function index()
    {
        return response()->json(Personal::all());
    }

    public function show($id)
    {
        return response()->json(Personal::findOrFail($id));
    }

  public function update(Request $request, $id)
    {
        $personal = Personal::findOrFail($id);

        $data = $request->validate([
            'name'      => 'required|string',
            'email'     => 'required|email',
            'phone'     => 'nullable|string',
            'address'   => 'nullable|string',
            'embedding' => 'nullable|string',
            'photo'     => 'required|string',
        ]);

        $data['embedding'] = $data['embedding'] ?? '';

        $personal->update($data);

        return response()->json($personal);
    }


    public function destroy($id)
    {
        Personal::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
