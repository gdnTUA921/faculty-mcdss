<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasUuids;

    protected $table = 'notifications';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'application_id',
        'type',
        'subject',
        'body',
        'channel',
        'delivery_status',
        'sent_at',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at'    => 'datetime',
            'read_at'    => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
