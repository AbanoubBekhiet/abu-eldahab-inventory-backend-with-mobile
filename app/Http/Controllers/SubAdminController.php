<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SubAdminController extends Controller
{
    /**
     * Display a listing of sub-admins.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');

        $query = User::where('role', 'sub_admin');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $subAdmins = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $subAdmins->items(),
            'pagination' => [
                'current_page' => $subAdmins->currentPage(),
                'last_page'    => $subAdmins->lastPage(),
                'total'        => $subAdmins->total(),
            ]
        ]);
    }

    /**
     * Store a newly created sub-admin.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|string|email|max:150|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $subAdmin = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'sub_admin',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة الموظف (Sub Admin) بنجاح',
            'data'    => $subAdmin,
        ], 201);
    }

    /**
     * Update the specified sub-admin.
     */
    public function update(Request $request, $id)
    {
        $subAdmin = User::where('role', 'sub_admin')->findOrFail($id);

        $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => ['required', 'string', 'email', 'max:150', Rule::unique('users')->ignore($subAdmin->id)],
            'password' => 'nullable|string|min:6',
        ]);

        $data = [
            'name'  => $request->name,
            'email' => $request->email,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $subAdmin->update($data);

        return response()->json([
            'success' => true,
            'message' => 'تم تعديل بيانات الموظف بنجاح',
            'data'    => $subAdmin,
        ]);
    }

    /**
     * Remove the specified sub-admin.
     */
    public function destroy($id)
    {
        $subAdmin = User::where('role', 'sub_admin')->findOrFail($id);
        $subAdmin->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الموظف بنجاح',
        ]);
    }
}
