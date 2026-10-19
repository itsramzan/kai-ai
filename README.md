# KAI / NEXUS AI CLI

A small interactive Groq-powered terminal chatbot built with JavaScript ES modules, Commander, Figlet, Inquirer prompts, and dotenv.

## Requirements

- Node.js 20+
- A Groq API key: https://console.groq.com/keys

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and add your own `GROQ_API_KEY`. Never share or commit this file.

## Run locally

```bash
npm start
# or
node src/index.js
```

## Install the `kai` command

```bash
npm link
kai
```

If `kai` is not found, open a new terminal and check that npm's global bin directory is on your PATH.

## Commands

```bash
kai
kai chat
kai ask "Explain JavaScript closures"
kai banner
kai --help
```

In chat mode:

- `/help` — list chat commands
- `/clear` — clear conversation context
- `/exit` — quit

## Configuration

Set `GROQ_MODEL` in `.env` to a model available to your Groq account. The default is `openai/gpt-oss-20b`.

## Termux

Install Node.js in Termux, copy/clone this folder, then run `npm install`, configure `.env`, and `npm link`.

```bash
pkg update
pkg install nodejs
npm install
cp .env.example .env
nano .env
npm link
kai
```
