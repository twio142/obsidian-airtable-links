import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	accessToken: string;
	linksTableUrl: string;
	listsTableUrl: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	accessToken: '',
	linksTableUrl: '',
	listsTableUrl: '',
}


export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });
		// Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app, this).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app, this).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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
		const {listsTableUrl, linksTableUrl, accessToken} = this.settings;
		const listsMatch = listsTableUrl.match(this.AIRTABLE_URL_REGEX);
		const linksMatch = linksTableUrl.match(this.AIRTABLE_URL_REGEX);
		const match = listUrl.match(this.AIRTABLE_URL_REGEX);
		if (!match || match[1] !== listsMatch[1] || match[2] !== listsMatch[2] || !match[4]) {
			new Notice('Invalid list URL');
			return;
		}
		const requestUrl = `https://api.airtable.com/v0/${linksMatch[1]}/${linksMatch[2]}?filterByFormula=FIND(%22${match[4]}%22%2C+%7BList-URLs%7D)`;
		const response = await fetch(requestUrl, {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});
		const data = await response.json();
		const records = data?.records;
		if (!records || records.length === 0) {
			new Notice('No links found');
			return;
		}
		return records;
	}

	AIRTABLE_URL_REGEX = /https:\/\/airtable.com\/(app[^/]+)\/(tbl[^/]+)(\/viw[^/]+\/(rec[^/]+))?/;

	// async makeTable(listUrl: string) {
	// 	let records = await this.GetAirtableLinks(listUrl);
	// 	if (!records) return;
	// }
}

class SampleModal extends Modal {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Enter Airtable List URL: ');
		const input = contentEl.createEl('input');
		input.focus();
		input.onkeydown = (ev) => {
			if (ev.key === 'Enter') {
				this.plugin.GetAirtableLinks(input.value);
				this.close();
			}
		};
		contentEl.createEl('span').setText(' ');
		const button = contentEl.createEl('button');
		button.setText('Confirm');
		button.onclick = () => {
			this.plugin.GetAirtableLinks(input.value);
			this.close();
		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
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
