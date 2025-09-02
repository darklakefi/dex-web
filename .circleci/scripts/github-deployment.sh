#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- Variable Checks ---
if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️  GITHUB_TOKEN not set, skipping GitHub integration"
  exit 0
fi

if [ -z "$VERCEL_URL" ]; then
  echo "❌ VERCEL_URL not set, cannot create deployment"
  exit 1
fi

if [[ ! "$VERCEL_URL" =~ ^https?:// ]]; then
  echo "❌ Invalid Vercel URL format: $VERCEL_URL"
  exit 1
fi

REPO_OWNER="$CIRCLE_PROJECT_USERNAME"
REPO_NAME="$CIRCLE_PROJECT_REPONAME"
COMMIT_SHA="$CIRCLE_SHA1"

# --- Pre-flight Debugging ---
echo "--- DEBUGGING VARIABLES ---"
echo "REPO_OWNER: '$REPO_OWNER'"
echo "REPO_NAME: '$REPO_NAME'"
echo "COMMIT_SHA: '$COMMIT_SHA'"
echo "VERCEL_URL: '$VERCEL_URL'"
echo "--- END DEBUGGING ---"

# Check if essential repo variables are set
if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
    echo "❌ ERROR: REPO_OWNER or REPO_NAME is empty. Check CircleCI project VCS settings."
    exit 1
fi


echo "🚀 Creating GitHub deployment for commit: $COMMIT_SHA"
echo "📁 Repository: $REPO_OWNER/$REPO_NAME"
echo "🔗 Preview URL: $VERCEL_URL"

# --- 1. Create GitHub deployment ---
DEPLOYMENT_URL="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/deployments"
echo "DEBUG: Posting to Deployment URL: $DEPLOYMENT_URL"

DEPLOYMENT_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "$DEPLOYMENT_URL" \
  -d '{
    "ref": "'$COMMIT_SHA'",
    "environment": "preview",
    "auto_merge": false,
    "required_contexts": []
  }')

HTTP_STATUS=$(echo "$DEPLOYMENT_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
DEPLOYMENT_BODY=$(echo "$DEPLOYMENT_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

if [ "$HTTP_STATUS" -ne 201 ]; then
  echo "❌ Failed to create deployment. HTTP Status: $HTTP_STATUS"
  echo "Response: $DEPLOYMENT_BODY"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "jq not found, attempting to install..."
  # Use 'apt-get' on Debian/Ubuntu-based images. Adjust if using Alpine (apk) or other base images.
  if [ -f /etc/debian_version ]; then
    sudo apt-get update && sudo apt-get install -y jq
  else
    echo "❌ Cannot determine package manager to install jq. Please install jq in the job's docker image."
    exit 1
  fi
fi

DEPLOYMENT_ID=$(echo "$DEPLOYMENT_BODY" | jq -r '.id')

if [ "$DEPLOYMENT_ID" == "null" ] || [ -z "$DEPLOYMENT_ID" ]; then
    echo "❌ Could not parse DEPLOYMENT_ID from response."
    echo "Response Body: $DEPLOYMENT_BODY"
    exit 1
fi

echo "✅ Deployment created (ID: $DEPLOYMENT_ID)"

# --- 2. Update deployment status ---
STATUS_URL="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/deployments/$DEPLOYMENT_ID/statuses"
echo "DEBUG: Posting to Status URL: $STATUS_URL"

STATUS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "$STATUS_URL" \
  -d '{
    "state": "success",
    "environment_url": "'$VERCEL_URL'",
    "description": "Preview deployment ready"
  }')

STATUS_HTTP=$(echo "$STATUS_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$STATUS_HTTP" -ne 201 ]; then
  echo "⚠️  Failed to update deployment status. HTTP Status: $STATUS_HTTP"
  echo "Response: $(echo "$STATUS_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')"
else
  echo "✅ Deployment status updated"
fi

# --- 3. Create commit status check ---
CHECK_URL="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/statuses/$COMMIT_SHA"
echo "DEBUG: Posting to Check URL: $CHECK_URL"

CHECK_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "$CHECK_URL" \
  -d '{
    "state": "success",
    "target_url": "'$VERCEL_URL'",
    "description": "Preview ready",
    "context": "deploy/preview"
  }')

CHECK_HTTP=$(echo "$CHECK_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$CHECK_HTTP" -ne 201 ]; then
  echo "⚠️  Failed to create status check. HTTP Status: $CHECK_HTTP"
  echo "Response: $(echo "$CHECK_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')"
else
  echo "✅ Status check created for deploy/preview context"
fi

echo "🎉 GitHub integration completed successfully!"
