#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();

const accountId = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'eu-central-1';

if (!accountId) {
  throw new Error('CDK_DEFAULT_ACCOUNT environment variable not set');
}

new InfrastructureStack(app, 'TeslaMateInfrastructureStack', {
  env: {
    account: accountId,
    region: region,
  },
});