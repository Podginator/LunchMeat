import { S3Event, SQSEvent, SQSRecord } from "aws-lambda";
import { from, mergeMap, lastValueFrom, map } from 'rxjs';
import { ParsedMail, simpleParser } from 'mailparser';
import { downloadS3Buffer, getStorageLocationKey } from "./libs/s3";
import { getServiceInformation, saveDataToDynamoDb } from "./libs/dynamodb";
import { LunchMeatMetadata } from "./types/LunchMeatMetadata";

export const convertToMailObject = mergeMap((contents: string): Promise<ParsedMail> => simpleParser(contents));

const convertParsedMailToMailStorageObject = mergeMap(async(parsedMail: ParsedMail): Promise<LunchMeatMetadata> => { 
  const to = Array.isArray(parsedMail.to) ? parsedMail.to! : [parsedMail.to!];
  const relevantAddress = to.flatMap(it => it.value)
    .filter(it => it.address?.includes(process.env.DOMAIN_NAME!!))
    .map(it => it.address!.match(/(^.*)(?=(\@))/)?.[0]);

  const [uuid] = relevantAddress;

  if (!uuid) { 
    throw new Error("No Common Email Address Found (How?)");
  }

  const alias = await getServiceInformation(uuid);
  
  return { 
    toAddress: `${uuid}@${process.env.DOMAIN_NAME}`,
    fromAddress: parsedMail.from!.value[0].address!,
    serviceName: alias.serviceName, 
    s3StorageLocation: getStorageLocationKey(parsedMail, alias.serviceName),
    timestamp: parsedMail.date!.getTime(),
    subject: parsedMail.subject || "NONE"
  };
})

const extractSqsMessages = mergeMap((it: SQSRecord) => {
    const s3Event = JSON.parse(it.body) as S3Event
    return s3Event.Records;
});

export async function handler(event: SQSEvent): Promise<void> {
  await lastValueFrom(from(event.Records)
    .pipe(
      extractSqsMessages,
      downloadS3Buffer,
      convertToMailObject,
      convertParsedMailToMailStorageObject,
      saveDataToDynamoDb
    ));
    
  return 
}