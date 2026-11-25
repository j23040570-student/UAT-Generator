import { useState, useEffect } from "react";
import "./GenerateTestCases.css";

const starterProjects = [
  {
    id: 1,
    name: "Library Management System",
    step: "Review Requirements",
    progress: 3,
    updatedAt: Date.now() - 2 * 86400000,
  },
  {
    id: 2,
    name: "Online Food Ordering System",
    step: "Input Requirements",
    progress: 1,
    updatedAt: Date.now() - 5 * 86400000,
  },
  {
    id: 3,
    name: "Hotel Booking System",
    step: "Detected Sentence Detail List",
    progress: 2,
    updatedAt: Date.now() - 7 * 86400000,
  },
];

export default function GenerateTestCases({
  onNavigate,
  onContinue,
}) {
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem("uatgen_projects");
      return saved ? JSON.parse(saved) : starterProjects;
    } catch {
      return starterProjects;
    }
  });

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Save projects to browser storage
  useEffect(() => {
    localStorage.setItem(
      "uatgen_projects",
      JSON.stringify(projects)
    );
  }, [projects]);

  // Format last updated date
  function formatDate(timestamp) {
    const days = Math.floor(
      (Date.now() - timestamp) / 86400000
    );

    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days === 7) return "1 week ago";

    if (days > 7) {
      const weeks = Math.floor(days / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }

    return `${days} days ago`;
  }

  // Create new project
  function handleCreateProject(event) {
  event.preventDefault();

  if (!projectName.trim()) return;

  const newProject = {
    id: Date.now(),
    name: projectName.trim(),
    step: "Input Requirements",
    progress: 1,
    updatedAt: Date.now(),
  };

  const updatedProjects = [
    newProject,
    ...projects
  ];

  try {
    localStorage.setItem(
      "uatgen_projects",
      JSON.stringify(updatedProjects)
    );
  } catch {
    alert("Unable to save the project.");
    return;
  }

  setProjects(updatedProjects);
  setProjectName("");
  setShowModal(false);

  if (onContinue) {
    onContinue(newProject);
  }
}

  // Delete existing project
  function handleDeleteProject() {
    if (!deleteTarget) return;

    setProjects((previous) =>
      previous.filter(
        (project) => project.id !== deleteTarget.id
      )
    );

    if (selectedProject?.id === deleteTarget.id) {
      setSelectedProject(null);
    }

    setDeleteTarget(null);
  }

  // Continue existing project
  function handleContinue(project) {
  setSelectedProject(project);

  if ([1, 2, 3, 4, 5].includes(project.progress) && onContinue) {
    onContinue(project);
  }
}

  // Search and sorting
  const filteredProjects = projects
    .filter((project) =>
      project.name
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }

      if (sortBy === "oldest") {
        return a.updatedAt - b.updatedAt;
      }

      return b.updatedAt - a.updatedAt;
    });

  return (
    <div className="gtc-page">

      {/* Page Header */}
      <header className="gtc-header">

        <div className="gtc-brand">
          <span className="gtc-robot">🤖</span>
          <span>UATGen AI</span>
        </div>

        <h1>Generate Test Cases</h1>

        <p>
          Continue an unfinished project or create a new project
        </p>

      </header>

      {/* New Project Button */}
      <div className="gtc-create-row">
        <button
          type="button"
          className="gtc-primary-button"
          onClick={() => {
            setProjectName("");
            setShowModal(true);
          }}
        >
          <span className="gtc-plus">+</span>
          New Project
        </button>
      </div>

      {/* Search and Sort */}
      <div className="gtc-toolbar">

        <div className="gtc-search">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 5 5" />
          </svg>

          <input
            type="text"
            placeholder="Search Project..."
            aria-label="Search projects"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          className="gtc-sort"
          aria-label="Sort projects"
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

      {/* Project Table */}
      <div className="gtc-table-wrapper">

        <table className="gtc-table">

          <thead>
            <tr>
              <th>Project Name</th>
              <th>Current Step</th>
              <th>Last Updated</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <tr key={project.id}>

                  <td className="gtc-project-name">
                    {project.name}
                  </td>

                  <td>
                    <div className="gtc-step-name">
                      {project.step}
                    </div>

                    <div className="gtc-step-progress">
                      Step {project.progress} of 5
                    </div>
                  </td>

                  <td className="gtc-updated">
                    {formatDate(project.updatedAt)}
                  </td>

                  <td>
                    <div className="gtc-actions">

                      <button
                        type="button"
                        className="gtc-continue-button"
                        onClick={() =>
                          handleContinue(project)
                        }
                      >
                        Continue
                        <span>→</span>
                      </button>

                      <button
                        type="button"
                        className="gtc-delete-button"
                        onClick={() =>
                          setDeleteTarget(project)
                        }
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M5 6l1 14h12l1-14" />
                          <path d="M10 10v6M14 10v6" />
                        </svg>

                        Delete
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="gtc-empty"
                >
                  No projects found.
                </td>
              </tr>
            )}

          </tbody>
        </table>

      </div>

      {selectedProject &&
  (!onContinue ||
    ![1, 2, 3, 4, 5].includes(selectedProject.progress)) && (
        <p className="gtc-selection-message">
          Selected: {selectedProject.name}
          {" — "}
          {selectedProject.step}.
          This project step is not implemented yet.
        </p>
      )}

      {/* Create New Project Modal */}
      {showModal && (
        <div
          className="gtc-modal-overlay"
          onClick={() => setShowModal(false)}
        >

          <div
            className="gtc-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gtc-create-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <h2 id="gtc-create-title">
              Create New Project
            </h2>

            <form onSubmit={handleCreateProject}>

              <label htmlFor="projectName">
                Project Name
                <span className="gtc-required">*</span>
              </label>

              <input
                id="projectName"
                className="gtc-project-input"
                type="text"
                placeholder="Enter Project Name"
                value={projectName}
                onChange={(event) =>
                  setProjectName(event.target.value)
                }
                autoFocus
                required
              />

              <div className="gtc-modal-actions">

                <button
                  type="button"
                  className="gtc-cancel-button"
                  onClick={() => {
                    setShowModal(false);
                    setProjectName("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="gtc-primary-button"
                  disabled={!projectName.trim()}
                >
                  Create Project
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="gtc-modal-overlay"
          onClick={() => setDeleteTarget(null)}
        >

          <div
            className="gtc-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gtc-delete-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <h2 id="gtc-delete-title">
              Delete Project
            </h2>

            <p className="gtc-delete-message">
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>?
              This action cannot be undone.
            </p>

            <div className="gtc-modal-actions">

              <button
                type="button"
                className="gtc-cancel-button"
                onClick={() =>
                  setDeleteTarget(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="gtc-confirm-delete"
                onClick={handleDeleteProject}
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