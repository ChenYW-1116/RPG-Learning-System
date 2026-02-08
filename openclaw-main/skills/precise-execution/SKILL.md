---
name: precise-execution
description: Execute complex tasks with zero hallucination and high precision by running an embedded OpenClaw agent session with enforced Chain of Thought, Hybrid Memory Search, and strict Sandbox boundaries. Use this when the user demands high accuracy or when previous attempts have failed due to hallucinations.
---

# Precise Execution Skill

This skill allows you to spawn a specialized, ephemeral OpenClaw agent designed for maximum precision. It enforces a "think-before-you-act" workflow and leverages hybrid memory search to ground its responses in reality.

## Operational Logic

When you invoke this skill, it runs a TypeScript script that:
1.  **Initializes the OpenClaw Engine**: Loads the core config and connects to the local state.
2.  **Enforces CoT**: Sets the `thinkingLevel` to `high`, forcing the underlying model to output `<think>` blocks before any final response.
3.  **Activates Hybrid Memory**: Ensures both Vector and Keyword search are active to retrieve relevant context from `MEMORY.md` and session history.
4.  **Sandboxes Execution**: Runs all tools within the Docker-based sandbox (if configured) to prevent accidental system state corruption.

## Usage

To execute a task with precision:

```bash
bun skills/precise-execution/scripts/run-task.ts --prompt "<YOUR_COMPLEX_PROMPT_HERE>"
```

### Parameters

- `--prompt`: The detailed description of the task to perform. Be specific about constraints.
- `--model` (Optional): Override the model to use (e.g., `claude-3-5-sonnet` for best reasoning). Default is the system default.
- `--verbose`: Enable detailed logging of the thought process.

## When to Use

- **Code Refactoring**: When changing core logic where mistakes are costly.
- **Root Cause Analysis**: When you need deep reasoning to find a bug.
- **Documentation Lookup**: When you need to answer questions based strictly on provided docs (`AGENTS.md`, `SKILL.md`s) without guessing.
- **Anti-Hallucination**: If you suspect the model is making things up, switch to this skill to force a grounded check.
