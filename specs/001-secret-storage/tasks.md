---

description: "Task list for Airtable Token Secret Storage"
---

# Tasks: Airtable Token Secret Storage

**Input**: Design documents from `/specs/001-secret-storage/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/internal-api.md ✅

**Tests**: Not requested — manual validation via `quickstart.md` scenarios.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (no dependency on incomplete tasks in same phase)
- **[Story]**: Which user story this task belongs to
- All file paths are relative to repository root

## Path Conventions

Single-file plugin — all source changes in `main.ts` at repository root.

---

## Phase 1: Setup

**Purpose**: Manifest update; independent of all `main.ts` changes.

- [x] T001 [P] Bump `minAppVersion` from `"0.12.0"` to `"1.11.4"` in `manifest.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update the TypeScript settings interface and defaults so all subsequent tasks
compile cleanly. MUST complete before any US1 or US2 work.

**⚠️ CRITICAL**: Both US1 and US2 depend on this phase.

- [x] T002 Update `AirtableLinksSettings` interface in `main.ts`: remove `accessToken: string`, add `accessTokenSecretName: string`
- [x] T003 Update `DEFAULT_SETTINGS` in `main.ts`: remove `accessToken: ''`, add `accessTokenSecretName: ''`

**Checkpoint**: TypeScript interface and defaults are updated. All references to
`settings.accessToken` will now be compile errors — expected and correct.

---

## Phase 3: User Story 1 - Store Token Securely (Priority: P1) 🎯 MVP

**Goal**: Replace the plain-text token input in settings with a `SecretComponent` secret
picker, add a device-local notice, and update API calls to resolve the token from
`app.secretStorage` via a new `resolveAccessToken()` helper.

**Independent Test**: Open plugin settings, select a secret via the picker, close Obsidian,
reopen — plugin should fetch Airtable links successfully. Inspect `data.json` and confirm
only `accessTokenSecretName` (a name string) is present, not any token value.

### Implementation for User Story 1

- [x] T004 [P] [US1] Replace the `accessToken` `Setting.addText()` block in `SettingTab.display()` in `main.ts` with a `SecretComponent` — set current value via `.setValue(this.plugin.settings.accessTokenSecretName)`, save selected name on `.onChange()` via `this.plugin.settings.accessTokenSecretName = value; await this.plugin.saveSettings()`
- [x] T005 [P] [US1] Add device-local notice beneath the token field in `SettingTab.display()` in `main.ts` — `containerEl.createEl('p', { text: 'Note: Secrets are stored locally on this device and will not sync to other devices.' })` (satisfies FR-008)
- [x] T006 [P] [US1] Implement `resolveAccessToken(): Promise<string>` method on `AirtableLinks` class in `main.ts` per Contract 1: throw `Error` if `accessTokenSecretName` is empty; call `this.app.secretStorage.get(name)`; throw `Error` (surfaced via `new Notice`) if result is null/empty; return token string
- [x] T007 [US1] Update `getAirtableLinks()` in `main.ts`: replace `const { baseID, linksTableID, accessToken } = this.settings` destructure with `const { baseID, linksTableID } = this.settings` and `const accessToken = await this.resolveAccessToken()` (depends on T006)
- [x] T008 [P] [US1] Update `getAirtableList()` in `main.ts`: replace `const { baseID, listsTableID, accessToken } = this.settings` destructure with `const { baseID, listsTableID } = this.settings` and `const accessToken = await this.resolveAccessToken()` (depends on T006; parallel with T007 once T006 is done)

**Checkpoint**: US1 fully functional. Fresh installs can select a secret and fetch Airtable
data. Token value is absent from `data.json`.

---

## Phase 4: User Story 2 - Transparent Migration (Priority: P2)

**Goal**: On plugin load, if `settings.accessToken` is non-empty (legacy install), silently
migrate the token to SecretStorage and clear it from `data.json`.

**Independent Test**: Manually populate `data.json` with `"accessToken": "patXXX..."`, reload
Obsidian — plugin continues to work, `data.json` no longer contains the token value, no
manual action required.

### Implementation for User Story 2

- [x] T009 [US2] Implement `migrateTokenToSecretStorage(): Promise<void>` method on `AirtableLinks` class in `main.ts` per Contract 2: check `settings.accessToken` non-empty; write to SecretStorage under fixed name `"obsidian-airtable-links-token"`; on success set `settings.accessTokenSecretName`, clear `settings.accessToken`, call `saveSettings()`; on failure emit `new Notice(...)` and leave settings unchanged
- [x] T010 [US2] Add `await this.migrateTokenToSecretStorage()` call in `onload()` in `main.ts` immediately after `await this.loadSettings()` (depends on T009)

**Checkpoint**: Existing installs migrate automatically on next load. No user action required.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Build verification and manual validation.

- [x] T011 Run `npm run build` from repository root and confirm zero TypeScript errors and successful esbuild output
- [x] T012 Validate all four scenarios from `specs/001-secret-storage/quickstart.md` against a live Obsidian vault (Scenario A: fresh install; Scenario B: migration; Scenario C: no token; Scenario D: update token)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately (different file from all others)
- **Foundational (Phase 2)**: No dependencies — can start immediately (parallel with Phase 1)
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) completion; independent of US1
- **Polish (Phase 5)**: Depends on all implementation phases (US1 + US2) being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2
- **US2 (P2)**: Can start after Phase 2 — no dependency on US1

### Within US1

- T004, T005, T006: All independent of each other — run in parallel
- T007: Depends on T006
- T008: Depends on T006; parallel with T007

### Within US2

- T009 before T010 (method must exist before it is called)

---

## Parallel Execution Examples

```bash
# Phase 1 + Phase 2 in parallel:
Task: "T001 — Bump minAppVersion in manifest.json"
Task: "T002 — Update AirtableLinksSettings interface in main.ts"
Task: "T003 — Update DEFAULT_SETTINGS in main.ts"

# Within US1 (after Foundational complete):
Task: "T004 — Replace accessToken Setting with SecretComponent in SettingTab"
Task: "T005 — Add device-local notice to SettingTab"
Task: "T006 — Implement resolveAccessToken() on AirtableLinks"

# After T006 done:
Task: "T007 — Update getAirtableLinks() to use resolveAccessToken()"
Task: "T008 — Update getAirtableList() to use resolveAccessToken()"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 (US1): SecretComponent UI + `resolveAccessToken()` + API call updates
3. **STOP and VALIDATE**: Open settings, pick a secret, fetch Airtable data, inspect `data.json`
4. Proceed to US2 only after US1 is verified

### Incremental Delivery

1. Phase 1 + Phase 2 → interface is clean, plugin will not compile mid-way (expected)
2. US1 complete → fresh install path fully works; existing users still need re-entry
3. US2 complete → existing users migrate automatically on next load
4. Polish → build verified, all quickstart scenarios pass

---

## Notes

- All changes are in two files only: `main.ts` and `manifest.json`
- TypeScript will report compile errors after T002/T003 until US1 tasks are done — this is expected
- The `resolveAccessToken()` method (T006) is the linchpin for US1; complete it before T007/T008
- Migration (US2) retries on every load until successful — no "already migrated" flag needed
- No `settings.accessToken` reference should remain after all tasks complete
