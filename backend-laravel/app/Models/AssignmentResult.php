<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentResult extends Model
{
    use HasUuids;

    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'assignment_run_id',
        'application_id',
        'position_id',
        'is_assigned',
        'objective_score',
        'notes',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'is_assigned' => 'boolean',
            'objective_score' => 'decimal:4',
            'created_at' => 'datetime',
        ];
    }

    public function assignmentRun(): BelongsTo
    {
        return $this->belongsTo(AssignmentRun::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }
}