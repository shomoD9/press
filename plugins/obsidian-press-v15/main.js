/**
 * This file is the private Obsidian plugin shell for Press V1.5. It exists so users
 * can run install, connect, ready-check, publish, update, and rollback actions from
 * Obsidian command palette instead of opening a terminal.
 *
 * It talks to local Press scripts/commands through child processes and to Obsidian's
 * workspace API for current-file context and command UI.
 */
const path = require("path");
const { spawn } = require("child_process");
const {
  Plugin,
  PluginSettingTab,
  Setting,
  Notice,
  Modal,
  MarkdownView
} = require("obsidian");

const DEFAULT_SETTINGS = {
  pressRepoPath: "/Users/shomo/development/build/press",
  vaultPath: "",
  excalidrawMcpCommand: "",
  defaultSourceFile: "essay.md"
};

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function normalizeLineEndings(value) {
  return String(value || "").replace(/\r\n/g, "\n");
}

class TextPromptModal extends Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.result = null;
    this.resolve = null;
  }

  openAndWait() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.options.title });

    const input = contentEl.createEl("input", { type: "text" });
    input.placeholder = this.options.placeholder || "";
    input.value = this.options.initialValue || "";
    input.style.width = "100%";
    input.style.marginBottom = "12px";

    const buttonRow = contentEl.createDiv();
    buttonRow.style.display = "flex";
    buttonRow.style.gap = "8px";

    const confirm = buttonRow.createEl("button", { text: this.options.confirmLabel || "Confirm" });
    const cancel = buttonRow.createEl("button", { text: "Cancel" });

    const closeWith = (value) => {
      this.result = value;
      this.close();
    };

    confirm.onclick = () => {
      closeWith(input.value.trim());
    };

    cancel.onclick = () => {
      closeWith(null);
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        closeWith(input.value.trim());
      }
    });

    // We autofocus so command flows stay fast and keyboard-first.
    window.setTimeout(() => input.focus(), 0);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.resolve) {
      this.resolve(this.result);
    }
  }
}

class ActionModal extends Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h3", { text: this.options.title });
    const body = contentEl.createEl("pre");
    body.setText(this.options.body || "");
    body.style.whiteSpace = "pre-wrap";
    body.style.maxHeight = "300px";
    body.style.overflow = "auto";
    body.style.marginBottom = "12px";

    const buttonRow = contentEl.createDiv();
    buttonRow.style.display = "flex";
    buttonRow.style.gap = "8px";

    if (this.options.actionLabel && this.options.onAction) {
      const actionButton = buttonRow.createEl("button", { text: this.options.actionLabel });
      actionButton.onclick = async () => {
        this.close();
        await this.options.onAction();
      };
    }

    const closeButton = buttonRow.createEl("button", { text: "Close" });
    closeButton.onclick = () => this.close();
  }
}

class PressSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Press V1.5 Settings" });

    new Setting(containerEl)
      .setName("Press repository path")
      .setDesc("Absolute path to the Press repository that contains package.json.")
      .addText((text) =>
        text
          .setPlaceholder("/Users/shomo/development/build/press")
          .setValue(this.plugin.settings.pressRepoPath)
          .onChange(async (value) => {
            this.plugin.settings.pressRepoPath = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Creative vault path")
      .setDesc("Absolute path to your creative vault root.")
      .addText((text) =>
        text
          .setPlaceholder("/Users/.../creative")
          .setValue(this.plugin.settings.vaultPath)
          .onChange(async (value) => {
            this.plugin.settings.vaultPath = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Excalidraw MCP command")
      .setDesc("Command used to start your Excalidraw MCP server.")
      .addText((text) =>
        text
          .setPlaceholder("npx -y <your-excalidraw-mcp-server>")
          .setValue(this.plugin.settings.excalidrawMcpCommand)
          .onChange(async (value) => {
            this.plugin.settings.excalidrawMcpCommand = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default source markdown file")
      .setDesc("Used when the active file is the project root or cannot infer source.")
      .addText((text) =>
        text
          .setPlaceholder("essay.md")
          .setValue(this.plugin.settings.defaultSourceFile)
          .onChange(async (value) => {
            this.plugin.settings.defaultSourceFile = value.trim() || "essay.md";
            await this.plugin.saveSettings();
          })
      );
  }
}

module.exports = class PressV15Plugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.ensureVaultPath();

    this.addSettingTab(new PressSettingTab(this.app, this));

    this.addCommand({
      id: "press-install-or-repair",
      name: "Press: Install or Repair",
      callback: async () => this.installOrRepair()
    });

    this.addCommand({
      id: "press-connect-services",
      name: "Press: Connect Services",
      callback: async () => this.connectServices()
    });

    this.addCommand({
      id: "press-ready-check",
      name: "Press: Ready Check",
      callback: async () => this.readyCheck()
    });

    this.addCommand({
      id: "press-generate-diagram-current",
      name: "Press: Generate Diagram (Current File/Selection)",
      callback: async () => this.generateDiagramCurrent()
    });

    this.addCommand({
      id: "press-refine-diagram",
      name: "Press: Refine Diagram",
      callback: async () => this.refineDiagram()
    });

    this.addCommand({
      id: "press-generate-visual-plan",
      name: "Press: Generate Visual Plan",
      callback: async () => this.generateVisualPlan()
    });

    this.addCommand({
      id: "press-build-article-draft-package",
      name: "Press: Build Article Draft Package",
      callback: async () => this.buildArticleDraftPackage()
    });

    this.addCommand({
      id: "press-update",
      name: "Press: Update Press",
      callback: async () => this.updatePress()
    });

    this.addCommand({
      id: "press-rollback",
      name: "Press: Rollback Press",
      callback: async () => this.rollbackPress()
    });
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  ensureVaultPath() {
    if (this.settings.vaultPath) {
      return;
    }

    const adapter = this.app.vault.adapter;
    if (adapter && typeof adapter.getBasePath === "function") {
      this.settings.vaultPath = adapter.getBasePath();
      this.saveSettings();
    }
  }

  async promptText(options) {
    const modal = new TextPromptModal(this.app, options);
    return modal.openAndWait();
  }

  showActionModal(title, body, actionLabel, onAction) {
    const modal = new ActionModal(this.app, { title, body, actionLabel, onAction });
    modal.open();
  }

  openPluginSettings() {
    const settingManager = this.app.setting;
    if (settingManager && typeof settingManager.open === "function") {
      settingManager.open();
      if (typeof settingManager.openTabById === "function") {
        settingManager.openTabById(this.manifest.id);
      }
      return;
    }

    new Notice("Open Obsidian settings and configure Press V1.5 manually.");
  }

  ensureConfiguredPaths() {
    if (!this.settings.pressRepoPath || !this.settings.vaultPath) {
      this.showActionModal(
        "Press configuration missing",
        "Set Press repository path and creative vault path in plugin settings.",
        "Open settings",
        async () => this.openPluginSettings()
      );
      return false;
    }

    return true;
  }

  runProcess(command, args, cwd) {
    return new Promise((resolve) => {
      const child = spawn(command, args, { cwd, shell: false });
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });

      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });

      child.on("close", (code) => {
        resolve({
          code: code || 0,
          stdout: normalizeLineEndings(stdout),
          stderr: normalizeLineEndings(stderr)
        });
      });
    });
  }

  async runNpmScript(scriptName, extraArgs) {
    const args = ["run", scriptName];
    if (extraArgs && extraArgs.length > 0) {
      args.push("--", ...extraArgs);
    }

    return this.runProcess(npmCommand(), args, this.settings.pressRepoPath);
  }

  async runPublishCommand(subCommandArgs) {
    const distPath = path.join(this.settings.pressRepoPath, "dist", "index.js");
    const result = await this.runProcess("node", [distPath, ...subCommandArgs], this.settings.pressRepoPath);
    return result;
  }

  parseJsonOutput(stdout) {
    try {
      return JSON.parse(stdout.trim());
    } catch {
      return null;
    }
  }

  resolveProjectContextFromActiveFile() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      return null;
    }

    const parts = activeFile.path.split("/");
    const categoryIndex = parts.findIndex((entry) => entry === "Essays" || entry === "Commentary");
    if (categoryIndex === -1 || categoryIndex >= parts.length - 1) {
      return null;
    }

    const projectRelative = parts.slice(0, categoryIndex + 2).join("/");
    const sourceRelative = parts.slice(categoryIndex + 2).join("/") || this.settings.defaultSourceFile;

    return {
      activeFile,
      projectRelative,
      projectAbsolute: path.join(this.settings.vaultPath, projectRelative),
      sourceRelative
    };
  }

  getSelectionText() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || !view.editor) {
      return "";
    }

    return view.editor.getSelection().trim();
  }

  async installOrRepair() {
    if (!this.ensureConfiguredPaths()) {
      return;
    }

    new Notice("Press install/repair started...");

    const args = ["--vault", this.settings.vaultPath];
    if (this.settings.excalidrawMcpCommand) {
      args.push("--excalidraw-mcp-command", this.settings.excalidrawMcpCommand);
    }

    const result = await this.runNpmScript("bootstrap", args);
    if (result.code === 0) {
      new Notice("Press install/repair completed.");
      return;
    }

    this.showActionModal(
      "Install or Repair failed",
      `${result.stdout}\n${result.stderr}`.trim(),
      "Run Ready Check",
      async () => this.readyCheck()
    );
  }

  async connectServices() {
    if (!this.ensureConfiguredPaths()) {
      return;
    }

    const command = await this.promptText({
      title: "Excalidraw MCP command",
      placeholder: "npx -y <your-excalidraw-mcp-server>",
      initialValue: this.settings.excalidrawMcpCommand,
      confirmLabel: "Connect"
    });

    if (!command) {
      return;
    }

    const result = await this.runNpmScript("connect-services", [
      "--vault",
      this.settings.vaultPath,
      "--excalidraw-mcp-command",
      command
    ]);

    const parsed = this.parseJsonOutput(result.stdout);
    if (result.code === 0 && parsed && parsed.ok) {
      this.settings.excalidrawMcpCommand = command;
      await this.saveSettings();
      new Notice("Excalidraw service connected and validated.");
      return;
    }

    this.showActionModal(
      "Connect Services failed",
      `${result.stdout}\n${result.stderr}`.trim(),
      "Retry connection",
      async () => this.connectServices()
    );
  }

  async readyCheck() {
    if (!this.ensureConfiguredPaths()) {
      return;
    }

    const result = await this.runNpmScript("ready-check", ["--vault", this.settings.vaultPath]);
    const body = `${result.stdout}\n${result.stderr}`.trim();
    const isReady = result.code === 0 && body.includes("READY");

    if (isReady) {
      new Notice("Press status: READY");
      this.showActionModal("Press Ready Check", body);
      return;
    }

    this.showActionModal("Press Ready Check: NOT READY", body, "Run Install or Repair", async () =>
      this.installOrRepair()
    );
  }

  async generateDiagramCurrent() {
    if (!this.ensureConfiguredPaths()) {
      return;
    }

    const context = this.resolveProjectContextFromActiveFile();
    if (!context) {
      this.showActionModal(
        "No project context",
        "Open a markdown file inside Essays/<slug>/... or Commentary/<slug>/... first."
      );
      return;
    }

    let excerpt = this.getSelectionText();
    if (!excerpt) {
      excerpt = await this.promptText({
        title: "Diagram excerpt",
        placeholder: "Paste the excerpt that should drive diagram generation",
        confirmLabel: "Generate"
      });
    }

    if (!excerpt) {
      return;
    }

    const result = await this.runPublishCommand([
      "publish",
      "diagram-create",
      "--project",
      context.projectAbsolute,
      "--source",
      context.sourceRelative,
      "--excerpt",
      excerpt
    ]);

    await this.handleCapabilityResult("Generate Diagram", result, async () => this.readyCheck());
  }

  async refineDiagram() {
    if (!this.ensureConfiguredPaths()) {
      return;
    }

    const context = this.resolveProjectContextFromActiveFile();
    if (!context) {
      this.showActionModal(
        "No project context",
        "Open a markdown file inside Essays/<slug>/... or Commentary/<slug>/... first."
      );
      return;
    }

    const diagram = await this.promptText({
      title: "Diagram ID or filename",
      placeholder: "diagram-01 or diagram-01.excalidraw",
      confirmLabel: "Next"
    });
    if (!diagram) {
      return;
    }

    const instruction = await this.promptText({
      title: "Refinement instruction",
      placeholder: "Simplify labels and tighten spacing",
      confirmLabel: "Refine"
    });
    if (!instruction) {
      return;
    }

    const result = await this.runPublishCommand([
      "publish",
      "diagram-refine",
      "--project",
      context.projectAbsolute,
      "--diagram",
      diagram,
      "--instruction",
      instruction
    ]);

    await this.handleCapabilityResult("Refine Diagram", result, async () => this.readyCheck());
  }

  async generateVisualPlan() {
    if (!this.ensureConfiguredPaths()) {
      return;
    }

    const context = this.resolveProjectContextFromActiveFile();
    if (!context) {
      this.showActionModal(
        "No project context",
        "Open a markdown file inside Essays/<slug>/... or Commentary/<slug>/... first."
      );
      return;
    }

    const result = await this.runPublishCommand([
      "publish",
      "plan-generate",
      "--project",
      context.projectAbsolute,
      "--source",
      context.sourceRelative
    ]);

    await this.handleCapabilityResult("Generate Visual Plan", result, async () => this.readyCheck());
  }

  async buildArticleDraftPackage() {
    if (!this.ensureConfiguredPaths()) {
      return;
    }

    const context = this.resolveProjectContextFromActiveFile();
    if (!context) {
      this.showActionModal(
        "No project context",
        "Open a markdown file inside Essays/<slug>/... or Commentary/<slug>/... first."
      );
      return;
    }

    const result = await this.runPublishCommand([
      "publish",
      "build-draft-package",
      "--project",
      context.projectAbsolute,
      "--source",
      context.sourceRelative
    ]);

    await this.handleCapabilityResult("Build Article Draft Package", result, async () =>
      this.generateVisualPlan()
    );
  }

  async updatePress() {
    if (!this.ensureConfiguredPaths()) {
      return;
    }

    const args = ["--vault", this.settings.vaultPath];
    if (this.settings.excalidrawMcpCommand) {
      args.push("--excalidraw-mcp-command", this.settings.excalidrawMcpCommand);
    }

    const result = await this.runNpmScript("update", args);
    if (result.code === 0) {
      new Notice("Press updated successfully.");
      return;
    }

    this.showActionModal(
      "Update failed",
      `${result.stdout}\n${result.stderr}`.trim(),
      "Run rollback",
      async () => this.rollbackPress()
    );
  }

  async rollbackPress() {
    if (!this.ensureConfiguredPaths()) {
      return;
    }

    const args = ["--vault", this.settings.vaultPath];
    if (this.settings.excalidrawMcpCommand) {
      args.push("--excalidraw-mcp-command", this.settings.excalidrawMcpCommand);
    }

    const result = await this.runNpmScript("rollback", args);
    if (result.code === 0) {
      new Notice("Press rollback completed.");
      return;
    }

    this.showActionModal("Rollback failed", `${result.stdout}\n${result.stderr}`.trim());
  }

  async handleCapabilityResult(actionLabel, processResult, fixCallback) {
    const parsed = this.parseJsonOutput(processResult.stdout);
    if (processResult.code === 0 && parsed && parsed.ok) {
      const files = parsed.data ? JSON.stringify(parsed.data, null, 2) : "{}";
      const warnings = (parsed.warnings || []).map((entry) => `- ${entry}`).join("\n");

      const body = [
        `Action: ${actionLabel}`,
        `Message: ${parsed.message || "Completed."}`,
        "",
        "Changed files / data:",
        files,
        "",
        "Warnings:",
        warnings || "- none"
      ].join("\n");

      new Notice(`${actionLabel} completed.`);
      this.showActionModal(actionLabel, body);
      return;
    }

    this.showActionModal(
      `${actionLabel} failed`,
      `${processResult.stdout}\n${processResult.stderr}`.trim(),
      "Run Ready Check",
      fixCallback
    );
  }
};
