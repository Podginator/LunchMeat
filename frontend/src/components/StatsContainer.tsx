import React from 'react';
import CreatedOnStat from './stats/CreatedOnStat';
import LastSevenDaysHistogramStats from './stats/LastSevenDaysHistogramStats';

import './StatsContainer.css';
import StatsSmallView from './StatsSmallView';
import StatsTallView from './StatsTallView';
import StatsWideView from './StatsWideView';
import TotalPageCount from './stats/TotalPageCount';
import SpamHamChart from './stats/SpamHamChart';
import DomainChart from './stats/DomainChart';
import { getDayFromTimestamp, getInOrderRecordForWeek } from '../utils/date';

interface Messages { subject: string, timestamp: number }

interface DomainStatsProps {
    serviceInfo: {
        createdAt: number;
        status: string;
    },
    messages: Messages[]
    stats: {
        totalCount: number
        spamCount: {
            spam: number,
            ham: number
        },
        domains: {
            domain: string, 
            count: number
        }[]
    }
}

function StatsContainer(props: DomainStatsProps) {

    // This is possibly something we should do on the backend at some point, but I'm not too sure how right now. Given there is no API currently, 
    // and it is all done via AppSync.
    const getLastSevenDaysOfEmails = (messages: Messages[]) => { 
        const today = new Date();
        today.setHours(23, 59, 59);

        const unmodifiedToday = new Date();
        const sevenDaysAgo = new Date(unmodifiedToday.setDate(unmodifiedToday.getDate() - 7));
        sevenDaysAgo.setHours(0,0,0);

        return messages
                .filter(it => it.timestamp >= sevenDaysAgo.getTime() && it.timestamp <= today.getTime())
                .reduce((acc, curr) => { 
                    const dayOfWeek = getDayFromTimestamp(curr.timestamp);
                    acc[dayOfWeek] += 1; 
                    
                    return acc;
                }, getInOrderRecordForWeek(sevenDaysAgo))
    }

    return (<div id="StatsContainer">
        <CreatedOnStat date={new Date(props.serviceInfo.createdAt)} verifiedStatus={props.serviceInfo.status} />
        <TotalPageCount totalCount={props.stats.totalCount} />
        <LastSevenDaysHistogramStats dayCount={getLastSevenDaysOfEmails(props.messages)} />
        <SpamHamChart stats={props.stats.spamCount} />
        <DomainChart domains={props.stats.domains} />
        <StatsTallView />
        <StatsWideView />
    </div>)
}

export default StatsContainer;
