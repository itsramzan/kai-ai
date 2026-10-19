#!/usr/bin/env node

import Groq from "groq-sdk";
import figlet from "figlet";
import { Command } from "commander";
import { input } from "@inquirer/prompts";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: resolve(projectDir, ".env"), quiet: true });

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function supportsColor() {
  return Boolean(
    process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb"
  );
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function gradient(text, start = "#8B5CF6", end = "#06B6D4") {
  if (!supportsColor()) return text;
  const chars = [...text];
  const visible = chars.filter((char) => char !== "\n").length;
  if (visible <= 1) {
    const [r, g, b] = hexToRgb(start);
    return `\x1b[38;2;${r};${g};${b}m${text}${RESET}`;
  }
  const a = hexToRgb(start);
  const b = hexToRgb(end);
  let index = 0;
  return (
    chars
      .map((char) => {
        if (char === "\n") return char;
        const t = index++ / (visible - 1);
        const rgb = a.map((value, i) => Math.round(value + (b[i] - value) * t));
        return `\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m${char}`;
      })
      .join("") + RESET
  );
}

const paint = {
  green: (s) => (supportsColor() ? `\x1b[32m${s}${RESET}` : s),
  yellow: (s) => (supportsColor() ? `\x1b[33m${s}${RESET}` : s),
  red: (s) => (supportsColor() ? `\x1b[31m${s}${RESET}` : s),
  dim: (s) => (supportsColor() ? `${DIM}${s}${RESET}` : s),
};

function showBanner() {
  const art = figlet.textSync("K A I", {
    font: "Small Slant",
    horizontalLayout: "fitted",
    verticalLayout: "fitted",
  });
  console.log(gradient(art, "#A855F7", "#22D3EE"));
  console.log(gradient("A I   T E R M I N A L", "#F472B6", "#60A5FA"));
  console.log(
    paint.dim("Ask anything. Type /help for commands, /exit to quit.\n")
  );
}

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is missing. Create a .env file from .env.example and add your Groq API key."
    );
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const history = [
  {
    role: "system",
    content:
      "You are KAI, a friendly, capable terminal AI assistant. " +
      "Answer accurately and clearly. Reply in the language used by the user, " +
      "including Bangla or Banglish. Use Markdown and code examples when useful.",
  },
];

async function askAI(client, question, useHistory = true) {
  const messages = useHistory
    ? [...history, { role: "user", content: question }]
    : [
        {
          role: "system",
          content:
            "You are KAI, a helpful AI assistant. Reply in the user's language.",
        },
        { role: "user", content: question },
      ];

  const response = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    messages,
    max_completion_tokens: 2048,
  });

  const answer =
    response.choices[0]?.message?.content?.trim() || "No response received.";

  if (useHistory) {
    history.push({ role: "user", content: question });
    history.push({ role: "assistant", content: answer });
    if (history.length > 21) history.splice(1, history.length - 21);
  }
  return answer;
}

function showError(error) {
  if (error.status === 401) {
    console.error(
      paint.red("Invalid Groq API key. Check GROQ_API_KEY in your .env file.")
    );
  } else if (error.status === 429) {
    console.error(
      paint.yellow("Groq rate limit reached. Wait a moment and try again.")
    );
  } else if (error.status === 404) {
    console.error(
      paint.red(
        "Model not found. Check GROQ_MODEL against the models available to your Groq account."
      )
    );
  } else {
    console.error(paint.red(`Error: ${error.message || String(error)}`));
  }
}

async function startChat() {
  const client = getClient();
  showBanner();

  while (true) {
    let question;
    try {
      question = await input({
        message: gradient("You: ", "#22D3EE", "#A78BFA"),
        required: false,
      });
    } catch (error) {
      if (error.name === "ExitPromptError") {
        console.log(
          "\n" + gradient("See you next time ✦", "#A855F7", "#22D3EE")
        );
        return;
      }
      throw error;
    }

    question = question.trim();
    if (!question) continue;

    const command = question.toLowerCase();
    if (["/exit", "/quit", "exit"].includes(command)) {
      console.log("\n" + gradient("See you next time ✦", "#A855F7", "#22D3EE"));
      return;
    }
    if (command === "/clear") {
      history.splice(1);
      console.clear();
      showBanner();
      console.log(paint.green("Conversation history cleared.\n"));
      continue;
    }
    if (command === "/help") {
      console.log(`
  ${gradient("/help", "#A855F7", "#22D3EE")}   Show commands
  ${gradient("/clear", "#A855F7", "#22D3EE")}  Clear conversation history
  ${gradient("/exit", "#A855F7", "#22D3EE")}   Exit KAI
`);
      continue;
    }

    try {
      console.log(paint.dim("\n  KAI is thinking...\n"));
      const answer = await askAI(client, question);
      console.log(`${gradient("KAI: ", "#A855F7", "#22D3EE")}${answer}\n`);
    } catch (error) {
      showError(error);
    }
  }
}

async function askOnce(question) {
  const client = getClient();
  console.log(await askAI(client, question, false));
}

const program = new Command();
program
  .name("kai")
  .description("NEXUS — gradient-styled Groq AI terminal assistant")
  .version(packageJson.version);

program
  .command("chat")
  .description("Start interactive AI chat")
  .action(startChat);

program
  .command("ask")
  .description("Ask one question")
  .argument("<question...>", "Your question")
  .action((question) => askOnce(question.join(" ")));

program
  .command("banner")
  .description("Display the gradient ASCII banner")
  .action(showBanner);

program.action(startChat);
program.parseAsync(process.argv).catch((error) => {
  showError(error);
  process.exitCode = 1;
});
