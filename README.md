# 🧠 CLI Agent using OpenAI API

A lightweight command-line agent that leverages OpenAI’s GPT-4 and vector store memory to provide intelligent and contextual responses.

---

## 1. 🚀 How to Launch the Agent

### ✅ Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- An OpenAI API key (`sk-...`)

### 🧪 Installation

```bash
git clone <your-repo-url>
cd <your-repo>
npm install
```
#### ▶️ Start the Agent

```bash
./start.sh
```
Or if you prefer using npm:

```bash
npm start
```
On first run:
* You will be prompted to enter your OpenAI API key.
* A .env file will be created with the key.
* A memory/ folder and storeId.json file will be initialized.
* The agent will start and wait for user input.

### 🧑‍💻 Usage

Once running, simply type your question and press Enter.

Special commands:
* `exit`: To terminate the agent.
* (More commands can be added later)

## 2. ⚙️ Technologies Used

- **Node.js** - For the backend server.
- **TypeScript** – If working with .mts modules
- **OpenAI SDK** - For GPT-4 and vector store access
- **readline** – CLI interaction
- **dotenv** - For environment variable management.
- **fs** (File System) – Local message storage
- **Bash** – For environment setup via start.sh

## 3. 📚 Project Overview & How It Works

### 💡 Overview
This project provides a CLI-based agent that:
* Stores per-user conversations in a vector store
* Retrieves relevant past context for intelligent answers
* Persists chat logs and memory files per user

### 📂 Folder Structure

```bash
.
├── agent.mts         # Main Agent class (OpenAI logic & memory)
├── main.mts          # CLI loop, user interaction
├── memory/
│   ├── storeId.json  # Vector store IDs per user
│   └── user-<id>.txt # Local conversation history
├── .env              # OpenAI API key
├── start.sh          # Bash script for setup & launch
└── package.json
```

### 🔁 Workflow

1. On startup, the agent loads or creates a vector store for the current user.

2. When the user sends a message:
* It retrieves relevant past messages from the vector store.
* It sends a prompt including this context to OpenAI’s GPT-4.
* The response is returned and displayed in the terminal.
* Both user input and assistant reply are saved locally.
* The updated history is uploaded to the vector store.

## 📌 Notes & Future Features

* Add SQLite for structured history
* Command /history to view past messages
* Multi-user management interface
* Option to reset or export memory

## 👤 Author

### Made by Roméo Froger