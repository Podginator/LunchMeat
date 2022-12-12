import React, { ReactNode } from 'react';
import StatsSmallView from '../StatsSmallView';

import './TotalPageCount.css';

interface TotalPageCountProps { 
    totalCount?: number;
}

function TotalPageCount(props: TotalPageCountProps) {
    return ( 
        <StatsSmallView title='Total Received'>
            <div className='totalCountText'> 
                {props.totalCount}
            </div>
        </StatsSmallView>
    )
}

export default TotalPageCount;
