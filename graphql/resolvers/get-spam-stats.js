import { util } from '@aws-appsync/utils';

export function request(ctx) {
}

export function response(ctx) {
    const items = ctx.source.items; 
    const returnMap = { spam: 0, ham: 0 }; 

    for (const item of items) { 
        if (item.spam == true) { 
            returnMap.spam = returnMap.spam + 1;
        } else { 
            returnMap.ham = returnMap.ham + 1;
        }
    }
    return returnMap;
}