<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            // ==========================================
            // CATEGORY 1: منتجات البان (Dairy Products - 34 Items)
            // ==========================================
            ['name' => 'لبن جهينة كامل الدسم', 'cost_price' => 38.00, 'price' => 45.00, 'stock' => 120, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'لبن جهينة خالي الدسم', 'cost_price' => 38.00, 'price' => 45.00, 'stock' => 80, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'لبن جهينة نصف دسم', 'cost_price' => 38.00, 'price' => 45.00, 'stock' => 95, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'زبادي جهينة طبيعي', 'cost_price' => 7.00, 'price' => 9.00, 'stock' => 300, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'زبادي جهينة لايت', 'cost_price' => 7.50, 'price' => 9.50, 'stock' => 150, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'زبادي جهينة بالخلاط فراولة', 'cost_price' => 12.00, 'price' => 15.00, 'stock' => 110, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'زبادي جهينة بالخلاط خوخ', 'cost_price' => 12.00, 'price' => 15.00, 'stock' => 100, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'لبن رايب جهينة طبيعي الكبير', 'cost_price' => 31.00, 'price' => 38.00, 'stock' => 85, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'لبن لمار كامل الدسم', 'cost_price' => 40.00, 'price' => 48.00, 'stock' => 140, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'لبن لمار خالي الدسم', 'cost_price' => 40.00, 'price' => 48.00, 'stock' => 70, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'كريمة طهى لمار', 'cost_price' => 105.00, 'price' => 125.00, 'stock' => 40, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'كريمة خفق لمار', 'cost_price' => 110.00, 'price' => 130.00, 'stock' => 35, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'جبنة دومتي فيتا علبة', 'cost_price' => 28.00, 'price' => 35.00, 'stock' => 200, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'جبنة دومتي اسطنبولي علبة', 'cost_price' => 29.00, 'price' => 36.00, 'stock' => 180, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'جبنة دومتي بلس زيتون', 'cost_price' => 31.00, 'price' => 38.00, 'stock' => 150, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'جبنة عبور لاند فيتا صغير', 'cost_price' => 14.50, 'price' => 18.00, 'stock' => 250, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'جبنة عبور لاند براميلي عبوة', 'cost_price' => 60.00, 'price' => 72.00, 'stock' => 90, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'جبنة عبور لاند شيدر علبة', 'cost_price' => 29.00, 'price' => 36.00, 'stock' => 110, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'جبنة كيري مربعات 6 قطع', 'cost_price' => 37.00, 'price' => 45.00, 'stock' => 130, 'unit' => 'علبة', 'number_of_items_in_unit' => 6, 'category_id' => 1],
            ['name' => 'جبنة كيري مربعات 12 قطعة', 'cost_price' => 70.00, 'price' => 85.00, 'stock' => 90, 'unit' => 'علبة', 'number_of_items_in_unit' => 12, 'category_id' => 1],
            ['name' => 'جبنة مثلثات لافاش كيري 8 قطع', 'cost_price' => 26.00, 'price' => 32.00, 'stock' => 220, 'unit' => 'علبة', 'number_of_items_in_unit' => 8, 'category_id' => 1],
            ['name' => 'جبنة مثلثات طعمة 8 قطع', 'cost_price' => 12.50, 'price' => 16.00, 'stock' => 300, 'unit' => 'علبة', 'number_of_items_in_unit' => 8, 'category_id' => 1],
            ['name' => 'جبنة مثلثات بريزيدن 8 قطع', 'cost_price' => 41.00, 'price' => 50.00, 'stock' => 140, 'unit' => 'علبة', 'number_of_items_in_unit' => 8, 'category_id' => 1],
            ['name' => 'جبنة شيدر أفانتي بالكمون', 'cost_price' => 53.00, 'price' => 65.00, 'stock' => 75, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'جبنة جودة أفانتي فيلمنك', 'cost_price' => 66.00, 'price' => 80.00, 'stock' => 60, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'جبنة رومي مصري قديم وسط', 'cost_price' => 78.00, 'price' => 95.00, 'stock' => 50, 'unit' => 'لفة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'جبنة موتزاريلا الأطباء مبشورة', 'cost_price' => 69.00, 'price' => 85.00, 'stock' => 80, 'unit' => 'لفة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'جبنة موتزاريلا دومتي كيس', 'cost_price' => 74.00, 'price' => 90.00, 'stock' => 95, 'unit' => 'لفة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'قشطة بوك مطبوخة علبة', 'cost_price' => 44.00, 'price' => 55.00, 'stock' => 110, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'زبدة فيرن خليط قالب', 'cost_price' => 92.00, 'price' => 110.00, 'stock' => 85, 'unit' => 'لفة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'زبدة كريستال قالب غير مملح', 'cost_price' => 96.00, 'price' => 115.00, 'stock' => 70, 'unit' => 'لفة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'سمنة روابي بطعم الزبدة الفلاحي', 'cost_price' => 122.00, 'price' => 145.00, 'stock' => 100, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'سمنة كريستال بيضاء علبة', 'cost_price' => 122.00, 'price' => 145.00, 'stock' => 120, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],
            ['name' => 'سمنة الهانم علبة كلاسيك', 'cost_price' => 112.00, 'price' => 135.00, 'stock' => 130, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 1],

            // ==========================================
            // CATEGORY 2: مستحضرات تجميل (Cosmetics - 33 Items)
            // ==========================================
            ['name' => 'كريم إيفا بالبنتينول مرطب', 'cost_price' => 26.00, 'price' => 35.00, 'stock' => 150, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'كريم إيفا بالجلسرين للبشرة الجافة', 'cost_price' => 29.00, 'price' => 38.00, 'stock' => 140, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'غسول إيفا سكين كليك لتفتيح البشرة', 'cost_price' => 65.00, 'price' => 85.00, 'stock' => 90, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'كريم إيفا كولاجين لشد التجاعيد', 'cost_price' => 125.00, 'price' => 160.00, 'stock' => 50, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'سيرم إيفا كولاجين للوجه والرقبة', 'cost_price' => 175.00, 'price' => 220.00, 'stock' => 45, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'شامبو بوبانا ببروتين الحرير', 'cost_price' => 58.00, 'price' => 75.00, 'stock' => 110, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'بلسم بوبانا بالارجان المغذي', 'cost_price' => 58.00, 'price' => 75.00, 'stock' => 95, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'ماسك بوبانا بالفحم لتقشير الوجه', 'cost_price' => 34.00, 'price' => 45.00, 'stock' => 160, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'سكراب بوبانا بالمشمش لإزالة الجلد الميت', 'cost_price' => 38.00, 'price' => 50.00, 'stock' => 130, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'سيرم جوفياليتي بحمض الهيالورونيك', 'cost_price' => 220.00, 'price' => 280.00, 'stock' => 30, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'كريم ترطيب الجسم جوفياليتي زبدة الشيا', 'cost_price' => 148.00, 'price' => 190.00, 'stock' => 55, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'مزيل عرق ألو إيفا ستيك حماية 48ساعة', 'cost_price' => 50.00, 'price' => 65.00, 'stock' => 140, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'سبراي معطر للجسم إيفا سكين كير كاندي', 'cost_price' => 68.00, 'price' => 90.00, 'stock' => 85, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'شامبو بندولين للأطفال كيدز طبيعي', 'cost_price' => 86.00, 'price' => 110.00, 'stock' => 120, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'كريم شعر بندولين كيدز كيرلي زبدة شيا', 'cost_price' => 105.00, 'price' => 135.00, 'stock' => 80, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'زيت شعر بندولين لمنع التساقط', 'cost_price' => 126.00, 'price' => 160.00, 'stock' => 65, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'شاور جيل سوفي بالورد والياسمين', 'cost_price' => 45.00, 'price' => 60.00, 'stock' => 150, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'صابون إيفا بالجلسرين شفاف قطعتين', 'cost_price' => 30.00, 'price' => 40.00, 'stock' => 200, 'unit' => 'علبة', 'number_of_items_in_unit' => 2, 'category_id' => 2],
            ['name' => 'كريم فاتيكا بالثوم والجرجير لتغذية الشعر', 'cost_price' => 34.00, 'price' => 45.00, 'stock' => 170, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'شامبو فاتيكا لإصلاح وتجديد الشعر التالف', 'cost_price' => 42.00, 'price' => 55.00, 'stock' => 140, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'زيت دابر أملا الذهبي لتطويل الشعر', 'cost_price' => 66.00, 'price' => 85.00, 'stock' => 105, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'كريم لونا لليدين والكعبين المرطب المركز', 'cost_price' => 22.00, 'price' => 30.00, 'stock' => 250, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'زبدة كاكاو لونا مرطب شفايف فراولة', 'cost_price' => 14.00, 'price' => 20.00, 'stock' => 400, 'unit' => 'شريط', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'غسول فم ميزواك مضاد للبكتيريا', 'cost_price' => 34.00, 'price' => 45.00, 'stock' => 110, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'معجون أسنان سيجنال مكافحة التسوق كلاسيك', 'cost_price' => 19.00, 'price' => 25.00, 'stock' => 230, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'زيت اللوز الحلو من ممتنان نقي 100%', 'cost_price' => 95.00, 'price' => 120.00, 'stock' => 50, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'ماء ورد نقي من امتنان لتنظيف البشرة', 'cost_price' => 34.00, 'price' => 45.00, 'stock' => 140, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'لوشن نيفيا سوفت مرطب للجسم متكامل', 'cost_price' => 74.00, 'price' => 95.00, 'stock' => 115, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'شاور جيل كامي معطر سحر الرومانسية', 'cost_price' => 53.00, 'price' => 70.00, 'stock' => 160, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'صابونة دوف ترطيب عميق الأصلي ربع كريم', 'cost_price' => 27.00, 'price' => 35.00, 'stock' => 240, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'سبراي فازلين لوشن سريع الامتصاص كاكاو', 'cost_price' => 140.00, 'price' => 180.00, 'stock' => 40, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'حمام كريم كليوباترا بالنخاع العسلي للشعر', 'cost_price' => 50.00, 'price' => 65.00, 'stock' => 85, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],
            ['name' => 'مخمرية العروسة لتعطير الجسم والشعر كلاسيك', 'cost_price' => 30.00, 'price' => 40.00, 'stock' => 190, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 2],

            // ==========================================
            // CATEGORY 3: مساحيق (Detergents/Powders - 33 Items)
            // ==========================================
            ['name' => 'مسحوق إيريال أتوماتيك لافندر كيس كبير', 'cost_price' => 410.00, 'price' => 499.00, 'stock' => 60, 'unit' => 'شكارة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'مسحوق إيريال عادي للغسيل اليدوي', 'cost_price' => 68.00, 'price' => 85.00, 'stock' => 140, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'مسحوق تايد أتوماتيك قوة البياض كيس', 'cost_price' => 310.00, 'price' => 380.00, 'stock' => 75, 'unit' => 'شكارة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'مسحوق برسيل أتوماتيك تكنولوجيا الأخضر', 'cost_price' => 370.00, 'price' => 450.00, 'stock' => 80, 'unit' => 'شكارة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'برسيل جيل أتوماتيك منظف للغسيل الأسود', 'cost_price' => 115.00, 'price' => 140.00, 'stock' => 110, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'برسيل جيل أتوماتيك برائحة اللافندر', 'cost_price' => 120.00, 'price' => 145.00, 'stock' => 125, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'مسحوق أوكسي أتوماتيك رائحة نسيم العليل', 'cost_price' => 295.00, 'price' => 360.00, 'stock' => 90, 'unit' => 'شكارة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'أوكسي جيل غسيل الأطباق بالليمون', 'cost_price' => 27.00, 'price' => 35.00, 'stock' => 200, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'مسحوق باهار للغسالات العادية اقتصادي', 'cost_price' => 44.00, 'price' => 55.00, 'stock' => 180, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'مسحوق وفير اقتصادي للغسالات الأتوماتيك', 'cost_price' => 240.00, 'price' => 290.00, 'stock' => 85, 'unit' => 'شكارة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'سائل تنظيف الأطباق بريل الأصلي جيل جركان', 'cost_price' => 53.00, 'price' => 65.00, 'stock' => 150, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'سائل تنظيف الأطباق فيري بقوة بديلة للمبيض', 'cost_price' => 70.00, 'price' => 85.00, 'stock' => 130, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'منظف أطباق فيبا بالليمون الأخضر اقتصادي', 'cost_price' => 22.00, 'price' => 28.00, 'stock' => 220, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'كلوركس الأبيض مبيض ومطهر للملابس عبوة', 'cost_price' => 19.00, 'price' => 25.00, 'stock' => 170, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'كلوركس الألوان سائل للملابس الملونة جالون', 'cost_price' => 68.00, 'price' => 85.00, 'stock' => 95, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'سبراي كلوركس مطهر عام للمنزل والأسطح', 'cost_price' => 44.00, 'price' => 55.00, 'stock' => 120, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'منعم ملابس داوني نسيم الوادي مركز زجاجة', 'cost_price' => 88.00, 'price' => 110.00, 'stock' => 100, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'منعم ومعطر ملابس فريدا رائحة الخوخ جالون', 'cost_price' => 160.00, 'price' => 199.00, 'stock' => 70, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'معطر جو فريدا سبراي رائحة العود الفاخر', 'cost_price' => 52.00, 'price' => 65.00, 'stock' => 140, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'مطهر ومنظف الأرضيات ديتول الأصلي حماية', 'cost_price' => 130.00, 'price' => 160.00, 'stock' => 80, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'منظف تواليت هاربيك باور بلس إزالة التكلسات', 'cost_price' => 60.00, 'price' => 75.00, 'stock' => 115, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'منظف زجاج جلانز كلاسيك مع بخاخ', 'cost_price' => 27.00, 'price' => 35.00, 'stock' => 160, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'ملمع خشب بليدج برائحة برتقال طبيعي', 'cost_price' => 68.00, 'price' => 85.00, 'stock' => 90, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'أقراص غسالات الأطباق فينيش الكل في واحد 30قرص', 'cost_price' => 310.00, 'price' => 380.00, 'stock' => 45, 'unit' => 'علبة', 'number_of_items_in_unit' => 30, 'category_id' => 3],
            ['name' => 'ملح غسالات الأطباق فينيش حماية الفلتر', 'cost_price' => 115.00, 'price' => 140.00, 'stock' => 50, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'مساعد شطف غسالات الأطباق فينيش لمعان', 'cost_price' => 122.00, 'price' => 150.00, 'stock' => 55, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'منظف سجاد ومفروشات فانيش مزيل بقع كيس', 'cost_price' => 52.00, 'price' => 65.00, 'stock' => 110, 'unit' => 'لفة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'سائل غسيل ملابس الأطفال بيجون لطيف', 'cost_price' => 160.00, 'price' => 195.00, 'stock' => 40, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'كازان كلين منظف أقمشة قوي جداً', 'cost_price' => 39.00, 'price' => 50.00, 'stock' => 130, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'مذيب دهون المطبخ سترس 7 في 1 فوم بخاخ', 'cost_price' => 78.00, 'price' => 95.00, 'stock' => 145, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'سائل ممسحة أرضيات جنرال عبير الزهور لتر', 'cost_price' => 38.00, 'price' => 48.00, 'stock' => 165, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'ديتول جيل منظف ومطهر الأسطح متعدد الأغراض', 'cost_price' => 73.00, 'price' => 90.00, 'stock' => 100, 'unit' => 'علبة', 'number_of_items_in_unit' => 1, 'category_id' => 3],
            ['name' => 'مكعبات تنظيف التواليت بريف نشاط الفراولة 2ق', 'cost_price' => 48.00, 'price' => 60.00, 'stock' => 210, 'unit' => 'علبة', 'number_of_items_in_unit' => 2, 'category_id' => 3],
        ];

        foreach ($products as $product) {
            Product::create(array_merge($product, ['image' => null]));
        }
    }
}