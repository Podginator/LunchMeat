import React, { ReactNode } from 'react';
import PieChart from '../charts/PieChart';
import StatsSmallView from '../StatsSmallView';

import './TotalPageCount.css';

interface SpamHamChartProps { 
    domains: {
        domain: string, 
        count: number
    }[]
}

function SpamHamChart(props: SpamHamChartProps) {
    return ( 
        <StatsSmallView title='Domains Sent'>
            <PieChart data={props.domains.map(it => ({ label: it.domain, value: it.count}))} fontSize={6} height={135} width={135}/>
        </StatsSmallView>
    )
}

export default SpamHamChart;
