import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface AirtableLinksSettings {
	accessToken: string;
	linksTableUrl: string;
	listsTableUrl: string;
}

interface CacheRecord {
	links: any[];
	cachedAt: Date;
}

const DEFAULT_SETTINGS: AirtableLinksSettings = {
	accessToken: '',
	linksTableUrl: '',
	listsTableUrl: '',
}


export default class AirtableLinks extends Plugin {
	settings: AirtableLinksSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async GetAirtableLinks(listUrl: string) {
		listUrl = listUrl.split('?')[0];
		let result;
		if (result = this.readCache(listUrl), result) {
			result.cachedAt = new Date();
			return result.links;
		}
		const {listsTableUrl, linksTableUrl, accessToken} = this.settings;
		const listsMatch = listsTableUrl.match(this.AIRTABLE_URL_REGEX);
		const linksMatch = linksTableUrl.match(this.AIRTABLE_URL_REGEX);
		const match = listUrl.match(this.AIRTABLE_URL_REGEX);
		if (!match || match[1] !== listsMatch[1] || match[2] !== listsMatch[2] || !match[4]) {
			new Notice('Invalid list URL');
			return;
		}
		const requestUrl = `https://api.airtable.com/v0/${linksMatch[1]}/${linksMatch[2]}?filterByFormula=FIND(%22${listUrl}%22%2C%7BList-URLs%7D)`;
		const response = await fetch(requestUrl, {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});
		const data = await response.json();
		let links = data?.records;
		if (!links || links.length === 0) {
			new Notice('No links found');
			return;
		}
		links = links.map(l => l.fields);
		const listName = links[0]['List-Names'][links[0].Lists.indexOf(match[4])];
		links = links.map(l => ({name: l.Name, url: l.URL, list: listName, done: !!l.Done, created: l.Created}));
		this.CACHE[listUrl] = {
			links,
			cachedAt: new Date()
		};
		return records;
	}

	readCache(key: string) {
		let record = this.CACHE[key];
		if (record && new Date() - record.cachedAt < 1000 * 60 * 3) {
			return record;
		}
	}

	CACHE = new Map<string, CacheRecord>();

	AIRTABLE_URL_REGEX = /https:\/\/airtable.com\/(app[^/]+)\/(tbl[^/]+)(\/viw[^/]+\/(rec[^/]+))?/;
}

class SettingTab extends PluginSettingTab {
	plugin: AirtableLinks;

	constructor(app: App, plugin: AirtableLinks) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Airtable Personal Access Token')
			.addText(text => text
				.setPlaceholder('Enter your token')
				.setValue(this.plugin.settings.accessToken)
				.onChange(async (value) => {
					console.log('Access Token: ' + value);
					this.plugin.settings.accessToken = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Lists Table URL')
			.setDesc('URL of the Airtable table containing lists')
			.addText(text => text
				.setPlaceholder('Enter table URL')
				.setValue(this.plugin.settings.listsTableUrl)
				.onChange(async (value) => {
					value = value.split('?')[0];
					if (!this.plugin.AIRTABLE_URL_REGEX.test(value)) {
						new Notice('Invalid Airtable URL');
						return;
					}
					console.log('Lists URL: ' + value);
					this.plugin.settings.listsTableUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Links Table URL')
			.setDesc('URL of the Airtable table containing links')
			.addText(text => text
				.setPlaceholder('Enter table URL')
				.setValue(this.plugin.settings.linksTableUrl)
				.onChange(async (value) => {
					value = value.split('?')[0];
					if (!this.plugin.AIRTABLE_URL_REGEX.test(value)) {
						new Notice('Invalid Airtable URL');
						return;
					}
					console.log('Links URL: ' + value);
					this.plugin.settings.linksTableUrl = value;
					await this.plugin.saveSettings();
				}));
	}
}
