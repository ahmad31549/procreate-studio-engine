<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::table('pdf_records', function (Blueprint $table) {
            $table->boolean('show_review')->default(true)->after('step3');
            $table->string('review_text')->default('Your feedback helps our small shop grow!')->after('show_review');
        });
    }

    public function down(): void
    {
        Schema::table('pdf_records', function (Blueprint $table) {
            $table->dropColumn(['show_review', 'review_text']);
        });
    }
};
