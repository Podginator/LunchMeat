import React, { ReactNode } from 'react';
import BarChart from '../charts/BarChart';
import StatsWideView from '../StatsWideView';

import './TotalPageCount.css';

interface LastSevenDayFrequencyProps { 
    dayCount: { [dayOfWeek: string]: number }
}

function LastSevenDayFrequency(props: LastSevenDayFrequencyProps) {
    return ( 
        <StatsWideView title='Last Week Received'>
            <BarChart data={Object.entries(props.dayCount).map(([xAxis, value]) => ({xAxis, value}))} width={375} height={125}/>
        </StatsWideView>
    )
}

export default LastSevenDayFrequency;
