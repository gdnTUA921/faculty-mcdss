<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ResumeParserService
{
    public function parse(string $fileContents, string $fileName, string $mimeType): ?array
    {
        try {
            $response = Http::withHeaders([
                'X-Service-Key' => config('services.fastapi.secret_key'),
            ])
                ->timeout(15)
                ->attach('file', $fileContents, $fileName, ['Content-Type' => $mimeType])
                ->post(rtrim(config('services.fastapi.url'), '/').'/parse-resume');

            if ($response->failed()) {
                Log::warning('Resume parser request failed.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            return $response->json();
        } catch (Throwable $exception) {
            Log::warning('Resume parser request threw an exception.', [
                'message' => $exception->getMessage(),
            ]);

            return null;
        }
    }
}
