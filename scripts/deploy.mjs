#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ENVIRONMENTS = {
  dev: 'development',
  prod: 'production',
} as const;

type Environment = keyof typeof ENVIRONMENTS;

/**
 * Deployment script for FBO Lambda Template
 */
class LambdaDeployer {
  private environment: Environment;
  private functionName: string;
  private region: string;

  constructor() {
    this.parseArguments();
    this.validateEnvironment();
    this.loadConfiguration();
  }

  private parseArguments(): void {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      this.showUsage();
      process.exit(1);
    }

    const env = args[0] as Environment;
    
    if (!Object.keys(ENVIRONMENTS).includes(env)) {
      console.error(`❌ Invalid environment: ${env}`);
      this.showUsage();
      process.exit(1);
    }

    this.environment = env;
  }

  private validateEnvironment(): void {
    const requiredEnvVars = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(envVar => console.error(`   - ${envVar}`));
      process.exit(1);
    }
  }

  private loadConfiguration(): void {
    const envFile = `.env.${this.environment}`;
    
    if (!existsSync(envFile)) {
      console.error(`❌ Environment file not found: ${envFile}`);
      process.exit(1);
    }

    // Load environment-specific configuration
    const envContent = readFileSync(envFile, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    }

    this.functionName = process.env.LAMBDA_FUNCTION_NAME || `fbo-lambda-template-${this.environment}`;
    this.region = process.env.AWS_REGION || 'us-east-1';
  }

  private showUsage(): void {
    console.log(`
Usage: npm run deploy <environment>

Environments:
  dev   - Deploy to development environment
  prod  - Deploy to production environment

Examples:
  npm run deploy dev
  npm run deploy prod

Prerequisites:
  - AWS CLI configured with appropriate credentials
  - Environment files (.env.dev, .env.prod) configured
  - Lambda function already created in AWS
`);
  }

  private runCommand(command: string, description: string): void {
    console.log(`🔄 ${description}...`);
    
    try {
      execSync(command, { stdio: 'inherit' });
      console.log(`✅ ${description} completed`);
    } catch (error) {
      console.error(`❌ ${description} failed`);
      process.exit(1);
    }
  }

  private checkLambdaExists(): boolean {
    try {
      execSync(`aws lambda get-function --function-name ${this.functionName} --region ${this.region}`, { 
        stdio: 'pipe' 
      });
      return true;
    } catch {
      return false;
    }
  }

  async deploy(): Promise<void> {
    console.log(`🚀 Starting deployment to ${this.environment} environment`);
    console.log(`   Function: ${this.functionName}`);
    console.log(`   Region: ${this.region}`);
    console.log('');

    // Check if Lambda function exists
    if (!this.checkLambdaExists()) {
      console.error(`❌ Lambda function '${this.functionName}' not found in region '${this.region}'`);
      console.log('Please create the Lambda function first or check your configuration.');
      process.exit(1);
    }

    // Clean previous build
    this.runCommand('npm run clean', 'Cleaning previous build');

    // Install dependencies
    this.runCommand('npm ci', 'Installing dependencies');

    // Run type checking
    this.runCommand('npm run type-check', 'Type checking');

    // Run linting
    this.runCommand('npm run lint', 'Linting code');

    // Run tests
    this.runCommand('npm run test', 'Running tests');

    // Build project
    this.runCommand('npm run build', 'Building project');

    // Create deployment package
    this.runCommand('npm run package', 'Creating deployment package');

    // Deploy to AWS Lambda
    this.runCommand(
      `aws lambda update-function-code --function-name ${this.functionName} --zip-file fileb://lambda-deployment.zip --region ${this.region}`,
      'Deploying to AWS Lambda'
    );

    // Update environment variables
    const envVars = this.buildEnvironmentVariables();
    this.runCommand(
      `aws lambda update-function-configuration --function-name ${this.functionName} --environment Variables='${envVars}' --region ${this.region}`,
      'Updating environment variables'
    );

    console.log('');
    console.log(`🎉 Deployment to ${this.environment} completed successfully!`);
    console.log(`   Function: ${this.functionName}`);
    console.log(`   Region: ${this.region}`);
  }

  private buildEnvironmentVariables(): string {
    const envVars = {
      NODE_ENV: ENVIRONMENTS[this.environment],
      FINANCE_API_BASE_URL: process.env.FINANCE_API_BASE_URL,
      FINANCE_API_KEY: process.env.FINANCE_API_KEY,
      FINANCE_DISPERSION_ENDPOINT: process.env.FINANCE_DISPERSION_ENDPOINT,
      SFTP_HOST: process.env.SFTP_HOST,
      SFTP_PORT: process.env.SFTP_PORT,
      SFTP_USERNAME: process.env.SFTP_USERNAME,
      SFTP_PASSWORD: process.env.SFTP_PASSWORD,
      SFTP_UPLOAD_PATH: process.env.SFTP_UPLOAD_PATH,
      SFTP_DOWNLOAD_PATH: process.env.SFTP_DOWNLOAD_PATH,
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
      FILE_REQUEST_PREFIX: process.env.FILE_REQUEST_PREFIX,
      FILE_RESPONSE_PREFIX: process.env.FILE_RESPONSE_PREFIX,
      AWS_REGION: this.region,
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
    };

    // Filter out undefined values
    const filteredEnvVars = Object.fromEntries(
      Object.entries(envVars).filter(([_, value]) => value !== undefined)
    );

    return JSON.stringify(filteredEnvVars);
  }
}

// Run deployment
const deployer = new LambdaDeployer();
deployer.deploy().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});