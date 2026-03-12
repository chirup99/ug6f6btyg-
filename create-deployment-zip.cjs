const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Allow custom zip filename from command line, default to 'dist.zip'
const zipFileName = process.argv[2] || 'dist.zip';
const distFolder = './dist';

if (!fs.existsSync(distFolder)) {
  console.error('Error: dist folder not found. Please run "npm run build" first.');
  process.exit(1);
}

try {
  console.log('Creating deployment zip file for AWS Elastic Beanstalk...');
  
  // Include only essential files for AWS Elastic Beanstalk
  execSync(`zip -r ${zipFileName} dist package.json Procfile`, { stdio: 'inherit' });
  
  console.log(`✓ Created ${zipFileName} successfully!`);
  console.log(`Ready to deploy to AWS Elastic Beanstalk!`);
} catch (error) {
  console.error('Error creating zip file. Make sure zip command is available.');
  process.exit(1);
}
