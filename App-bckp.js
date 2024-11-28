//frontend/src/App.js

import './App.css';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion'; // Import Framer Motion


function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true); // State for collapsible list

  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [existingFileDetails, setExistingFileDetails] = useState(null);
  const [newFileDetails, setNewFileDetails] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null); // For the file being confirmed
  const [suggestedNewName, setSuggestedNewName] = useState(''); // State for suggested new file name


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

  // Fetch the documents when the frontend loads
  const fetchDocuments = async () => {
    try {
      const result = await axios.get(`${backendURL}/list-documents`);
      setDocuments(result.data.documents); // Update the document list state
    } catch (error) {
      console.error("Error fetching document list:", error);
    }
  };

  // Call fetchDocuments when the component loads
  useEffect(() => {
    fetchDocuments();
  }, []); 

  //
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
            {/*<h2>Răspuns:</h2>*/}
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
          {/* <h2>Discută cu documentul</h2> */}
          <form onSubmit={handleSubmit}>
            <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onInput={handleInput}
                placeholder="Scrie întrebarea ta aici..."
                rows="3" // Minimum rows
                style={{ resize: 'none', overflow: 'hidden' }} // Prevent manual resizing
              />
            <button type="submit" disabled={loading}>
              {loading ? 'Se încarcă...' : 'Trimite'}
            </button>
          </form>

          {/* Collapsible Document List */}
          <div className="document-section">
            
          </div>








          {/* Afiseaza fisierele pdf existente */}
          <div className="document-list">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="collapse-button"
            >
              {isCollapsed ? 'Show Documents' : 'Hide Documents'}
            </button>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: isCollapsed ? 0 : 'auto',
                opacity: isCollapsed ? 0 : 1,
              }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
              className="document-list"
            >

              <h3>Documente disponibile:</h3>
              <ul>
                {documents.length > 0 ? (
                    documents.map((doc, index) => (
                        <li key={index}>
                            &#128462;&nbsp;
                            <a
                              href={`${backendURL}/download/${encodeURIComponent(doc.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {doc.name}
                            </a>
                            <br />
                            <span>
                                &nbsp; &nbsp;(Dimensiune: {doc.size_kb} KB, ID: {doc.etag}, Ultima modificare la: {new Date(doc.last_modified).toLocaleString()})
                            </span>
                            <br />
                            <span>Status: {doc.indexed === "true" ? "Indexed" : "Not Indexed"}</span>
                            <br />
                            {doc.indexed === "false" && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await axios.post(
                                                `${backendURL}/index-document/${doc.name}`
                                            );
                                            alert(response.data.message);
                                            fetchDocuments(); // Refresh document list to update status
                                        } catch (error) {
                                            console.error("Error indexing document:", error);
                                            alert("Failed to index the document.");
                                        }
                                    }}
                                >
                                    Index
                                </button>
                            )}
                        </li>
                    ))
                ) : (
                    <li>Nu am gasit documente.</li>
                )}
              </ul>
            </motion.div>
          </div>






          {/* Incarca fisier pdf nou */}
          <div className="upload-section">
            <h3>Incarca un fisier nou PDF:</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!file) {
                  setUploadMessage("Please select a file to upload.");
                  return;
                }

                try {
                  const formData = new FormData();
                  formData.append("file", file);

                  // Attempt the upload
                  const response = await axios.post(`${backendURL}/upload-document`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                  });

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
                    console.error("Error uploading file:", error);
                    setUploadMessage("Failed to upload the file.");
                  }
                }
              }}
            >


              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <button type="submit">Incarca</button>
            </form>
            {uploadMessage && <p>{uploadMessage}</p>}
          </div>

          {requiresConfirmation && (
          <div className="confirmation-dialog">
            <p>
              A file with the same name already exists. Existing file size: {existingFileDetails.size_kb} KB.
              New file size: {newFileDetails.size_kb} KB. 
            </p>
            <p>Do you want to:</p>
            <ul>
              <li>Replace the existing file?</li>
              <li>Upload the new file with a different name: <strong>{suggestedNewName}</strong>?</li>
              <li>Cancel the upload?</li>
            </ul>
            <button
              onClick={async () => {
                // Replace existing file
                try {
                  const formData = new FormData();
                  formData.append("file", fileToUpload);
                  formData.append("replace", true); // Add replace to form data

                  const response = await axios.post(
                    `${backendURL}/upload-document`,
                    formData,
                    {
                      headers: { "Content-Type": "multipart/form-data" },
                    }
                  );

                  setUploadMessage(response.data.message);
                  setRequiresConfirmation(false);
                  setFileToUpload(null);
                  await fetchDocuments(); // Refresh document list
                } catch (error) {
                  console.error("Error replacing file:", error);
                  setUploadMessage("Failed to replace the file.");
                }
              }}
            >
              Replace Existing File
            </button>
            <button
              onClick={async () => {
                // Upload with new name
                try {
                  const formData = new FormData();
                  formData.append("file", fileToUpload);

                  // Override file name
                  formData.append("new_name", suggestedNewName);

                  const response = await axios.post(
                    `${backendURL}/upload-document`,
                    formData,
                    {
                      headers: { "Content-Type": "multipart/form-data" },
                    }
                  );

                  setUploadMessage(response.data.message);
                  setRequiresConfirmation(false);
                  setFileToUpload(null);
                  await fetchDocuments(); // Refresh document list
                } catch (error) {
                  console.error("Error uploading with new name:", error);
                  setUploadMessage("Failed to upload the file with a new name.");
                }
              }}
            >
              Use New Name
            </button>
            <button
              onClick={() => {
                // Cancel upload
                setRequiresConfirmation(false);
                setFileToUpload(null);
                setUploadMessage("Upload cancelled.");
              }}
            >
              Cancel
            </button>
          </div>
        )}


        </div>
      </div>
    </div>
  );
}

export default App;
