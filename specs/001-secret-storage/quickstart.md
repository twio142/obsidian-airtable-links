# Quickstart & Validation Guide: Airtable Token Secret Storage

**Branch**: `001-secret-storage` | **Date**: 2026-02-21

## Prerequisites

- Obsidian ≥ 1.11.4 installed.
- A valid Airtable Personal Access Token.
- The plugin built and loaded into your test vault.

## Scenario A: Fresh Install

1. Build the plugin (`npm run build`) and copy `main.js` + `manifest.json` to your vault's
   plugin folder.
2. Enable the plugin in Obsidian → Settings → Community Plugins.
3. Open Settings → Airtable Links.
4. In the **Airtable Personal Access Token** field, click to select or create a secret.
   Enter your token value and give it a name (e.g., `"airtable-pat"`).
5. Fill in Base ID, Lists Table ID, Links Table ID as before.
6. Close settings.

**Verify**:
- Open `.obsidian/plugins/obsidian-airtable-links/data.json`.
- Confirm `accessTokenSecretName` is set to your secret name (e.g., `"airtable-pat"`).
- Confirm there is NO `accessToken` field with a token value.
- Call `app.plugins.plugins["obsidian-airtable-links"].getAirtableLinks("<list-id>")` from
  the developer console — it should succeed and return links.

## Scenario B: Migration from Old Install

1. Before upgrading: verify `data.json` contains `"accessToken": "patXXX..."`.
2. Build and replace `main.js` + `manifest.json` with the new version.
3. Reload Obsidian (or disable/enable the plugin).

**Verify**:
- Open `data.json` — `accessToken` should be empty string or absent; `accessTokenSecretName`
  should be `"obsidian-airtable-links-token"`.
- Plugin should work without re-entering any credentials.
- No error Notice appeared during load.

## Scenario C: No Token Configured

> **Note**: The plugin caches results in memory for 3 minutes. To hit this path immediately,
> reload the plugin first (disable → enable in Community Plugins) to clear the cache before
> attempting a fetch.

1. Clear `accessTokenSecretName` from settings (deselect the secret via the UI).
2. Reload the plugin to clear the in-memory cache.
3. Attempt to fetch links from the developer console.

**Verify**:
- A Notice appears with a clear message directing the user to Settings.
- No uncaught exception or silent failure.

## Scenario D: Update Stored Token

1. Open Settings → Airtable Links → Access Token field.
2. Change the selected secret to a different one (or update the value of the existing secret).

**Verify**:
- `data.json` reflects the new `accessTokenSecretName`.
- Subsequent API calls use the updated token.
