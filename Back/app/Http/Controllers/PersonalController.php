<?php

namespace App\Http\Controllers;

use App\Models\Personal;
use Illuminate\Http\Request;
use App\Services\FaceService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class PersonalController extends Controller
{
    public function store(Request $request, FaceService $face)
{
    Log::info('Datos recibidos para el registro de Personal:', $request->all());

    // Aseguramos que 'descripcion' sea parte de los datos que se van a validar
    $data = $request->validate([
        'name'      => 'required|string',
        'apellido'  => 'required|string|max:100',
        'email'     => 'required|email|unique:personals,email',
        'telefono'  => 'required_without:phone|string|max:20',
        'phone'     => 'nullable|string|max:20',
        'ci'        => 'required|string|max:20|unique:personals,ci',
        'direccion' => 'nullable|string|max:255',
        'address'   => 'nullable|string|max:255', 
        'usuario'   => 'required|string|max:50|unique:personals,usuario',
        'password'  => 'required|string|min:6',
        'photo'     => 'required|string', 
        'tipo'      => 'nullable|string',     // Validar el campo tipo si es necesario
        'descripcion' => 'nullable|string',   // Agregar validación para descripcion
    ]);

    Log::info('Datos validados para el registro de Personal:', $data);

    // Manejo de campos legacy (phone y address)
    $data['telefono'] = $data['telefono'] ?? $data['phone'];
    $data['direccion'] = $data['direccion'] ?? $data['address'];

    // Analizar la imagen utilizando el servicio FaceService
    try {
        $analysis = $face->analyze($data['photo']);
    } catch (\Exception $e) {
        Log::error('Error al intentar analizar la imagen:', ['error' => $e->getMessage()]);
        return response()->json(['message' => 'Error al procesar la imagen.'], 500);
    }

    if (!$analysis) {
        Log::warning('No se detectó un rostro válido en la imagen');
        return response()->json(['message' => 'No se detectó un rostro válido.'], 422);
    }

    Log::info('Análisis de imagen exitoso:', $analysis);

    $conf  = (float) ($analysis['confidence'] ?? 0);
    $sharp = (float) ($analysis['sharpness'] ?? 0);
    $w     = (int)   ($analysis['size']['w'] ?? 0);
    $h     = (int)   ($analysis['size']['h'] ?? 0);

    if ($conf < 0.95 || min($w, $h) < 120 || $sharp < 100) {
        return response()->json(['message' => 'Imagen de baja calidad. Acércate o mejora la iluminación.'], 422);
    }

    // Procesar y almacenar la imagen
    $b64  = explode(',', $analysis['face_base64'] ?? $data['photo'])[1] ?? $data['photo'];
    $bin  = base64_decode($b64);
    $path = 'parents/'.Str::uuid().'.jpg';
    Storage::disk('public')->put($path, $bin);

    $data['photo']     = $path;
    $data['embedding'] = $analysis['embedding'] ?? null;
    $data['password']  = Hash::make($data['password']);
    $data['estado']    = $request->input('estado', 'activo');

    unset($data['phone'], $data['address']);

    // Crear el nuevo registro de personal con 'descripcion'
    $personal = Personal::create($data);

    Log::info('Registro de Personal exitoso:', $personal->toArray());

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

public function update(Request $request, $id, FaceService $face)
{
    $personal = Personal::findOrFail($id);

    $data = $request->validate([
        'name'      => 'sometimes|required|string',
        'apellido'  => 'sometimes|required|string|max:100',
        'email'     => ['sometimes','required','email', Rule::unique('personals','email')->ignore($id)],
        'telefono'  => 'sometimes|required_without:phone|string|max:20',
        'phone'     => 'nullable|string|max:20', 
        'ci'        => ['sometimes','required','string','max:20', Rule::unique('personals','ci')->ignore($id)],
        'direccion' => 'nullable|string|max:255',
        'address'   => 'nullable|string|max:255',
        'usuario'   => ['sometimes','required','string','max:50', Rule::unique('personals','usuario')->ignore($id)],
        'password'  => 'nullable|string|min:6',
        'photo'     => 'sometimes|required|string',
        'estado'    => 'sometimes|in:activo,inactivo',
        'tipo'      => 'nullable|string',
        'descripcion' => 'nullable|string',   // Asegúrate de incluir el campo descripcion en la validación
    ]);

    // Actualización de datos del personal
    $data['telefono'] = $data['telefono'] ?? $request->input('phone');
    $data['direccion'] = $data['direccion'] ?? $request->input('address');

    if (!empty($data['photo'])) {
        try {
            $analysis = $face->analyze($data['photo']);
        } catch (\Exception $e) {
            Log::error('Error al intentar analizar la nueva imagen:', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error al procesar la imagen.'], 500);
        }

        if (!$analysis) {
            Log::warning('No se detectó un rostro en la nueva imagen.');
            return response()->json(['message' => 'No se detectó un rostro en la nueva imagen.'], 422);
        }

        Log::info('Análisis de la nueva imagen exitoso:', $analysis);

        $conf  = (float) ($analysis['confidence'] ?? 0);
        $sharp = (float) ($analysis['sharpness'] ?? 0);
        $w     = (int)   ($analysis['size']['w'] ?? 0);
        $h     = (int)   ($analysis['size']['h'] ?? 0);

        if ($conf < 0.95 || min($w, $h) < 120 || $sharp < 100) {
            Log::warning('Imagen de baja calidad. Confianza: '.$conf.', Ancho: '.$w.', Alto: '.$h.', Nitidez: '.$sharp);
            return response()->json(['message' => 'Imagen de baja calidad.'], 422);
        }

        $b64  = explode(',', $analysis['face_base64'] ?? $data['photo'])[1] ?? $data['photo'];
        $bin  = base64_decode($b64);
        $path = 'parents/'.Str::uuid().'.jpg';
        Storage::disk('public')->put($path, $bin);

        $data['photo']     = $path;
        $data['embedding'] = $analysis['embedding'] ?? $personal->embedding;
    }

    if (!empty($data['password'])) {
        $data['password'] = Hash::make($data['password']);
    } else {
        unset($data['password']);
    }

    unset($data['phone'], $data['address']);
    $personal->update($data);

    return response()->json($personal);
}


    public function destroy($id)
    {
        Personal::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
