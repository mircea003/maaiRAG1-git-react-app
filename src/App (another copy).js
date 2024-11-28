import './App.css';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import DocumentList from './DocumentList'; // Import DocumentList

function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [existingFileDetails, setExistingFileDetails] = useState(null);
  const [newFileDetails, setNewFileDetails] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [suggestedNewName, setSuggestedNewName] = useState('');

  // Define the backendURL based on the environment
  const backendURL =
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'
      : process.env.REACT_APP_BACKEND_URL ||
        'https://maairag1webapp-f9deetd3bdehe7e2.westeurope-01.azurewebsites.net/';

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

  // Fetch the documents when the frontend loads
  const fetchDocuments = async () => {
    try {
      const result = await axios.get(`${backendURL}/list-documents`);
      setDocuments(result.data.documents); // Update the document list state
    } catch (error) {
      console.error('Error fetching document list:', error);
    }
  };

  // Call fetchDocuments when the component loads
  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleInput = (e) => {
    const textarea = e.target;

    // Reset the height to allow shrinking
    textarea.style.height = 'auto';

    // Set the height dynamically based on the scroll height
    const lineHeight = 24; // Approximate line height in pixels
    const maxHeight = lineHeight * 8; // Maximum height for 8 rows
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;

    // If content exceeds 8 rows, enable scrolling
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.overflowY = 'scroll';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  };

  return (
    <div className="App">
      {/* Header Section */}
      <div className="header-container">
        <header className="header">
          <img src="/maaiLOGO.jpg" alt="maAI Logo" className="logo" />
          <h1 className="title">maAI Docs</h1>
        </header>
      </div>

      {/* Content Section */}
      <div className="container">
        {/* Left Side */}
        <div className="left">
          {/* Answer Section */}
          <div className="answer-section">
            <div className="markdown-answer">
              <ReactMarkdown>
                {response?.answer || 'Așteptăm întrebarea ta...'}
              </ReactMarkdown>
            </div>
          </div>

          {/* Sources Section */}
          <div className="sources-section">
            <h3>surse:</h3>
            <ul>
              {response?.sources?.length > 0 ? (
                response.sources.map((source, index) => (
                  <li key={index}>{source}</li>
                ))
              ) : (
                <li>Nici o sursă utilizată...</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Side */}
        <div className="right">
          <form onSubmit={handleSubmit}>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onInput={handleInput}
              placeholder="Scrie întrebarea ta aici..."
              rows="3"
              style={{ resize: 'none', overflow: 'hidden' }}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Se încarcă...' : 'Trimite'}
            </button>
          </form>

          {/* Use DocumentList Component */}
          <DocumentList
            documents={documents}
            backendURL={backendURL}
            fetchDocuments={fetchDocuments}
          />

          {/* Upload Section */}
          <div className="upload-section">
            <h3>Încarcă un fișier nou PDF:</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!file) {
                  setUploadMessage('Selectează un fișier pentru încărcare.');
                  return;
                }

                try {
                  const formData = new FormData();
                  formData.append('file', file);

                  const response = await axios.post(
                    `${backendURL}/upload-document`,
                    formData,
                    {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    }
                  );

                  setUploadMessage(response.data.message); // Success message
                  setFile(null); // Clear the file input
                  await fetchDocuments(); // Refresh document list
                } catch (error) {
                  if (error.response && error.response.status === 409) {
                    // Handle conflict
                    const data = error.response.data;
                    setRequiresConfirmation(true);
                    setExistingFileDetails(data.existing_file);
                    setNewFileDetails(data.new_file);
                    setSuggestedNewName(data.suggested_new_name);
                    setFileToUpload(file); // Store the file for later
                    setUploadMessage(data.message);
                  } else {
                    // General error handling
                    console.error('Eroare la incarcarea fisierului:', error);
                    setUploadMessage('Nu a reusit sa incarce fisierul.');
                  }
                }
              }}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <button type="submit">Încarcă</button>
            </form>
            {uploadMessage && <p>{uploadMessage}</p>}
          </div>

          {requiresConfirmation && (
            <div className="confirmation-dialog">
              <p>
              Există deja un fișier cu acest nume.
              </p>
              <p>Vrei să:</p>
              <ul>
                <li>Înlocuiești fișierul existent?</li>
                <li>
                Încarci fișierul nou cu numele nou:<br />"{' '}
                  <i>{suggestedNewName}</i>" ?
                </li>
                <li>Renunți la încărcare?</li>
              </ul>
              <button
                onClick={async () => {
                  // Replace existing file
                  try {
                    const formData = new FormData();
                    formData.append('file', fileToUpload);
                    formData.append('replace', true); // Add replace to form data

                    const response = await axios.post(
                      `${backendURL}/upload-document`,
                      formData,
                      {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      }
                    );

                    setUploadMessage(response.data.message);
                    setRequiresConfirmation(false);
                    setFileToUpload(null);
                    await fetchDocuments(); // Refresh document list
                  } catch (error) {
                    console.error('Eroare la inlocuirea fisierului:', error);
                    setUploadMessage('Nu a reusit sa inlocuiasca fisierul.');
                  }
                }}
              >
                Înlocuiește
              </button>
              <button
                onClick={async () => {
                  // Upload with new name
                  try {
                    const formData = new FormData();
                    formData.append('file', fileToUpload);

                    // Override file name
                    formData.append('new_name', suggestedNewName);

                    const response = await axios.post(
                      `${backendURL}/upload-document`,
                      formData,
                      {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      }
                    );

                    setUploadMessage(response.data.message);
                    setRequiresConfirmation(false);
                    setFileToUpload(null);
                    await fetchDocuments(); // Refresh document list
                  } catch (error) {
                    console.error('Eroare la incarcarea cu un nume nou:', error);
                    setUploadMessage(
                      'Nu a reusit sa incarce fisierul cu un nume nou.'
                    );
                  }
                }}
              >
                Nume nou
              </button>
              <button
                onClick={() => {
                  // Cancel upload
                  setRequiresConfirmation(false);
                  setFileToUpload(null);
                  setUploadMessage('Încărcare anulată.');
                }}
              >
                Renunță
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
