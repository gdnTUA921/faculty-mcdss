<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['first_name', 'last_name', 'email', 'password', 'role', 'phone', 'is_active', 'is_temp_password'])]
#[Hidden(['password'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public $incrementing = false;
    protected $keyType   = 'string';

    // No remember_token column in schema — Sanctum handles sessions via tokens
    public function getRememberTokenName(): ?string
    {
        return null;
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
            'is_temp_password'  => 'boolean',
        ];
    }
}
