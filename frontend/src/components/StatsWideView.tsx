import React, { ReactNode } from 'react';

import './StatsWideView.css';

interface StatsWideViewProps {
    children?: ReactNode
    title?: string
}

function StatsWideView(props: StatsWideViewProps) {
    return (
        <div className='statsWideView'>
            <div className='statsWideTitle'>{props.title}</div>
            <div className='statsWideContent'>
                {props.children}
            </div>
        </div>)

}

export default StatsWideView;
