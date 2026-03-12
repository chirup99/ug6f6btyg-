#!/bin/bash

# Cloud Run Diagnostic Script
# Checks all configurations for post creation to work

echo "🔍 Checking Cloud Run Configuration for Neo Feed Post Creation..."
echo ""

PROJECT_ID="fast-planet-470408-f1"
SERVICE_NAME="perala"
REGION="us-central1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES_FOUND=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Checking Cloud Run Service Exists"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID &>/dev/null; then
    echo -e "${GREEN}✅ Service '$SERVICE_NAME' exists${NC}"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format='value(status.url)')
    echo "   URL: $SERVICE_URL"
else
    echo -e "${RED}❌ Service '$SERVICE_NAME' not found${NC}"
    echo "   Run: ./deploy-cloudrun-no-docker.sh"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Checking Cloud Run IAM (Unauthenticated Access)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if gcloud run services get-iam-policy $SERVICE_NAME --region $REGION --project $PROJECT_ID 2>/dev/null | grep -q "allUsers"; then
    echo -e "${GREEN}✅ Service allows unauthenticated access${NC}"
else
    echo -e "${RED}❌ Service requires authentication (will block CORS preflight)${NC}"
    echo "   Fix: gcloud run services add-iam-policy-binding $SERVICE_NAME \\"
    echo "          --region $REGION \\"
    echo "          --member=\"allUsers\" \\"
    echo "          --role=\"roles/run.invoker\""
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Checking Firestore IAM Permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "   Project Number: $PROJECT_NUMBER"

if gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --filter="bindings.members:${PROJECT_NUMBER}-compute" --format="value(bindings.role)" 2>/dev/null | grep -q "roles/datastore.user"; then
    echo -e "${GREEN}✅ Cloud Run has Firestore access (roles/datastore.user)${NC}"
else
    echo -e "${RED}❌ Missing Firestore permissions${NC}"
    echo "   Fix: gcloud projects add-iam-policy-binding $PROJECT_ID \\"
    echo "          --member=\"serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com\" \\"
    echo "          --role=\"roles/datastore.user\""
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Checking .env Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    
    # Check VITE_API_URL
    if grep -q "^VITE_API_URL=" .env; then
        VITE_API_URL=$(grep "^VITE_API_URL=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        if [ -z "$VITE_API_URL" ]; then
            echo -e "${YELLOW}⚠️  VITE_API_URL is empty (OK if single service deployment)${NC}"
        else
            echo -e "${GREEN}✅ VITE_API_URL is set: $VITE_API_URL${NC}"
            
            # Verify it matches Cloud Run URL
            if [ "$VITE_API_URL" == "$SERVICE_URL" ]; then
                echo -e "${GREEN}   ✅ Matches Cloud Run URL${NC}"
            else
                echo -e "${YELLOW}   ⚠️  Doesn't match Cloud Run URL${NC}"
                echo "      Expected: $SERVICE_URL"
                echo "      Found: $VITE_API_URL"
                echo "   Update .env with: VITE_API_URL=\"$SERVICE_URL\""
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  VITE_API_URL not found in .env${NC}"
        echo "   If you have separate frontend/backend, add:"
        echo "   VITE_API_URL=\"$SERVICE_URL\""
    fi
    
    # Check Firebase config
    if grep -q "^VITE_FIREBASE_API_KEY=" .env; then
        echo -e "${GREEN}✅ Firebase frontend config found${NC}"
    else
        echo -e "${RED}❌ Missing Firebase frontend config${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Checking Recent Builds"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RECENT_BUILD=$(gcloud builds list --limit 1 --project $PROJECT_ID --format="table(id,status,createTime)" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$RECENT_BUILD"
    
    BUILD_ID=$(gcloud builds list --limit 1 --project $PROJECT_ID --format="value(id)" 2>/dev/null)
    BUILD_STATUS=$(gcloud builds list --limit 1 --project $PROJECT_ID --format="value(status)" 2>/dev/null)
    
    if [ "$BUILD_STATUS" == "SUCCESS" ]; then
        echo -e "${GREEN}✅ Latest build successful${NC}"
    else
        echo -e "${RED}❌ Latest build status: $BUILD_STATUS${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${YELLOW}⚠️  No builds found${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Checking Recent Cloud Run Logs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Looking for Firebase Admin SDK initialization..."
if gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50 2>/dev/null | grep -q "Firebase Admin SDK initialized"; then
    echo -e "${GREEN}✅ Firebase Admin SDK initialized${NC}"
else
    echo -e "${RED}❌ Firebase Admin SDK not initialized${NC}"
    echo "   Check logs: gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""
echo "Looking for recent POST /api/social-posts requests..."
POST_ATTEMPTS=$(gcloud run services logs read $SERVICE_NAME --region $REGION --limit 100 2>/dev/null | grep "POST /api/social-posts" | wc -l)
if [ $POST_ATTEMPTS -gt 0 ]; then
    echo -e "${GREEN}✅ Found $POST_ATTEMPTS post creation attempts${NC}"
    echo ""
    echo "Last 3 attempts:"
    gcloud run services logs read $SERVICE_NAME --region $REGION --limit 100 2>/dev/null | grep "POST /api/social-posts" | head -3
else
    echo -e "${YELLOW}⚠️  No post creation attempts found in recent logs${NC}"
    echo "   Either no posts created yet, or check if frontend is calling correct URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Configuration looks good.${NC}"
    echo ""
    echo "If posts still fail to create:"
    echo "1. Check browser console for errors (F12)"
    echo "2. Stream logs while creating post: gcloud run services logs tail $SERVICE_NAME --region $REGION"
    echo "3. Verify user is signed in and has profile set up"
else
    echo -e "${RED}❌ Found $ISSUES_FOUND issue(s) that need to be fixed${NC}"
    echo ""
    echo "Run the fix commands shown above, then redeploy:"
    echo "  ./deploy-cloudrun-no-docker.sh"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Quick Links"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Service URL: $SERVICE_URL"
echo "Cloud Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo "Logs: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
echo ""
