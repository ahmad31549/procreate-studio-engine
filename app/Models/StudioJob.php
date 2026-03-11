<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudioJob extends Model
{
    protected $fillable = [
        'job_id',
        'user_id',
        'status',
        'progress',
        'progress_message',
        'manifest',
        'files',
        'outputs',
        'bundle',
        'store_name',
        'author_name',
        'final_zip_name',
    ];

    protected $casts = [
        'manifest' => 'array',
        'files' => 'array',
        'outputs' => 'array',
        'bundle' => 'array'
    ];
}
