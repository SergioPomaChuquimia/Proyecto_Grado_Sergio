<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return User::with('role')->get(); 
    }

    public function assignRole(Request $request, $id)
    {
        $request->validate(['role_id' => 'required|exists:roles,id']);

        $user = User::findOrFail($id);
        $user->role_id = $request->role_id;
        $user->save();

        return response()->json(['message' => 'Rol asignado correctamente']);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Usuario eliminado']);
    }

    public function unlockUser($id)
    {
        $user = User::findOrFail($id);

        $user->is_blocked = false;
        $user->password_change_attempts = 0;
        $user->save();

        return response()->json(['message' => 'Usuario desbloqueado correctamente', 'user' => $user]);
    }
}
