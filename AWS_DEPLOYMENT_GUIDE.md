# AWS Deployment Guide

This guide explains how to deploy your application to AWS with a custom domain.

## Recommended Option: AWS Elastic Beanstalk

Elastic Beanstalk is the easiest way to deploy - it handles infrastructure automatically.

---

## Prerequisites

1. **AWS Account** - Create one at [aws.amazon.com](https://aws.amazon.com)
2. **AWS CLI** - Install from [AWS CLI Installation](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
3. **EB CLI** - Install with: `pip install awsebcli`
4. **Custom Domain** - Purchase from any registrar (GoDaddy, Namecheap, Route 53, etc.)

---

## Step 1: Configure AWS Credentials

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `ap-south-1` for Mumbai)
- Output format: `json`

---

## Step 2: Build Your Application

Run this command to create a production build:

```bash
npm run build
```

---

## Step 3: Initialize Elastic Beanstalk

```bash
# Navigate to your project directory
cd /path/to/your/project

# Initialize EB application
eb init

# Follow the prompts:
# 1. Select region (choose closest to your users)
# 2. Create new application or select existing
# 3. Select Node.js platform
# 4. Set up SSH if needed
```

---

## Step 4: Create Environment and Deploy

```bash
# Create a new environment and deploy
eb create production-env

# This will:
# - Create EC2 instances
# - Set up load balancer
# - Configure auto-scaling
# - Deploy your application
```

Wait 5-10 minutes for deployment to complete.

---

## Step 5: Verify Deployment

```bash
# Open your deployed app in browser
eb open

# Check status
eb status

# View logs if needed
eb logs
```

---

## Step 6: Configure Custom Domain

### Option A: Using AWS Route 53 (Recommended)

1. **Go to Route 53 in AWS Console**
2. **Create Hosted Zone** for your domain
3. **Update Nameservers** at your domain registrar with Route 53 nameservers
4. **Create Records**:
   - **A Record (Alias)**: Point `yourdomain.com` to your Elastic Beanstalk environment
   - **CNAME Record**: Point `www.yourdomain.com` to your EB URL

### Option B: Using External Domain Registrar

1. **Get your EB URL**: Run `eb status` to find your environment URL
2. **At your domain registrar**:
   - Create **CNAME record**: `www` pointing to `your-env.region.elasticbeanstalk.com`
   - For root domain, you may need to use a redirect or ALIAS record

---

## Step 7: Enable HTTPS (SSL Certificate)

### Request Certificate in AWS Certificate Manager (ACM)

1. Go to **AWS Certificate Manager** in the console
2. Click **Request a certificate**
3. Choose **Public certificate**
4. Enter your domain names:
   - `yourdomain.com`
   - `*.yourdomain.com` (wildcard for subdomains)
5. Choose **DNS validation**
6. Add the CNAME records to your domain (Route 53 can do this automatically)
7. Wait for certificate status to become **Issued**

### Attach Certificate to Load Balancer

1. Go to **Elastic Beanstalk** > Your Environment > **Configuration**
2. Click **Edit** on **Load Balancer**
3. Add a listener:
   - Port: 443
   - Protocol: HTTPS
   - SSL Certificate: Select your ACM certificate
4. Apply changes

---

## Step 8: Force HTTPS Redirect

Add this to your `.ebextensions/https-redirect.config`:

The file is already created in your project.

---

## Environment Variables

Set your environment variables in Elastic Beanstalk:

1. Go to **Elastic Beanstalk** > Your Environment > **Configuration**
2. Click **Edit** on **Software**
3. Add your environment variables:
   - All your secrets from the Replit Secrets tab
   - `NODE_ENV=production`

---

## Updating Your Application

After making changes:

```bash
# Build the frontend
npm run build

# Deploy to Elastic Beanstalk
eb deploy
```

---

## Monitoring and Logs

```bash
# View logs
eb logs

# SSH into the instance
eb ssh

# Open the EB console
eb console
```

---

## Costs (Estimate)

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| EC2 (t2.micro) | 750 hours/month for 12 months | ~$8-10/month |
| Elastic Load Balancer | 750 hours for 12 months | ~$16/month |
| Route 53 | N/A | $0.50/month per hosted zone |
| ACM (SSL) | Free | Free |
| Data Transfer | 15 GB/month | $0.09/GB |

**Estimated Monthly Cost After Free Tier**: $25-40/month

---

## Troubleshooting

### Application won't start
```bash
eb logs --all
```

### Environment health is Red
```bash
eb health --refresh
```

### Database connection issues
- Ensure your RDS security group allows connections from EB
- Check environment variables are set correctly

---

## Quick Reference Commands

```bash
eb init          # Initialize EB application
eb create        # Create new environment
eb deploy        # Deploy latest code
eb open          # Open app in browser
eb status        # Check environment status
eb logs          # View logs
eb ssh           # SSH into instance
eb terminate     # Delete environment (careful!)
```

---

## Need Help?

- [AWS Elastic Beanstalk Documentation](https://docs.aws.amazon.com/elasticbeanstalk/)
- [Node.js on Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs.html)
- [Route 53 Documentation](https://docs.aws.amazon.com/route53/)
