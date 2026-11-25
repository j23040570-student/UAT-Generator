import { useState } from "react";
import "./ReviewRequirements.css";

export default function ReviewRequirements({
  project,
  onBack,
  onSave,
  onGenerate
}) {
  const requirements = project?.reviewRequirements || [];

  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showOriginal, setShowOriginal] = useState(true);
  const [selectedSource, setSelectedSource] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState("");

  const hasUnsavedChanges = editingId !== null;

  /* Automatically generate sequential requirement IDs */

  const numberedRequirements = requirements.map(
    (requirement, index) => ({
      ...requirement,
      displayId: `REQ-${String(index + 1).padStart(3, "0")}`
    })
  );

  /* Search */

  const filteredRequirements = numberedRequirements.filter(
    (item) => {
      const query = search.trim().toLowerCase();

      return (
        item.displayId.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }
  );

  /* Pagination */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequirements.length / rowsPerPage)
  );

  const activePage = Math.min(currentPage, totalPages);

  const startIndex = (activePage - 1) * rowsPerPage;

  const visibleRequirements = filteredRequirements.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  /* Save project requirements */

  function saveRequirements(updatedRequirements) {
    try {
      onSave(updatedRequirements);
      return true;
    } catch {
      setMessage("Unable to save requirements.");
      return false;
    }
  }

  /* Edit requirement */

  function handleEdit(item) {
    setEditingId(item.id);
    setEditedText(item.description);
    setMessage("");
  }

  /* Save edited requirement */

  function handleSave() {
    if (!editedText.trim()) {
      setMessage("Requirement description cannot be empty.");
      return;
    }

    const updatedRequirements = requirements.map((item) =>
      item.id === editingId
        ? {
            ...item,
            description: editedText.trim()
          }
        : item
    );

    if (saveRequirements(updatedRequirements)) {
      setEditingId(null);
      setEditedText("");
      setMessage("Requirement updated successfully.");
    }
  }

  /* Cancel editing */

  function handleCancel() {
    setEditingId(null);
    setEditedText("");
    setMessage("");
  }

  /* Delete requirement */

  function handleDelete() {
    if (!deleteTarget) return;

    const updatedRequirements = requirements.filter(
      (item) => item.id !== deleteTarget.id
    );

    if (saveRequirements(updatedRequirements)) {
      setDeleteTarget(null);
      setMessage("Requirement deleted successfully.");
    }
  }

  /* View original source sentence */

  function handleViewSource(item) {
    setShowOriginal(true);

    setSelectedSource({
      number: item.sourceId,
      text: item.sourceText
    });
  }

  /* Generate Test Cases */

  function handleGenerate() {
    if (
      hasUnsavedChanges ||
      requirements.length === 0
    ) {
      return;
    }

    if (onGenerate) {
      onGenerate(numberedRequirements);
    } else {
      setMessage(
        "The Generated Test Cases page is not implemented yet."
      );
    }
  }

  return (
    <div className="rr-page">

      {/* Top Navigation */}

      <div className="rr-top">

        <span className="rr-step-badge">
          STEP 3 OF 5
        </span>

      </div>

      {/* Header */}

      <header className="rr-header">

        <div className="rr-brand">
          <span className="rr-robot">🤖</span>
          UATGen AI
        </div>

        <h1>Review Requirements</h1>

        <p>
          Review extracted requirements before generating
          test cases.
        </p>

        {project && (
          <p className="rr-project-name">
            Project: <strong>{project.name}</strong>
          </p>
        )}

      </header>

      {/* Original Input */}

      <section className="rr-original-card">

        <button
          type="button"
          className="rr-original-toggle"
          aria-expanded={showOriginal}
          onClick={() => setShowOriginal(!showOriginal)}
        >

          <span>
            View Original Input
            <small className="rr-read-only">
              Read only
            </small>
          </span>

          <span>
            {showOriginal ? "⌄" : "›"}
          </span>

        </button>

        {showOriginal && (
          <div className="rr-original-content">

            <pre>
              {project?.requirementText ||
                "No original input available."}
            </pre>

            {selectedSource && (
              <div className="rr-source-highlight">

                <strong>
                  Sentence {selectedSource.number}
                </strong>

                <p>{selectedSource.text}</p>

                <button
                  type="button"
                  onClick={() => setSelectedSource(null)}
                >
                  Close
                </button>

              </div>
            )}

          </div>
        )}

      </section>

      {/* Requirements Toolbar */}

      <div className="rr-toolbar">

        <h2>
          {requirements.length} Requirements
        </h2>

        <div className="rr-toolbar-controls">

          <div className="rr-search">

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
              placeholder="Search by ID or requirement..."
              value={search}
              disabled={hasUnsavedChanges}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
            />

          </div>

          <div className="rr-rows-control">

            <label htmlFor="rr-rows">
              Rows per page:
            </label>

            <select
              id="rr-rows"
              value={rowsPerPage}
              disabled={hasUnsavedChanges}
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

          </div>

        </div>

      </div>

      {/* Requirements Table */}

      <div className="rr-table-wrapper">

        <table className="rr-table">

          <thead>
            <tr>
              <th>Requirement ID</th>
              <th>Requirement Description</th>
              <th>Source</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {visibleRequirements.length === 0 && (
              <tr>
                <td colSpan={4} className="rr-empty">
                  No requirements found.
                </td>
              </tr>
            )}

            {visibleRequirements.map((item) => (

              <tr
                key={item.id}
                className={
                  editingId === item.id
                    ? "rr-editing-row"
                    : ""
                }
              >

                {/* Requirement ID */}

                <td className="rr-requirement-id">
                  {item.displayId}
                </td>

                {/* Requirement Description */}

                <td>

                  {editingId === item.id ? (

                    <div>

                      <textarea
                        className="rr-edit-input"
                        value={editedText}
                        onChange={(event) =>
                          setEditedText(event.target.value)
                        }
                        autoFocus
                      />

                      <small className="rr-unsaved-label">
                        ● Unsaved changes
                      </small>

                    </div>

                  ) : (

                    <span>{item.description}</span>

                  )}

                </td>

                {/* Original Source */}

                <td>

                  <button
                    type="button"
                    className="rr-source-link"
                    onClick={() => handleViewSource(item)}
                  >
                    Sentence {item.sourceId}
                  </button>

                </td>

                {/* Action Buttons */}

                <td>

                  {editingId === item.id ? (

                    <div className="rr-edit-actions">

                      <button
                        type="button"
                        className="rr-save-button"
                        onClick={handleSave}
                        disabled={!editedText.trim()}
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        className="rr-cancel-button"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>

                    </div>

                  ) : (

                    <div className="rr-row-actions">

                      <button
                        type="button"
                        className="rr-edit-button"
                        disabled={hasUnsavedChanges}
                        onClick={() => handleEdit(item)}
                      >

                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m14 5 5 5" />
                          <path d="M4 20l4-1L20 7l-4-4L4 15z" />
                        </svg>

                        Edit

                      </button>

                      <button
                        type="button"
                        className="rr-delete-button"
                        disabled={hasUnsavedChanges}
                        onClick={() => setDeleteTarget(item)}
                      >

                        <svg
                          width="14"
                          height="14"
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

                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* Pagination */}

      <div className="rr-pagination-bar">

        <span className="rr-showing">

          Showing{" "}

          {filteredRequirements.length === 0
            ? 0
            : startIndex + 1}

          –

          {Math.min(
            startIndex + rowsPerPage,
            filteredRequirements.length
          )}

          {" "}of {filteredRequirements.length}

        </span>

        <div className="rr-pagination">

          <button
            type="button"
            disabled={
              activePage === 1 ||
              hasUnsavedChanges
            }
            onClick={() => setCurrentPage(1)}
          >
            First
          </button>

          <button
            type="button"
            disabled={
              activePage === 1 ||
              hasUnsavedChanges
            }
            onClick={() =>
              setCurrentPage(activePage - 1)
            }
          >
            Previous
          </button>

          <span className="rr-current-page">
            {activePage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={
              activePage === totalPages ||
              hasUnsavedChanges
            }
            onClick={() =>
              setCurrentPage(activePage + 1)
            }
          >
            Next
          </button>

          <button
            type="button"
            disabled={
              activePage === totalPages ||
              hasUnsavedChanges
            }
            onClick={() => setCurrentPage(totalPages)}
          >
            Last
          </button>

        </div>

      </div>

      {/* Status Message */}

      {message && (
        <p className="rr-message" role="status">
          {message}
        </p>
      )}

      {/* Footer */}

      <div className="rr-footer">

        <div className="rr-footer-actions">

          {hasUnsavedChanges && (
            <div className="rr-warning">
              ⚠ Unsaved changes — save or cancel
              before generating.
            </div>
          )}

          <button
            type="button"
            className="rr-generate-button"
            disabled={
              hasUnsavedChanges ||
              requirements.length === 0
            }
            onClick={handleGenerate}
          >
            ✦ Generate Test Cases
          </button>

        </div>

      </div>

      {/* Delete Confirmation Modal */}

      {deleteTarget && (

        <div
          className="rr-modal-overlay"
          onClick={() => setDeleteTarget(null)}
        >

          <div
            className="rr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rr-delete-title"
            onClick={(event) => event.stopPropagation()}
          >

            <h2 id="rr-delete-title">
              Delete Requirement
            </h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.displayId}</strong>?
            </p>

            <div className="rr-delete-preview">
              {deleteTarget.description}
            </div>

            <p className="rr-delete-note">
              The remaining requirement IDs will
              automatically be renumbered.
            </p>

            <div className="rr-modal-actions">

              <button
                type="button"
                className="rr-cancel-button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="rr-confirm-delete"
                onClick={handleDelete}
              >
                Delete Requirement
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}