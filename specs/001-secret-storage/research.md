# Research: Airtable Token Secret Storage

**Branch**: `001-secret-storage` | **Date**: 2026-02-21

## Decision 1: Obsidian Secret Storage API

**Decision**: Use `app.secretStorage` + `SecretComponent` (Obsidian v1.11.4+).

**Rationale**: This is the only official Obsidian mechanism for storing plugin secrets
separately from `data.json`. It ships as part of the Obsidian runtime — no additional
dependency is required. `SecretComponent` is the recommended UI widget for the settings tab.

**How it works**:
- Secrets are stored in Obsidian's Local Storage, keyed by a user-assigned name.
- The plugin stores only the *name* (key) of the secret in `data.json`, not the value itself.
- Retrieval: `this.app.secretStorage.get(secretName)` returns the value or `null`.
- The `SecretComponent` renders a credential picker in the settings UI. Its `.onChange()`
  callback receives the secret *name* chosen by the user, which the plugin saves to settings.

**Security note**: As of v1.11.4 secrets are stored in plaintext in LevelDB (Local Storage).
Encryption via `electron.safeStorage` is planned for a subsequent release. This is a known
Obsidian limitation — not a plugin concern.

**Alternatives considered**:
- `loadData` / `saveData` (current approach): stores token in plaintext in `data.json`,
  which may be synced or inspected. Rejected because it is the problem being solved.
- System keychain via Node.js `keytar`: requires a native runtime dependency, violating
  Principle I. Rejected.
- Obsidian `loadLocalStorage` / `saveLocalStorage` (Plugin instance methods): stores per-plugin
  key-value data in Local Storage, not through the shared SecretStorage vault. Rejected because
  it is functionally equivalent to `data.json` for security purposes and bypasses the
  official secret management UX.

## Decision 2: Minimum Obsidian Version

**Decision**: Bump `minAppVersion` in `manifest.json` from `"0.12.0"` to `"1.11.4"`.

**Rationale**: `app.secretStorage` and `SecretComponent` are only available from v1.11.4
(released 2026-01-07). Setting an earlier minimum version would cause a runtime crash when
the code accesses a non-existent API.

**Alternatives considered**:
- Runtime version check + graceful fallback to `data.json`: preserves backwards compatibility
  but defeats the purpose of the feature and adds code complexity. Rejected per Principle IV.

## Decision 3: Settings Schema Change

**Decision**: Replace `accessToken: string` in settings with `accessTokenSecretName: string`.

**Rationale**: The plugin no longer stores the token value in settings. Instead, it stores
the *name* of the secret the user has configured in SecretStorage. This name is non-sensitive
and safe to persist in `data.json`.

**Migration path**: On `onload()`, if `settings.accessToken` is non-empty, the plugin will:
1. Derive a fixed secret name: `"obsidian-airtable-links-token"`.
2. Store the existing token under that name via `app.secretStorage`.
3. Set `settings.accessTokenSecretName` to that name.
4. Clear `settings.accessToken` and save settings.

If step 2 fails, the plugin emits a `Notice`, leaves settings unchanged, and aborts migration
(token remains in `data.json` — no data loss).

## Decision 4: Error Handling

**Decision**: On any API call where `app.secretStorage.get(name)` returns `null` or empty,
throw immediately with a `Notice` directing the user to settings.

**Rationale**: Silent failures leave users confused. A prominent notice is the Obsidian
convention (Principle III) and the simplest correct behaviour (Principle IV).
