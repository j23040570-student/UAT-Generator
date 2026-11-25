import { useState, useEffect } from "react";
import { starterProjects } from "../GenerateTestCases/GenerateTestCases";
import RequirementCoverage from "../RequirementCoverage/RequirementCoverage";
import "./MyProjects.css";

function loadProjects() {
  try {
    const saved = localStorage.getItem("uatgen_projects");
    const data = saved ? JSON.parse(saved) : starterProjects;

    return Array.isArray(data) ? data : starterProjects;
  } catch {
    return starterProjects;
  }
}

function isCompleted(project) {
  return Number(project.progress) >= 5;
}

function formatDate(timestamp) {
  if (!timestamp) return "Not recorded";

  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function relativeDate(timestamp) {
  if (!timestamp) return "Not recorded";

  const days = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 86400000)
  );

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";

  return formatDate(timestamp);
}

function ProjectIcon({ name }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "eye" ? (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 6h18M8 6V3h8v3" />
          <path d="M5 6l1 15h12l1-15M10 10v7M14 10v7" />
        </>
      )}
    </svg>
  );
}

export default function MyProjects({ onContinue }) {
  const [projects, setProjects] = useState(loadProjects);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [selectedProjectId, setSelectedProjectId] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("coverage");

  const [detailSearch, setDetailSearch] =
    useState("");

  const [testType, setTestType] = useState("All");
  const [selectedTestId, setSelectedTestId] =
    useState(null);

  const [showOriginal, setShowOriginal] =
    useState(false);

  const [selectedSource, setSelectedSource] =
    useState(null);

  const [message, setMessage] = useState("");

  // Initialize shared project storage if necessary.
  useEffect(() => {
    try {
      if (localStorage.getItem("uatgen_projects") === null) {
        localStorage.setItem(
          "uatgen_projects",
          JSON.stringify(projects)
        );
      }
    } catch {
      setMessage("Browser storage is unavailable.");
    }
  }, [projects]);

  const completedCount = projects.filter(
    isCompleted
  ).length;

  const inProgressCount =
    projects.length - completedCount;

  const selectedProject = projects.find(
    (item) => item.id === selectedProjectId
  );

  const requirements = (
    selectedProject?.reviewRequirements || []
  ).map((item, index) => ({
    ...item,
    displayId: `REQ-${String(index + 1).padStart(3, "0")}`
  }));

  const testCases = selectedProject?.testCases || [];

  const selectedTest = testCases.find(
    (item) => item.id === selectedTestId
  );

  const linkedRequirement = requirements.find(
    (item) => item.id === selectedTest?.requirementId
  );

  const approvedCount = testCases.filter(
    (item) => item.status === "Approved"
  ).length;

  const linkedCount = requirements.filter(
    (requirement) =>
      testCases.some(
        (item) => item.requirementId === requirement.id
      )
  ).length;

  /* Search and sort projects */

  const filteredProjects = projects
    .filter((item) => {
      const completed = isCompleted(item);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && completed) ||
        (statusFilter === "progress" && !completed);

      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }

      if (sortBy === "oldest") {
        return (a.updatedAt || 0) - (b.updatedAt || 0);
      }

      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

  /* Open saved project */

  function openProject(project) {
    setMessage("");

    if (!isCompleted(project)) {
      onContinue?.(project);
      return;
    }

    setSelectedProjectId(project.id);
    setActiveTab("coverage");
    setSelectedTestId(null);
    setSelectedSource(null);
    setShowOriginal(false);
    setDetailSearch("");
    setTestType("All");
  }

  /* Return to My Projects */

  function backToProjects() {
    setSelectedProjectId(null);
    setSelectedTestId(null);
    setSelectedSource(null);
    setMessage("");
  }

  /* Change read-only archive tab */

  function changeTab(tab) {
    setActiveTab(tab);
    setDetailSearch("");
    setTestType("All");
    setSelectedTestId(null);
    setSelectedSource(null);
    setShowOriginal(false);
  }

  /* Delete entire project */

  function deleteProject() {
    if (!deleteTarget) return;

    const updated = projects.filter(
      (item) => item.id !== deleteTarget.id
    );

    try {
      localStorage.setItem(
        "uatgen_projects",
        JSON.stringify(updated)
      );

      setProjects(updated);
      setDeleteTarget(null);
      setMessage("Project deleted successfully.");
    } catch {
      setMessage("Unable to delete project.");
    }
  }

  /* Search archived requirements */

  const filteredRequirements = requirements.filter(
    (item) =>
      `${item.displayId} ${item.description}`
        .toLowerCase()
        .includes(detailSearch.trim().toLowerCase())
  );

  /* Search archived test cases */

  const filteredTestCases = testCases.filter((item) => {
    const matchesSearch = [
      item.code,
      item.requirementCode,
      item.scenario
    ]
      .join(" ")
      .toLowerCase()
      .includes(detailSearch.trim().toLowerCase());

    const matchesType =
      testType === "All" || item.type === testType;

    return matchesSearch && matchesType;
  });

  /* Project Detail Navigation */

  const projectTabs = (
    <nav className="mp-detail-tabs">
      {[
        { id: "requirements", label: "Requirements" },
        { id: "test-cases", label: "Test Cases" },
        { id: "coverage", label: "Coverage Report" }
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={
            activeTab === tab.id ? "active" : ""
          }
          onClick={() => changeTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );

  /* ===================================
     READ-ONLY TEST CASE DETAILS
  =================================== */

  if (selectedProject && selectedTest) {
    return (
      <div className="mp-page">

        <button
          className="mp-back"
          onClick={() => setSelectedTestId(null)}
        >
          ← Back to Test Cases
        </button>

        <div className="mp-brand">
          <span>🤖</span> UATGen AI
        </div>

        <h1>Test Case Details</h1>

        <p className="mp-subtitle">
          View the complete information for this test case.
        </p>

        <section className="mp-test-overview">

          <div>
            <small>TEST CASE ID</small>
            <strong className="mp-purple">
              {selectedTest.code}
            </strong>
          </div>

          <div>
            <small>TEST SCENARIO</small>
            <strong>{selectedTest.scenario}</strong>
          </div>

          <div>
            <small>PROJECT</small>
            <strong>{selectedProject.name}</strong>
          </div>

        </section>

        <div className="mp-details-grid">

          <section className="mp-card">

            <h2>Test Description</h2>

            <div className="mp-value">
              {selectedTest.scenario}
            </div>

            <div className="mp-two-columns">

              <div>
                <h3>Preconditions</h3>
                <div className="mp-value">
                  {selectedTest.preconditions || "None"}
                </div>
              </div>

              <div>
                <h3>Test Data</h3>
                <div className="mp-value">
                  {selectedTest.testData || "None"}
                </div>
              </div>

            </div>

            <h3>Test Steps</h3>

            <div className="mp-test-steps">

              {(selectedTest.steps || "")
                .split("\n")
                .filter((step) => step.trim())
                .map((step, index) => (
                  <div
                    className="mp-test-step"
                    key={index}
                  >
                    <strong>
                      {String(index + 1).padStart(2, "0")}
                    </strong>

                    <span>
                      {step.replace(/^\d+[.)]\s*/, "")}
                    </span>
                  </div>
                ))}

            </div>

            <h3>Expected Result</h3>

            <div className="mp-value">
              {selectedTest.expected}
            </div>

          </section>

          <aside className="mp-detail-sidebar">

            <section className="mp-card">

              <h2>Test Case Information</h2>

              <div className="mp-info-row">
                <span>Priority:</span>
                <strong
                  className={`mp-priority ${
                    selectedTest.priority.toLowerCase()
                  }`}
                >
                  {selectedTest.priority}
                </strong>
              </div>

              <div className="mp-info-row">
                <span>Test Type:</span>
                <strong className="mp-purple">
                  {selectedTest.type}
                </strong>
              </div>

              <div className="mp-info-row">
                <span>Status:</span>
                <span
                  className={`mp-status ${
                    selectedTest.status.toLowerCase()
                  }`}
                >
                  {selectedTest.status}
                </span>
              </div>

            </section>

            <section className="mp-card">

              <h2>Requirement Traceability</h2>

              <div className="mp-value">
                Linked Requirement:{" "}
                <strong className="mp-purple">
                  {linkedRequirement?.displayId ||
                    selectedTest.requirementCode}
                </strong>

                {linkedRequirement && (
                  <p>{linkedRequirement.description}</p>
                )}
              </div>

            </section>

            <section className="mp-card">

              <h2>Comments</h2>

              <div className="mp-value">
                {selectedTest.comments || "No comments."}
              </div>

            </section>

          </aside>

        </div>

      </div>
    );
  }

  /* ===================================
     COMPLETED PROJECT ARCHIVE
  =================================== */

  if (selectedProject) {
    return (
      <div className="mp-page">

        <button
          className="mp-back"
          onClick={backToProjects}
        >
          ← Back to My Projects
        </button>

        {activeTab === "coverage" ? (

  <>
    <h1 className="mp-project-title">
      {selectedProject.name}
    </h1>

    <p className="mp-subtitle">
      Access project requirements and UAT tests.
    </p>

    <div className="mp-project-dates">
      <span>
        Created: {formatDate(selectedProject.createdAt)}
      </span>

      <span>
        Last updated:{" "}
        {formatDate(selectedProject.updatedAt)}
      </span>
    </div>

    <RequirementCoverage
      key={selectedProject.id}
      project={selectedProject}
      navigation={projectTabs}
    />
  </>

) : (

          <>

            <h1 className="mp-project-title">
              {selectedProject.name}
            </h1>

            <p className="mp-subtitle">
              Access project requirements and UAT tests.
            </p>

            <div className="mp-project-dates">

              <span>
                Created: {formatDate(selectedProject.createdAt)}
              </span>

              <span>
                Last updated:{" "}
                {formatDate(selectedProject.updatedAt)}
              </span>

            </div>

            {projectTabs}

            {/* REQUIREMENTS TAB */}

            {activeTab === "requirements" && (

              <>

                <section className="mp-original-card">

                  <button
                    className="mp-original-toggle"
                    aria-expanded={showOriginal}
                    onClick={() =>
                      setShowOriginal(!showOriginal)
                    }
                  >
                    {showOriginal ? "⌄" : "›"}
                    <strong>View Original Input</strong>
                    <span>Read only</span>
                  </button>

                  {showOriginal && (
                    <div className="mp-original-content">

                      <pre>
                        {selectedProject.requirementText ||
                          "No original input available."}
                      </pre>

                      {selectedSource && (
                        <div className="mp-source-highlight">

                          <strong>
                            Sentence {selectedSource.sourceId}
                          </strong>

                          <p>
                            {selectedSource.sourceText}
                          </p>

                          <button
                            className="mp-link"
                            onClick={() =>
                              setSelectedSource(null)
                            }
                          >
                            Close
                          </button>

                        </div>
                      )}

                    </div>
                  )}

                </section>

                <h2 className="mp-section-title">
                  {requirements.length} Requirements
                </h2>

                <div className="mp-search">

                  <span>⌕</span>

                  <input
                    placeholder="Search requirements..."
                    value={detailSearch}
                    onChange={(event) =>
                      setDetailSearch(event.target.value)
                    }
                  />

                </div>

                <div className="mp-table-wrapper">

                  <table className="mp-table">

                    <thead>
                      <tr>
                        <th>Requirement ID</th>
                        <th>Requirement Description</th>
                        <th>Source</th>
                      </tr>
                    </thead>

                    <tbody>

                      {filteredRequirements.map((item) => (
                        <tr key={item.id}>

                          <td>{item.displayId}</td>

                          <td>{item.description}</td>

                          <td>
                            <button
                              className="mp-link"
                              onClick={() => {
                                setSelectedSource(item);
                                setShowOriginal(true);
                              }}
                            >
                              Sentence {item.sourceId}
                            </button>
                          </td>

                        </tr>
                      ))}

                      {filteredRequirements.length === 0 && (
                        <tr>
                          <td colSpan={3} className="mp-empty">
                            No requirements found.
                          </td>
                        </tr>
                      )}

                    </tbody>

                  </table>

                </div>

                <p className="mp-table-note">
                  {filteredRequirements.length} requirements
                  · Scroll to view more
                </p>

              </>

            )}

            {/* TEST CASES TAB */}

            {activeTab === "test-cases" && (

              <>

                <div className="mp-stat-grid">

                  <div className="mp-stat-card">
                    <strong>{testCases.length}</strong>
                    <small>Generated Test Cases</small>
                  </div>

                  <div className="mp-stat-card green">
                    <strong>{approvedCount}</strong>
                    <small>Approved</small>
                  </div>

                  <div className="mp-stat-card purple">
                    <strong>{linkedCount}</strong>
                    <small>Requirements Linked</small>
                  </div>

                </div>

                <h2 className="mp-section-title">
                  {testCases.length} Test Cases
                </h2>

                <div className="mp-case-toolbar">

                  <div className="mp-search">

                    <span>⌕</span>

                    <input
                      placeholder="Search test cases..."
                      value={detailSearch}
                      onChange={(event) =>
                        setDetailSearch(event.target.value)
                      }
                    />

                  </div>

                  <select
                    className="mp-select"
                    value={testType}
                    onChange={(event) =>
                      setTestType(event.target.value)
                    }
                  >
                    <option value="All">All Type</option>
                    <option>Positive</option>
                    <option>Negative</option>
                    <option>Boundary</option>
                  </select>

                </div>

                <div className="mp-table-wrapper">

                  <table className="mp-table">

                    <thead>
                      <tr>
                        <th>Test Case ID</th>
                        <th>Requirement ID</th>
                        <th>Scenario</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>

                      {filteredTestCases.map((item) => (

                        <tr key={item.id}>

                          <td>{item.code}</td>

                          <td>{item.requirementCode}</td>

                          <td>{item.scenario}</td>

                          <td>{item.type}</td>

                          <td>
                            <span
                              className={`mp-status ${
                                item.status.toLowerCase()
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td>
                            <button
                              className="mp-link"
                              onClick={() =>
                                setSelectedTestId(item.id)
                              }
                            >
                              View Details
                            </button>
                          </td>

                        </tr>

                      ))}

                      {filteredTestCases.length === 0 && (
                        <tr>
                          <td colSpan={6} className="mp-empty">
                            No test cases found.
                          </td>
                        </tr>
                      )}

                    </tbody>

                  </table>

                </div>

              </>

            )}

          </>

        )}

      </div>
    );
  }

  /* ===================================
     MY PROJECTS MAIN PAGE
  =================================== */

  return (
    <div className="mp-page">

      <header className="mp-header">

        <div className="mp-brand">
          <span>🤖</span> UATGen AI
        </div>

        <h1>My Projects</h1>

        <p className="mp-subtitle">
          Manage your UATGen AI projects, including
          requirements, test cases and coverage.
        </p>

      </header>

      {/* Filters, Search and Sort */}

      <div className="mp-toolbar">

        <div className="mp-filters">

          {[
            {
              id: "all",
              label: `All Projects (${projects.length})`
            },
            {
              id: "progress",
              label: `In Progress (${inProgressCount})`
            },
            {
              id: "completed",
              label: `Completed (${completedCount})`
            }
          ].map((item) => (

            <button
              key={item.id}
              className={`mp-filter ${
                statusFilter === item.id ? "active" : ""
              }`}
              onClick={() => setStatusFilter(item.id)}
            >
              {item.label}
            </button>

          ))}

        </div>

        <div className="mp-toolbar-controls">

          <div className="mp-search">

            <span>⌕</span>

            <input
              placeholder="Search Project..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

          <select
            className="mp-select"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value)
            }
          >
            <option value="latest">
              Sort By: Last Updated
            </option>

            <option value="oldest">
              Sort By: Oldest Updated
            </option>

            <option value="name-asc">
              Sort By: Name A-Z
            </option>

            <option value="name-desc">
              Sort By: Name Z-A
            </option>
          </select>

        </div>

      </div>

      {/* Projects Table */}

      <div className="mp-table-wrapper mp-main-table">

        <table className="mp-table">

          <thead>
            <tr>
              <th>Project Name</th>
              <th>Step</th>
              <th>Last Updated</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredProjects.map((project) => (

              <tr key={project.id}>

                <td>

                  {isCompleted(project) ? (

                    <span>{project.name}</span>

                  ) : (

                    <button
                      className="mp-link mp-project-link"
                      onClick={() => openProject(project)}
                    >
                      {project.name}
                    </button>

                  )}

                </td>

                <td>

                  <strong className="mp-current-step">
                    {isCompleted(project)
                      ? "Coverage Report"
                      : project.step}
                  </strong>

                  <small className="mp-step-number">
                    Step {project.progress} of 5
                  </small>

                </td>

                <td className="mp-muted">
                  {relativeDate(project.updatedAt)}
                </td>

                <td>
                  <span
                    className={`mp-status ${
                      isCompleted(project)
                        ? "completed"
                        : "in-progress"
                    }`}
                  >
                    {isCompleted(project)
                      ? "Completed"
                      : "In Progress"}
                  </span>
                </td>

                <td>

                  <div className="mp-project-actions">

                    {isCompleted(project) && (
                      <button
                        className="mp-view-icon"
                        title="View project"
                        aria-label={`View ${project.name}`}
                        onClick={() => openProject(project)}
                      >
                        <ProjectIcon name="eye" />
                      </button>
                    )}

                    <button
                      className="mp-delete-icon"
                      title="Delete project"
                      aria-label={`Delete ${project.name}`}
                      onClick={() => {
                        setDeleteTarget(project);
                        setMessage("");
                      }}
                    >
                      <ProjectIcon name="trash" />
                    </button>

                  </div>

                </td>

              </tr>

            ))}

            {filteredProjects.length === 0 && (
              <tr>
                <td colSpan={5} className="mp-empty">
                  No projects found.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

      {message && (
        <p className="mp-message" role="status">
          {message}
        </p>
      )}

      {/* Delete Confirmation */}

      {deleteTarget && (

        <div
          className="mp-modal-overlay"
          onClick={() => setDeleteTarget(null)}
        >

          <div
            className="mp-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Delete project"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <h2>Delete Project</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>?
            </p>

            <p className="mp-delete-warning">
              All saved requirements, test cases and coverage
              information for this project will be removed.
            </p>

            <div className="mp-modal-actions">

              <button
                className="mp-cancel-button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                className="mp-confirm-delete"
                onClick={deleteProject}
              >
                Delete Project
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}