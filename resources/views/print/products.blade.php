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
            margin-bottom: 25px;
            border-bottom: 2px solid #2E5A44;
            padding-bottom: 15px;
        }
        .header h1 {
            margin: 0;
            color: #2E5A44;
            font-size: 26px;
        }
        .header p {
            margin: 6px 0 0;
            color: #666;
            font-size: 14px;
        }
        .filter-badges {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-info {
            background-color: #EBF5EF;
            color: #2E5A44;
            border: 1px solid #D7EBE1;
        }
        .badge-success {
            background-color: #E8F5E9;
            color: #2E7D32;
        }
        .badge-danger {
            background-color: #FFEBEE;
            color: #C62828;
        }
        .badge-gray {
            background-color: #F5F5F5;
            color: #616161;
        }

        /* Category Section Header */
        .category-section {
            margin-bottom: 28px;
            page-break-inside: auto;
        }
        .category-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: #EEF4F1;
            border-right: 6px solid #2E5A44;
            padding: 10px 16px;
            margin-bottom: 10px;
            border-radius: 6px;
        }
        .category-title {
            font-size: 16px;
            font-weight: bold;
            color: #1A2D23;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .category-count {
            font-size: 13px;
            font-weight: bold;
            color: #2E5A44;
            background-color: #fff;
            padding: 3px 12px;
            border-radius: 12px;
            border: 1px solid #D7EBE1;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 10px;
        }
        table, th, td {
            border: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            color: #2E5A44;
            padding: 10px 8px;
            text-align: right;
            font-weight: bold;
        }
        td {
            padding: 8px;
            vertical-align: middle;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        
        @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            @page { margin: 1cm; size: A4; }
            table { font-size: 12px; }
            th { 
                background-color: #f0f0f0 !important; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
            }
            .category-header {
                background-color: #EEF4F1 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            tr { page-break-inside: avoid; }
            thead { display: table-header-group; }
        }

        .print-btn {
            display: block;
            width: fit-content;
            margin: 0 auto 20px;
            padding: 10px 24px;
            background-color: #2E5A44;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.15);
            transition: all 0.2s;
        }
        .print-btn:hover { background-color: #234735; }
    </style>
</head>
<body>

    <button onclick="window.print()" class="print-btn no-print">🖨️ طباعة التقرير / حفظ كـ PDF</button>

    <div class="header">
        <h1>تقرير المنتجات - مؤسسة أبو الدهب</h1>
        <p>تاريخ ووقت الطباعة: {{ date('Y-m-d H:i') }}</p>
        
        <div class="filter-badges">
            <span class="badge badge-info">إجمالي الأصناف: {{ count($products) }} صنف</span>
            <span class="badge badge-info">عدد الأقسام: {{ count($groupedProducts) }} قسم</span>
            @if(isset($stockStatus))
                @if($stockStatus === 'in_stock')
                    <span class="badge badge-success">المخزون: متوفر فقط</span>
                @elseif($stockStatus === 'out_of_stock')
                    <span class="badge badge-danger">المخزون: النواقص (نفذت الكمية) فقط</span>
                @else
                    <span class="badge badge-info">المخزون: كل المنتجات</span>
                @endif
            @endif

            @if(isset($appStatus))
                @if($appStatus === 'available')
                    <span class="badge badge-success">التطبيق: معروض في التطبيق</span>
                @elseif($appStatus === 'unavailable')
                    <span class="badge badge-gray">التطبيق: غير معروض بالتطبيق</span>
                @endif
            @endif
        </div>
    </div>

    @if(count($products) === 0)
        <div style="text-align: center; padding: 40px; color: #888; font-size: 15px; border: 1px dashed #ddd; border-radius: 8px;">
            لا توجد منتجات مطابقة للخيارات والفلاتر المحددة
        </div>
    @else
        @foreach($groupedProducts as $categoryName => $catProducts)
            <div class="category-section">
                <!-- Category Section Header on the right -->
                <div class="category-header">
                    <div class="category-title">
                        <span>📁 قسم: {{ $categoryName }}</span>
                    </div>
                    <div class="category-count">
                        {{ count($catProducts) }} صنف
                    </div>
                </div>

                <!-- Products Table for this Category -->
                <table>
                    <thead>
                        <tr>
                            @if(!empty($columns['id']))
                                <th class="text-center" style="width: 8%">الكود</th>
                            @endif
                            @if(!empty($columns['name']))
                                <th>اسم المنتج</th>
                            @endif
                            @if(!empty($columns['cost_price']))
                                <th class="text-center" style="width: 12%">سعر التكلفة</th>
                            @endif
                            @if(!empty($columns['price']))
                                <th class="text-center" style="width: 12%">سعر البيع</th>
                            @endif
                            @if(!empty($columns['stock']))
                                <th class="text-center" style="width: 11%">الكمية</th>
                            @endif
                            @if(!empty($columns['unit']))
                                <th class="text-center" style="width: 10%">الوحدة</th>
                            @endif
                            @if(!empty($columns['stock_status']))
                                <th class="text-center" style="width: 13%">حالة المخزون</th>
                            @endif
                            @if(!empty($columns['app_status']))
                                <th class="text-center" style="width: 14%">الظهور بالتطبيق</th>
                            @endif
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($catProducts as $product)
                        <tr>
                            @if(!empty($columns['id']))
                                <td class="text-center">{{ $product->id }}</td>
                            @endif
                            @if(!empty($columns['name']))
                                <td class="text-right"><strong>{{ $product->name }}</strong></td>
                            @endif
                            @if(!empty($columns['cost_price']))
                                <td class="text-center">{{ number_format($product->cost_price, 2) }} ج.م</td>
                            @endif
                            @if(!empty($columns['price']))
                                <td class="text-center">{{ number_format($product->price, 2) }} ج.م</td>
                            @endif
                            @if(!empty($columns['stock']))
                                <td class="text-center font-bold">{{ $product->stock }}</td>
                            @endif
                            @if(!empty($columns['unit']))
                                <td class="text-center">{{ $product->unit ?? 'قطعة' }}</td>
                            @endif
                            @if(!empty($columns['stock_status']))
                                <td class="text-center">
                                    @if($product->stock > 0)
                                        <span class="badge badge-success">متوفر ({{ $product->stock }})</span>
                                    @else
                                        <span class="badge badge-danger">نفذت الكمية</span>
                                    @endif
                                </td>
                            @endif
                            @if(!empty($columns['app_status']))
                                <td class="text-center">
                                    @if($product->is_available_on_app)
                                        <span class="badge badge-info">معروض بالتطبيق</span>
                                    @else
                                        <span class="badge badge-gray">غير معروض</span>
                                    @endif
                                </td>
                            @endif
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endforeach
    @endif

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
