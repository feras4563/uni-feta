<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // الأصول (Assets)
        $assets = Account::create([
            'account_name' => 'الأصول',
            'account_number' => '1',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'description' => 'جميع الأصول المملوكة للمؤسسة',
        ]);

        // الأصول المتداولة
        $currentAssets = Account::create([
            'account_name' => 'الأصول المتداولة',
            'account_number' => '11',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'parent_account_id' => $assets->id,
            'description' => 'الأصول التي يمكن تحويلها إلى نقد خلال سنة',
        ]);

        // النقدية والبنوك
        $cash = Account::create([
            'account_name' => 'النقدية والبنوك',
            'account_number' => '1101',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'parent_account_id' => $currentAssets->id,
        ]);

        Account::create([
            'account_name' => 'النقدية في الصندوق',
            'account_number' => '110101',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'parent_account_id' => $cash->id,
            'description' => 'النقدية المتوفرة في الصندوق الرئيسي',
        ]);

        Account::create([
            'account_name' => 'الحسابات البنكية',
            'account_number' => '110102',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'parent_account_id' => $cash->id,
            'description' => 'الأرصدة في البنوك',
        ]);

        // الذمم المدينة
        $receivables = Account::create([
            'account_name' => 'الذمم المدينة',
            'account_number' => '1102',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'parent_account_id' => $currentAssets->id,
        ]);

        Account::create([
            'account_name' => 'رسوم الطلاب',
            'account_number' => '110201',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'parent_account_id' => $receivables->id,
            'description' => 'الرسوم المستحقة على الطلاب',
        ]);

        Account::create([
            'account_name' => 'المخزون',
            'account_number' => '1103',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'parent_account_id' => $currentAssets->id,
            'description' => 'المخزون من المواد والمستلزمات',
        ]);

        // الأصول الثابتة
        $fixedAssets = Account::create([
            'account_name' => 'الأصول الثابتة',
            'account_number' => '12',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'parent_account_id' => $assets->id,
            'description' => 'الأصول طويلة الأجل',
        ]);

        Account::create([
            'account_name' => 'المباني والإنشاءات',
            'account_number' => '1201',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'parent_account_id' => $fixedAssets->id,
        ]);

        Account::create([
            'account_name' => 'الأجهزة والمعدات',
            'account_number' => '1202',
            'account_type' => 'asset',
            'root_account_type' => 'assets',
            'parent_account_id' => $fixedAssets->id,
        ]);

        // الخصوم (Liabilities)
        $liabilities = Account::create([
            'account_name' => 'الخصوم',
            'account_number' => '2',
            'account_type' => 'liability',
            'root_account_type' => 'liabilities',
            'description' => 'جميع الالتزامات المالية',
        ]);

        // الخصوم المتداولة
        $currentLiabilities = Account::create([
            'account_name' => 'الخصوم المتداولة',
            'account_number' => '21',
            'account_type' => 'liability',
            'root_account_type' => 'liabilities',
            'parent_account_id' => $liabilities->id,
        ]);

        Account::create([
            'account_name' => 'الذمم الدائنة',
            'account_number' => '2101',
            'account_type' => 'liability',
            'root_account_type' => 'liabilities',
            'parent_account_id' => $currentLiabilities->id,
        ]);

        Account::create([
            'account_name' => 'القروض قصيرة الأجل',
            'account_number' => '2102',
            'account_type' => 'liability',
            'root_account_type' => 'liabilities',
            'parent_account_id' => $currentLiabilities->id,
        ]);

        // حقوق الملكية (Equity)
        $equity = Account::create([
            'account_name' => 'حقوق الملكية',
            'account_number' => '3',
            'account_type' => 'equity',
            'root_account_type' => 'equity',
            'description' => 'حقوق أصحاب المؤسسة',
        ]);

        Account::create([
            'account_name' => 'رأس المال',
            'account_number' => '3101',
            'account_type' => 'equity',
            'root_account_type' => 'equity',
            'parent_account_id' => $equity->id,
        ]);

        Account::create([
            'account_name' => 'الأرباح المحتجزة',
            'account_number' => '3102',
            'account_type' => 'equity',
            'root_account_type' => 'equity',
            'parent_account_id' => $equity->id,
        ]);

        // الإيرادات (Revenue)
        $revenue = Account::create([
            'account_name' => 'الإيرادات',
            'account_number' => '4',
            'account_type' => 'revenue',
            'root_account_type' => 'revenue',
            'description' => 'جميع الإيرادات',
        ]);

        Account::create([
            'account_name' => 'رسوم التعليم',
            'account_number' => '4101',
            'account_type' => 'revenue',
            'root_account_type' => 'revenue',
            'parent_account_id' => $revenue->id,
        ]);

        Account::create([
            'account_name' => 'إيرادات أخرى',
            'account_number' => '4102',
            'account_type' => 'revenue',
            'root_account_type' => 'revenue',
            'parent_account_id' => $revenue->id,
        ]);

        // المصروفات (Expenses)
        $expenses = Account::create([
            'account_name' => 'المصروفات',
            'account_number' => '5',
            'account_type' => 'expense',
            'root_account_type' => 'expenses',
            'description' => 'جميع المصروفات',
        ]);

        // المصروفات التشغيلية
        $operatingExpenses = Account::create([
            'account_name' => 'المصروفات التشغيلية',
            'account_number' => '51',
            'account_type' => 'expense',
            'root_account_type' => 'expenses',
            'parent_account_id' => $expenses->id,
        ]);

        Account::create([
            'account_name' => 'الرواتب والأجور',
            'account_number' => '5101',
            'account_type' => 'expense',
            'root_account_type' => 'expenses',
            'parent_account_id' => $operatingExpenses->id,
        ]);

        Account::create([
            'account_name' => 'المرافق العامة',
            'account_number' => '5102',
            'account_type' => 'expense',
            'root_account_type' => 'expenses',
            'parent_account_id' => $operatingExpenses->id,
        ]);

        // المصروفات الإدارية
        $adminExpenses = Account::create([
            'account_name' => 'المصروفات الإدارية',
            'account_number' => '52',
            'account_type' => 'expense',
            'root_account_type' => 'expenses',
            'parent_account_id' => $expenses->id,
        ]);

        Account::create([
            'account_name' => 'مستلزمات المكتب',
            'account_number' => '5201',
            'account_type' => 'expense',
            'root_account_type' => 'expenses',
            'parent_account_id' => $adminExpenses->id,
        ]);
    }
}
