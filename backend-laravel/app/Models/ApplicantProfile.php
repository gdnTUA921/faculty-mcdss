<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ApplicantProfile extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'applicant_type',
        'institution_email',
        'summary',
        'parsed_resume_data',
        'profile_completed_at',
    ];

    protected function casts(): array
    {
        return [
            'parsed_resume_data'   => 'json',
            'profile_completed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
