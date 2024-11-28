//DocumentList.js

import React, { useState } from 'react';
import axios from 'axios';

function DocumentList({ documents, backendURL, fetchDocuments }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="document-section">
      {/* Button to toggle collapse */}
      <button onClick={toggleCollapse} className="collapse-button">
        {isCollapsed ? 'Arată documentele încărcate' : 'Ascunde documentele'}
      </button>

      {/* Conditionally render the document list */}
      {!isCollapsed && (
        <div className="document-list">
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
                    &nbsp; &nbsp;(Dimensiune: {doc.size_kb} KB, ID: {doc.etag},
                    Ultima modificare la:{' '}
                    {new Date(doc.last_modified).toLocaleString()})
                  </span>
                  <br />
                  <span>
                    Status: {doc.indexed === 'true' ? 'Indexed' : 'Not Indexed'}
                  </span>
                  <br />
                  {doc.indexed === 'false' && (
                    <button
                      onClick={async () => {
                        try {
                          const response = await axios.post(
                            `${backendURL}/index-document/${doc.name}`
                          );
                          alert(response.data.message);
                          fetchDocuments(); // Refresh document list to update status
                        } catch (error) {
                          console.error('Error indexing document:', error);
                          alert('Failed to index the document.');
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
        </div>
      )}
    </div>
  );
}

export default DocumentList;
