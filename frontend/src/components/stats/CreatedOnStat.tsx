import React from 'react';
import './CreatedOnStat.css';
import { datePostFix, dayOfWeekString, monthString } from '../../utils/date';

class CreatedOnProps {
    date?: Date;
    verifiedStatus: string = "UNVERIFIED"
}

function CreatedOnStat(props: CreatedOnProps) {

    const formatDate = (date: Date) => {
        const dayOfWeek = dayOfWeekString[date.getDay() - 1];
        const postFix = datePostFix(date);

        return (<>
            <div className='fullDateString'>{`${dayOfWeek} ${date.getDate()}`}<span className='createdOnPostFix'><>{postFix}</></span>{`  ${monthString[date.getMonth()]}`}</div>
            <div className='createdOnYearString'>{date.getFullYear()}</div>
        </>);
    };

    const getCssClassForVerifiedStatus = (verifiedStatus: string) => { 
        switch(verifiedStatus) { 
            case "APPROVED": 
                return 'createdOnVerified'
            case "UNVERIFIED":
                return 'createdOnNotVerified'
            default: 
                return 'createdOnInvalid'
        }
    }

    return (
        <div className={`smallStatsView ${getCssClassForVerifiedStatus(props.verifiedStatus)}`}>
            <div className='smallStatsTitle'>Created On</div>
            <div className='smallStatsContent'>
                <div className='createdOnStat'>
                    {formatDate(props.date!)}
                </div>
            </div>


        </div>
    )
}

export default CreatedOnStat;
