<!--
SYNC IMPACT REPORT
==================
Version change: N/A (initial population) → 1.0.0
Modified principles: N/A — first-time fill of all template placeholders
Added sections:
  - Core Principles (4 principles: Zero Runtime Dependencies, Single-File Architecture,
    Obsidian Plugin Conventions, Simplicity First)
  - Technology Stack (new; replaces generic SECTION_2)
  - Governance
Removed sections: SECTION_3 placeholder (merged into Governance)
Templates requiring updates:
  - .specify/templates/plan-template.md  ✅ Constitution Check gates are generic; no edit needed
  - .specify/templates/spec-template.md  ✅ No constitution-specific references; no edit needed
  - .specify/templates/tasks-template.md ✅ No constitution-specific references; no edit needed
Deferred TODOs: None
-->

# Obsidian Airtable Links Constitution

## Core Principles

### I. Zero Runtime Dependencies

This plugin MUST have zero runtime dependencies. The `dependencies` field in `package.json`
MUST remain empty. DevDependencies (build tools, type definitions, linters) are permitted.
All functionality MUST be implemented using the Obsidian Plugin API and native browser/Node
APIs available in the Obsidian runtime environment.

**Rationale**: Runtime dependencies increase bundle size, introduce supply-chain risk, and
add maintenance overhead. A focused personal tool of this scope requires no third-party
libraries at runtime.

### II. Single-File Architecture

All plugin logic MUST reside in `main.ts`, compiled to a single `main.js`. Additional
source files MUST NOT be introduced unless the file size genuinely harms readability,
in which case a justification MUST be documented in the plan's Complexity Tracking table
before splitting.

**Rationale**: A single-file layout is easy to audit, deploy, and understand. It directly
supports the zero-dependency and minimal-maintenance goals of this project.

### III. Obsidian Plugin Conventions

The plugin MUST follow official Obsidian plugin conventions:

- Settings MUST be persisted exclusively via `loadData()` / `saveData()`.
- User-facing errors MUST be surfaced using `new Notice(...)`.
- The plugin MUST release all resources (event listeners, intervals) in `onunload()`.
- Credentials and API tokens MUST NOT be hardcoded; they MUST be stored in plugin settings.

**Rationale**: Compliance with Obsidian conventions ensures compatibility across Obsidian
versions and a predictable user experience.

### IV. Simplicity First (YAGNI)

New features or abstractions MUST have a concrete, immediate use case. Speculative
generalization, premature abstraction, and configuration for hypothetical future users are
prohibited. This is a personal tool with a single purpose: retrieving Airtable links for
display via the Dataview API in Obsidian.

**Rationale**: Scope creep is the primary risk for a personal tool. Every addition that is
not immediately used increases maintenance burden without delivering value.

## Technology Stack

- **Language**: TypeScript, strict mode enforced via `tsconfig.json`
- **Build**: esbuild (`esbuild.config.mjs`), outputs `main.js` at repository root
- **Lint**: ESLint with `@antfu/eslint-config` (`eslint.config.mjs`)
- **Runtime target**: Obsidian desktop and mobile (Electron + Chromium browser APIs)
- **Testing**: No automated test framework. Manual validation against a live Obsidian vault
  is the accepted method. Automated tests MAY be added if explicitly requested.

## Governance

This constitution supersedes all other development conventions for this project. It is the
authoritative source of non-negotiable rules.

**Amendment procedure**:
1. Identify the principle or section being changed and state the rationale.
2. Update `CONSTITUTION_VERSION` following semantic versioning:
   - MAJOR: removal or incompatible redefinition of a principle.
   - MINOR: new principle or section added.
   - PATCH: clarifications, wording, or typo fixes.
3. Update `LAST_AMENDED_DATE` to the ISO date of the change.

**Compliance**:
- All feature plans MUST include a Constitution Check verifying compliance with all four
  principles before Phase 0 research begins.
- Violations of Principle I (Zero Runtime Dependencies) or Principle II (Single-File
  Architecture) MUST be explicitly justified in the plan's Complexity Tracking table
  before implementation proceeds.

**Version**: 1.0.0 | **Ratified**: 2026-02-21 | **Last Amended**: 2026-02-21
