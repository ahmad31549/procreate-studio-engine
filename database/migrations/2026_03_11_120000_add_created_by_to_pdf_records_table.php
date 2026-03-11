<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pdf_records', function (Blueprint $table) {
            $table->string('created_by')->nullable()->after('store_link');
        });
    }

    public function down(): void
    {
        Schema::table('pdf_records', function (Blueprint $table) {
            $table->dropColumn('created_by');
        });
    }
};
