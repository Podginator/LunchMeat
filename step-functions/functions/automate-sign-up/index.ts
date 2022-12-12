

interface AutomatedSignUp { 
  signupUrl: string;
  uuid: string;
  serviceName: string;
}

export async function handler(event: AutomatedSignUp): Promise<AutomatedSignUp> { 
  throw new Error("Functionality not implemented yet!");

  return event;
}