<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class CriterionOption extends Model
{
    use HasFactory;


    public $incrementing = false;


    public $timestamps = false;


    protected $keyType = 'string';


    protected $fillable = [
        'criterion_id',
        'label',
        'value',
        'score_value',
        'display_order',
    ];


    protected function casts(): array
    {
        return [
            'score_value' => 'decimal:4',
            'display_order' => 'integer',
        ];
    }


    public function criterion(): BelongsTo
    {
        return $this->belongsTo(Criterion::class);
    }
 
}
