#!/bin/bash
set -e

# Check for environment argument
if [ -z "$1" ]; then
  echo "❌ Missing environment argument. Usage: $0 [preview|production]"
  exit 1
fi

ENVIRONMENT=$1
DESCRIPTION=""
TARGET_URL=""

# Configure based on environment
if [ "$ENVIRONMENT" = "preview" ]; then
  if [ -z "$VERCEL_URL" ]; then
    echo "❌ VERCEL_URL not set for preview environment"
    exit 1
  fi
  if [[ ! "$VERCEL_URL" =~ ^https?:// ]]; then
    echo "❌ Invalid Vercel URL format: $VERCEL_URL"
    exit 1
  fi
  DESCRIPTION="Preview deployment ready"
  TARGET_URL="$VERCEL_URL"
elif [ "$ENVIRONMENT" = "production" ]; then
  DESCRIPTION="Production deployment successful"
else
  echo "❌ Invalid environment: $ENVIRONMENT. Use 'preview' or 'production'."
  exit 1
fi

# Check for GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️ GITHUB_TOKEN not set, skipping GitHub integration"
  exit 0
fi

# Common variables
REPO_OWNER="$CIRCLE_PROJECT_USERNAME"
REPO_NAME="$CIRCLE_PROJECT_REPONAME"
COMMIT_SHA="$CIRCLE_SHA1"

echo "🚀 Creating GitHub deployment for '$ENVIRONMENT' environment..."
echo "📁 Repository: $REPO_OWNER/$REPO_NAME"
echo "commit: $COMMIT_SHA"

# Create Deployment
DEPLOYMENT_PAYLOAD=$(
  cat <<EOF
{
  "ref": "$COMMIT_SHA",
  "environment": "$ENVIRONMENT",
  "auto_merge": false,
  "required_contexts": [],
  "description": "$DESCRIPTION"
}
EOF
)

DEPLOYMENT_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/deployments" \
  -d "$DEPLOYMENT_PAYLOAD")

HTTP_STATUS=$(echo "$DEPLOYMENT_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
DEPLOYMENT_BODY=$(echo "$DEPLOYMENT_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

if [ "$HTTP_STATUS" -ne 201 ]; then
  echo "❌ Failed to create deployment. HTTP Status: $HTTP_STATUS"
  echo "Response: $DEPLOYMENT_BODY"
  exit 1
fi

DEPLOYMENT_ID=$(echo "$DEPLOYMENT_BODY" | jq -r '.id')
echo "✅ Deployment created (ID: $DEPLOYMENT_ID)"

# Create Deployment Status
STATUS_PAYLOAD_JSON='{
  "state": "success",
  "description": "'"$DESCRIPTION"'"
}'

if [ -n "$TARGET_URL" ]; then
  STATUS_PAYLOAD_JSON=$(echo "$STATUS_PAYLOAD_JSON" | jq --arg url "$TARGET_URL" '. + {environment_url: $url}')
fi

STATUS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/deployments/$DEPLOYMENT_ID/statuses" \
  -d "$STATUS_PAYLOAD_JSON")

STATUS_HTTP=$(echo "$STATUS_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$STATUS_HTTP" -ne 201 ]; then
  echo "⚠️ Failed to update deployment status. HTTP Status: $STATUS_HTTP"
  echo "Response: $(echo "$STATUS_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')"
else
  echo "✅ Deployment status updated"
fi

# Create Commit Status (only for preview deployments with a URL)
if [ "$ENVIRONMENT" = "preview" ] && [ -n "$TARGET_URL" ]; then
  CHECK_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/statuses/$COMMIT_SHA" \
    -d '{
      "state": "success",
      "target_url": "'"$TARGET_URL"'",
      "description": "Preview ready",
      "context": "deploy/preview"
    }')

  CHECK_HTTP=$(echo "$CHECK_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

  if [ "$CHECK_HTTP" -ne 201 ]; then
    echo "⚠️ Failed to create status check. HTTP Status: $CHECK_HTTP"
    echo "Response: $(echo "$CHECK_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')"
  else
    echo "✅ Status check created for deploy/preview context"
  fi
fi

echo "🎉 GitHub integration completed successfully!"
