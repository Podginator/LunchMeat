import React, { ReactNode } from 'react';
import PieChart from '../charts/PieChart';
import StatsSmallView from '../StatsSmallView';

import './TotalPageCount.css';


interface SpamHamChartProps {
    stats: { spam: number, ham: number }
}

function SpamHamChart(props: SpamHamChartProps) {
    const toData = [{label: "Spam",value: props.stats.spam}, { label: "Ham", value: props.stats.ham }].filter(({ value }) => value);

    return (
        <StatsSmallView title='Spam Count'>
            <PieChart data={toData} height={135} width={135} />
        </StatsSmallView>
    )
}

export default SpamHamChart;
