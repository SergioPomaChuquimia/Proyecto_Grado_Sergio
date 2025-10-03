<?php

namespace App\Http\Controllers;

use App\Models\HistorialRecojo;
use App\Models\Hijo;

class HistorialRecojoController extends Controller
{
    public function index($ci)
    {
        $hijo = Hijo::where('ci', $ci)->first();

        if (!$hijo) {
            return response()->json(['message' => 'Estudiante no encontrado'], 404);
        }

        $historial = HistorialRecojo::with([
                'personal:id,name,apellido,ci,tipo,descripcion',
                'hijo:id,nombre,apellido,grado',
            ])
            ->where('hijo_id', $hijo->id)
            ->orderBy('fecha_hora', 'desc')
            ->get();

        return response()->json($historial);
    }
}