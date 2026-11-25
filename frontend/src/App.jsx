
import { useEffect, useRef, useState } from 'react'
import './App.css'
import welcomeArt from './assets/welcome-art.png'
import GenerateTestCases from './pages/GenerateTestCases/GenerateTestCases.jsx'
import InputRequirements from "./pages/InputRequirements/InputRequirements.jsx";
import DetectedSentence, {
  detectSentences
} from "./pages/DetectedSentence/DetectedSentence.jsx";
import ReviewRequirements from "./pages/ReviewRequirements/ReviewRequirements.jsx";
import GeneratedTestCases, {
  generateDraftCases
} from "./pages/GeneratedTestCases/GeneratedTestCases.jsx";
import RequirementCoverage from "./pages/RequirementCoverage/RequirementCoverage.jsx";

const starterProjects = [
  { name: 'Student Portal System', updated: '2 days ago', tests: 20, status: 'Completed' },
  { name: 'Library Management System', updated: '5 days ago', tests: 15, status: 'In Progress' },
  { name: 'E-Commerce Website', updated: '1 week ago', tests: 13, status: 'Completed' },
]

function Icon({ name, size = 20 }) {
  const paths = {
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />,
    clipboard: <>
      <rect x="5" y="5" width="14" height="16" rx="2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 11h6M9 15h6"/>
    </>,
    folder: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
    settings: <>
      <path d="M10 2h4l.7 2.4 2 .8 2.2-1.2 2.8 2.8-1.2 2.2.8 2L23 11v4l-2.4.7-.8 2 1.2 2.2-2.8 2.8-2.2-1.2-2 .8L14 24h-4l-.7-2.4-2-.8-2.2 1.2-2.8-2.8 1.2-2.2-.8-2L0 15v-4l2.4-.7.8-2L2 6.1l2.8-2.8L7 4.5l2-.8z" transform="translate(2 0) scale(.83)"/>
      <circle cx="12" cy="12" r="3"/>
    </>,
    file: <>
      <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
      <path d="M14 3v6h5M9 13h6M9 17h6"/>
    </>,
    check: <>
      <rect x="5" y="4" width="14" height="17" rx="2"/>
      <path d="m9 13 2 2 4-4M9 3h6"/>
    </>,
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const menuItems = [
  { page: 'generate', title: 'Generate Test Cases', icon: 'clipboard' },
  { page: 'projects', title: 'My Projects', icon: 'folder' },
  { page: 'settings', title: 'Settings', icon: 'settings' },
]

function getInitialPosition() {
  const fallback = { x: 65, y: 250 }

  try {
    const value = JSON.parse(
      localStorage.getItem('uatgen_floating_menu_position')
    )

    if (
      Number.isFinite(value?.x) &&
      Number.isFinite(value?.y)
    ) {
      return value
    }
  } catch {
    // Ignore invalid saved position
  }

  return fallback
}

function FloatingMenu({ onNavigate, page }) {
  const [position, setPosition] = useState(getInitialPosition)
  const [open, setOpen] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth)
  const drag = useRef(null)
  const positionRef = useRef(position)
  positionRef.current = position

  const bound = (x, y) => ({
    x: Math.max(8, Math.min(x, window.innerWidth - 78)),
    y: Math.max(55, Math.min(y, window.innerHeight - 78)),
  })

  useEffect(() => {
    const resize = () => {
      setViewportWidth(window.innerWidth)
      setPosition(p => ({
        x: Math.max(8, Math.min(p.x, window.innerWidth - 78)),
        y: Math.max(55, Math.min(p.y, window.innerHeight - 78)),
      }))
    }

    resize()
    window.addEventListener('resize', resize)

    return () => window.removeEventListener('resize', resize)
  }, [])
const handleHomeDoubleClick = () => {
  onNavigate('dashboard')
  setOpen(false)
}
  const onPointerDown = event => {
    if (event.button !== 0) return

    event.preventDefault()

    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: positionRef.current,
      moved: false,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = event => {
    const d = drag.current
    if (!d || event.pointerId !== d.pointerId) return

    const dx = event.clientX - d.x
    const dy = event.clientY - d.y

    if (!d.moved && Math.hypot(dx, dy) <= 6) return

    d.moved = true
    setPosition(bound(d.start.x + dx, d.start.y + dy))
  }

  const onPointerUp = event => {
    const d = drag.current
    if (!d || event.pointerId !== d.pointerId) return

    drag.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (!d.moved) {
      setOpen(value => !value)
    } else {
      const point = bound(
        d.start.x + event.clientX - d.x,
        d.start.y + event.clientY - d.y
      )

      setPosition(point)
      localStorage.setItem(
        'uatgen_floating_menu_position',
        JSON.stringify(point)
      )
    }
  }

  const side = position.x > viewportWidth - 180 ? 'left' : 'right'

  return (
    <nav
      className={`floating-menu ${open ? 'is-open' : ''} ${side}`}
      style={{ left: position.x, top: position.y }}
      aria-label="Floating page navigation"
    >
      <button
      onDoubleClick={handleHomeDoubleClick}
        type="button"
        className={`float-main ${page === 'dashboard' ? 'active' : ''}`}
        title="Click to expand; drag to move"
        aria-label={open ? 'Close floating navigation' : 'Open floating navigation'}
        aria-expanded={open}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current = null }}
      >
        <Icon name="home" size={24} />
      </button>

      {menuItems.map((item, index) => (
        <div
          key={item.page}
          className={`float-option float-option-${index + 1}`}
        >
          <span className="float-connector" />

          <button
            type="button"
            title={item.title}
            aria-label={item.title}
            tabIndex={open ? 0 : -1}
            className={`float-small ${page === item.page ? 'selected' : ''}`}
            onClick={() => {
              onNavigate(item.page)
              setOpen(false)
            }}
          >
            <Icon name={item.icon} size={20} />
          </button>
        </div>
      ))}
    </nav>
  )
}

