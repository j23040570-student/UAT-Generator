import { useRef, useState } from "react";
import "./InputRequirements.css";

const sampleCases = [
  {
    id: "TC-001",
    title: "Login with valid email and password",
    type: "Positive",
    preconditions: "User has a registered account",
    steps: "1. Enter valid email\n2. Enter valid password\n3. Click Login",
    expected: "User logs in successfully."
  },
  {
    id: "TC-002",
    title: "Login with invalid password",
    type: "Negative",
    preconditions: "User has a registered account",
    steps: "1. Enter valid email\n2. Enter incorrect password\n3. Click Login",
    expected: "Error message is displayed."
  },
  {
    id: "TC-003",
    title: "Leave email field empty",
    type: "Negative",
    preconditions: "None",
    steps: "1. Leave email empty\n2. Enter password\n3. Click Login",
    expected: "Email required message is displayed."
  },
  {
    id: "TC-004",
    title: "Password at minimum length",
    type: "Boundary",
    preconditions: "User has a registered account",
    steps: "1. Enter email\n2. Enter minimum-length password\n3. Click Login",
    expected: "System validates the password."
  }
];

export default function InputRequirements({
  project,
  onNavigate,
  onAnalyse
}) {
  const [activeTab, setActiveTab] = useState("text");
  const [requirements, setRequirements] = useState(
  project?.requirementText || ""
);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fileInput = useRef(null);

  function changeTab(tab) {
    setActiveTab(tab);
    setError("");
    setMessage("");
  }

  // Validate uploaded file
  function handleFile(file) {
    if (!file) return;

    setError("");
    setMessage("");

    const allowedExtensions = ["pdf", "docx", "txt"];

    const extension = file.name
      .split(".")
      .pop()
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError("Please upload a PDF, DOCX or TXT file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must not exceed 10 MB.");
      return;
    }

    setUploadedFile(file);
  }

  // Drag and drop
  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    handleFile(event.dataTransfer.files[0]);
  }

  // Remove uploaded file
  function removeFile() {
    setUploadedFile(null);
    setError("");
    setMessage("");

    if (fileInput.current) {
      fileInput.current.value = "";
    }
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Analyse requirements
  async function handleAnalyse() {
  setError("");
  setMessage("");

  let inputText = "";

  if (activeTab === "text") {
    if (!requirements.trim()) {
      setError("Please enter your software requirements.");
      return;
    }

    inputText = requirements.trim();
  }

  if (activeTab === "upload") {
    if (!uploadedFile) {
      setError("Please upload a requirements file.");
      return;
    }

    if (!uploadedFile.name.toLowerCase().endsWith(".txt")) {
      setError(
        "PDF and DOCX analysis will be available when file extraction is connected."
      );
      return;
    }

    try {
      inputText = await uploadedFile.text();
    } catch {
      setError("Unable to read the uploaded file.");
      return;
    }
  }

  if (!inputText.trim()) {
    setError("No requirements were found.");
    return;
  }

  const inputData = {
    projectId: project?.id,
    projectName: project?.name,
    inputType: activeTab,
    text: inputText
  };

  try {
    if (onAnalyse) {
      await onAnalyse(inputData);
    } else {
      setMessage("Analysis module is not connected yet.");
    }
  } catch (error) {
    setError(error.message || "Unable to analyse requirements.");
  }
}

  return (
    <div className="ir-page">

      {/* Header */}
      <header className="ir-header">

        <div className="ir-brand">
          <span className="ir-robot">🤖</span>
          UATGen AI
        </div>

        <div className="ir-heading-row">
          <h1>Generate Test Cases</h1>

          <span className="ir-step-badge">
            STEP 1 OF 5
          </span>
        </div>

        <p className="ir-subtitle">
          Upload or paste your software requirements below
        </p>

        {project && (
          <p className="ir-current-project">
            Project: <strong>{project.name}</strong>
          </p>
        )}

      </header>

      {/* Navigation Tabs */}
      <div className="ir-tabs">

        <button
          type="button"
          className={`ir-tab ${
            activeTab === "text" ? "active" : ""
          }`}
          onClick={() => changeTab("text")}
        >
          <span>▤</span>
          Text Input
        </button>

        <button
          type="button"
          className={`ir-tab ${
            activeTab === "upload" ? "active" : ""
          }`}
          onClick={() => changeTab("upload")}
        >
          <span>⇧</span>
          File Upload
        </button>

        <button
          type="button"
          className={`ir-tab ${
            activeTab === "sample" ? "active" : ""
          }`}
          onClick={() => changeTab("sample")}
        >
          <span>▧</span>
          Sample
        </button>

      </div>

      {/* Text Input Tab */}
      {activeTab === "text" && (
        <section className="ir-content">

          <h2>Software Requirements</h2>

          <p className="ir-description">
            Enter your software requirements here...
            <br />
            (e.g., functional requirements, user stories,
            or use cases)
          </p>

          <textarea
            className="ir-textarea"
            aria-label="Software requirements"
            value={requirements}
            onChange={(event) => {
              setRequirements(event.target.value);
              setError("");
              setMessage("");
            }}
            placeholder={
              "Example:\n" +
              "1. Users can register an account with email and password.\n" +
              "2. Users can log in to the system.\n" +
              "3. Users can reset their password."
            }
          />

          <div className="ir-character-count">
            {requirements.length} characters
          </div>

        </section>
      )}

      {/* File Upload Tab */}
      {activeTab === "upload" && (
        <section className="ir-content">

          <h2>Upload Requirements File</h2>

          <p className="ir-description">
            Upload a file with your software requirements.
            <br />
            (Supported formats: PDF, DOCX, TXT, up to 10 MB)
          </p>

          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.docx,.txt"
            hidden
            onChange={(event) => {
              handleFile(event.target.files[0]);
              event.target.value = "";
            }}
          />

          <div
            className={`ir-upload-area ${
              dragging ? "dragging" : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >

            <svg
              width="46"
              height="46"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 18H6a5 5 0 0 1-1-9.9A7 7 0 0 1 18.5 8a5 5 0 0 1-.5 10h-1" />
              <path d="M12 12v9M8 16l4-4 4 4" />
            </svg>

            <p>
              Drag & drop your file here, or{" "}
              <button
                type="button"
                className="ir-browse"
                onClick={() => fileInput.current.click()}
              >
                browse files
              </button>
            </p>

            <small>PDF, DOCX, TXT · Max 10 MB</small>

          </div>

          {/* Selected File */}
          {uploadedFile && (
            <div className="ir-uploaded-file">

              <div className="ir-file-icon">
                ▤
              </div>

              <div className="ir-file-information">
                <strong>{uploadedFile.name}</strong>
                <small>
                  {formatFileSize(uploadedFile.size)}
                </small>
              </div>

              <span className="ir-upload-status">
                Ready
              </span>

              <button
                type="button"
                className="ir-remove-file"
                aria-label="Remove file"
                onClick={removeFile}
              >
                ×
              </button>

            </div>
          )}

        </section>
      )}

      {/* Sample Tab */}
      {activeTab === "sample" && (
        <section className="ir-content">

          <h2>Sample Test Cases</h2>

          <p className="ir-description">
            View a sample set of generated UAT test cases.
            This page is read-only and for demonstration purposes.
          </p>

          <div className="ir-sample-card">

            <div className="ir-sample-heading">
              <h3>Sample Requirement</h3>
              <span>Sample Preview</span>
            </div>

            <div className="ir-sample-information">

              <div className="ir-info-row">
                <strong>Requirement ID</strong>
                <span>SAMPLE-001</span>
              </div>

              <div className="ir-info-row">
                <strong>Requirement Type</strong>
                <span className="ir-type-badge">
                  User Story
                </span>
              </div>

              <div className="ir-info-row">
                <strong>Project</strong>
                <span>Demo Project</span>
              </div>

              <div className="ir-info-row">
                <strong>Requirement Text</strong>

                <span className="ir-sample-text">
                  As a user, I want to log in with a valid
                  email and password so that I can access
                  my account.
                </span>
              </div>

            </div>

          </div>

          <div className="ir-sample-card">

            <div className="ir-sample-heading">
              <h3>Generated UAT Test Cases</h3>
            </div>

            <div className="ir-table-wrapper">

              <table className="ir-sample-table">

                <thead>
                  <tr>
                    <th>TC ID</th>
                    <th>Test Case Title</th>
                    <th>Test Case Type</th>
                    <th>Preconditions</th>
                    <th>Test Steps</th>
                    <th>Expected Result</th>
                  </tr>
                </thead>

                <tbody>
                  {sampleCases.map((item) => (
                    <tr key={item.id}>

                      <td>{item.id}</td>

                      <td>{item.title}</td>

                      <td>
                        <span
                          className={`ir-case-type ${
                            item.type.toLowerCase()
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>

                      <td>{item.preconditions}</td>

                      <td className="ir-test-steps">
                        {item.steps}
                      </td>

                      <td>{item.expected}</td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

          </div>

          <div className="ir-sample-actions">

            <button
              type="button"
              className="ir-outline-button"
              onClick={() => changeTab("text")}
            >
              + Try Text Input
            </button>

            <button
              type="button"
              className="ir-primary-button"
              onClick={() => changeTab("upload")}
            >
              ⇧ Upload Requirement
            </button>

          </div>

        </section>
      )}

      {/* Validation Message */}
      {error && (
        <p className="ir-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="ir-message" role="status">
          {message}
        </p>
      )}

      {/* Analyse Requirements Button */}
      {activeTab !== "sample" && (
        <button
          type="button"
          className="ir-analyse-button"
          onClick={handleAnalyse}
        >
          <span>✦</span>
          Analyse Requirements
        </button>
      )}

      <button
        type="button"
        className="ir-back-button"
        onClick={() => onNavigate("generate")}
      >
        ← Back to Projects
      </button>

    </div>
  );
}