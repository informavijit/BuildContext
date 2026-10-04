# BuildContext

**BuildContext** is a free, privacy-first VS Code extension that traverses workspaces, detects applications and solutions, extracts codebase knowledge, and writes compact knowledge-base Markdown files per application (`<app-id>.md` and `KB_INDEX.md`). AI coding agents (Claude Code, Copilot, Cursor, Gemini) can load these context files instead of consuming thousands of tokens reading raw codebases.

## Core Features

- **100% Rule-Based & Offline by Default**: Scanning, project detection, script parsing, symbol extraction, dependency graph generation, and indexing require no network calls, no API keys, and no telemetry.
- **Opt-in AI Authoring Modes**: `BuildContext: Workspace AI` and `BuildContext: Refine Path AI` allow optional AI models (VS Code LM API, Anthropic, Gemini, OpenAI-compatible servers, or local Ollama) to synthesize knowledge-base documents with strict evidence-grounding validation.
- **BuildContext Refine Path**: Deduplicates, merges, and de-noises folders of Markdown knowledge files to maintain compact token budgets.
- **Agent Pointer Generation**: Writes managed pointer blocks to `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and `.cursor/rules/buildcontext.mdc`.
- **Multi-Language Support**: Deep & Tiered analysis across Java, .NET (C#/VB/F#), C/C++, Delphi/Object Pascal (including text DFMs), Python, JS/TS (React, Angular, Vue, NestJS, Express), Dart/Flutter, PowerShell, Perl, Go, Rust, Kotlin, Swift, PHP, Ruby, Shell, SQL, Docker, K8s, OpenAPI, and Proto.
- **Secret Protection**: Values in configuration files and environment definitions are strictly redacted. Only key names are extracted.

## Commands

- `BuildContext: Workspace`: Automatic scan of the active workspace (intelligently updates changed apps, settings, or rule-packs).
- `BuildContext: Folder...`: Scan a selected folder.
- `BuildContext: Refine Path`: Optimize, merge, and compact a folder of `.md` context files into a `_refined/` subfolder.
- `BuildContext: Workspace AI`: Opt-in AI-authored knowledge generation.
- `BuildContext: Refine Path AI`: Opt-in AI section merging.
- `BuildContext: Generate Agent Pointers`: Add pointer blocks for AI agent guidelines.
- `BuildContext: Open Index`: Open `KB_INDEX.md`.

## Preserving Custom Notes

Any notes placed under `<!-- buildcontext:manual -->` or wrapped inside `<!-- buildcontext:keep -->...<!-- /buildcontext:keep -->` in generated `.md` files will be preserved verbatim across regenerations and refinement passes.

## License

MIT License. Completely free and open source.
