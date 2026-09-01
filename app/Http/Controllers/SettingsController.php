<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $receiptName    = Setting::get('receipt_name', 'أبو الدهب');
        $receiptLogoVal = Setting::get('receipt_logo');
        $receiptLogoUrl = ($receiptLogoVal && Storage::disk('public')->exists($receiptLogoVal)) ? route('settings.logo') . '?v=' . md5($receiptLogoVal) : null;
        $receiptSize    = Setting::get('receipt_size', 'A4');
        $phone1         = Setting::get('phone1', '');
        $phone2         = Setting::get('phone2', '');

        return Inertia::render('settings/Index', [
            'settings' => [
                'receipt_name'     => $receiptName,
                'receipt_logo_url' => $receiptLogoUrl,
                'receipt_size'     => $receiptSize,
                'phone1'           => $phone1,
                'phone2'           => $phone2,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'receipt_name' => 'required|string|max:255',
            'receipt_logo' => 'nullable|file|max:5120',
            'receipt_size' => 'nullable|string',
            'phone1'       => 'nullable|string|max:30',
            'phone2'       => 'nullable|string|max:30',
        ]);

        Setting::set('receipt_name', $request->receipt_name);
        Setting::set('receipt_size', $request->receipt_size ?? 'A4');
        Setting::set('phone1', $request->phone1 ?? '');
        Setting::set('phone2', $request->phone2 ?? '');

        if ($request->hasFile('receipt_logo')) {
            // Delete old logo
            $oldLogo = Setting::get('receipt_logo');
            if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
                Storage::disk('public')->delete($oldLogo);
            }
            $path = $request->file('receipt_logo')->store('settings', 'public');
            Setting::set('receipt_logo', $path);
        } elseif ($request->input('remove_logo') == '1') {
            // Explicitly remove logo
            $oldLogo = Setting::get('receipt_logo');
            if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
                Storage::disk('public')->delete($oldLogo);
            }
            Setting::set('receipt_logo', '');
        }

        session()->flash('success', 'تم حفظ الإعدادات بنجاح!');
        return redirect()->route('settings');
    }

    public function apiIndex()
    {
        $receiptName    = Setting::get('receipt_name', 'أبو الدهب');
        $receiptLogoVal = Setting::get('receipt_logo');
        $receiptLogoUrl = ($receiptLogoVal && Storage::disk('public')->exists($receiptLogoVal)) ? route('api.settings.logo') . '?v=' . md5($receiptLogoVal) : null;
        $receiptSize    = Setting::get('receipt_size', 'A4');
        $phone1         = Setting::get('phone1', '');
        $phone2         = Setting::get('phone2', '');

        return response()->json([
            'settings' => [
                'receipt_name'     => $receiptName,
                'receipt_logo_url' => $receiptLogoUrl,
                'receipt_size'     => $receiptSize,
                'phone1'           => $phone1,
                'phone2'           => $phone2,
            ],
        ]);
    }

    public function apiUpdate(Request $request)
    {
        $request->validate([
            'receipt_name' => 'required|string|max:255',
            'receipt_logo' => 'nullable|file|max:5120',
            'receipt_size' => 'nullable|string',
            'phone1'       => 'nullable|string|max:30',
            'phone2'       => 'nullable|string|max:30',
        ]);

        Setting::set('receipt_name', $request->receipt_name);
        Setting::set('receipt_size', $request->receipt_size ?? 'A4');
        Setting::set('phone1', $request->phone1 ?? '');
        Setting::set('phone2', $request->phone2 ?? '');

        if ($request->hasFile('receipt_logo')) {
            $oldLogo = Setting::get('receipt_logo');
            if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
                Storage::disk('public')->delete($oldLogo);
            }
            $path = $request->file('receipt_logo')->store('settings', 'public');
            Setting::set('receipt_logo', $path);
        } elseif ($request->input('remove_logo') == '1') {
            $oldLogo = Setting::get('receipt_logo');
            if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
                Storage::disk('public')->delete($oldLogo);
            }
            Setting::set('receipt_logo', '');
        }

        $receiptLogoVal = Setting::get('receipt_logo');
        $receiptLogoUrl = ($receiptLogoVal && Storage::disk('public')->exists($receiptLogoVal)) ? route('api.settings.logo') . '?v=' . md5($receiptLogoVal) : null;

        return response()->json([
            'success'  => true,
            'message'  => 'تم حفظ الإعدادات بنجاح!',
            'settings' => [
                'receipt_name'     => Setting::get('receipt_name', 'أبو الدهب'),
                'receipt_logo_url' => $receiptLogoUrl,
                'receipt_size'     => Setting::get('receipt_size', 'A4'),
                'phone1'           => Setting::get('phone1', ''),
                'phone2'           => Setting::get('phone2', ''),
            ],
        ]);
    }

    public function getLogo()
    {
        $logoPath = Setting::get('receipt_logo');
        if (!$logoPath || !Storage::disk('public')->exists($logoPath)) {
            abort(404);
        }

        $file = Storage::disk('public')->get($logoPath);
        $mime = Storage::disk('public')->mimeType($logoPath);

        return response($file, 200)
            ->header('Content-Type', $mime)
            ->header('Cache-Control', 'public, max-age=86400');
    }
}
