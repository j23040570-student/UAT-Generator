import { useState } from "react";
import "./DetectedSentence.css";

/* Basic requirement detection */

function analyseSentence(sentence) {
  const isUserStory = /^as\s+(a|an|the)\s+/i.test(sentence);

  const type = isUserStory
    ? "User Story"
    : "Functional Requirement";

  let problem = "";
  let suggestion = "";

  const hasResetMethod =
    /reset link|verification code|otp|registered email/i.test(sentence);

  const hasOutcome =
    /new password|log in again|access restored|confirmation/i.test(sentence);

  // Check password reset requirements
  if (
    /reset.*password/i.test(sentence) &&
    (!hasResetMethod || !hasOutcome)
  ) {
    if (isUserStory) {
      problem =
        "The user story explains the user's goal, but does not specify how the password reset process works or what should happen after a successful reset.";

      suggestion =
        "Please clarify the password reset method and expected outcome. For example, users could receive a reset link at their registered email address, set a new password, and then log in using the new password.";
    } else {
      problem =
        "This requirement is incomplete, as it does not specify how a user should reset their password, nor does it state the expected outcome.";

      suggestion =
        "Please specify the password reset method, for example, by sending a password reset link to the email address the user registered with, allowing them to set a new password.";
    }
  }

  // Check user story structure
  else if (
    isUserStory &&
    (!/i want/i.test(sentence) || !/so that/i.test(sentence))
  ) {
    problem =
      "The user story does not contain a complete role, goal and benefit.";

    suggestion =
      "Rewrite the user story using: As a [user role], I want [feature], so that [benefit].";
  }

  // Check unclear requirements
  else if (
    /\b(user friendly|fast|easy|efficient|etc|as needed)\b/i.test(sentence)
  ) {
    problem =
      "The requirement contains vague or subjective terms.";

    suggestion =
      "Replace vague terms with specific, measurable and testable criteria.";
  }

  return {
    sentence,
    type,
    status: problem ? "Invalid" : "Valid",
    problem: problem || "No issue detected by the current validation rules.",
    suggestion: suggestion || "No changes suggested."
  };
}

/* Detect multiple sentences */

export function detectSentences(text) {
  return text
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z])/)
    .map((sentence) =>
      sentence.replace(/^\s*(?:\d+[.)]|[-•])\s*/, "").trim()
    )
    .filter(Boolean)
    .map((sentence, index) => ({
      id: index + 1,
      ...analyseSentence(sentence)
    }));
}

/* Main page */

