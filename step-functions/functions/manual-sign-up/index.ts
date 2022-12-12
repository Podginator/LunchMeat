import { SES } from 'aws-sdk'
import { SendEmailRequest } from 'aws-sdk/clients/ses';
import { generateEmailContents } from './email';

const sesClient = new SES({apiVersion: '2010-12-01'});

const { EMAIL } = process.env

export interface ManualSignUp { 
  emailInfo: { 
    signUpUrl: string;
    uuid: string;
    serviceName: string;
  }, 
  token: string
}

function generateEmail(event: ManualSignUp): SendEmailRequest { 
  return {
    Destination: { 
      ToAddresses: [EMAIL!]
    }, 
    Source: EMAIL!, 
    Message: {
      Body: {
        Html: {
          Data: generateEmailContents(event),
          Charset: 'UTF-8'
        }
      },
      Subject: { 
        Charset: 'UTF-8',
        Data: `LunchMeat: Manual Sign up required for ${event.emailInfo.serviceName}.`
      }
    }
  };
}

export async function handler(event: ManualSignUp): Promise<ManualSignUp> { 
  await sesClient.sendEmail(generateEmail(event)).promise();
  
  return event;
}