import { S3EventRecord } from "aws-lambda";
import { map, from, Observable, concatMap, mergeMap } from 'rxjs';
import { S3 } from "aws-sdk";
import { ParsedMail } from 'mailparser';
import { LunchMeatMetadata } from "../types/LunchMeatMetadata";
import { v4 } from 'uuid';

const s3Client = new S3();

export const downloadS3Buffer = concatMap((s3Event: S3EventRecord): Observable<string> => {
  const { s3 } = s3Event;
  const { bucket: { name }, object: { key } } = s3;

  return from(s3Client.getObject({
    Bucket: name,
    Key: key
  }).promise())
    .pipe( 
      map(it => it.Body!!.toString('utf-8'))
    )
});

export const writeToDataLakeStorage = mergeMap((mail: ParsedMail & LunchMeatMetadata) => { 
  return s3Client.putObject({ 
    Key: mail.s3StorageLocation,
    Bucket: process.env.STORAGE_BUCKET!, 
    Body: JSON.stringify(mail)
  })
  .promise()
});

export const getStorageLocationKey = (mail: ParsedMail, serviceName: string) => { 
  const date = mail.date!;
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate() + 1}/${date.getHours() + 1}/${serviceName.replace(".",":")}/${v4()}.json`;
}