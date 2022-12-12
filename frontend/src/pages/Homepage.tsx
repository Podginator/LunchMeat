import React from 'react';
import { Row, Col } from 'react-grid-system';
import SearchBar from '../components/SearchBar';

import './Homepage.css';

function Homepage() {
    return (
        <>
            <Row className="divider"></Row>
            <Row >
                <Col xs={1} md={2}></Col>
                <Col xs={10} md={8} >
                    <div id="LogoHolder">
                        <div className='overlay'></div>
                        <img src="LunchMeatLogo.png" />
                    </div>
                </Col>
                <Col xs={1} md={2}></Col>
            </Row>
            <div className='searchBarContainer'>
                <SearchBar />
            </div>
        </>
    );
}

export default Homepage;





