# Feature Specification: Airtable Token Secret Storage

**Feature Branch**: `001-secret-storage`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: "the latest version of obsidian supports storing secret apart from
plugin config file. this plugin uses an airtable personal access token. this should be stored
as a secret."

## Clarifications

### Session 2026-02-21

- Q: Should the plugin address that secrets are device-local and do not sync via Obsidian Sync? → A: Yes — add a brief informational notice in the settings UI.
- Q: Should the plugin allow explicit token removal/clearing in the settings UI? → A: Out of scope — secrets are stored and managed in Obsidian's own secret vault UI; the plugin only holds a reference (secret name). Lifecycle management (create, update, delete) is Obsidian's responsibility.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Store Token Securely (Priority: P1)

The user opens the plugin settings and selects which Obsidian secret contains their Airtable
Personal Access Token. The plugin stores only the secret's name as a reference. The token
value itself lives in Obsidian's shared secret vault and does not appear in the plugin's
configuration file.

**Why this priority**: This is the core requirement. Without it, sensitive credentials remain
exposed in a plain-text config file that may be synced, backed up, or read by other processes.

**Independent Test**: Enter a new token via the settings UI, close and reopen Obsidian, then
verify the plugin successfully fetches Airtable data. Also verify the token is absent from the
plugin's data file.

**Acceptance Scenarios**:

1. **Given** the plugin is installed and the settings tab is open, **When** the user selects
   a secret from Obsidian's secret vault, **Then** the secret's name is saved to the plugin's
   settings and the token value remains exclusively in Obsidian's secret vault, absent from
   the plugin's configuration/data file.
2. **Given** an access token is already stored, **When** the user enters a new token and saves,
   **Then** the stored token is updated and the old value is no longer accessible.
3. **Given** an access token is stored, **When** the plugin makes an Airtable API request,
   **Then** the request succeeds using the stored token without any user interaction.

---

### User Story 2 - Transparent Migration for Existing Setup (Priority: P2)

The user already has a working plugin setup with an access token stored in the old config file.
On next load, the plugin detects the old token, moves it to secure storage automatically, and
removes it from the config file — without any user action required.

**Why this priority**: The user should not need to re-enter their token or take any manual
migration steps. A seamless transition is essential for a single-user personal tool.

**Independent Test**: Place a token in the plugin's data file, reload Obsidian, then verify
the plugin continues to work and the token is no longer in the data file.

**Acceptance Scenarios**:

1. **Given** an access token exists in the plugin's configuration file, **When** the plugin
   loads, **Then** the token is automatically moved to secure storage and removed from the
   configuration file, with no user action required.
2. **Given** migration has completed, **When** the user opens plugin settings, **Then** the
   token field reflects that a token is already stored (e.g., masked placeholder).

---

### Edge Cases

- What happens when the secure credential store is unavailable (e.g., older platform version
  that pre-dates the feature)?
  → _Assumption_: The plugin will declare a minimum platform version requirement that guarantees
  secure storage availability. On unsupported versions, the plugin should display a clear notice
  and decline to save the token rather than falling back to the config file.
- What happens when no token is stored and an API call is triggered?
  → The plugin must display a clear, actionable message telling the user to configure the token
  in settings before attempting any Airtable operation.
- What happens if migration fails (e.g., write to secure storage errors out)?
  → The token must remain in the config file unchanged (no data loss). The user must be informed
  that migration failed and prompted to re-enter the token in settings.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The plugin MUST store the Airtable Personal Access Token exclusively in the
  platform's secure credential store, not in the plugin's configuration/data file.
- **FR-002**: The plugin MUST provide a settings UI field that allows the user to select which
  Obsidian secret holds their Airtable token. The plugin stores only the secret's name (a
  non-sensitive reference); the actual token value is managed exclusively through Obsidian's
  own secret management interface, not through this plugin.
- **FR-003**: The plugin MUST read the access token from secure storage every time an Airtable
  API request is made.
- **FR-004**: The plugin MUST NOT write or retain the access token in the plugin configuration
  file (`data.json`) at any point after this feature is active.
- **FR-005**: If no token is stored and an Airtable API call is attempted, the plugin MUST
  display a clear message directing the user to configure the token in settings.
- **FR-006**: On startup, if the plugin detects an access token in the existing configuration
  file, it MUST automatically migrate that token to secure storage and remove it from the
  configuration file without user interaction.
- **FR-007**: If migration fails, the plugin MUST leave the original configuration unchanged,
  notify the user of the failure, and prompt them to re-enter the token manually in settings.
- **FR-008**: The plugin's settings UI MUST display a persistent informational notice stating
  that the access token is stored locally on this device and will not sync to other devices.

### Key Entities

- **Access Token**: The Airtable Personal Access Token. Sensitive credential required for all
  Airtable API operations. Previously stored in config; now stored in secure credential store.
- **Plugin Configuration**: The plugin's persisted settings file. After this feature, it MUST
  NOT contain the access token. Still holds non-sensitive settings (Base ID, Table IDs).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After entering a token via the settings UI, the token is not present in any
  plain-text file associated with the plugin (verified by inspecting the data file).
- **SC-002**: The plugin successfully retrieves Airtable links after token migration or
  fresh token entry, with no additional steps from the user.
- **SC-003**: An existing user with a token in their config file experiences zero disruption:
  the plugin migrates automatically and continues working on the next load.
- **SC-004**: Attempting to fetch Airtable data with no token configured results in a
  clear, user-actionable error message rather than a silent failure.

## Assumptions

- The plugin will declare a minimum platform version that includes the secure credential
  storage feature. Backwards compatibility with older platform versions is out of scope.
- Other settings (Base ID, Links Table ID, Lists Table ID) are not sensitive and MUST remain
  in the standard configuration file.
- The plugin's settings UI does not handle the token value at all — it only holds a reference
  (the secret name). Creating, updating, and deleting the actual token value is done through
  Obsidian's own secret management interface.
- Secrets are device-local and do not sync via Obsidian Sync. Users with multiple devices
  must re-enter the token on each device. The plugin MUST surface this as an in-UI notice
  (see FR-008) rather than relying on documentation alone.
