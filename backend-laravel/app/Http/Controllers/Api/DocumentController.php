<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\Application;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
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

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Document deleted.']);
    }
}
