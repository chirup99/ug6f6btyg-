#!/usr/bin/env npx tsx

import { setupAllGSIs, checkGSIStatus } from '../server/dynamodb-gsi-setup';
import 'dotenv/config';

async function main() {
  const command = process.argv[2];

  console.log('🔧 DynamoDB GSI Management Tool\n');
  console.log('AWS Region:', process.env.AWS_REGION || 'ap-south-1');
  console.log('---\n');

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials not found!');
    console.error('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.\n');
    process.exit(1);
  }

  if (command === 'check' || command === 'status') {
    await checkGSIStatus();
  } else if (command === 'setup' || command === 'create') {
    await setupAllGSIs();
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/setup-dynamodb-gsis.ts check   - Check GSI status for all tables');
    console.log('  npx tsx scripts/setup-dynamodb-gsis.ts setup   - Create all missing GSIs');
    console.log('');
    console.log('Note: GSI creation takes 5-10 minutes per index in AWS.');
    console.log('DynamoDB only allows creating one GSI at a time per table.');
  }
}

main().catch(console.error);
