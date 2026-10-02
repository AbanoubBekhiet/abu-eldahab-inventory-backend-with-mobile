<table>
    <thead>
    <tr>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">كود العميل</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">اسم العميل</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">اسم المحل</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">رقم الهاتف</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">العنوان</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">المنطقة</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">تاريخ الانضمام</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">الرصيد (عليه / له)</th>
    </tr>
    </thead>
    <tbody>
    @foreach($customers as $customer)
        <tr>
            <td style="text-align: center;">{{ $customer->id }}</td>
            <td style="text-align: right;">{{ $customer->name }}</td>
            <td style="text-align: right;">{{ $customer->profile ? $customer->profile->shop_name : '—' }}</td>
            <td style="text-align: center;">{{ $customer->profile ? $customer->profile->phone_number : '—' }}</td>
            <td style="text-align: right;">{{ $customer->profile ? $customer->profile->address : '—' }}</td>
            <td style="text-align: center;">{{ ($customer->profile && $customer->profile->region) ? $customer->profile->region->name : '—' }}</td>
            <td style="text-align: center;">{{ $customer->created_at ? $customer->created_at->format('Y-m-d') : '—' }}</td>
            <td style="text-align: center;">{{ number_format($customer->balance, 2) }}</td>
        </tr>
    @endforeach
    </tbody>
</table>
