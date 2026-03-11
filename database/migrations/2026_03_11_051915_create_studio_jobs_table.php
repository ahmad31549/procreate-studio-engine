<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('studio_jobs', function (Blueprint $table) {
            $table->id();
            $table->uuid('job_id')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('status')->default('uploaded');
            $table->integer('progress')->default(0);
            $table->string('progress_message')->nullable();
            $table->json('manifest')->nullable();
            $table->json('files')->nullable();
            $table->json('outputs')->nullable();
            $table->json('bundle')->nullable();
            $table->string('store_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('studio_jobs');
    }
};
