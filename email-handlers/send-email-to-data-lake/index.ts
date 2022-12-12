import { S3Event } from "aws-lambda";
import { from, mergeMap, lastValueFrom } from 'rxjs';
import { ParsedMail, simpleParser } from 'mailparser';
import { downloadS3Buffer, getStorageLocationKey, writeToDataLakeStorage } from "./libs/s3";
import { getServiceInformation } from "../shared/libs/dynamodb";
import { LunchMeatMetadata } from "./types/LunchMeatMetadata";

export const convertToMailObject = mergeMap((contents: string): Promise<ParsedMail> => simpleParser(contents));

const convertToDataLakeStorage = mergeMap(async(parsedMail: ParsedMail): Promise<LunchMeatMetadata & ParsedMail> => { 
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
    s3StorageLocation: getStorageLocationKey(parsedMail),
    timestamp: parsedMail.date!.getMilliseconds(),
    ...parsedMail
  };
})

export async function handler(event: S3Event): Promise<void> {
  await lastValueFrom(from(event.Records)
    .pipe(
      downloadS3Buffer,
      convertToMailObject,
      convertToDataLakeStorage, 
      writeToDataLakeStorage
    ));

  return 
}