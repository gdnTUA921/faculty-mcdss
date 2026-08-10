<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\Application;
use App\Models\Document;
use App\Services\ResumeParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    public function __construct(private readonly ResumeParserService $resumeParser)
    {
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $applicantProfile = $request->user()->applicantProfile;

        if (! $applicantProfile) {
            abort(422, 'Applicant profile not found for this user.');
        }

        $validated = $request->validated();

        if (! empty($validated['application_id'])) {
            $application = Application::find($validated['application_id']);

            if (! $application || $application->applicant_profile_id !== $applicantProfile->id) {
                abort(422, 'The specified application does not belong to you.');
            }
        }

        $file = $request->file('file');
        $fileContents = $file->get();
        $storedName = Str::uuid().'_'.$file->getClientOriginalName();
        $path = $file->storeAs("documents/{$applicantProfile->id}", $storedName, 'local');

        $document = Document::create([
            'applicant_profile_id' => $applicantProfile->id,
            'application_id' => $validated['application_id'] ?? null,
            'document_type' => $validated['document_type'],
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'file_size_bytes' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        if (strtolower($validated['document_type']) === 'resume') {
            $parsedResumeData = $this->resumeParser->parse(
                $fileContents,
                $file->getClientOriginalName(),
                $file->getClientMimeType()
            );

            if ($parsedResumeData !== null) {
                $applicantProfile->update(['parsed_resume_data' => $parsedResumeData]);
            }
        }

        return response()->json($document, 201);
    }

    public function index(Request $request): JsonResponse
    {
        $applicantProfile = $request->user()->applicantProfile;

        if (! $applicantProfile) {
            return response()->json([]);
        }

        $documents = $applicantProfile->documents()->orderBy('uploaded_at', 'desc')->get();

        return response()->json($documents);
    }

    public function destroy(Request $request, Document $document): JsonResponse
    {
        $applicantProfile = $request->user()->applicantProfile;

        if (! $applicantProfile || $document->applicant_profile_id !== $applicantProfile->id) {
            abort(404);
        }

        // The portal already hides the delete button on verified documents; enforce
        // it here too, so HR sign-off can't be undone by a direct API call.
        if ($document->is_verified) {
            abort(422, 'Verified documents cannot be deleted. Contact HR if this is wrong.');
        }

        // Profile-level uploads carry no application_id but still appear in every
        // review packet, so once anything has been submitted, deleting one would
        // mutate an application HR is already reviewing. Drafts don't count --
        // before submitting, applicants are free to clear out mistaken uploads.
        $hasSubmitted = Application::where('applicant_profile_id', $applicantProfile->id)
            ->where('status', '!=', 'draft')
            ->exists();

        if ($hasSubmitted) {
            abort(422, 'Documents cannot be deleted once you have submitted an application. Contact HR if something needs to change.');
        }

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Document deleted.']);
    }
}
