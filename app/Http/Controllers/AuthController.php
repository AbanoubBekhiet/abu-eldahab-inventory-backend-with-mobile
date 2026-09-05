<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function loginPage(){
        if (!User::where('role', 'admin')->exists()) {
            return redirect()->route('auth.register');
        }
        return Inertia::render('auth/login');
    }
    
    public function login(Request $request){
        $request->validate([
            'email'    => 'required|string',
            'password' => 'required|string',
        ]);
        
        $user = User::where('email', $request->email)->first();
        if (!$user && strpos($request->email, '@') === false) {
            $user = User::where('name', $request->email)->first();
        }

        if($user && Hash::check($request->password, $user->password)){
            Auth::login($user);
            return redirect()->route('dashboard')->with('success', 'تم تسجيل الدخول بنجاح');
        }
        return redirect()->route('login')->with('error', 'بيانات الدخول غير صحيحة');
    }

    public function logout(Request $request){
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login')->with('success', 'تم تسجيل الخروج بنجاح');
    }

    public function registerPage()
    {
        if (User::where('role', 'admin')->exists()) {
            return redirect()->route('login');
        }
        return Inertia::render('auth/register');
    }

    public function register(Request $request)
    {
        if (User::where('role', 'admin')->exists()) {
            return redirect()->route('login');
        }

        $request->validate([
            'store_name'   => 'required|string|max:100',
            'phone'        => 'required|string|max:20',
            'phone2'       => 'nullable|string|max:20',
            'receipt_logo' => 'nullable|image|mimes:png,jpg,jpeg,gif,svg|max:2048',
            'name'         => 'required|string|max:100',
            'email'        => 'required|string|email|max:150|unique:users',
            'password'     => 'required|string|min:6|confirmed',
        ]);

        // Create Admin User
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'admin',
        ]);

        // Store business info in settings table
        Setting::set('receipt_name', $request->store_name);
        Setting::set('phone1', $request->phone);
        if ($request->phone2) {
            Setting::set('phone2', $request->phone2);
        }

        if ($request->hasFile('receipt_logo')) {
            $path = $request->file('receipt_logo')->store('settings', 'public');
            Setting::set('receipt_logo', $path);
        }

        // Authenticate the user
        Auth::login($user);

        return redirect()->route('dashboard')->with('success', 'تم تهيئة النظام وتسجيل حساب المسؤول بنجاح!');
    }
    
    public function resetPasswordPage(){
        return Inertia::render('auth/reset_password');
    }

    public function resetPassword(Request $request){
        $request->validate([
            'email' => 'required|email',
        ]);
        $user = User::where('email', $request->email)->first();
        if(!$user){
            return redirect()->route('reset-password')->with('error', 'البريد الالكتروني غير موجود');
        }
        
        $token = strval(rand(100000, 999999));
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => $token,
                'created_at' => now(),
            ]
        );
        
        // Send OTP email
        \Illuminate\Support\Facades\Mail::send([], [], function ($message) use ($user, $token) {
            $message->to($user->email)
                    ->subject('رمز التحقق لإعادة تعيين كلمة المرور')
                    ->html("
                        <div style='direction: rtl; text-align: right; font-family: sans-serif; padding: 20px; border: 1px solid #EAE8E2; border-radius: 12px; max-width: 500px; margin: auto;'>
                            <h2 style='color: #2E5A44;'>إعادة تعيين كلمة المرور</h2>
                            <p style='color: #5C5950;'>لقد طلبت رمز تحقق لإعادة تعيين كلمة المرور الخاصة بك. يرجى استخدام الرمز التالي لإتمام العملية:</p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <span style='background-color: #FAF9F6; border: 2px dashed #ADCBBB; color: #2E5A44; font-size: 24px; font-weight: bold; padding: 10px 25px; letter-spacing: 5px; border-radius: 8px;'>{$token}</span>
                            </div>
                            <p style='color: #9A978F; font-size: 12px;'>إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد الإلكتروني بأمان.</p>
                        </div>
                    ");
        });
        
        return redirect()->route('verify-reset-code')->with('success', 'تم إرسال رمز التحقق إلى بريدك الالكتروني بنجاح.');
    }

    public function verifyResetCodePage(Request $request){
        return Inertia::render('auth/verify_reset_code');
    }
    
    public function verifyResetCode(Request $request){
        $request->validate([
            'code' => 'required',
            'password' => 'required|string|min:6|confirmed',
        ]);
        
        $reset = DB::table('password_reset_tokens')->where('token', $request->code)->first();
        if(!$reset){
            return redirect()->route('verify-reset-code')->with('error', 'رمز التحقق غير صحيح');
        }
        
        $user = User::where('email', $reset->email)->first();
        if($user){
            $user->password = Hash::make($request->password);
            $user->save();
        }
        
        DB::table('password_reset_tokens')->where('token', $request->code)->delete();

        return redirect()->route('login')->with('success', 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.');
    }

    // public function checkRegistered()
    // {
    //     return response()->json([
    //         'registered' => User::where('role', 'admin')->exists(),
    //     ]);
    // }

    public function me(Request $request)
    {
        $user = $request->user()->load('profile.region');

        // Calculate balance (debts vs payments) from customer transactions
        $aggregates = \App\Models\CustomerTransaction::where('user_id', $user->id)
            ->selectRaw('
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_debts,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_payments
            ')->first();

        $totalDebts    = floatval($aggregates->total_debts ?? 0);
        $totalPayments = floatval($aggregates->total_payments ?? 0);
        $balance       = round($totalDebts - $totalPayments, 2);

        // Fetch last 20 orders for this user
        $orders = \App\Models\Order::with('products')
            ->where('user_id', $user->id)
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($order) {
                return [
                    'id'           => '#ORD-' . str_pad($order->id, 4, '0', STR_PAD_LEFT),
                    'raw_id'       => $order->id,
                    'total'        => floatval($order->total_price),
                    'net_total'    => floatval($order->total_price) - floatval($order->discount ?? 0),
                    'status'       => $order->status,
                    'payment_type' => $order->payment_type ?? 'كاش',
                    'notes'        => $order->notes ?? '',
                    'date'         => $order->created_at ? $order->created_at->locale('ar')->translatedFormat('j F Y g:i a') : '—',
                    'items_count'  => $order->products->count(),
                    'items'        => $order->products->map(fn($p) => [
                        'name'     => $p->name,
                        'quantity' => $p->pivot->quantity,
                        'price'    => floatval($p->pivot->price),
                    ])->values()->toArray(),
                ];
            })->values();

        return response()->json([
            'user' => array_merge($user->toArray(), [
                'phone'     => $user->profile?->phone_number,
                'address'   => $user->profile?->address,
                'shop_name' => $user->profile?->shop_name,
                'latitude'  => $user->profile?->latitude,
                'longitude' => $user->profile?->longitude,
                'region'    => $user->profile?->region,
            ]),
            'balance'        => $balance,
            'total_debts'    => round($totalDebts, 2),
            'total_payments' => round($totalPayments, 2),
            'orders'         => $orders,
        ]);
    }

    public function apiLogin(Request $request)
    {
        $request->validate([
            'email'     => 'required|string',
            'password'  => 'required|string',
            'fcm_token' => 'nullable|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user && strpos($request->email, '@') === false) {
            $user = User::where('name', $request->email)
                ->orWhereHas('profile', function($q) use ($request) {
                    $q->where('phone_number', $request->email)
                      ->orWhere('phone_number2', $request->email);
                })->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات الدخول غير صحيحة',
            ], 401);
        }

        if ($request->boolean('for_web') && !in_array($user->role, ['admin', 'sub_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'عذراً، نظام الويب مخصص للمشرفين والموظفين فقط. يمكن للعملاء تسجيل الدخول عبر تطبيق الموبايل.',
            ], 403);
        }

        if ($request->has('fcm_token')) {
            $user->fcm_token = $request->fcm_token;
            $user->save();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $redirectPath = match ($user->role) {
            'admin'     => '/',
            'sub_admin' => '/pos',
            default     => '/',
        };

        return response()->json([
            'success'       => true,
            'token'         => $token,
            'access_token'  => $token,
            'token_type'    => 'Bearer',
            'user'          => $user,
            'redirect_path' => $redirectPath,
            'message'       => 'تم تسجيل الدخول بنجاح',
        ]);
    }

    public function customerRegister(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:100',
            'phone'        => 'nullable|string|max:30',
            'phone_number' => 'nullable|string|max:30',
            'email'        => 'nullable|string|email|max:150|unique:users',
            'password'     => 'required|string|min:6',
            'address'      => 'nullable|string|max:500',
            'shop_name'    => 'nullable|string|max:150',
            'latitude'     => 'nullable|numeric',
            'longitude'    => 'nullable|numeric',
            'fcm_token'    => 'nullable|string',
            'region_id'    => 'required|exists:regions,id',
        ]);

        $user = User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'role'      => 'customer',
            'fcm_token' => $request->fcm_token,
        ]);

        $phoneNumber = $request->phone ?: $request->phone_number;

        \App\Models\Profile::create([
            'user_id'      => $user->id,
            'phone_number' => $phoneNumber,
            'address'      => $request->address,
            'shop_name'    => $request->shop_name ?: ($request->name . ' (عميل)'),
            'latitude'     => $request->latitude,
            'longitude'    => $request->longitude,
            'region_id'    => $request->region_id,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success'       => true,
            'token'         => $token,
            'access_token'  => $token,
            'token_type'    => 'Bearer',
            'user'          => $user->load('profile'),
            'redirect_path' => '/',
            'message'       => 'تم إنشاء الحساب بنجاح!',
        ]);
    }

    public function apiUpdateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'         => 'required|string|max:100',
            'phone'        => 'nullable|string|max:30',
            'phone_number' => 'nullable|string|max:30',
            'email'        => 'nullable|string|email|max:150|unique:users,email,' . $user->id,
            'address'      => 'nullable|string|max:500',
            'shop_name'    => 'nullable|string|max:150',
            'latitude'     => 'nullable|numeric',
            'longitude'    => 'nullable|numeric',
            'region_id'    => 'nullable|exists:regions,id',
        ]);

        $user->update([
            'name'  => $request->name,
            'email' => $request->email,
        ]);

        $phoneNumber = $request->phone ?: $request->phone_number;

        if ($user->profile) {
            $user->profile->update([
                'phone_number' => $phoneNumber,
                'address'      => $request->address,
                'shop_name'    => $request->shop_name ?: ($request->name . ' (عميل)'),
                'latitude'     => $request->latitude,
                'longitude'    => $request->longitude,
                'region_id'    => $request->region_id ?: $user->profile->region_id,
            ]);
        } else {
            \App\Models\Profile::create([
                'user_id'      => $user->id,
                'phone_number' => $phoneNumber,
                'address'      => $request->address,
                'shop_name'    => $request->shop_name ?: ($request->name . ' (عميل)'),
                'latitude'     => $request->latitude,
                'longitude'    => $request->longitude,
                'region_id'    => $request->region_id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الملف الشخصي بنجاح',
            'user'    => $user->fresh('profile.region'),
        ]);
    }

    public function apiLogout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->fcm_token = null;
            $user->save();
            $user->currentAccessToken()?->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الخروج بنجاح',
        ]);
    }

    public function updateFcmToken(Request $request)
    {
        $request->validate([
            'fcm_token' => 'nullable|string',
        ]);

        $user = $request->user();
        if ($user) {
            $user->fcm_token = $request->fcm_token;
            $user->save();
        }

        return response()->json([
            'success'   => true,
            'message'   => 'تم تحديث رمز FCM بنجاح',
            'fcm_token' => $user?->fcm_token,
        ]);
    }

    public function apiRegister(Request $request)
    {
        if (User::where('role', 'admin')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'تم تهيئة المسؤول بالفعل.',
            ], 422);
        }

        $request->validate([
            'store_name'   => 'required|string|max:100',
            'phone'        => 'required|string|max:20',
            'phone2'       => 'nullable|string|max:20',
            'receipt_logo' => 'nullable|image|mimes:png,jpg,jpeg,gif,svg|max:2048',
            'name'         => 'required|string|max:100',
            'email'        => 'required|string|email|max:150|unique:users',
            'password'     => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'admin',
        ]);

        Setting::set('receipt_name', $request->store_name);
        Setting::set('phone1', $request->phone);
        if ($request->phone2) {
            Setting::set('phone2', $request->phone2);
        }

        if ($request->hasFile('receipt_logo')) {
            $path = $request->file('receipt_logo')->store('settings', 'public');
            Setting::set('receipt_logo', $path);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success'       => true,
            'token'         => $token,
            'access_token'  => $token,
            'token_type'    => 'Bearer',
            'user'          => $user,
            'redirect_path' => '/',
            'message'       => 'تم تهيئة النظام وتسجيل حساب المسؤول بنجاح!',
        ]);
    }

    public function apiResetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'البريد الالكتروني غير موجود',
            ], 404);
        }

        $token = strval(rand(100000, 999999));
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token'      => $token,
                'created_at' => now(),
            ]
        );

        try {
            \Illuminate\Support\Facades\Mail::send([], [], function ($message) use ($user, $token) {
                $message->to($user->email)
                        ->subject('رمز التحقق لإعادة تعيين كلمة المرور')
                        ->html("
                            <div style='direction: rtl; text-align: right; font-family: sans-serif; padding: 20px; border: 1px solid #EAE8E2; border-radius: 12px; max-width: 500px; margin: auto;'>
                                <h2 style='color: #2E5A44;'>إعادة تعيين كلمة المرور</h2>
                                <p style='color: #5C5950;'>لقد طلبت رمز تحقق لإعادة تعيين كلمة المرور الخاصة بك:</p>
                                <div style='text-align: center; margin: 30px 0;'>
                                    <span style='background-color: #FAF9F6; border: 2px dashed #ADCBBB; color: #2E5A44; font-size: 24px; font-weight: bold; padding: 10px 25px; letter-spacing: 5px; border-radius: 8px;'>{$token}</span>
                                </div>
                            </div>
                        ");
            });
        } catch (\Exception $e) {
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إرسال رمز التحقق إلى بريدك الالكتروني بنجاح.',
        ]);
    }

    public function apiVerifyResetCode(Request $request)
    {
        $request->validate([
            'code'     => 'required',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $reset = DB::table('password_reset_tokens')->where('token', $request->code)->first();
        if (!$reset) {
            return response()->json([
                'success' => false,
                'message' => 'رمز التحقق غير صحيح',
            ], 422);
        }

        $user = User::where('email', $reset->email)->first();
        if ($user) {
            $user->password = Hash::make($request->password);
            $user->save();
        }

        DB::table('password_reset_tokens')->where('token', $request->code)->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.',
        ]);
    }
}
