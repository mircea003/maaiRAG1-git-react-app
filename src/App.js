import './App.css';

import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Define the backendURL based on the environment
  const backendURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'
      : process.env.REACT_APP_BACKEND_URL || 'https://maairag1webapp-f9deetd3bdehe7e2.westeurope-01.azurewebsites.net/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await axios.post(
        `${backendURL}/query`,
        new URLSearchParams({ query })
      );
      setResponse(result.data);
    } catch (error) {
      console.error('Error querying the backend:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Document Query</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query"
        />
        <button type="submit">Search</button>
      </form>
      {loading && <p>Loading...</p>}
      {response && (
        <div>
          <h2>Answer:</h2>
          <p>{response.answer}</p>
          <h3>Sources:</h3>
          <ul>
            {response.sources.map((source, index) => (
              <li key={index}>{source}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
