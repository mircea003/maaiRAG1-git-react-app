import React, { useState } from "react";
import axios from "axios";

function DocumentUpload({
  backendURL,
  fetchDocuments,
  setUploadMessage,
  setRequiresConfirmation,
  setExistingFileDetails,
  setNewFileDetails,
  setFileToUpload,
  setSuggestedNewName,
}) {
  const [file, setFile] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div>
      <button onClick={toggleCollapse} className="collapse-button">
        {isCollapsed ? "Încarcă fișier" : "Ascunde"}
      </button>
      {!isCollapsed && (
        <div className="upload-section">
          <h3>Încarcă un fișier nou PDF:</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!file) {
                setUploadMessage("Selectează un fișier pentru încărcare.");
                return;
              }

              try {
                const formData = new FormData();
                formData.append("file", file);

                // Attempt the upload
                const response = await axios.post(
                  `${backendURL}/upload-document`,
                  formData,
                  {
                    headers: { "Content-Type": "multipart/form-data" },
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
                  console.error("Eroare la incarcarea fisierului:", error);
                  setUploadMessage("Nu a reusit sa incarce fisierul.");
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
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
