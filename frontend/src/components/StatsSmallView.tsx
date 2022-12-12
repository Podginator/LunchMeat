import React, { ReactNode } from 'react';

import './StatsSmallView.css';

interface StatsSmallViewProps {
    children?: ReactNode
    title?: string
}

function StatsSmallView(props: StatsSmallViewProps) {
    return (
        <div className='smallStatsView'>
            <div className='smallStatsTitle'>{props.title}</div>
            <div className='smallStatsContent'>
                {props.children}
            </div>
        </div>)

}

export default StatsSmallView;
