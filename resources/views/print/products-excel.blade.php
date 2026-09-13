<table>
    <thead>
    <tr>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">كود المنتج</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">اسم المنتج</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">التصنيف</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">سعر التكلفة</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">سعر البيع</th>
        <th style="font-weight: bold; background-color: #f3f4f6; text-align: center;">الكمية المتوفرة</th>
    </tr>
    </thead>
    <tbody>
    @foreach($products as $product)
        <tr>
            <td style="text-align: center;">{{ $product->id }}</td>
            <td style="text-align: right;">{{ $product->name }}</td>
            <td style="text-align: center;">{{ $product->category ? $product->category->name : 'غير محدد' }}</td>
            <td style="text-align: center;">{{ number_format($product->cost_price, 2) }}</td>
            <td style="text-align: center;">{{ number_format($product->price, 2) }}</td>
            <td style="text-align: center;">{{ $product->stock }}</td>
        </tr>
    @endforeach
    </tbody>
</table>
