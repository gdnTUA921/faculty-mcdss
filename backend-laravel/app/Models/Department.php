<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Department extends Model
{
    public $incrementing = false;
    protected $keyType   = 'string';
    public $timestamps   = false;

    protected $fillable  = ['name', 'code', 'description', 'director_id', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active'  => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function director(): BelongsTo
    {
        return $this->belongsTo(User::class, 'director_id');
    }
}
