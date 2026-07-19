<?php
namespace App\Services;
use App\Models\Position;
use App\Models\Application;
use App\Models\ApplicationFormResponse;
use Illuminate\Support\Facades\DB;
class WsmScoringService
{
    /**
     * Scores all submitted applications for a specific position.
     */
    public function scorePositionApplications(Position $position): void
    {
        $criteria = $position->criteria()->with('options')->get();
        // Retrieve submitted applications only (ignore drafts)
        $applications = $position->applications()
            ->where('status', '!=', 'draft')
            ->get();
        foreach ($applications as $application) {
            $totalWsmScore = 0.0;
            foreach ($criteria as $criterion) {
                // Fetch the response or initialize a blank one if missing
                $response = ApplicationFormResponse::firstOrNew([
                    'application_id' => $application->id,
                    'criterion_id' => $criterion->id,
                ]);
                $rawValue = $response->raw_value;
                $normalizedScore = 0.0;
                if ($rawValue !== null && $rawValue !== '') {
                    switch ($criterion->data_type) {
                        case 'numeric':
                            $min = (float) $criterion->min_value;
                            $max = (float) $criterion->max_value;
                            $val = (float) $rawValue;
                            if ($max === $min) {
                                $normalizedScore = 0.0;
                            } else {
                                $normalizedScore = ($val - $min) / ($max - $min);
                                $normalizedScore = max(0.0, min(1.0, $normalizedScore)); // Clip to [0,1]
                            }
                            break;
                        case 'select':
                            // Raw value contains the selected option 'value' string
                            $option = $criterion->options->firstWhere('value', $rawValue);
                            if ($option) {
                                $normalizedScore = (float) $option->score_value;
                            }
                            break;
                        case 'boolean':
                            // Handle string values from forms ('true', '1', 'on')
                            $isTrue = in_array(strtolower((string) $rawValue), ['1', 'true', 'on', 'yes'], true);
                            $normalizedScore = $isTrue ? 1.0 : 0.0;
                            break;
                        case 'text':
                            // Basic text criteria scoring: 1.0 if not empty
                            $normalizedScore = 1.0;
                            break;
                    }
                }
                $weightedScore = $normalizedScore * (float) $criterion->weight;
                $response->normalized_score = $normalizedScore;
                $response->weighted_score = $weightedScore;
                $response->save();
                $totalWsmScore += $weightedScore;
            }
            $application->update([
                'total_wsm_score' => $totalWsmScore,
            ]);
        }
    }
}