<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssignmentRun extends Model
{
    use HasUuids;

    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'hiring_round_id',
        'scope_applicant_type',
        'scope_position_ids',
        'scope_department_ids',
        'ilp_parameters',
        'status',
        'result_summary',
        'run_at',
        'completed_at',
        'run_by',
    ];

    protected function casts(): array
    {
        return [
            'scope_position_ids' => 'array',
            'scope_department_ids' => 'array',
            'ilp_parameters' => 'array',
            'result_summary' => 'array',
            'run_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function hiringRound(): BelongsTo
    {
        return $this->belongsTo(HiringRound::class);
    }

    public function runner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'run_by');
    }

    public function results(): HasMany
    {
        return $this->hasMany(AssignmentResult::class);
    }
}