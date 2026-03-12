# AWS Elastic Beanstalk Deployment Guide for Beginners

This is a simple step-by-step guide to deploy your app to AWS Elastic Beanstalk.

## Step 1: Create the Deployment ZIP File

Run these commands in your terminal:

```bash
# Build the app (creates dist folder)
npm run build

# Create the zip file for deployment
node create-deployment-zip.cjs
```

You will now have a file called **`dist.zip`** in your project folder. This is what you'll upload to Elastic Beanstalk.

## Step 2: Create an AWS Account (if you don't have one)

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the signup steps (you'll need a credit card)
4. Once created, sign in to your AWS Console

## Step 3: Create an Elastic Beanstalk Application

1. Go to the AWS Console: https://console.aws.amazon.com
2. Search for "Elastic Beanstalk" in the search bar
3. Click on "Elastic Beanstalk"
4. Click the orange "Create application" button

## Step 4: Configure Your Application

Fill in these fields:

- **Application name**: Give your app a name (e.g., "my-trading-app")
- **Environment tier**: Select "Web server environment"
- **Platform**: Select "Node.js"
- **Platform branch**: Select the latest Node.js version
- **Application code**: Choose "Upload your code"

## Step 5: Upload Your ZIP File

1. Under "Application code", click "Choose file"
2. Select the **`dist.zip`** file from your project folder
3. Click "Create environment"

AWS will now take about 5-10 minutes to deploy your app. You'll see a loading screen while it sets up.

## Step 6: Get Your App URL

Once deployment is complete:

1. You'll see a green checkmark and a URL (looks like: `http://my-app-name-12345.us-east-1.elasticbeanstalk.com`)
2. Click on that URL to visit your live app!

## Step 7: Deploy Updates (Next Time)

When you make changes and want to update your app:

```bash
# Build the app
npm run build

# Create the zip file
node create-deployment-zip.cjs
```

Then:
1. Go back to Elastic Beanstalk console
2. Click "Upload and deploy"
3. Select the new `dist.zip` file
4. Click "Deploy"

Done! Your app will be updated.

## Important: Environment Variables

If your app needs API keys or secrets (like API credentials, database URLs, etc.):

1. In Elastic Beanstalk console, go to your environment
2. Click "Configuration" → "Software"
3. Add your environment variables there
4. Click "Apply"

## Troubleshooting

**If your app doesn't load:**
- Check the "Logs" tab in Elastic Beanstalk to see error messages
- Make sure all environment variables are set

**If you see errors about npm:**
- Make sure `package.json` is included in your zip file (it should be automatically)

## Common Issues & Fixes

### My zip file is too big
- Your zip is fine if it's under 500MB

### Port error
- Elastic Beanstalk automatically uses port 8081 for Node.js apps
- Your app should work as-is

### Database connection error
- Add your database URL as an environment variable in Elastic Beanstalk
- Check the "Environment variables" section (Step 7 above)

## Questions?

If something goes wrong:
1. Check the AWS Elastic Beanstalk logs (Environment → Logs)
2. Look for red error messages
3. Search for that error message online

Good luck! 🚀
