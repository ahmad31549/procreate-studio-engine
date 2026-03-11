<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('studio_jobs', function (Blueprint $table) {
            $table->string('author_name')->nullable()->after('store_name');
            $table->string('final_zip_name')->nullable()->after('author_name');
            $table->string('author_pic_path')->nullable()->after('final_zip_name');
            $table->string('sig_pic_path')->nullable()->after('author_pic_path');
        });
    }

    public function down(): void
    {
        Schema::table('studio_jobs', function (Blueprint $table) {
            $table->dropColumn(['author_name', 'final_zip_name', 'author_pic_path', 'sig_pic_path']);
        });
    }
};
