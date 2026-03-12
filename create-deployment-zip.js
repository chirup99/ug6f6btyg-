const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a zip file from the dist folder
const zipFileName = 'dist.zip';
const distFolder = './dist';

if (!fs.existsSync(distFolder)) {
  console.error('Error: dist folder not found. Please run "npm run build" first.');
  process.exit(1);
}

try {
  // Use zip command if available, otherwise use a Node library
  console.log('Creating deployment zip file...');
  execSync(`cd . && zip -r ${zipFileName} ${distFolder}`, { stdio: 'inherit' });
  console.log(`✓ Created ${zipFileName} successfully!`);
} catch (error) {
  // Fallback: try with npm package if zip command fails
  console.log('Zip command not found. Installing archiver for zip creation...');
  try {
    execSync('npm list archiver', { stdio: 'ignore' });
  } catch {
    console.log('Installing archiver...');
    execSync('npm install --save-dev archiver', { stdio: 'inherit' });
  }
  
  // Use archiver to create zip
  const archiver = require('archiver');
  const output = fs.createWriteStream(zipFileName);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', function() {
    console.log(`✓ Created ${zipFileName} successfully! (${archive.pointer()} bytes)`);
  });
  
  archive.on('error', function(err) {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory(distFolder, false);
  archive.finalize();
}
