<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApplicantProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicantProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = ApplicantProfile::where('user_id', $request->user()->id)->firstOrFail();

        return response()->json($profile);
    }

    public function update(Request $request): JsonResponse
    {
        $profile = ApplicantProfile::where('user_id', $request->user()->id)->firstOrFail();

        $data = $request->validate([
            'institution_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'summary'           => ['sometimes', 'nullable', 'string', 'max:5000'],

            // Corrections to the parsed CV. The applicant reviews and edits every
            // field the parser produced, so the full structured shape is accepted.
            'parsed_resume_data' => ['sometimes', 'array'],

            'parsed_resume_data.name'      => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.email'     => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.phone'     => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.address'   => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.linkedin'  => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.portfolio' => ['nullable', 'string', 'max:500'],

            'parsed_resume_data.education'                   => ['sometimes', 'array', 'max:50'],
            'parsed_resume_data.education.*.raw_text'        => ['nullable', 'string', 'max:2000'],
            'parsed_resume_data.education.*.degree'          => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.education.*.field_of_study'  => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.education.*.institution'     => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.education.*.graduation_year' => ['nullable', 'string', 'max:500'],

            // Work, teaching, and academic experience share this one section.
            'parsed_resume_data.experience'                    => ['sometimes', 'array', 'max:50'],
            'parsed_resume_data.experience.*.raw_text'         => ['nullable', 'string', 'max:2000'],
            'parsed_resume_data.experience.*.position'         => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.experience.*.organization'     => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.experience.*.start_date'       => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.experience.*.end_date'         => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.experience.*.responsibilities'   => ['sometimes', 'array', 'max:50'],
            'parsed_resume_data.experience.*.responsibilities.*' => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.experience.*.courses_taught'     => ['sometimes', 'array', 'max:50'],
            'parsed_resume_data.experience.*.courses_taught.*'   => ['nullable', 'string', 'max:500'],

            // Certifications and licenses are combined.
            'parsed_resume_data.certifications'                   => ['sometimes', 'array', 'max:50'],
            'parsed_resume_data.certifications.*.raw_text'        => ['nullable', 'string', 'max:2000'],
            'parsed_resume_data.certifications.*.name'            => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.certifications.*.issuer'          => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.certifications.*.date_obtained'   => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.certifications.*.expiration_date' => ['nullable', 'string', 'max:500'],

            'parsed_resume_data.skills'              => ['sometimes', 'array', 'max:100'],
            'parsed_resume_data.skills.*'            => ['nullable', 'string', 'max:500'],
            'parsed_resume_data.research_interests'   => ['sometimes', 'array', 'max:100'],
            'parsed_resume_data.research_interests.*' => ['nullable', 'string', 'max:500'],

            'parsed_resume_data.publications'                => ['sometimes', 'array', 'max:100'],
            'parsed_resume_data.publications.*.raw_text'     => ['nullable', 'string', 'max:2000'],
            'parsed_resume_data.research_projects'           => ['sometimes', 'array', 'max:100'],
            'parsed_resume_data.research_projects.*.raw_text' => ['nullable', 'string', 'max:2000'],
            'parsed_resume_data.professional_development'            => ['sometimes', 'array', 'max:100'],
            'parsed_resume_data.professional_development.*.raw_text' => ['nullable', 'string', 'max:2000'],
            'parsed_resume_data.awards'            => ['sometimes', 'array', 'max:100'],
            'parsed_resume_data.awards.*.raw_text' => ['nullable', 'string', 'max:2000'],
        ]);

        if (array_key_exists('parsed_resume_data', $data)) {
            // A shallow merge is deliberate: a section the applicant submits replaces
            // the stored one wholesale, which is what lets them delete an entry the
            // parser got wrong. Sections they don't send are left untouched.
            $profile->parsed_resume_data = array_merge(
                $profile->parsed_resume_data ?? [],
                $data['parsed_resume_data'],
            );

            unset($data['parsed_resume_data']);
        }

        $profile->fill($data);

        // A resume correction is not the applicant filling in their profile, so it
        // must not flip the completion flag that admins see on the applicant record.
        if ($profile->profile_completed_at === null && $data !== []) {
            $profile->profile_completed_at = now();
        }

        $profile->save();

        return response()->json($profile);
    }
}
