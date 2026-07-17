<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class AssignmentSolverService
{
    public function run(array $payload): array
    {
        try {
            $response = Http::withHeaders([
                'X-Service-Key' => config('services.fastapi.secret_key'),
            ])
                ->timeout(60)
                ->post(rtrim(config('services.fastapi.url'), '/').'/run-assignment', $payload);

            if ($response->failed()) {
                Log::warning('Assignment solver request failed.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new RuntimeException('Assignment solver request failed.');
            }

            return $response->json();
        } catch (Throwable $exception) {
            Log::warning('Assignment solver request threw an exception.', [
                'message' => $exception->getMessage(),
            ]);

            throw new RuntimeException('Assignment solver service unavailable.', previous: $exception);
        }
    }
}