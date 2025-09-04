<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use App\Http\Controllers\PersonalController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
});
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    Log::info("Usuario autenticado:", [$request->user()]);  // Log para verificar el usuario autenticado
    return $request->user();
});
Route::apiResource('personals', PersonalController::class);
Route::post('/personals', [PersonalController::class, 'store']);
Route::get('/personals', [PersonalController::class, 'index']);
Route::get('/personals/{id}', [PersonalController::class, 'show']);
Route::put('/personals/{id}', [PersonalController::class, 'update']);
Route::delete('/personals/{id}', [PersonalController::class, 'destroy']);

Route::apiResource('roles', RoleController::class);

Route::get('/users', [UserController::class, 'index']);
Route::put('/users/{id}/role', [UserController::class, 'assignRole']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);
