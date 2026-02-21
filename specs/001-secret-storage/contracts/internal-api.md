# Internal API Contracts: Airtable Token Secret Storage

**Branch**: `001-secret-storage` | **Date**: 2026-02-21

> Note: This is an Obsidian plugin with no HTTP API. "Contracts" here define the internal
> function signatures and platform API boundaries that the implementation must satisfy.

---

## Contract 1: Secret Resolution

**Function**: `resolveAccessToken(): Promise<string>`
**Location**: `AirtableLinks` class (`main.ts`)

**Behaviour**:
- Reads `this.settings.accessTokenSecretName`.
- If empty → throws `Error("No Airtable token configured. Open Settings to add one.")`.
- Calls `this.app.secretStorage.get(secretName)`.
- If result is `null` or empty string → throws `Error("Airtable token not found in secret storage. ...")`.
- Returns the token string.

**Callers**: `getAirtableLinks()`, `getAirtableList()`
**Must NOT**: call `saveSettings()`, mutate state, or fall back to `settings.accessToken`.

---

## Contract 2: Token Migration

**Function**: `migrateTokenToSecretStorage(): Promise<void>`
**Location**: `AirtableLinks` class (`main.ts`)

**Trigger**: Called once from `onload()` after `loadSettings()`.

**Preconditions** (all must be true to run migration):
- `settings.accessToken` is a non-empty string.

**Behaviour**:
1. Define `MIGRATION_SECRET_NAME = "obsidian-airtable-links-token"`.
2. Write `settings.accessToken` value to SecretStorage under `MIGRATION_SECRET_NAME`.
3. Set `settings.accessTokenSecretName = MIGRATION_SECRET_NAME`.
4. Set `settings.accessToken = ""`.
5. Call `saveSettings()`.

**On failure** (step 2 throws):
- Emit `new Notice("Airtable Links: Failed to migrate token to secret storage. Please re-enter it in Settings.")`.
- Do NOT mutate settings.
- Do NOT call `saveSettings()`.

**Postconditions (success)**:
- `settings.accessToken === ""`
- `settings.accessTokenSecretName === "obsidian-airtable-links-token"`
- `data.json` no longer contains the access token value.

---

## Contract 3: Settings UI — Token Field

**Component**: `SecretComponent` inside `SettingTab.display()`

**Behaviour**:
- Renders a credential picker showing the current `settings.accessTokenSecretName`.
- On change: sets `settings.accessTokenSecretName = newValue` and calls `plugin.saveSettings()`.
- The component does NOT receive or display the actual token value.

**Replaces**: the existing `Setting.addText()` block for `accessToken`.

---

## Contract 4: Manifest Version

**File**: `manifest.json`

| Field | Old Value | New Value |
|-------|-----------|-----------|
| `minAppVersion` | `"0.12.0"` | `"1.11.4"` |

**Rationale**: `app.secretStorage` and `SecretComponent` require Obsidian ≥ 1.11.4.
