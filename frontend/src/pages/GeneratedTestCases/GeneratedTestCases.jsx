import { useState } from "react";
import "./GeneratedTestCases.css";

/* Generate demonstration test cases */

function createDraft(requirement, type, number) {
  const positive = type === "Positive";
  const boundary = type === "Boundary";

  return {
    id: `case-${number}`,
    code: `TC-${String(number).padStart(3, "0")}`,

    requirementId: requirement.id,
    requirementCode: requirement.displayId,
    requirementText: requirement.description,

    scenario: positive
      ? `Verify: ${requirement.description}`
      : boundary
      ? `Check boundary conditions: ${requirement.description}`
      : `Check invalid conditions: ${requirement.description}`,

    type,
    priority: boundary ? "Medium" : "High",
    status: "Pending",

    preconditions:
      "The application and required test environment are available.",

    testData: positive
      ? "Valid input satisfying the requirement."
      : boundary
      ? "Input at the specified minimum or maximum limit."
      : "Invalid or missing input.",

    steps: positive
      ? "1. Open the relevant application feature.\n2. Enter valid test data.\n3. Perform the required action.\n4. Verify the system response."
      : boundary
      ? "1. Identify the permitted input limits.\n2. Enter values at and around the limits.\n3. Verify the system response."
      : "1. Open the relevant application feature.\n2. Enter invalid or missing data.\n3. Perform the action.\n4. Verify the validation response.",

    expected: positive
      ? `The system satisfies the requirement: ${requirement.description}`
      : boundary
      ? "The system handles the specified boundary values correctly."
      : "The system handles invalid input appropriately without unintended changes.",

    note:
      "Confirm the test data, validation rules and expected outcome before approval.",

    comments: ""
  };
}

export function generateDraftCases(requirements) {
  return requirements.flatMap((requirement, index) => [
    createDraft(requirement, "Positive", index * 2 + 1),
    createDraft(requirement, "Negative", index * 2 + 2)
  ]);
}

/* Main Component */

