import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface AirtableLinksSettings {
	accessToken: string;
	baseID: string;
	linksTableID: string;
	listsTableID: string;
}

interface CacheRecord {
	links: Link[];
	cachedAt: Date;
}

class Link {
	name: string;
	url: string;
	list: string;
	done: boolean;
	created: string;

	constructor(data: { name: string; url: string; list: string; done: boolean; created: string }) {
		this.name = data.name;
		this.url = data.url;
		this.list = data.list;
		this.done = data.done;
		this.created = data.created;
	}
}

class List {
	name: string;
	id: string;
	links?: string[];

	constructor(data: { name: string; id: string, links?: string[] }) {
		this.name = data.name;
		this.id = data.id;
		this.links = data.links || [];
	}
}

const DEFAULT_SETTINGS: AirtableLinksSettings = {
	accessToken: '',
	baseID: '',
	linksTableID: '',
	listsTableID: '',
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

	async getAirtableLinks(listID: string) {
		if (!this.REGEX.recordID.test(listID)) {
			throw new Error('Invalid List ID');
		}
		let record = this.readCache(listID);
		if (record) {
			record.cachedAt = new Date();
			return record.links;
		}
		const { baseID, linksTableID, accessToken } = this.settings;
		let list = await this.getAirtableList(listID);
		if (list.links.length === 0) {
			throw new Error('List has no links');
		}
		const requestURL = `https://api.airtable.com/v0/${baseID}/${linksTableID}/listRecords`;
		const response = await fetch(requestURL, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				filterByFormula: `FIND(RIGHT({Record URL}, 17), "${list.links.join(',')}")`
			})
		});
		const data = await response.json();
		let links = data?.records;
		if (!links || links.length === 0) {
			throw new Error('No links found');
		}
		links = links.map((l: { fields: any; }) => l.fields);
		links = links.map((l: { Name: any; URL: any; Done: any; Created: any; }) => new Link({ name: l.Name, url: l.URL, list: list.name, done: !!l.Done, created: l.Created }));
		this.cache.set(listID, {
			links,
			cachedAt: new Date()
		});
		return links;
	}

	async getAirtableList(listID: string) {
		if (!this.REGEX.recordID.test(listID)) {
			throw new Error('Invalid List ID');
		}
		const { baseID, listsTableID, accessToken } = this.settings;
		const requestURL = `https://api.airtable.com/v0/${baseID}/${listsTableID}/${listID}`;
		const response = await fetch(requestURL, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});
		const data = await response.json();
		if (!data || !data.fields) {
			throw new Error('List not found');
		}
		return new List({
			name: data.fields.Name || 'Unnamed List',
			id: data.id,
			links: data.fields.Links
		});
	}

	readCache(key: string) {
		let record = this.cache.get(key);
		if (record && (new Date().getTime() - record.cachedAt.getTime()) < 1000 * 60 * 3) {
			return record;
		}
	}

	cache = new Map<string, CacheRecord>();

	REGEX = {
		baseID: /^app[a-zA-Z0-9]{9,}$/,
		tableID: /^tbl[a-zA-Z0-9]{9,}$/,
		recordID: /^rec[a-zA-Z0-9]{9,}$/,
	};
}

class SettingTab extends PluginSettingTab {
	plugin: AirtableLinks;

	constructor(app: App, plugin: AirtableLinks) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

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
			.setName('Base ID')
			.setDesc('ID of the Airtable base')
			.addText(text => text
				.setPlaceholder('Enter base ID')
				.setValue(this.plugin.settings.baseID)
				.onChange(async (value) => {
					value = value.split('?')[0];
					if (!this.plugin.REGEX.baseID.test(value)) {
						new Notice('Invalid Base ID');
						return;
					}
					console.log('Base ID: ' + value);
					this.plugin.settings.baseID = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Lists Table ID')
			.setDesc('ID of the Airtable table containing lists')
			.addText(text => text
				.setPlaceholder('Enter table ID')
				.setValue(this.plugin.settings.listsTableID)
				.onChange(async (value) => {
					value = value.split('?')[0];
					if (!this.plugin.REGEX.tableID.test(value)) {
						new Notice('Invalid Table ID');
						return;
					}
					console.log('Lists ID: ' + value);
					this.plugin.settings.listsTableID = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Links Table ID')
			.setDesc('ID of the Airtable table containing links')
			.addText(text => text
				.setPlaceholder('Enter table ID')
				.setValue(this.plugin.settings.linksTableID)
				.onChange(async (value) => {
					value = value.split('?')[0];
					if (!this.plugin.REGEX.tableID.test(value)) {
						new Notice('Invalid Table ID');
						return;
					}
					console.log('Links ID: ' + value);
					this.plugin.settings.linksTableID = value;
					await this.plugin.saveSettings();
				}));
	}
}
