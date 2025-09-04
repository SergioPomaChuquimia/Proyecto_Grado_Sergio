<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // Listar usuarios con su rol
    public function index()
    {
        return User::with('role')->get(); 
    }

    // Asignar un rol a un usuario
    public function assignRole(Request $request, $id)
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::findOrFail($id);
        $user->role_id = $request->role_id;
        $user->save();

        return response()->json(['message' => 'Rol asignado correctamente']);
    }

    // Eliminar un usuario
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Usuario eliminado']);
    }
}
