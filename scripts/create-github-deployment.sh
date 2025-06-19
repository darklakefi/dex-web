#!/bin/bash
set -e

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

REPO_OWNER="darklakefi"
REPO_NAME="dex-web"
COMMIT_SHA="$CIRCLE_SHA1"

echo "🚀 Creating GitHub deployment for commit: $COMMIT_SHA"
echo "📁 Repository: $REPO_OWNER/$REPO_NAME"
echo "🔗 Preview URL: $VERCEL_URL"

DEPLOYMENT_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/deployments \
  -d '{
    "ref": "'"$COMMIT_SHA"'",
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

DEPLOYMENT_ID=$(echo "$DEPLOYMENT_BODY" | jq -r '.id')
echo "✅ Deployment created (ID: $DEPLOYMENT_ID)"

STATUS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/deployments/"$DEPLOYMENT_ID"/statuses \
  -d '{
    "state": "success",
    "environment_url": "'"$VERCEL_URL"'",
    "description": "Preview deployment ready"
  }')

STATUS_HTTP=$(echo "$STATUS_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$STATUS_HTTP" -ne 201 ]; then
  echo "⚠️  Failed to update deployment status. HTTP Status: $STATUS_HTTP"
  echo "Response: $(echo "$STATUS_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')"
else
  echo "✅ Deployment status updated"
fi

CHECK_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/statuses/"$COMMIT_SHA" \
  -d '{
    "state": "success",
    "target_url": "'"$VERCEL_URL"'",
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
