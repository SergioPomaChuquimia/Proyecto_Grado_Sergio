<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\TwoFactorCodeMail;
use Closure;


class AuthController extends Controller
{
    // Registro de usuario
    public function register(Request $request)
    {
        try {
            Log::info('Solicitud de registro recibida:', $request->all());

            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users',
                'password' => 'required|string|min:6|confirmed',
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'two_factor_enabled' => 1, // Activamos 2FA automáticamente al registrar
            ]);

            Log::info('Usuario registrado exitosamente:', $user->toArray());

            return response()->json(['message' => 'Usuario registrado correctamente'], 201);
        } catch (\Exception $e) {
            Log::error('Error al registrar el usuario:', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error al registrar el usuario', 'error' => $e->getMessage()], 500);
        }
    }

    // Ver usuario autenticado
    public function user(Request $request)
    {
        Log::info('Verificando usuario autenticado:', ['user' => $request->user()]);
        return response()->json($request->user());
    }

    // Login con soporte 2FA
        public function login(Request $request)
    {
        Log::info('Iniciando sesión con los siguientes datos:', $request->only('email'));

        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            Log::warning('Intento de login: usuario no encontrado', [$request->email]);
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // Si la cuenta está bloqueada, rechazamos con 403 y mensaje claro
   if ($user->is_blocked) {
        // Cambiar a código 423
        return response()->json(['message' => 'Cuenta bloqueada. Contacta al DIRECTOR.'], 423);
    }

        if (!Hash::check($request->password, $user->password)) {
            Log::warning('Intento fallido de inicio de sesión para el correo:', [$request->email]);
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // Si el usuario tiene 2FA activado
        if ($user->two_factor_enabled) {
            $code = $user->generateTwoFactorCode();
            Mail::to($user->email)->send(new TwoFactorCodeMail($code));

            Log::info('Código 2FA generado y enviado por correo para el usuario:', ['email' => $user->email]);

            return response()->json([
                '2fa_required' => true,
                'email' => $user->email,
                'message' => 'Se envió un código al correo.'
            ]);
        }

        // Login normal si 2FA no activado
        Auth::login($user);
        Log::info('Sesión iniciada correctamente para el usuario:', [$user]);
        return response()->json(['message' => 'Autenticado correctamente', 'user' => $user]);
    }

    // Verificar código 2FA
    public function verify2FA(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|digits:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        if (!$user->two_factor_code || $user->two_factor_code !== $request->code) {
            return response()->json(['message' => 'Código inválido'], 401);
        }

        if ($user->two_factor_expires_at->lt(now())) {
            return response()->json(['message' => 'Código expirado'], 401);
        }

        Auth::login($user);
        $user->resetTwoFactorCode();

        Log::info('Usuario autenticado correctamente vía 2FA:', ['email' => $user->email]);

        return response()->json(['message' => 'Autenticado correctamente', 'user' => $user]);
    }

    // Reenviar código 2FA
    public function resend2FA(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->firstOrFail();

        if (!$user->two_factor_enabled) {
            return response()->json(['message' => '2FA no está activado para este usuario.'], 400);
        }

        $code = $user->generateTwoFactorCode();
        Mail::to($user->email)->send(new TwoFactorCodeMail($code));

        Log::info('Código 2FA reenviado por correo para el usuario:', ['email' => $user->email]);

        return response()->json(['message' => 'Código reenviado.']);
    }

    // Middleware temporal para logs de cookies (si lo usas)
    public function handle($request, Closure $next)
    {
        Log::info('Verificando cookies:', $request->cookies->all());
        return $next($request);
    }

    // Logout
    public function logout(Request $request)
    {
        Log::info('Cerrando sesión para el usuario:', [$request->user()]);

        if ($request->user()) {
            $request->user()->tokens()->delete();
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }



}
