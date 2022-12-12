import { AttributeType, Table, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from "constructs";

export class DynamoDBTable extends Construct {

    table: Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const tableName = "emailInformation";

        const table = new Table(scope, `${tableName}Table`, {
            tableName: tableName,
            partitionKey: {
                name: "eventName",
                type: AttributeType.STRING,
            },
            sortKey: { 
                name: "timestamp", 
                type: AttributeType.NUMBER
            },
            readCapacity: 5,
            writeCapacity: 5,
            removalPolicy: RemovalPolicy.DESTROY,
            stream: StreamViewType.NEW_IMAGE
        });

        this.table = table;
    }
    
}