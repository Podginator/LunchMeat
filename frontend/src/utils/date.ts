export const dayOfWeekString = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
];

export const monthString = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sept',
    'Oct',
    'Nov',
    'Dec'
]

export const getDayFromTimestamp = (timestamp: number) => { 
    const date = new Date(timestamp);
    const dayOfWeek = date.getUTCDay();

    return dayOfWeekString[dayOfWeek];
}

export const datePostFix = (date: Date) => {
    const prefixMap: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' } 
    const secondDigit = (date.getDay()) % 10;

    return prefixMap[secondDigit] || 'th';
}

export const getInOrderRecordForWeek= (start: Date): { [dayOfWeek: string]: number} => { 
    let iterator = 0; 
    let iteratedDate = new Date(start.setDate(start.getDate() - 6));
    let returnMap = {} as Record<string, number>; 
    

    do { 
        const day = getDayFromTimestamp(iteratedDate.getTime());
        returnMap = {...returnMap, [day]: 0};
        iteratedDate = new Date(iteratedDate.setDate(iteratedDate.getDate() + 1));
        iterator++; 
    } while(iterator < 7);

    return returnMap;
}