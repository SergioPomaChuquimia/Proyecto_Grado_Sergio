<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;


class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            Log::info('Solicitud de registro recibida:', $request->all());

            // Validación de los datos de entrada
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users',
                'password' => 'required|string|min:6|confirmed',
            ]);

            // Registrar el usuario
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            Log::info('Usuario registrado exitosamente:', $user->toArray());

            return response()->json(['message' => 'Usuario registrado correctamente'], 201);
        } catch (\Exception $e) {
            Log::error('Error al registrar el usuario:', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error al registrar el usuario', 'error' => $e->getMessage()], 500);
        }
    }


public function user(Request $request)
{
    Log::info('Verificando usuario autenticado:', ['user' => $request->user()]);
    return response()->json($request->user());
}

public function login(Request $request)
{
    Log::info('Iniciando sesión con los siguientes datos:', $request->only('email'));
    if (Auth::attempt($request->only('email', 'password'))) {
        Log::info('Sesión iniciada correctamente para el usuario:', [Auth::user()]);
        return response()->json(['message' => 'Autenticado correctamente']);
    } else {
        Log::warning('Intento fallido de inicio de sesión para el correo:', [$request->email]);
        return response()->json(['message' => 'Credenciales incorrectas'], 401);
    }
}

            public function handle($request, Closure $next)
        {
            Log::info('Verificando cookies:', $request->cookies->all());  // Mostrar todas las cookies

            return $next($request);
        }


public function logout(Request $request)
{
    Log::info('Cerrando sesión para el usuario:', [$request->user()]);

    // Opcional: eliminar tokens personales si usas tokens API
    if ($request->user()) {
        $request->user()->tokens()->delete();
    }

    // Invalida la sesión
    $request->session()->invalidate();

    // Regenera token CSRF
    $request->session()->regenerateToken();

    return response()->json(['message' => 'Sesión cerrada correctamente']);
}



}
