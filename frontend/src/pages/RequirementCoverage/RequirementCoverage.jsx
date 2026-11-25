import { useState } from "react";
import {
  exportExcel,
  exportPDF,
  exportCSV
} from "./exportUtils";

import "./RequirementCoverage.css";

/* Calculate requirement coverage */

function calculateCoverage(requirements, testCases) {
  return requirements.map((requirement, index) => {
    const requirementCode =
      `REQ-${String(index + 1).padStart(3, "0")}`;

    const linkedCases = testCases.filter(
      (item) => item.requirementId === requirement.id
    );

    const approvedCases = linkedCases.filter(
      (item) => item.status === "Approved"
    );

    const hasCriteria =
      Array.isArray(requirement.acceptanceCriteria) &&
      requirement.acceptanceCriteria.length > 0;

    const criteria = hasCriteria
      ? requirement.acceptanceCriteria
      : [requirement.description];

    const acceptanceCriteria = criteria.map(
      (criterion, criterionIndex) => {
        const criterionId =
          criterion.id ||
          `AC-${String(criterionIndex + 1).padStart(2, "0")}`;

        const description =
          typeof criterion === "string"
            ? criterion
            : criterion.description || criterion.text || "";

        const coveredBy = approvedCases.filter(
          (item) =>
            !hasCriteria ||
            item.acceptanceCriteriaIds?.includes(criterionId)
        );

        return {
          id: criterionId,
          description,
          covered: coveredBy.length > 0,
          coveredBy: coveredBy.map((item) => item.code)
        };
      }
    );

    const coveredCount = acceptanceCriteria.filter(
      (item) => item.covered
    ).length;

    const percentage = Math.round(
      (coveredCount / acceptanceCriteria.length) * 100
    );

    const status =
      coveredCount === acceptanceCriteria.length
        ? "Covered"
        : coveredCount > 0
          ? "Partially Covered"
          : "Not Covered";

    return {
      ...requirement,
      code: requirementCode,
      percentage,
      status,
      acceptanceCriteria,
      provisional: !hasCriteria,
      linkedCases: linkedCases.length
    };
  });
}

function CoverageStatus({ status }) {
  return (
    <span
      className={`rc-status ${status
        .toLowerCase()
        .replaceAll(" ", "-")}`}
    >
      {status}
    </span>
  );
}

/* Main Component */

