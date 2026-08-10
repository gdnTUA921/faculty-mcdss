<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesToDirector;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicationDocumentController extends Controller
{
    use ScopesToDirector;

    /**
     * Documents visible when reviewing one application: the ones attached to it,
     * plus the applicant's profile-level uploads (resume, TOR) which carry no
     * application_id but are part of the same review packet.
     */
    public function index(Request $request, Application $application): JsonResponse
    {
        $application->load('position:id,department_id');

        $this->assertDepartmentAccess($request->user(), $application->position?->department_id);

        $documents = Document::with(['uploader:id,first_name,last_name', 'verifier:id,first_name,last_name'])
            ->where('applicant_profile_id', $application->applicant_profile_id)
            ->where(fn ($q) => $q->where('application_id', $application->id)->orWhereNull('application_id'))
            ->orderByDesc('uploaded_at')
            ->get()
            ->map(fn ($document) => [
                'id'              => $document->id,
                'application_id'  => $document->application_id,
                'document_type'   => $document->document_type,
                'file_name'       => $document->file_name,
                'mime_type'       => $document->mime_type,
                'file_size_bytes' => $document->file_size_bytes,
                'is_verified'     => $document->is_verified,
                'uploaded_by'     => $document->uploader
                    ? trim($document->uploader->first_name . ' ' . $document->uploader->last_name)
                    : null,
                'uploaded_at'     => $document->uploaded_at?->toIso8601String(),
                'verified_by'     => $document->verifier
                    ? trim($document->verifier->first_name . ' ' . $document->verifier->last_name)
                    : null,
                'verified_at'     => $document->verified_at?->toIso8601String(),
                'download_url'    => url("/api/documents/{$document->id}/download"),
            ]);

        return response()->json(['data' => $documents]);
    }

    /**
     * Admin marks a credential as checked (or reverses a mistake). Records who and
     * when, so "Verified" is attributable rather than an anonymous green badge.
     */
    public function verify(Request $request, Document $document): JsonResponse
    {
        $validated = $request->validate([
            'is_verified' => ['required', 'boolean'],
        ]);

        if ($validated['is_verified']) {
            $document->is_verified = true;
            $document->verified_by = $request->user()->id;
            $document->verified_at = now();
        } else {
            $document->is_verified = false;
            $document->verified_by = null;
            $document->verified_at = null;
        }

        $document->save();
        $document->load('verifier:id,first_name,last_name');

        return response()->json([
            'id'          => $document->id,
            'is_verified' => $document->is_verified,
            'verified_by' => $document->verifier
                ? trim($document->verifier->first_name . ' ' . $document->verifier->last_name)
                : null,
            'verified_at' => $document->verified_at?->toIso8601String(),
            'message'     => $document->is_verified
                ? 'Document marked as verified.'
                : 'Verification removed.',
        ]);
    }

    /**
     * Streams a stored file. Applicants may only fetch their own; directors only
     * documents belonging to an applicant who applied within their departments.
     */
    public function download(Request $request, Document $document): StreamedResponse
    {
        $user = $request->user();

        if (in_array($user->role, ['internal_applicant', 'external_applicant'], true)) {
            $profile = $user->applicantProfile;

            if (! $profile || $document->applicant_profile_id !== $profile->id) {
                abort(404);
            }
        } else {
            $departmentIds = $this->scopedDepartmentIds($user);

            if ($departmentIds !== null) {
                $reachable = Application::where('applicant_profile_id', $document->applicant_profile_id)
                    ->whereHas('position', fn ($q) => $q->whereIn('department_id', $departmentIds))
                    ->exists();

                if (! $reachable) {
                    abort(404);
                }
            }
        }

        if (! Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'Stored file is missing.');
        }

        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }
}
