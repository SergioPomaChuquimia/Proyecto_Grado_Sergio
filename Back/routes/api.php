<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use App\Http\Controllers\PersonalController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\VerifyController;
use App\Http\Controllers\HijoController;
use App\Http\Controllers\HistorialRecojoController;

use Illuminate\Support\Facades\Log;
use App\Http\Controllers\PickupRuleController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::apiResource('personals', PersonalController::class); // No es necesario declarar las rutas manualmente si usas apiResource

Route::apiResource('roles', RoleController::class);

Route::get('/users', [UserController::class, 'index']);
Route::put('/users/{id}/role', [UserController::class, 'assignRole']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);

Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink']);
Route::post('/reset-password',  [PasswordResetController::class, 'reset']);
Route::post('/users/{id}/unlock', [UserController::class, 'unlockUser']);

Route::post('/verify', [VerifyController::class, 'verify']);
Route::post('/verifyNow', [VerifyController::class, 'verifyNow']);
Route::apiResource('hijos', HijoController::class);

Route::middleware('auth:sanctum')->group(function () {
    Route::get   ('/hijos/{hijo}/pickup-rules',          [PickupRuleController::class,'index']);
    Route::post  ('/hijos/{hijo}/pickup-rules',          [PickupRuleController::class,'store']);
    Route::put   ('/hijos/{hijo}/pickup-rules/{rule}',   [PickupRuleController::class,'update']);
    Route::delete('/hijos/{hijo}/pickup-rules/{rule}',   [PickupRuleController::class,'destroy']);
});


Route::get('/hijos/{ci}/historial-recojos', [HistorialRecojoController::class, 'index']);