export default function RequirementCoverage({
  project,
  navigation
}) {
  const [view, setView] = useState("report");

  const [selectedRequirement, setSelectedRequirement] =
    useState(null);

  const [format, setFormat] = useState("excel");
  const [message, setMessage] = useState("");

  const requirements = project?.reviewRequirements || [];
  const testCases = project?.testCases || [];

  const coverage = calculateCoverage(
    requirements,
    testCases
  );

  const total = coverage.length;

  const covered = coverage.filter(
    (item) => item.status === "Covered"
  ).length;

  const partial = coverage.filter(
    (item) => item.status === "Partially Covered"
  ).length;

  const notCovered = total - covered - partial;

  const coveredPercent = total
    ? (covered / total) * 100
    : 0;

  const partialPercent = total
    ? (partial / total) * 100
    : 0;

  const notCoveredPercent = total
    ? (notCovered / total) * 100
    : 0;

  const overallCoverage = Math.round(coveredPercent);

  const selected = coverage.find(
    (item) => item.id === selectedRequirement
  );

  const chartBackground = total
    ? `conic-gradient(
        #10b98c 0% ${coveredPercent}%,
        #3675f5 ${coveredPercent}% ${coveredPercent + partialPercent}%,
        #a3adbe ${coveredPercent + partialPercent}% 100%
      )`
    : "#e5e7eb";

  function openDetails(requirement) {
    setSelectedRequirement(requirement.id);
    setView("detail");
    setMessage("");
  }

  function backToReport() {
    setView("report");
    setMessage("");
  }

  /* Download selected export format */

  function handleDownload() {
    try {
      const filename = project?.name || "UAT-Test-Cases";

      if (format === "excel") {
        exportExcel(filename, testCases);
      }

      if (format === "pdf") {
        exportPDF(filename, testCases);
      }

      if (format === "csv") {
        exportCSV(filename, testCases);
      }

      setMessage("Your export has been prepared.");
    } catch (error) {
      setMessage(
        error.message || "Unable to export test cases."
      );
    }
  }

  /* Reusable Logo */

  function Brand() {
    return (
      <div className="rc-brand">
        <span className="rc-robot">🤖</span>
        UATGen AI
      </div>
    );
  }

  /* Requirement Coverage Detail Screen */

  if (view === "detail" && selected) {
    return (
      <div className="rc-page">

        <button
          className="rc-back"
          onClick={backToReport}
        >
          ‹ Back to Coverage Report
        </button>

        <h1 className="rc-detail-title">
          Requirement Coverage Detail
        </h1>

        <section className="rc-card">

          <div className="rc-table-scroll">

            <table className="rc-table">

              <thead>
                <tr>
                  <th>Requirement ID</th>
                  <th>Requirement Name</th>
                  <th>Coverage</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>{selected.code}</td>

                  <td>{selected.description}</td>

                  <td>{selected.percentage}%</td>

                  <td>
                    <CoverageStatus status={selected.status} />
                  </td>
                </tr>
              </tbody>

            </table>

          </div>

        </section>

        <section className="rc-card rc-criteria-card">

          <h2>Acceptance Criteria Coverage</h2>

          {selected.provisional && (
            <p className="rc-info-note">
              Individual acceptance criteria have not been
              extracted. The requirement is shown as one
              provisional acceptance criterion.
            </p>
          )}

          <div className="rc-table-scroll">

            <table className="rc-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Acceptance Criteria</th>
                  <th>Coverage</th>
                  <th>Covered By</th>
                </tr>
              </thead>

              <tbody>

                {selected.acceptanceCriteria.map((item) => (

                  <tr key={item.id}>

                    <td>{item.id}</td>

                    <td>{item.description}</td>

                    <td>
                      <CoverageStatus
                        status={
                          item.covered
                            ? "Covered"
                            : "Not Covered"
                        }
                      />
                    </td>

                    <td>
                      {item.coveredBy.length > 0
                        ? item.coveredBy.join(", ")
                        : "—"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

      </div>
    );
  }

  /* Export Test Cases Screen */

  if (view === "export") {
    return (
      <div className="rc-page">

        <button
          className="rc-back"
          onClick={backToReport}
        >
          ← Back to Coverage Report
        </button>

        <Brand />

        <h1>Export Test Cases</h1>

        <p className="rc-subtitle">
          Download your test cases in different formats.
        </p>

        <section className="rc-card rc-export-card">

          <h2>Select Export Format</h2>

          <div className="rc-export-options">

            {[
              {
                id: "excel",
                icon: "XLSX",
                name: "Excel (.xlsx)",
                description: "Export test cases in Excel format"
              },
              {
                id: "pdf",
                icon: "PDF",
                name: "PDF (.pdf)",
                description: "Export test cases in PDF format"
              },
              {
                id: "csv",
                icon: "CSV",
                name: "CSV (.csv)",
                description: "Export test cases in CSV format"
              }
            ].map((item) => (

              <button
                key={item.id}
                type="button"
                className={`rc-format-option ${
                  format === item.id ? "selected" : ""
                }`}
                aria-pressed={format === item.id}
                onClick={() => {
                  setFormat(item.id);
                  setMessage("");
                }}
              >

                {format === item.id && (
                  <span className="rc-format-check">✓</span>
                )}

                <div className="rc-format-icon">
                  <span>{item.icon}</span>
                </div>

                <strong>{item.name}</strong>

                <p>{item.description}</p>

              </button>

            ))}

          </div>

          <p className="rc-info-note">
            {testCases.length} test cases will be exported,
            including their review statuses.
          </p>

          <button
            className="rc-download-button"
            disabled={testCases.length === 0}
            onClick={handleDownload}
          >
            ⇩ Download Test Cases
          </button>

          {message && (
            <p className="rc-message" role="status">
              {message}
            </p>
          )}

        </section>

      </div>
    );
  }

  /* Coverage Report Main Screen */

  return (
    <div className="rc-page">

      {!navigation && (
  <div className="rc-top">
    <span className="rc-step">
      STEP 5 OF 5
    </span>
  </div>
)}

      {!navigation && (
  <>
    <Brand />

    <h1>Coverage Report</h1>

    <p className="rc-subtitle">
      View the coverage of test cases against your requirements.
    </p>

    {project && (
      <p className="rc-project-name">
        Project: <strong>{project.name}</strong>
      </p>
    )}
  </>
)}

{navigation}

      <div className="rc-export-row">

        <button
          className="rc-primary"
          onClick={() => {
            setView("export");
            setMessage("");
          }}
        >
          ⇩ Export Report
        </button>

      </div>

      <div className="rc-report-grid">

        {/* Coverage Overview */}

        <section className="rc-card rc-overview">

          <h2>Coverage Overview</h2>

          <div className="rc-chart-container">

            <div
              className="rc-donut"
              style={{ background: chartBackground }}
              role="img"
              aria-label={`${overallCoverage}% fully covered requirements`}
            >

              <div className="rc-donut-center">

                <strong>{overallCoverage}%</strong>

                <span>
                  Requirements
                  <br />
                  Covered
                </span>

              </div>

            </div>

          </div>

          <div className="rc-legend">

            {[
              {
                label: "Covered",
                count: covered,
                percent: coveredPercent,
                color: "#10b98c"
              },
              {
                label: "Partially Covered",
                count: partial,
                percent: partialPercent,
                color: "#3675f5"
              },
              {
                label: "Not Covered",
                count: notCovered,
                percent: notCoveredPercent,
                color: "#a3adbe"
              }
            ].map((item) => (

              <div
                className="rc-legend-row"
                key={item.label}
              >

                <span
                  className="rc-legend-dot"
                  style={{ background: item.color }}
                />

                <span className="rc-legend-label">
                  {item.label} ({item.count})
                </span>

                <strong>
                  {Math.round(item.percent)}%
                </strong>

              </div>

            ))}

          </div>

          <p className="rc-info-note">
            Coverage is based on approved test cases,
            not executed test results.
          </p>

        </section>

        {/* Requirements List */}

        <section className="rc-card rc-requirements">

          <h2>Requirements List</h2>

          <div className="rc-table-scroll">

            <table className="rc-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Requirement</th>
                  <th>Coverage</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {coverage.map((item) => (

                  <tr key={item.id}>

                    <td>{item.code}</td>

                    <td>{item.description}</td>

                    <td>{item.percentage}%</td>

                    <td>
                      <CoverageStatus status={item.status} />
                    </td>

                    <td>

                      <button
                        className="rc-view-button"
                        onClick={() => openDetails(item)}
                      >
                        View Coverage
                      </button>

                    </td>

                  </tr>

                ))}

                {coverage.length === 0 && (
                  <tr>
                    <td colSpan={5} className="rc-empty">
                      No requirements available.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>

    </div>
  );
}