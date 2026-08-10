<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Department;
use App\Models\User;

trait ScopesToDirector
{
    /**
     * Department IDs the given director is responsible for.
     * Admins are unscoped and receive null.
     */
    protected function scopedDepartmentIds(?User $user): ?array
    {
        if (! $user || $user->role !== 'director') {
            return null;
        }

        return Department::where('director_id', $user->id)->pluck('id')->all();
    }

    /**
     * Abort with 404 when a director reaches a record outside their departments.
     * Hides existence rather than confirming it with a 403.
     */
    protected function assertDepartmentAccess(?User $user, ?string $departmentId): void
    {
        $allowed = $this->scopedDepartmentIds($user);

        if ($allowed === null) {
            return;
        }

        if ($departmentId === null || ! in_array($departmentId, $allowed, true)) {
            abort(404);
        }
    }
}
