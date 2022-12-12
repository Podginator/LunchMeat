import React, { ReactNode } from 'react';

import './StatsTallView.css';

interface StatsTallViewProps {
    children?: ReactNode
    title?: string
}

function StatsTallView(props: StatsTallViewProps) {
    return (
        <div className='statsTallView'>
            <div className='statsTallTitle'>{props.title}</div>
            <div className='statsTallContent'>
                {props.children}
            </div>
        </div>)

}

export default StatsTallView;
