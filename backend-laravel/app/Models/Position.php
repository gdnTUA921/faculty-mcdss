<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    use HasFactory;


    public $incrementing = false;


    protected $keyType = 'string';


    protected $fillable = [
        'department_id',
        'title',
        'description',
        'target_applicant_type',
        'slots_available',
        'slots_filled',
        'status',
        'application_deadline',
        'created_by',
    ];


    protected function casts(): array
    {
        return [
            'application_deadline' => 'date',
            'slots_available' => 'integer',
            'slots_filled' => 'integer',
        ];
    }


    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }


    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }


    public function criteria(): HasMany
    {
        return $this->hasMany(Criterion::class)->orderBy('display_order')->orderBy('created_at');
    }

}
