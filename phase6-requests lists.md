Run the WSM test seeder to insert the test position and candidate:

docker compose exec laravel php artisan db:seed --class=Phase6TestSeeder

Test Verification Results
Using your freshly seeded position ID 019f419c-96d3-715c-a402-152d807d8317 and application ID 019f419c-97f2-71cc-87f3-f354ec8784d4, here are the tested responses:

1. Trigger Scoring
Request: POST http://localhost:8000/api/positions/019f419c-96d3-715c-a402-152d807d8317/score
Response:
json
{
  "message": "Scoring and WSM calculations completed for Test Lecturer in Computer Science"
}
2. View Rankings
Request: GET http://localhost:8000/api/positions/019f419c-96d3-715c-a402-152d807d8317/rankings
Response:
json
[
  {
    "application_id": "019f419c-97f2-71cc-87f3-f354ec8784d4",
    "applicant_name": "ExternalApplicant",
    "position_title": "Test Lecturer in Computer Science",
    "total_wsm_score": "0.6600",
    "rank_in_position": 1,
    "status": "applied"
  }
]
3. View Score Breakdown (Explainability)
Request: GET http://localhost:8000/api/applications/019f419c-97f2-71cc-87f3-f354ec8784d4/score-breakdown
Response:
json
{
  "application_id": "019f419c-97f2-71cc-87f3-f354ec8784d4",
  "total_wsm_score": "0.6600",
  "breakdown": [
    {
      "criterion_name": "Years of Teaching Experience",
      "weight": "0.5000",
      "raw_value": "5",
      "normalized_score": "0.5000",
      "weighted_score": "0.2500"
    },
    {
      "criterion_name": "Highest Degree Obtained",
      "weight": "0.3000",
      "raw_value": "ms",
      "normalized_score": "0.7000",
      "weighted_score": "0.2100"
    },
    {
      "criterion_name": "Has Active Research",
      "weight": "0.2000",
      "raw_value": "true",
      "normalized_score": "1.0000",
      "weighted_score": "0.2000"
    }
  ]
}