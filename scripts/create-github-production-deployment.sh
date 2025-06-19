#!/bin/bash
set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️  GITHUB_TOKEN not set, skipping GitHub integration"
  exit 0
fi

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME/deployments" \
  -d '{
    "ref": "'"$CIRCLE_SHA1"'",
    "environment": "production",
    "auto_merge": false,
    "required_contexts": []
  }' | jq -r '.id' | xargs -I {} curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME/deployments/{}/statuses" \
  -d '{"state": "success", "description": "Production deployment successful"}'
