# project description
A lightweight Vite + JavaScript front-end, with optional Node.js server `server/` and optional Python scripts `llm_scripts/` for data processing. currently at mid-fidelity level

## Requirement
there is no strictly requirement for Node.js or Pyhton, newest version is recommanded.

## How to Run

### Clone this repository
```bash
# 1) Clone and enter the project
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# 2) Install dependencies and start the front-end
npm install
npm run dev
# Open the printed URL (usually http://localhost:5173)
```
### (Optional) Run the Node server
```bash
cd server
npm install
npm start          # or: node index.js (adjust to your entry file)
```
### (Optional but require a deployed modal) Run Python scripts
```bash
cd llm_scripts
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt   # if present
python data_enhance.py            # adjust to your script name

# the modal I used
https://huggingface.co/TheBloke/openchat-3.5-0106-GGUF/blob/main/openchat-3.5-0106.Q5_K_M.gguf
```

## data
See `public/data/HourlyGenerator.py` for details on generating the hourly summaries. Several features depend on these files; write the outputs to the same `public/data/` path so the app can load them.

## path
be sure to change the file path to your local file path in python script before run it.


# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
