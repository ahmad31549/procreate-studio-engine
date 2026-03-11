<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function index()
    {
        if (!auth()->user()->is_admin) {
            abort(403, 'Unauthorized');
        }

        $users = User::orderBy('created_at', 'desc')->get();
        return view('admin-panel', compact('users'));
    }

    public function updateStatus(Request $request, $id)
    {
        if (!auth()->user()->is_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);
        $user->status = $request->status;
        $user->save();

        return response()->json(['success' => true, 'message' => 'Status updated']);
    }

    public function updateToolAccess(Request $request, $id)
    {
        if (!auth()->user()->is_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);
        $user->tool_access = $request->tool_access ?? [];
        $user->save();

        return response()->json(['success' => true, 'message' => 'Tool access updated']);
    }

    public function resetPassword(Request $request, $id)
    {
        if (!auth()->user()->is_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'password' => 'required|min:8',
        ]);

        $user = User::findOrFail($id);
        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['success' => true, 'message' => 'Password reset successfully']);
    }

    public function deleteUser($id)
    {
        if (!auth()->user()->is_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);
        
        if ($user->is_admin) {
            return response()->json(['success' => false, 'message' => 'Cannot delete admin user'], 400);
        }

        $user->delete();

        return response()->json(['success' => true, 'message' => 'User deleted']);
    }
}
