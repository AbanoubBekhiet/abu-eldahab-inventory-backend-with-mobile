<table>
    <thead>
    <tr>
        @if(!empty($columns['id']))
            <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">كود المنتج</th>
        @endif
        @if(!empty($columns['name']))
            <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">اسم المنتج</th>
        @endif
        @if(!empty($columns['category']))
            <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">التصنيف</th>
        @endif
        @if(!empty($columns['cost_price']))
            <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">سعر التكلفة</th>
        @endif
        @if(!empty($columns['price']))
            <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">سعر البيع</th>
        @endif
        @if(!empty($columns['stock']))
            <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">الكمية المتوفرة</th>
        @endif
        @if(!empty($columns['unit']))
            <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">الوحدة</th>
        @endif
        @if(!empty($columns['stock_status']))
            <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">حالة المخزون</th>
        @endif
        @if(!empty($columns['app_status']))
            <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">الظهور بالتطبيق</th>
        @endif
    </tr>
    </thead>
    <tbody>
    @foreach($products as $product)
        <tr>
            @if(!empty($columns['id']))
                <td style="text-align: center;">{{ $product->id }}</td>
            @endif
            @if(!empty($columns['name']))
                <td style="text-align: right;">{{ $product->name }}</td>
            @endif
            @if(!empty($columns['category']))
                <td style="text-align: center;">{{ $product->category ? $product->category->name : 'غير محدد' }}</td>
            @endif
            @if(!empty($columns['cost_price']))
                <td style="text-align: center;">{{ number_format($product->cost_price, 2) }}</td>
            @endif
            @if(!empty($columns['price']))
                <td style="text-align: center;">{{ number_format($product->price, 2) }}</td>
            @endif
            @if(!empty($columns['stock']))
                <td style="text-align: center;">{{ $product->stock }}</td>
            @endif
            @if(!empty($columns['unit']))
                <td style="text-align: center;">{{ $product->unit ?? 'قطعة' }}</td>
            @endif
            @if(!empty($columns['stock_status']))
                <td style="text-align: center;">{{ $product->stock > 0 ? 'متوفر' : 'نفذت الكمية' }}</td>
            @endif
            @if(!empty($columns['app_status']))
                <td style="text-align: center;">{{ $product->is_available_on_app ? 'معروض بالتطبيق' : 'غير معروض' }}</td>
            @endif
        </tr>
    @endforeach
    </tbody>
</table>