function Dashboard({ onNavigate }) {
  return (
    <>
      <h1 className="page-heading">Dashboard</h1>

      <section className="welcome-banner">
        <div className="welcome-copy">
          <h2>Welcome, Test User 👋</h2>
          <p>
            Generate UAT test cases from your
            <br />
            software requirements using AI.
          </p>
        </div>

        <img
          src={welcomeArt}
          alt="AI assistant and checklist illustration"
          className="welcome-art"
        />
      </section>

      <div className="stat-grid">
        <article className="stat-card">
          <span className="stat-icon purple">
            <Icon name="folder" />
          </span>
          <div>
            <strong>3</strong>
            <small>Projects</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-icon blue">
            <Icon name="file" />
          </span>
          <div>
            <strong>12</strong>
            <small>Requirements</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-icon green">
            <Icon name="check" />
          </span>
          <div>
            <strong>48</strong>
            <small>Test Cases</small>
          </div>
        </article>
      </div>

      <div className="section-heading">
        <h2>Recent Projects</h2>

        <button
          type="button"
          className="view-all"
          onClick={() => onNavigate('projects')}
        >
          View All <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="projects-table-wrap">
        <table className="projects-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Last Updated</th>
              <th>Test Cases</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {starterProjects.map(item => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td className="muted-cell">{item.updated}</td>
                <td>{item.tests}</td>
                <td>
                  <span
                    className={`status-pill ${
                      item.status === 'Completed'
                        ? 'completed'
                        : 'in-progress'
                    }`}
                  >
                    {item.status === 'Completed' ? '✓ ' : '◷ '}
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

const pages = {
  generate: {
    title: 'Generate Test Cases',
    icon: 'clipboard',
    text: 'Upload or enter software requirements to start generating UAT test cases.',
  },
  projects: {
    title: 'My Projects',
    icon: 'folder',
    text: 'View and manage your UAT generation projects.',
  },
  settings: {
    title: 'Settings',
    icon: 'settings',
    text: 'Account and application settings will appear here.',
  },
}

function PlaceholderPage({ page, onNavigate }) {
  const item = pages[page]

  return (
    <>
      <div className="inner-top">
        <button
          className="back-link"
          type="button"
          onClick={() => onNavigate('dashboard')}
        >
          ‹ Back to Dashboard
        </button>
      </div>

      <h1 className="page-heading">{item.title}</h1>

      <div className="placeholder-page">
        <span className="placeholder-icon">
          <Icon name={item.icon} size={40} />
        </span>

        <h2>{item.title}</h2>
        <p>{item.text}</p>

        {page === 'projects' && (
          <div className="mini-projects">
            {starterProjects.map(project => (
              <div key={project.name}>{project.name}</div>
            ))}
          </div>
        )}

        <span className="demo-label">
          UI placeholder — functionality to be developed
        </span>
      </div>
    </>
  )
}

const workflowPages = [
  "input-requirements",
  "detected-sentence",
  "review-requirements",
  "generated-test-cases",
  "requirement-coverage"
];

export default function App() {
  const [page, setPage] = useState("dashboard");

  const [selectedProject, setSelectedProject] =
    useState(null);


  const activePage =
  selectedProject && workflowPages.includes(page)
    ? workflowPages[selectedProject.progress - 1] || page
    : page;

  /* Open existing or new project */

  function openProject(project) {
  setSelectedProject(project);

  if (project.progress === 5) {
    setPage("requirement-coverage");
  } else if (project.progress === 4) {
    setPage("generated-test-cases");
  } else if (project.progress === 3) {
    setPage("review-requirements");
  } else if (project.progress === 2) {
    setPage("detected-sentence");
  } else {
    setPage("input-requirements");
  }
}

  /* Save project data */

  function updateProject(updates) {
  if (!selectedProject) {
    throw new Error("No project selected.");
  }

  // Prevent users from returning to completed steps
  if (
    updates.progress !== undefined &&
    updates.progress < selectedProject.progress
  ) {
    throw new Error(
      "Completed steps cannot be reopened."
    );
  }

  const updatedProject = {
    ...selectedProject,
    ...updates,
    updatedAt: Date.now()
  };

  const projects = JSON.parse(
    localStorage.getItem("uatgen_projects") || "[]"
  );

  const updatedProjects = projects.map((project) =>
    project.id === updatedProject.id
      ? updatedProject
      : project
  );

  localStorage.setItem(
    "uatgen_projects",
    JSON.stringify(updatedProjects)
  );

  setSelectedProject(updatedProject);

  return updatedProject;
}

  /* Step 1: Analyse Requirements */

  function handleAnalyse(inputData) {
    const detected = detectSentences(inputData.text);

    if (detected.length === 0) {
      throw new Error("No sentences were detected.");
    }

    updateProject({
      requirementText: inputData.text,
      detectedSentences: detected,
      reviewRequirements: null,
      step: "Detected Sentence Detail List",
      progress: 2
    });

    setPage("detected-sentence");
  }

  /* Step 2: Save Detected Sentences */

  function saveDetectedSentences(sentences) {
    updateProject({
      detectedSentences: sentences
    });
  }

  /* Open Review Requirements page */

  function handleReview(sentences) {
    const originalSentences = detectSentences(
      selectedProject.requirementText || ""
    );

    const reviewRequirements =
      selectedProject.reviewRequirements ??
      sentences.map((item) => ({
        id: `requirement-${item.id}`,

        description: item.sentence,

        sourceId: item.id,

        sourceText:
          originalSentences.find(
            (original) => original.id === item.id
          )?.sentence || item.sentence,

        type: item.type
      }));

    updateProject({
      detectedSentences: sentences,
      reviewRequirements: reviewRequirements,
      step: "Review Requirements",
      progress: 3
    });

    setPage("review-requirements");
  }

  /* Step 3: Save reviewed requirements */

  function saveReviewRequirements(requirements) {
    updateProject({
      reviewRequirements: requirements,
      step: "Review Requirements",
      progress: 3
    });
  }
  /* Step 4: Generate Test Cases */

function handleGenerateTestCases(requirements) {
  if (requirements.length === 0) return;

  const signature = JSON.stringify(
    requirements.map((item) => [
      item.id,
      item.displayId,
      item.description
    ])
  );

  const existingCases = selectedProject.testCases;

  const sameRequirements =
    selectedProject.generationSignature === signature;

  // Keep previously edited and approved test cases
  // when the reviewed requirements have not changed.

  if (
    sameRequirements &&
    Array.isArray(existingCases)
  ) {
    updateProject({
      step: "Generated Test Cases",
      progress: 4
    });

    setPage("generated-test-cases");
    return;
  }

  // Confirm before replacing existing test cases.

  if (
    existingCases?.length &&
    !window.confirm(
      "Requirements have changed. Generate new test cases and replace the previous ones?"
    )
  ) {
    return;
  }

  const generatedCases =
    generateDraftCases(requirements);

  updateProject({
    testCases: generatedCases,
    generationSignature: signature,
    step: "Generated Test Cases",
    progress: 4
  });

  setPage("generated-test-cases");
}

/* Save Test Case Changes */

function saveGeneratedTestCases(testCases) {
  updateProject({
    testCases,
    step: "Generated Test Cases",
    progress: 4
  });
}
/* Step 5: Generate Coverage Report */

function handleGenerateCoverage(testCases) {
  updateProject({
    testCases,
    step: "Requirement Coverage",
    progress: 5
  });

  setPage("requirement-coverage");
}

  return (
  <div className="app-shell">

    <main className="dashboard-panel">

      {activePage === "dashboard" ? (

        <Dashboard onNavigate={setPage} />

      ) : activePage === "generate" ? (

        <GenerateTestCases
          onNavigate={setPage}
          onContinue={openProject}
        />

      ) : activePage === "input-requirements" ? (

        <InputRequirements
          key={selectedProject?.id}
          project={selectedProject}
          onNavigate={setPage}
          onAnalyse={handleAnalyse}
        />

      ) : activePage === "detected-sentence" ? (

        <DetectedSentence
          key={selectedProject?.id}
          project={selectedProject}
          onSave={saveDetectedSentences}
          onReview={handleReview}
        />

      ) : activePage === "review-requirements" ? (

        <ReviewRequirements
          key={selectedProject?.id}
          project={selectedProject}
          onSave={saveReviewRequirements}
          onGenerate={handleGenerateTestCases}
        />

      ) : activePage === "generated-test-cases" ? (

        <GeneratedTestCases
          key={selectedProject?.id}
          project={selectedProject}
          onSave={saveGeneratedTestCases}
          onCoverage={handleGenerateCoverage}
        />

      ) : activePage === "requirement-coverage" ? (

        <RequirementCoverage
          key={selectedProject?.id}
          project={selectedProject}
        />

      ) : (

        <PlaceholderPage
          page={activePage}
          onNavigate={setPage}
        />

      )}

    </main>

    <FloatingMenu
      onNavigate={setPage}
      page={activePage}
    />

  </div>
);
}