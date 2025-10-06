#!/bin/bash

# Update videos table to make video_url nullable and add status column
curl -X POST 'https://fvnbfaljmyzbjehvbjxm.supabase.co/rest/v1/rpc/exec_sql' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bmJmYWxqbXl6YmplaHZianhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTczOTI1MiwiZXhwIjoyMDc1MzE1MjUyfQ.Tqt3ygBmILp_gAi2y-0o4wFp8gYfPYIwrfE5yPe3BVk" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bmJmYWxqbXl6YmplaHZianhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTczOTI1MiwiZXhwIjoyMDc1MzE1MjUyfQ.Tqt3ygBmILp_gAi2y-0o4wFp8gYfPYIwrfE5yPe3BVk" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE public.videos ALTER COLUMN video_url DROP NOT NULL; ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '\''loading'\'' CHECK (status IN ('\''loading'\'', '\''completed'\'', '\''failed'\''));"
  }'

echo ""
echo "Schema update complete!"
