<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationFormResponse extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'application_id',
        'criterion_id',
        'raw_value',
        'normalized_score',
        'weighted_score',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'normalized_score' => 'decimal:4',
            'weighted_score' => 'decimal:4',
            'responded_at' => 'datetime',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function criterion(): BelongsTo
    {
        return $this->belongsTo(Criterion::class);
    }
}