export default function DetectedSentence({
  project,
  onBack,
  onSave,
  onReview
}) {
  const [sentences, setSentences] = useState(
    project?.detectedSentences || []
  );

  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedSentence, setEditedSentence] = useState("");
  const [message, setMessage] = useState("");

  const detectedCount = sentences.length;

  const invalidCount = sentences.filter(
    (item) => item.status === "Invalid"
  ).length;

  const validCount = sentences.filter(
    (item) => item.status === "Valid"
  ).length;

  const ignoredCount = sentences.filter(
    (item) => item.status === "Ignored"
  ).length;

  function toggleSentence(id) {
    setExpandedId((previous) =>
      previous === id ? null : id
    );

    setEditingId(null);
    setMessage("");
  }

  function updateSentences(updated) {
    try {
      onSave?.(updated);
      setSentences(updated);
      return true;
    } catch {
      setMessage("Unable to save changes.");
      return false;
    }
  }

  /* Edit detected sentence */

  function handleEdit(item) {
    setEditingId(item.id);
    setEditedSentence(item.sentence);
    setMessage("");
  }

  /* Save and validate updated sentence */

  function handleSave(id) {
    if (!editedSentence.trim()) return;

    const updated = sentences.map((item) =>
      item.id === id
        ? {
            id: item.id,
            ...analyseSentence(editedSentence.trim())
          }
        : item
    );

    if (updateSentences(updated)) {
      setEditingId(null);
      setMessage("Changes saved successfully.");
    }
  }

  /* Ignore detected issue */

  function handleIgnore(id) {
    const updated = sentences.map((item) =>
      item.id === id
        ? {
            ...item,
            status: "Ignored"
          }
        : item
    );

    if (updateSentences(updated)) {
      setEditingId(null);
      setMessage("Requirement issue ignored.");
    }
  }

  /* Restore ignored requirement */

  function handleRestore(item) {
    const updated = sentences.map((sentence) =>
      sentence.id === item.id
        ? {
            id: item.id,
            ...analyseSentence(item.sentence)
          }
        : sentence
    );

    if (updateSentences(updated)) {
      setMessage("Requirement restored.");
    }
  }

  function handleReview() {
    if (onReview) {
      onReview(sentences);
    } else {
      setMessage(
        "The Review Requirements page is not implemented yet."
      );
    }
  }

  return (
    <div className="ds-page">

      {/* Top Navigation */}

      <div className="ds-top">

        <span className="ds-step-badge">
          STEP 2 OF 5
        </span>

      </div>

      {/* Header */}

      <header className="ds-header">

        <div className="ds-brand">
          <span className="ds-robot">🤖</span>
          UATGen AI
        </div>

        <h1>Detected Sentence Detail List</h1>

        {project && (
          <p className="ds-project-name">
            Project: {project.name}
          </p>
        )}

      </header>

      {/* Detection Statistics */}

      <section className="ds-statistics">

        <div className="ds-stat-card">
          <strong>{detectedCount}</strong>
          <small>Detected</small>
        </div>

        <div className="ds-stat-card invalid">
          <strong>{invalidCount}</strong>
          <small>Invalid</small>
        </div>

        <div className="ds-stat-card valid">
          <strong>{validCount}</strong>
          <small>Valid</small>
        </div>

      </section>

      {ignoredCount > 0 && (
        <p className="ds-ignored-count">
          Ignored requirements: {ignoredCount}
        </p>
      )}

      {/* Detected Sentence List */}

      <section className="ds-sentence-list">

        {sentences.length === 0 && (
          <div className="ds-empty">
            No analysed requirements available.
            Please return to Input Requirements.
          </div>
        )}

        {sentences.map((item, index) => (

          <div
            className="ds-sentence-item"
            key={item.id}
          >

            {/* Expandable Sentence */}

            <button
              type="button"
              className="ds-sentence-row"
              aria-expanded={expandedId === item.id}
              onClick={() => toggleSentence(item.id)}
            >

              <span className="ds-sentence-text">
                {index + 1}. {item.sentence}
              </span>

              <span className="ds-chevron">
                {expandedId === item.id ? "⌄" : "›"}
              </span>

              <span
                className={`ds-status ${item.status.toLowerCase()}`}
              >
                {item.status}
              </span>

            </button>

            {/* Expanded Sentence Details */}

            {expandedId === item.id && (

              <div className="ds-detail-card">

                {/* Detected Sentence */}

                <div className="ds-detail-section">

                  <div className="ds-detail-heading">
                    <h3>Detected Sentence</h3>

                    <span className="ds-type">
                      {item.type}
                    </span>
                  </div>

                  {editingId === item.id ? (

                    <textarea
                      className="ds-edit-input"
                      value={editedSentence}
                      onChange={(event) =>
                        setEditedSentence(event.target.value)
                      }
                      autoFocus
                    />

                  ) : (

                    <div className="ds-original-sentence">
                      {item.sentence}
                    </div>

                  )}

                </div>

                {/* Problem Description */}

                <div className="ds-detail-section">

                  <h3>Problem Description</h3>

                  <p>{item.problem}</p>

                </div>

                {/* AI Suggestion */}

                <div className="ds-detail-section">

                  <h3>AI Suggestion</h3>

                  <div className="ds-suggestion">
                    {item.suggestion}
                  </div>

                  {/* Action Buttons */}

                  <div className="ds-actions">

                    {item.status === "Ignored" ? (

                      <button
                        type="button"
                        className="ds-ignore-button"
                        onClick={() => handleRestore(item)}
                      >
                        Restore
                      </button>

                    ) : (

                      <button
                        type="button"
                        className="ds-ignore-button"
                        onClick={() => handleIgnore(item.id)}
                      >
                        Ignore
                      </button>

                    )}

                    <button
                      type="button"
                      className="ds-edit-button"
                      onClick={() => handleEdit(item)}
                    >
                      ✎ Edit
                    </button>

                    <button
                      type="button"
                      className="ds-save-button"
                      disabled={
                        editingId !== item.id ||
                        !editedSentence.trim()
                      }
                      onClick={() => handleSave(item.id)}
                    >
                      ▣ Save Changes
                    </button>

                  </div>

                </div>

              </div>

            )}

          </div>

        ))}

      </section>

      {/* Status Message */}

      {message && (
        <p className="ds-message" role="status">
          {message}
        </p>
      )}

      {/* Review Requirements Button */}

      <div className="ds-footer">

        <button
          type="button"
          className="ds-review-button"
          disabled={sentences.length === 0}
          onClick={handleReview}
        >
          Review Requirements
        </button>

      </div>

    </div>
  );
}