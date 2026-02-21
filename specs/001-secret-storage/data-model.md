# Data Model: Airtable Token Secret Storage

**Branch**: `001-secret-storage` | **Date**: 2026-02-21

## Changed Entity: Plugin Settings

### Before (current `AirtableLinksSettings`)

```typescript
interface AirtableLinksSettings {
  accessToken: string      // ← token value stored in plain text
  baseID: string
  linksTableID: string
  listsTableID: string
}
```

### After (updated `AirtableLinksSettings`)

```typescript
interface AirtableLinksSettings {
  accessTokenSecretName: string  // ← name/key of secret in SecretStorage (non-sensitive)
  baseID: string
  linksTableID: string
  listsTableID: string
}
```

**Field details**:

| Field | Type | Description | Stored in |
|-------|------|-------------|-----------|
| `accessTokenSecretName` | `string` | Name of the secret in Obsidian SecretStorage that holds the token. Empty string means no secret selected. | `data.json` |
| `baseID` | `string` | Airtable base ID (non-sensitive). Unchanged. | `data.json` |
| `linksTableID` | `string` | Airtable Links table ID (non-sensitive). Unchanged. | `data.json` |
| `listsTableID` | `string` | Airtable Lists table ID (non-sensitive). Unchanged. | `data.json` |

**Removed field**:

| Field | Type | Reason |
|-------|------|--------|
| `accessToken` | `string` | Was stored in `data.json` in plain text. Replaced by `accessTokenSecretName`. |

## Updated Default Settings

```typescript
const DEFAULT_SETTINGS: AirtableLinksSettings = {
  accessTokenSecretName: '',   // no secret selected by default
  baseID: '',
  linksTableID: '',
  listsTableID: '',
}
```

## State Transitions

### Fresh install (no prior data)

```
DEFAULT_SETTINGS
  accessTokenSecretName: ''
→ User opens Settings, selects/creates a secret via SecretComponent
→ settings.accessTokenSecretName = "<chosen-secret-name>"
→ saveSettings()
→ Plugin uses app.secretStorage.get(accessTokenSecretName) for API calls
```

### Existing install (migration)

```
Loaded settings (legacy)
  accessToken: "patXXXXXXXXXXXXXX"   ← non-empty
  accessTokenSecretName: ''            ← empty (or absent)

→ onload() detects accessToken non-empty
→ app.secretStorage.set("obsidian-airtable-links-token", accessToken) // pseudo-code
→ settings.accessTokenSecretName = "obsidian-airtable-links-token"
→ settings.accessToken = ''   // clear
→ saveSettings()
→ Normal operation resumes
```

### Migration failure

```
→ app.secretStorage.set(...) throws / rejects
→ new Notice("Airtable Links: Failed to migrate token to secure storage. ...")
→ settings left unchanged (accessToken still populated, migration NOT marked done)
→ Next load will retry migration
```
