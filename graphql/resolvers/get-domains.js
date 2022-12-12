import { util } from '@aws-appsync/utils';

export function request(ctx) {
}

export function response(ctx) {
    const items = ctx.source.items; 
    const returnMap = {} 
    const returnArr = [];

    for (const item of items) { 
        const domain = item.fromAddress.replace("(.+)@", "");

        if (returnMap[domain]) { 
            returnMap[domain] = returnMap[domain] + 1;
        } else { 
            returnMap[domain] = 1; 
        }
    }
    
    for (const domain of Object.keys(returnMap)) { 
        returnArr.push({ domain, count: returnMap[domain] })
    }

    console.log(returnArr);
    return returnArr;
}