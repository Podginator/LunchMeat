import { ManualSignUp } from ".";
import * as fs from 'fs';

const EMAIL_TEMPLATE = fs.readFileSync(`${process.cwd()}/template.html`).toString();

export const generateEmailContents = (email: ManualSignUp): string => { 
    const encodedToken = encodeURIComponent(email.token);
    const encodedService = encodeURIComponent(email.emailInfo.serviceName)
    return EMAIL_TEMPLATE
        .replace('{serviceName}', email.emailInfo.serviceName)
        .replace('{uuid}', email.emailInfo.uuid)
        .replace('{signupUrl}', email.emailInfo.signUpUrl)
        .replace('{approvalUrl}', `https://${process.env.API_ADDRESS!}/approve/${encodedService}/true?token=${encodedToken}`)
        .replace('{denyUrl}', `https://${process.env.API_ADDRESS!}/approve/${encodedService}/false?token=${encodedToken}`);
}
