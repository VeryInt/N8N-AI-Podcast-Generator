# Tech Push - Cloudflare Workers Project

This project is a full-stack application leveraging Cloudflare Workers for serverless backend logic, a React frontend for the user interface, and potentially a Python backend for specific functionalities (e.g., AI/ML tasks via Hugging Face). It's designed for high performance and scalability, deployed on the Cloudflare edge network.

## Features

*   **Serverless Backend:** Powered by Cloudflare Workers for efficient, low-latency API endpoints.
*   **Modern Frontend:** Built with React for a dynamic and responsive user experience.
*   **TypeScript Support:** Ensures type safety and improves code maintainability across the project.
*   **Vite for Development:** Fast development server and optimized build process.
*   **Hugging Face Integration (Potential):** `src/worker/huggingface.ts` suggests integration with Hugging Face models, likely for AI/ML tasks.
*   **Python Backend (Potential):** `src/python/app.py` indicates a Python component, possibly for more complex backend processing or specific services.

## Technologies Used

*   **Cloudflare Workers:** Serverless platform for backend logic.
*   **Hono:** Fast, lightweight web framework for Cloudflare Workers (likely used in `src/worker/index.ts`).
*   **React:** JavaScript library for building user interfaces.
*   **Vite:** Next-generation frontend tooling.
*   **TypeScript:** Superset of JavaScript that adds static types.
*   **Wrangler:** Cloudflare's CLI tool for developing and deploying Workers.
*   **ESLint:** Pluggable JavaScript linter.
*   **Python:** For `src/python/app.py`, potentially with frameworks like Flask/FastAPI (not explicitly visible, but common).

## Getting Started

### Prerequisites

*   Node.js (LTS recommended)
*   npm or yarn
*   Cloudflare account and Wrangler CLI installed and configured.
*   Python 3.x (if running the Python backend)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd tech-push
    ```
2.  Install frontend and worker dependencies:
    ```bash
    npm install
    # or yarn install
    ```
3.  (Optional) Install Python dependencies if `src/python/app.py` is used:
    ```bash
    # Navigate to the python directory if it has its own requirements.txt
    # cd src/python
    # pip install -r requirements.txt
    # cd ../..
    ```

### Running the Project Locally

1.  **Start the React development server:**
    ```bash
    npm run dev
    ```
    This will typically start the React app on `http://localhost:5173`.

2.  **Start the Cloudflare Worker development server:**
    In a separate terminal:
    ```bash
    npm run start # or wrangler dev
    ```
    This will start the Worker locally, usually on `http://localhost:8787`. The React app will likely proxy API requests to this address.

3.  **Start the Python backend (if applicable):**
    In another separate terminal:
    ```bash
    # Navigate to the python directory
    # cd src/python
    # python app.py # or uvicorn app:app --reload if using FastAPI
    # cd ../..
    ```

## Project Structure

```
.
├── .git/                   # Git version control
├── .vscode/                # VS Code settings
├── node_modules/           # Node.js dependencies
├── public/                 # Static assets for the frontend
├── src/
│   ├── python/             # Python backend application
│   │   └── app.py
│   ├── react-app/          # React frontend application
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── vite-env.d.ts
│   │   └── assets/
│   │       ├── Cloudflare_Logo.svg
│   │       ├── hono.svg
│   │       └── react.svg
│   └── worker/             # Cloudflare Worker backend logic
│       ├── huggingface.ts  # Hugging Face integration logic
│       └── index.ts        # Main Worker entry point (likely Hono)
├── .gitignore
├── eslint.config.js        # ESLint configuration
├── index.html              # Main HTML file for the React app
├── package-lock.json
├── package.json            # Node.js project metadata and scripts
├── README.md               # This file
├── tsconfig.app.json       # TypeScript config for React app
├── tsconfig.json           # Base TypeScript config
├── tsconfig.node.json      # TypeScript config for Node.js environment
├── tsconfig.worker.json    # TypeScript config for Cloudflare Worker
├── vite.config.ts          # Vite build configuration
├── worker-configuration.d.ts # Cloudflare Worker type definitions
└── wrangler.json           # Cloudflare Wrangler configuration
```

## Deployment

To deploy the Cloudflare Worker:

```bash
npm run deploy # or wrangler deploy
```

Ensure your `wrangler.json` is correctly configured for your Cloudflare account.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[Specify your license here, e.g., MIT License]