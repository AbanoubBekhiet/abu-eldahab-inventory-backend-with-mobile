<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير المنتجات</title>
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
        <h1>تقرير المنتجات</h1>
        <p>تاريخ الطباعة: {{ date('Y-m-d H:i') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th class="text-center" style="width: 8%">الكود</th>
                <th>اسم المنتج</th>
                <th class="text-center" style="width: 15%">التصنيف</th>
                <th class="text-center" style="width: 12%">سعر التكلفة</th>
                <th class="text-center" style="width: 12%">سعر البيع</th>
                <th class="text-center" style="width: 12%">المتوفر</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $product)
            <tr>
                <td class="text-center">{{ $product->id }}</td>
                <td>{{ $product->name }}</td>
                <td class="text-center">{{ $product->category ? $product->category->name : 'غير محدد' }}</td>
                <td class="text-center">{{ number_format($product->cost_price, 2) }} ج.م</td>
                <td class="text-center">{{ number_format($product->price, 2) }} ج.م</td>
                <td class="text-center">{{ $product->stock }}</td>
            </tr>
            @endforeach
            
            @if(count($products) === 0)
            <tr>
                <td colspan="6" class="text-center" style="padding: 20px; color: #888;">لا توجد منتجات مطابقة للبحث</td>
            </tr>
            @endif
        </tbody>
    </table>

    <script>
        // Auto-open print dialog on load
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
