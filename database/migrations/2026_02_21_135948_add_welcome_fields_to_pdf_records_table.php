<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pdf_records', function (Blueprint $table) {
            $table->string('welcome_title')->default('Your Files are Ready! ✨')->after('store_link');
            $table->text('welcome_msg')->nullable()->after('welcome_title');
        });
    }

    public function down(): void
    {
        Schema::table('pdf_records', function (Blueprint $table) {
            $table->dropColumn(['welcome_title', 'welcome_msg']);
        });
    }
};
