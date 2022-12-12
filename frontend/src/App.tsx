import React from 'react';
import { Routes, Route, Outlet, Link, BrowserRouter as Router } from "react-router-dom";
import './App.css';
import DomainStatsView from './pages/DomainStatsView';
import Homepage from './pages/Homepage';
import { ApolloClient, InMemoryCache, ApolloProvider, } from '@apollo/client';

export const client = new ApolloClient({
    uri: process.env.APPLICATION_URL,
    cache: new InMemoryCache(),
    headers: { 
      'x-api-key': process.env.APPLICATION_API_KEY
    }
});

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <Routes>
          <Route path="/">
            <Route index element={<Homepage />} />
            <Route path="/domain/:domain" element={<DomainStatsView />} />
          </Route>
        </Routes>
      </Router>

      <Outlet />
    </ApolloProvider>
  );
}

export default App;