export default function GeneratedTestCases({
  project,
  onBack,
  onSave,
  onCoverage
}) {
  const testCases = project?.testCases || [];

  const requirements = (
    project?.reviewRequirements || []
  ).map((item, index) => ({
    ...item,
    displayId: `REQ-${String(index + 1).padStart(3, "0")}`
  }));

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  const selectedCase = testCases.find(
    (item) => item.id === selectedId
  );

  const currentCase = draft || selectedCase;

  const approvedCount = testCases.filter(
    (item) => item.status === "Approved"
  ).length;

  const pendingCount = testCases.filter(
    (item) => item.status === "Pending"
  ).length;

  const linkedCount = new Set(
    testCases.map((item) => item.requirementId)
  ).size;

  /* Search and Filter */

  const filteredCases = testCases.filter((item) => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      item.code,
      item.requirementCode,
      item.scenario
    ].some((value) =>
      value.toLowerCase().includes(query)
    );

    const matchesType =
      typeFilter === "All" ||
      item.type === typeFilter;

    const matchesStatus =
      statusFilter === "All" ||
      item.status === statusFilter;

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus
    );
  });

  /* Save test cases */

  function saveCases(updatedCases) {
    try {
      onSave(updatedCases);
      return true;
    } catch {
      setMessage("Unable to save test cases.");
      return false;
    }
  }

  /* Open Test Case Details */

  function viewDetails(item) {
    setSelectedId(item.id);
    setDraft(null);
    setAdding(false);
    setMessage("");
  }

  function backToList() {
    if (
      draft &&
      !window.confirm("Discard unsaved changes?")
    ) {
      return;
    }

    setSelectedId(null);
    setDraft(null);
    setAdding(false);
    setMessage("");
  }

  /* Regenerate All */

  function regenerateAll() {
    if (
      !window.confirm(
        "Regenerate all test cases? Existing edits, manual test cases and review decisions will be replaced."
      )
    ) {
      return;
    }

    const updated = generateDraftCases(requirements);

    if (saveCases(updated)) {
      setMessage("All draft test cases regenerated.");
    }
  }

  /* Add Test Case */

  function addTestCase() {
    if (requirements.length === 0) {
      setMessage("No reviewed requirements available.");
      return;
    }

    const number = testCases.length + 1;

    const newCase = createDraft(
      requirements[0],
      "Positive",
      number
    );

    setDraft({
      ...newCase,
      scenario: "",
      preconditions: "",
      testData: "",
      steps: "",
      expected: "",
      comments: ""
    });

    setAdding(true);
    setSelectedId(null);
    setMessage("");
  }

  /* Edit Test Case */

  function editCase() {
    setDraft({ ...selectedCase });
    setMessage("");
  }

  function changeField(field, value) {
    setDraft((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function changeRequirement(requirementId) {
    const requirement = requirements.find(
      (item) => item.id === requirementId
    );

    if (!requirement) return;

    setDraft((previous) => ({
      ...previous,
      requirementId: requirement.id,
      requirementCode: requirement.displayId,
      requirementText: requirement.description
    }));
  }

  /* Save Testing Instructions */

  function saveDetails(event) {
    event.preventDefault();

    if (
      !draft.scenario.trim() ||
      !draft.steps.trim() ||
      !draft.expected.trim()
    ) {
      setMessage(
        "Scenario, test steps and expected result are required."
      );
      return;
    }

    const savedCase = {
      ...draft,
      status: "Pending"
    };

    const updated = adding
      ? [...testCases, savedCase]
      : testCases.map((item) =>
          item.id === savedCase.id
            ? savedCase
            : item
        );

    if (saveCases(updated)) {
      setSelectedId(savedCase.id);
      setDraft(null);
      setAdding(false);
      setMessage("Testing instructions saved.");
    }
  }

  function cancelEditing() {
    setDraft(null);
    setAdding(false);
    setMessage("");
  }

  /* Approve or Reject */

  function updateStatus(status) {
  if (!selectedCase || draft) return;

  const updated = testCases.map((item) =>
    item.id === selectedCase.id
      ? { ...item, status }
      : item
  );

  if (saveCases(updated)) {
    if (status === "Approved") {
      setSelectedId(null);
      setDraft(null);
      setAdding(false);
      setMessage("Test case approved successfully.");
    } else {
      setMessage(
        "Test case rejected. It remains in the project."
      );
    }
  }
}

  /* Regenerate Individual Test Case */

  function regenerateCase() {
    if (!selectedCase || draft) return;

    const requirement = requirements.find(
      (item) =>
        item.id === selectedCase.requirementId
    );

    if (!requirement) {
      setMessage("Linked requirement not found.");
      return;
    }

    if (
      !window.confirm(
        "Regenerate this test case and replace its testing instructions?"
      )
    ) {
      return;
    }

    const regenerated = createDraft(
      requirement,
      selectedCase.type,
      1
    );

    const updated = testCases.map((item) =>
      item.id === selectedCase.id
        ? {
            ...regenerated,
            id: item.id,
            code: item.code,
            comments: item.comments
          }
        : item
    );

    if (saveCases(updated)) {
      setMessage("Test case regenerated.");
    }
  }

  /* Coverage Report */

  function handleCoverage() {
    if (onCoverage) {
      onCoverage(testCases);
    } else {
      setMessage(
        "The Requirement Coverage page is not implemented yet."
      );
    }
  }

  /* Test Case Details Page */

  if (currentCase) {
    return (
      <div className="gen-page">

        <div className="gen-top">
          <button
            className="gen-back"
            onClick={backToList}
          >
            ‹ Back to Generated Test Cases
          </button>

          <span className="gen-step">
            {adding ? "ADD TEST CASE" : "REVIEW MODE"}
          </span>
        </div>

        <div className="gen-brand">
          <span>🤖</span> UATGen AI
        </div>

        <div className="gen-title-row">
          <div>
            <h1>
              {adding
                ? "Add Test Case"
                : "Test Case Details"}
            </h1>

            <p className="gen-subtitle">
              Review all test instructions and expected results before approval.
            </p>
          </div>

          <span
            className={`gen-status ${currentCase.status.toLowerCase()}`}
          >
            {currentCase.status === "Pending"
              ? "● Pending Review"
              : currentCase.status}
          </span>
        </div>

        {/* Test Case Information */}

        <section className="gen-detail-overview">

          <div>
            <small>TEST CASE ID</small>
            <strong className="gen-purple">
              {currentCase.code}
            </strong>
          </div>

          <div>
            <small>LINKED REQUIREMENT</small>
            <strong>
              {currentCase.requirementCode}
            </strong>
          </div>

          <div>
            <small>TEST SCENARIO</small>
            <strong>{currentCase.scenario || "New Test Case"}</strong>
          </div>

        </section>

        <div className="gen-details-grid">

          {/* Testing Instructions */}

          <section className="gen-card">

            <h2>Testing Instructions</h2>

            {draft ? (

              <form
                id="gen-edit-form"
                onSubmit={saveDetails}
                className="gen-edit-form"
              >

                <label>Linked Requirement</label>

                <select
                  value={draft.requirementId}
                  onChange={(event) =>
                    changeRequirement(event.target.value)
                  }
                >
                  {requirements.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.displayId} — {item.description}
                    </option>
                  ))}
                </select>

                <label>Test Scenario *</label>

                <input
                  value={draft.scenario}
                  onChange={(event) =>
                    changeField("scenario", event.target.value)
                  }
                  required
                />

                <div className="gen-two-columns">

                  <div>
                    <label>Test Type</label>

                    <select
                      value={draft.type}
                      onChange={(event) =>
                        changeField("type", event.target.value)
                      }
                    >
                      <option>Positive</option>
                      <option>Negative</option>
                      <option>Boundary</option>
                    </select>
                  </div>

                  <div>
                    <label>Priority</label>

                    <select
                      value={draft.priority}
                      onChange={(event) =>
                        changeField("priority", event.target.value)
                      }
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>

                </div>

                <label>Preconditions</label>

                <textarea
                  value={draft.preconditions}
                  onChange={(event) =>
                    changeField("preconditions", event.target.value)
                  }
                />

                <label>Test Data</label>

                <textarea
                  value={draft.testData}
                  onChange={(event) =>
                    changeField("testData", event.target.value)
                  }
                />

                <label>Test Steps *</label>

                <textarea
                  rows={5}
                  value={draft.steps}
                  onChange={(event) =>
                    changeField("steps", event.target.value)
                  }
                  required
                />

                <label>Expected Result *</label>

                <textarea
                  value={draft.expected}
                  onChange={(event) =>
                    changeField("expected", event.target.value)
                  }
                  required
                />

                <label>Comments</label>

                <textarea
                  placeholder="Add reviewer feedback..."
                  value={draft.comments}
                  onChange={(event) =>
                    changeField("comments", event.target.value)
                  }
                />

              </form>

            ) : (

              <>

                <div className="gen-two-columns">

                  <div className="gen-detail-field">
                    <small>PRECONDITIONS</small>
                    <p>{currentCase.preconditions || "None specified."}</p>
                  </div>

                  <div className="gen-detail-field">
                    <small>TEST DATA</small>
                    <p>{currentCase.testData || "None specified."}</p>
                  </div>

                </div>

                <div className="gen-detail-field gen-separated">

                  <small>TEST STEPS</small>

                  <div className="gen-steps-list">

                    {currentCase.steps
                      .split("\n")
                      .filter((step) => step.trim())
                      .map((step, index) => (

                        <div
                          className="gen-test-step"
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

                </div>

                <div className="gen-detail-field gen-separated">
                  <small>EXPECTED RESULT</small>
                  <p>{currentCase.expected}</p>
                </div>

                <div className="gen-detail-field gen-separated">
                  <small>COMMENTS</small>

                  <p>
                    {currentCase.comments ||
                      "No comments yet. Select Edit to add reviewer feedback."}
                  </p>
                </div>

              </>

            )}

          </section>

          {/* Review Summary */}

          <aside className="gen-card">

            <h2>Review Summary</h2>

            <div className="gen-two-columns">

              <div className="gen-summary-item">
                <small>PRIORITY</small>

                <strong
                  className={`gen-priority ${currentCase.priority.toLowerCase()}`}
                >
                  {currentCase.priority}
                </strong>
              </div>

              <div className="gen-summary-item">
                <small>TEST TYPE</small>
                <strong className="gen-purple">
                  {currentCase.type}
                </strong>
              </div>

            </div>

            <div className="gen-review-note">
              <h3>✦ REVIEW NOTE</h3>
              <p>{currentCase.note}</p>
              <small>
                Suggested instructions require human confirmation.
              </small>
            </div>

            {!adding && (

              <div className="gen-manage">

                <h3>Manage This Test Case</h3>

                <button
                  className="gen-outline"
                  disabled={!!draft}
                  onClick={regenerateCase}
                >
                  ⟳ Regenerate
                </button>

              </div>

            )}

          </aside>

        </div>

        {message && (
          <p className="gen-message" role="status">
            {message}
          </p>
        )}

        {/* Review Actions */}

        <div className="gen-detail-footer">

          {draft ? (

            <>

              <button
                className="gen-outline"
                onClick={cancelEditing}
              >
                Cancel
              </button>

              <button
                type="submit"
                form="gen-edit-form"
                className="gen-primary"
              >
                Save Changes
              </button>

            </>

          ) : (

            <>

              <button
                className="gen-outline"
                onClick={editCase}
              >
                Edit Testing Instructions
              </button>

              <button
                className="gen-reject"
                disabled={currentCase.status === "Rejected"}
                onClick={() => updateStatus("Rejected")}
              >
                Reject
              </button>

              <button
                className="gen-primary"
                disabled={currentCase.status === "Approved"}
                onClick={() => updateStatus("Approved")}
              >
                ✓ Approve
              </button>

            </>

          )}

        </div>

      </div>
    );
  }

  /* Generated Test Cases Main Page */

  return (
    <div className="gen-page">

      <div className="gen-top">

        <span className="gen-step">
          STEP 4 OF 5
        </span>

      </div>

      <div className="gen-brand">
        <span>🤖</span> UATGen AI
      </div>

      <div className="gen-title-row">

        <div>
          <h1>Generated UAT Test Cases</h1>

          <p className="gen-subtitle">
            Review generated scenarios before approving them for UAT.
          </p>
        </div>

        <div className="gen-header-actions">

          <button
            className="gen-outline"
            onClick={regenerateAll}
            disabled={requirements.length === 0}
          >
            Regenerate All
          </button>

          <button
            className="gen-primary"
            onClick={addTestCase}
            disabled={requirements.length === 0}
          >
            + Add Test Case
          </button>

        </div>

      </div>

      {/* Project Information */}

      <section className="gen-project-card">

        <div className="gen-project-icon">
          ▣
        </div>

        <div className="gen-project-info">

          <strong>
            {project?.name || "Untitled Project"}
          </strong>

          <small>
            {requirements.length} Requirements
            {" • "}
            {testCases.length} Test Cases
            {" • "}
            Draft generation complete
          </small>

        </div>

        <span className="gen-requirement-badge">
          {requirements.length} Requirements
        </span>

        <span className="gen-ready-badge">
          Ready for Review
        </span>

      </section>

      {/* Statistics */}

      <div className="gen-stat-grid">

        <div className="gen-stat-card">
          <strong>{testCases.length}</strong>
          <small>Generated Test Cases</small>
        </div>

        <div className="gen-stat-card green">
          <strong>{approvedCount}</strong>
          <small>Approved</small>
        </div>

        <div className="gen-stat-card orange">
          <strong>{pendingCount}</strong>
          <small>Pending Review</small>
        </div>

        <div className="gen-stat-card purple">
          <strong>{linkedCount}</strong>
          <small>Requirements Linked</small>
        </div>

      </div>

      {/* Search and Filters */}

      <div className="gen-toolbar">

        <div className="gen-search">

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 5 5" />
          </svg>

          <input
            placeholder="Search ID, requirement, or scenario..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
        >
          <option value="All">All Test Types</option>
          <option>Positive</option>
          <option>Negative</option>
          <option>Boundary</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="All">All Statuses</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>

      </div>

      {/* Generated Test Cases Table */}

      <div className="gen-table-wrapper">

        <table className="gen-table">

          <thead>
            <tr>
              <th>TEST CASE</th>
              <th>REQUIREMENT</th>
              <th>SCENARIO</th>
              <th>TYPE</th>
              <th>PRIORITY</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>

            {filteredCases.map((item) => (

              <tr key={item.id}>

                <td className="gen-purple">
                  {item.code}
                </td>

                <td>{item.requirementCode}</td>

                <td>{item.scenario}</td>

                <td>{item.type}</td>

                <td>{item.priority}</td>

                <td>

                  <span
                    className={`gen-status ${item.status.toLowerCase()}`}
                  >
                    {item.status}
                  </span>

                </td>

                <td>

                  <button
                    className="gen-view-button"
                    onClick={() => viewDetails(item)}
                  >
                    View Details →
                  </button>

                </td>

              </tr>

            ))}

            {filteredCases.length === 0 && (

              <tr>
                <td colSpan={7} className="gen-empty">
                  No test cases found.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

      {message && (
        <p className="gen-message" role="status">
          {message}
        </p>
      )}

      {/* Coverage Report */}

      <div className="gen-footer">

        <button
          className="gen-primary"
          disabled={testCases.length === 0}
          onClick={handleCoverage}
        >
          ✦ Generate Coverage Report
        </button>

      </div>

    </div>
  );
}