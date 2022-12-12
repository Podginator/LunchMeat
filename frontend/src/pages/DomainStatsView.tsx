import { gql, useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import Header from '../components/Header';
import StatsContainer from '../components/StatsContainer';

import './DomainStatsView.css';


const QUERY_SERVICE_STATS = gql`
    query GetServiceStats($serviceName: String!) {
        getService(serviceName: $serviceName) {
            createdAt
            eventName
            signUpUrl
            status
            uuid
          }
      }
`;

const QUERY_MESSAGES = gql`
      query GetMessageStats($serviceName: String!, $start: Long, $end: Long) { 
        getEmails(serviceName: $serviceName, start: $start, end: $end) { 
            messages {
                subject
                fromAddress
                timestamp
              }
              stats {
                domains {
                  count
                  domain
                }
                spamCount {
                  ham
                  spam
                }
                totalCount
              }
            }
      }
`

function DomainStatsView() {
    const { domain } = useParams();
    const serviceQuery = useQuery(QUERY_SERVICE_STATS, {
        variables: { serviceName: domain }
    })

    const statsQuery = useQuery(QUERY_MESSAGES, { 
        variables: { serviceName: domain }
    });

    if (serviceQuery.data && statsQuery.data) {
        return (
            <div id="DomainStatsView">
                <Header title={domain!} />
                <StatsContainer 
                    messages={statsQuery.data.getEmails.messages}
                    serviceInfo={serviceQuery.data.getService} 
                    stats={statsQuery.data.getEmails.stats}
                />
            </div>
        );
    }

    return null;
}

export default DomainStatsView;





