# Web-Agent-Based Detection of Broken Access Control via Authorization State Perturbation

A research prototype for detecting **Broken Access Control (BAC)** in web applications through black-box web exploration, frontend authorization-state perturbation, and agent-based evaluation.

## Overview

Numerous web applications monetize their services through feature gating, offering free content while restricting access to premium features to paying subscribers. In this setting, Broken Access Control (BAC) vulnerabilities may arise when improper server-side checks or reliance on client-side logic allow users to access features or resources beyond their intended privileges. 

While prior research has investigated these vulnerabilities under specific assumptions, e.g., client-side access
control, we propose a technology-agnostic, black-box approach for detecting feature-gating BAC and reporting potential vulnerabilities in natural language. Our approach uses a proxy server to perturb authorization state by mutating JSON-based
network data delivered to the web front-end. A web agent then interacts with the application and analyzes its GUI state across two runs, before and after the perturbation, to identify behavioral differences indicative of unauthorized feature access.

In short, the prototype combines:

1. **A proxy server**, which observes application traffic and selectively perturbs authorization-related values in eligible JSON responses.
2. **A web agent**, which explores the application through its user interface and acts as an oracle for assessing whether restricted functionality or resources become accessible.
3. **An evaluation workflow**, which coordinates discovery, perturbation, agent-driven interaction, and the collection of results.

## Installation and Usage

1. Clone the repository and navigate to the project directory.
2. Run the installation script:
    ```bash
    sudo bash install.sh
    ```
3. Start the tool:
    ```bash
    sudo bash start.sh
    ```