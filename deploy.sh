#!/bin/bash
# This script provides a reliable, repeatable way to build and deploy the application.
# It ensures that all necessary build-time variables and runtime secrets are correctly configured.

echo "INFO: Starting the Cloud Build process..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null
then
    echo "ERROR: gcloud command not found. Please install the Google Cloud SDK and ensure it is in your PATH."
    exit 1
fi

# Submit the build to Google Cloud Build, using the configuration from cloudbuild.yaml
# This is the crucial step that correctly injects the VITE_* variables for the frontend build.
gcloud builds submit . --config=cloudbuild.yaml

# The cloudbuild.yaml file handles the subsequent push and deploy steps.
echo "INFO: Cloud Build process initiated. Monitor the build progress in the Google Cloud Console."
echo "INFO: https://console.cloud.google.com/cloud-builds"
