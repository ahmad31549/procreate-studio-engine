<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class PdfRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'title',
        'store_name',
        'store_link',
        'created_by',
        'welcome_title',
        'welcome_msg',
        'theme',
        'pdf_mode',
        'products',
        'message',
        'step1',
        'step2',
        'step3',
        'show_review',
        'review_text',
    ];

    protected $casts = [
        'products' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
