import React from 'react';
import { Row, Col } from 'react-grid-system';


import './Header.css';

interface HeaderProps { 
    title: string; 
}

function Header(props: HeaderProps) {
    return (
        <>
            <Row id="HeaderRow">
                <Col md={2} className="headerLogo"><a href='/'><img className="logoImg" src="/LunchMeatLogo.png" /></a></Col>
                <Col md={8} className="headerText">{props.title}</Col>
                <Col md={2}></Col>
            </Row>
        </>
    );
}

export default Header;





