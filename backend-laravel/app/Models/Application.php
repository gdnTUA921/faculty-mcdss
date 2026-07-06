<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Application extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'applicant_profile_id',
        'position_id',
        'hiring_round_id',
        'status',
        'total_wsm_score',
        'is_pool_member',
        'pool_status',
        'applied_at',
        'status_updated_at',
    ];

    protected function casts(): array
    {
        return [
            'total_wsm_score' => 'decimal:4',
            'is_pool_member' => 'boolean',
            'applied_at' => 'datetime',
            'status_updated_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function applicantProfile(): BelongsTo
    {
        return $this->belongsTo(ApplicantProfile::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function hiringRound(): BelongsTo
    {
        return $this->belongsTo(HiringRound::class);
    }

    public function formResponses(): HasMany
    {
        return $this->hasMany(ApplicationFormResponse::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(StatusHistory::class);
    }
}
