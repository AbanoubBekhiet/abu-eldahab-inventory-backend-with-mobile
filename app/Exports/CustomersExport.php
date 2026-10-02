<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class CustomersExport implements FromView, ShouldAutoSize
{
    protected $regionIds;

    public function __construct($regionIds)
    {
        $this->regionIds = $regionIds;
    }

    public function view(): View
    {
        $query = User::where('role', 'customer')
            ->with(['profile.region'])
            ->orderBy('name');
        
        if (!empty($this->regionIds) && $this->regionIds[0] !== 'all') {
            $query->whereHas('profile', function($q) {
                $q->whereIn('region_id', $this->regionIds);
            });
        }

        $customers = $query->get()->map(function($user) {
            $aggregates = \App\Models\CustomerTransaction::where('user_id', $user->id)
                ->selectRaw('
                    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_debts,
                    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_payments
                ')->first();
            $balance = round(floatval($aggregates->total_debts ?? 0) - floatval($aggregates->total_payments ?? 0), 2);
            $user->balance = $balance;
            return $user;
        });

        return view('print.customers-excel', [
            'customers' => $customers
        ]);
    }
}
