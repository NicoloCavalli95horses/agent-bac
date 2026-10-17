# Web-Agent-Based Detection of Broken Access Control via Authorization State Perturbation

A research prototype for detecting **Broken Access Control (BAC)** in web applications through black-box web exploration, frontend authorization-state perturbation, and agent-based evaluation.

## Overview

Numerous web applications monetize their services through feature gating, offering free content while restricting access to premium features to paying subscribers. In this setting, Broken Access Control (BAC) vulnerabilities may arise when improper server-side checks or reliance on client-side logic allow users to access features or resources beyond their intended privileges. 

While prior research has investigated these vulnerabilities under specific assumptions, this project proposes a technology-agnostic, black-box approach for detecting feature-gating BAC and reporting potential vulnerabilities in natural language. We use a proxy server to perturb authorization state by mutating JSON-based network data delivered to the web front-end. A web agent then interacts with the application and analyzes its GUI state across two runs, before and after the perturbation, to identify behavioral differences indicative of unauthorized feature access. Generation of E2E tests is currently work in progress.

## Requirements

The research prototype has been tested with the following environment:

- Ubuntu 24.04 LTS (64-bit)  
- Python 3.12.3 with `venv`
- Node.js v24.12.0
- npm 11.6.2
- Google Chrome 153.0.8010.52 (Official Build, x86_64)

Other versions may work but have not been tested.

## Installation and Usage

1. Clone the repository and navigate to the project directory.

2. Run the installation script:

   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. Start the tool as a regular user (do not run the script with `sudo`):

   ```bash
   chmod +x start.sh
   ./start.sh
   ```

### Troubleshooting

If the installation script fails, check the error message first. You can install the project dependencies manually:

- **Python dependencies**, from the repository root:

  ```bash
  python3 -m venv .venv
  .venv/bin/python -m pip install -r requirements.txt
  ```

- **Node.js dependencies**, from `src/playwright`:

  ```bash
  cd src/playwright
  npm install
  ```

Some system dependencies may need to be installed separately.