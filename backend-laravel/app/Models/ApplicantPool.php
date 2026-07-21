<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicantPool extends Model
{
    use HasUuids;

    protected $table = 'applicant_pool';

    public $timestamps = false;

    protected $fillable = [
        'applicant_profile_id',
        'hiring_round_id',
        'position_id',
        'status',
        'reengagement_email_sent',
        'reengagement_sent_at',
        'responded_at',
        'confirmed_interest',
    ];

    protected function casts(): array
    {
        return [
            'reengagement_email_sent' => 'boolean',
            'reengagement_sent_at'    => 'datetime',
            'responded_at'            => 'datetime',
            'confirmed_interest'      => 'boolean',
            'created_at'              => 'datetime',
        ];
    }

    public function applicantProfile(): BelongsTo
    {
        return $this->belongsTo(ApplicantProfile::class);
    }

    public function hiringRound(): BelongsTo
    {
        return $this->belongsTo(HiringRound::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }
}
