# UATGen-AI – AI-Powered UAT Test Case Generator

## Project Overview

UATGen-AI is a web-based application designed to assist users in generating User Acceptance Testing (UAT) test cases from software requirements using AI and Natural Language Processing (NLP).

The system aims to simplify the UAT preparation process by allowing users to manage projects, analyse software requirements, review generated test cases, and track requirement coverage.

This project is developed as part of the COS40005 Project A.

## Technologies Used

| Component | Technology |
|---|---|
| Frontend | React, JavaScript, CSS, Vite |
| Backend (Planned) | Python, Flask |
| NLP (Planned) | Python |
| Database (Planned) | PostgreSQL |
| Version Control | Git and GitHub |

## Current Development Progress

The frontend is currently under development.

- Dashboard interface with project statistics and recent projects
- Draggable floating navigation menu
- Navigation to Generate Test Cases, My Projects and Settings (placeholder pages)

Other features, including backend integration, database connectivity and AI-powered test case generation, are planned for future development.

## Project Structure

```text
UAT-Generator/
└── frontend/
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    └── index.html
```

## How to Run the Project Locally

### Step 1: Install Required Software

Make sure the following software is installed:

- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)

Use a Node.js version compatible with the installed Vite version.

### Step 2: Clone the GitHub Repository

Open VS Code Terminal or PowerShell and run:

```bash
git clone https://github.com/j23040570-student/UAT-Generator.git
```

### Step 3: Open the Project in VS Code

```bash
cd UAT-Generator
code .
```

Alternatively, open VS Code and select **File → Open Folder**, then select the downloaded `UAT-Generator` folder.

### Step 4: Navigate to the Frontend

Open the VS Code Terminal and run:

```bash
cd frontend
```

### Step 5: Install Dependencies

```bash
npm install
```

This installs the required dependencies listed in `package.json`.

### Step 6: Start the Development Server

```bash
npm run dev
```

### Step 7: Open the Website

After the development server starts, open the local URL shown in the terminal, usually:

http://localhost:5173/

The UATGen-AI Dashboard should now be visible.

## Running the Project Again

After the initial setup, there is no need to reinstall the dependencies every time.

Open the project and run:

```bash
cd frontend
npm run dev
```

To stop the development server, press `Ctrl + C` in the terminal.

## Getting the Latest Changes

To download the latest updates from GitHub, run the following command from the repository root:

```bash
git pull
```

If the project dependencies have changed, run `npm install` again inside the `frontend` directory.

## Development Note

This project is still in development. The current Dashboard contains demonstration data, and some navigation pages are placeholders. Authentication, backend services, NLP processing and database integration are not yet implemented.

## Project Team

Developed by the UATGen-AI project team.
