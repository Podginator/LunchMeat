#!/bin/bash


# Build Frontend 
cd frontend && npm i && npm run build && cd .. && pwd

# Build Created Trigger
cd created-trigger && npm i && npm run compile && cd ..

# Build Step Functions 
cd step-functions/functions/automate-sign-up && npm run compile && cd ..
cd manual-sign-up && npm run compile && cd ..
cd validate-complete && npm run compile && cd ..
cd validate-sign-up && npm run compile && cd ../../..

# Build Email Handlers
cd email-handlers/register-message-to-dynamodb/ && npm run compile && cd ../..

# Deploy 

cd infra/cdk && npx cdk deploy 
