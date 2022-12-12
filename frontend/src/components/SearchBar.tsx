import React, { ChangeEvent, useMemo, useState, MouseEvent } from 'react';
import { Row, Col } from 'react-grid-system';
import { ReactComponent as MailIcon } from '../envelope.svg';
import { LunchMeatService } from '../service/LunchMeatService';
import { debounce } from 'lodash';
import { gql, useMutation } from '@apollo/client';
import {} from "@apollo/client"
import { useNavigate } from "react-router-dom";


import './SearchBar.css';

const MUTATE_CREATE_SERVICE = gql`
    mutation CreateService($serviceName: String!, $signUpUrl: String!) {
        createService(serviceName: $serviceName, signUpUrl: $signUpUrl) {
            eventName
        }
      }
`;

function SearchBar() {
    const navigate = useNavigate();
    const [service, setService] = useState("");
    const [createService, { loading, error, data }] = useMutation<{ name: string}>(MUTATE_CREATE_SERVICE);

    const onChangeHandlerInput = (input: ChangeEvent<HTMLInputElement>) => {
        setService(input.target.value);
    }

    const debouncedHandler = useMemo(() => debounce(onChangeHandlerInput, 200), []);

    const onButtonPress = async (_: MouseEvent<HTMLButtonElement>) => {
        const extractedDomainServiceName = LunchMeatService.getServiceUrlName(service);

        // This either creates the service, or, if it already exists, returns the name of the existing service. 
        // We need to also return and handle errors, that can come later.
        try { 
            await createService({variables: { serviceName: extractedDomainServiceName, signUpUrl: service  }})
            navigate(`/domain/${extractedDomainServiceName}`);
        } catch (err: any) { 
            const [clientError] = err.graphQLErrors;
            const { errorType } = clientError;

            if (errorType == "SERVICE_CONFLICT") { 
                navigate(`/domain/${extractedDomainServiceName}`);
            }

        }
    }

    return (
        <>
            <Row >
                <Col xs={1} md={2}></Col>
                <Col xs={10} md={8} >
                    <div className='searchBoxContainer'>
                        <input onChange={debouncedHandler} placeholder='Enter a signup page to continue...' />
                        <button onClick={onButtonPress} disabled={!LunchMeatService.validateServiceUrl(service)}><MailIcon /></button>
                    </div>
                </Col>
                <Col xs={1} md={2}></Col>
            </Row>

        </>
    );
}

export default SearchBar;


