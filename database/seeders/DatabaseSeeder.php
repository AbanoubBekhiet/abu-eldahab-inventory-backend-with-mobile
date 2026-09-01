<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Database\Seeders\CategorySeeder;
use Database\Seeders\ProductSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Main System Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@pos.local'],
            [
                'name'     => 'مدير النظام الرئيسي',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ]
        );

        if (!$admin->profile) {
            Profile::create([
                'user_id'      => $admin->id,
                'phone_number' => '01000000000',
                'shop_name'    => 'أبو الدهب - الإدارة الرئيسية',
                'address'      => 'القاهرة، مصر',
            ]);
        }

        // 2. Seed Secondary Admin / Branch Admin
        $subAdmin = User::firstOrCreate(
            ['email' => 'admin2@pos.local'],
            [
                'name'     => 'مدير فرع أبو الدهب',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ]
        );

        if (!$subAdmin->profile) {
            Profile::create([
                'user_id'      => $subAdmin->id,
                'phone_number' => '01100000000',
                'shop_name'    => 'أبو الدهب - فرع الجملة',
                'address'      => 'الجيزة، مصر',
            ]);
        }

        // 3. Call Categories & Products Seeders
        $this->call(CategorySeeder::class);
        $this->call(ProductSeeder::class);
    }
}
