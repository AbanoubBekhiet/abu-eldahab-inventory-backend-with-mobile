<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير العملاء</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #fff;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2E5A44;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            color: #2E5A44;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0;
            color: #666;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        table, th, td {
            border: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            color: #2E5A44;
            padding: 12px 8px;
            text-align: right;
            font-weight: bold;
        }
        td {
            padding: 10px 8px;
            vertical-align: middle;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
            @page { margin: 1cm; }
        }
        .print-btn {
            display: block;
            width: fit-content;
            margin: 0 auto 20px;
            padding: 10px 20px;
            background-color: #2E5A44;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
        }
        .print-btn:hover { background-color: #234735; }
    </style>
</head>
<body>

    <button onclick="window.print()" class="print-btn no-print">🖨️ طباعة التقرير / تصدير كـ PDF</button>

    <div class="header">
        <h1>تقرير العملاء</h1>
        <p>تاريخ الطباعة: {{ date('Y-m-d H:i') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th class="text-center" style="width: 5%">الكود</th>
                <th style="width: 20%">اسم العميل</th>
                <th style="width: 15%">المحل</th>
                <th class="text-center" style="width: 12%">الهاتف</th>
                <th class="text-center" style="width: 10%">المنطقة</th>
                <th class="text-center" style="width: 18%">الرصيد</th>
            </tr>
        </thead>
        <tbody>
            @foreach($customers as $customer)
            <tr>
                <td class="text-center">{{ $customer->id }}</td>
                <td>{{ $customer->name }}</td>
                <td>{{ $customer->profile ? $customer->profile->shop_name : '—' }}</td>
                <td class="text-center">{{ $customer->profile ? $customer->profile->phone_number : '—' }}</td>
                <td class="text-center">{{ ($customer->profile && $customer->profile->region) ? $customer->profile->region->name : '—' }}</td>
                <td class="text-center" dir="ltr">
                    @if($customer->balance > 0)
                        <span style="color: #C0392B;">{{ number_format($customer->balance, 2) }} ج.م (عليه)</span>
                    @elseif($customer->balance < 0)
                        <span style="color: #2E5A44;">{{ number_format(abs($customer->balance), 2) }} ج.م (له)</span>
                    @else
                        <span>0.00 ج.م</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if($customers->isEmpty())
        <p style="text-align: center; margin-top: 30px; color: #666;">لا توجد بيانات للعملاء في هذه المناطق.</p>
    @endif

</body>
</html>
