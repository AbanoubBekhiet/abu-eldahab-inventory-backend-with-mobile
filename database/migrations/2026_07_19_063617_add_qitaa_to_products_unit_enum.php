<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * SQLite does not support ALTER COLUMN, so we rebuild the products table
     * with an updated CHECK constraint on the `unit` column that includes قطعة.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            DB::statement('
                CREATE TABLE "products_new" (
                    "id"                       integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                    "name"                     varchar NOT NULL,
                    "image"                    varchar,
                    "description"              text,
                    "price"                    numeric NOT NULL,
                    "stock"                    integer NOT NULL DEFAULT \'0\',
                    "unit"                     varchar NOT NULL
                                               CHECK("unit" IN (\'شكارة\',\'علبة\',\'كرتونة\',\'شريط\',\'دستة\',\'لفة\',\'قطعة\')),
                    "number_of_items_in_unit"  integer NOT NULL DEFAULT \'1\',
                    "category_id"              integer NOT NULL,
                    "created_at"               datetime,
                    "updated_at"               datetime,
                    "cost_price"               numeric NOT NULL DEFAULT \'0\',
                    FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE
                )
            ');

            DB::statement('INSERT INTO "products_new" SELECT * FROM "products"');
            DB::statement('DROP TABLE "products"');
            DB::statement('ALTER TABLE "products_new" RENAME TO "products"');

            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            DB::statement("ALTER TABLE `products` MODIFY COLUMN `unit` ENUM('شكارة','علبة','كرتونة','شريط','دستة','لفة','قطعة') NOT NULL");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            DB::statement('
                CREATE TABLE "products_new" (
                    "id"                       integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                    "name"                     varchar NOT NULL,
                    "image"                    varchar,
                    "description"              text,
                    "price"                    numeric NOT NULL,
                    "stock"                    integer NOT NULL DEFAULT \'0\',
                    "unit"                     varchar NOT NULL
                                               CHECK("unit" IN (\'شكارة\',\'علبة\',\'كرتونة\',\'شريط\',\'دستة\',\'لفة\')),
                    "number_of_items_in_unit"  integer NOT NULL DEFAULT \'1\',
                    "category_id"              integer NOT NULL,
                    "created_at"               datetime,
                    "updated_at"               datetime,
                    "cost_price"               numeric NOT NULL DEFAULT \'0\',
                    FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE
                )
            ');

            DB::statement('INSERT INTO "products_new" SELECT * FROM "products"');
            DB::statement('DROP TABLE "products"');
            DB::statement('ALTER TABLE "products_new" RENAME TO "products"');

            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            DB::statement("ALTER TABLE `products` MODIFY COLUMN `unit` ENUM('شكارة','علبة','كرتونة','شريط','دستة','لفة') NOT NULL");
        }
    }
};
