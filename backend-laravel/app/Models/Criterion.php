<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Criterion extends Model
{
    use HasFactory;


    public $incrementing = false;


    public $timestamps = false;


    protected $keyType = 'string';


    protected $fillable = [
        'position_id',
        'name',
        'description',
        'data_type',
        'weight',
        'min_value',
        'max_value',
        'is_required',
        'display_order',
        'created_at',
    ];


    protected function casts(): array
    {
        return [
            'weight' => 'decimal:4',
            'min_value' => 'decimal:2',
            'max_value' => 'decimal:2',
            'is_required' => 'boolean',
            'display_order' => 'integer',
            'created_at' => 'datetime',
        ];
    }


    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }


    public function options(): HasMany
    {
        return $this->hasMany(CriterionOption::class)->orderBy('display_order')->orderBy('label');
    }
}



