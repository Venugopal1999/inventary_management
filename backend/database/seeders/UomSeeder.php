<?php

namespace Database\Seeders;

use App\Models\Uom;
use Illuminate\Database\Seeder;

class UomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $uoms = [
            ['name' => 'Piece', 'symbol' => 'pcs', 'base_ratio' => 1.0000],
            ['name' => 'Box', 'symbol' => 'box', 'base_ratio' => 1.0000],
            ['name' => 'Kilogram', 'symbol' => 'kg', 'base_ratio' => 1.0000],
            ['name' => 'Gram', 'symbol' => 'g', 'base_ratio' => 0.0010],
            ['name' => 'Liter', 'symbol' => 'L', 'base_ratio' => 1.0000],
            ['name' => 'Milliliter', 'symbol' => 'mL', 'base_ratio' => 0.0010],
            ['name' => 'Meter', 'symbol' => 'm', 'base_ratio' => 1.0000],
            ['name' => 'Centimeter', 'symbol' => 'cm', 'base_ratio' => 0.0100],
            ['name' => 'Dozen', 'symbol' => 'doz', 'base_ratio' => 12.0000],
            ['name' => 'Pallet', 'symbol' => 'plt', 'base_ratio' => 1.0000],
        ];

        foreach ($uoms as $uom) {
            Uom::create($uom);
        }
    }
}
