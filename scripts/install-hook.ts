/**
 * Install Hook Script
 * Adds the JRPG Battle Visualizer hook to Claude Code settings
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Claude Code settings path
const claudeSettingsDir = join(homedir(), '.claude');
const claudeSettingsPath = join(claudeSettingsDir, 'settings.json');

// Hook command - points to the built hook
const hookCommand = `node "${join(projectRoot, 'packages', 'hook', 'dist', 'index.js')}"`;

interface ClaudeSettings {
  hooks?: {
    PostToolUse?: Array<{
      matcher?: string;
      hooks?: Array<{
        type: string;
        command: string;
        timeout?: number;
      }>;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function loadSettings(): ClaudeSettings {
  if (!existsSync(claudeSettingsPath)) {
    return {};
  }

  try {
    const content = readFileSync(claudeSettingsPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    console.error('Failed to parse existing settings, starting fresh');
    return {};
  }
}

function saveSettings(settings: ClaudeSettings): void {
  if (!existsSync(claudeSettingsDir)) {
    mkdirSync(claudeSettingsDir, { recursive: true });
  }

  writeFileSync(claudeSettingsPath, JSON.stringify(settings, null, 2), 'utf-8');
}

function installHook(): void {
  console.log('Installing JRPG Battle Visualizer hook...\n');

  const settings = loadSettings();

  // Initialize hooks structure if needed
  if (!settings.hooks) {
    settings.hooks = {};
  }

  if (!settings.hooks.PostToolUse) {
    settings.hooks.PostToolUse = [];
  }

  // Check if hook already exists
  const existingHook = settings.hooks.PostToolUse.find(
    (h) =>
      h.matcher === 'TodoWrite' &&
      h.hooks?.some((hook) => hook.command.includes('jrpg-battle-visualizer'))
  );

  if (existingHook) {
    console.log('Hook already installed! Updating command...\n');

    // Update the command
    existingHook.hooks = [
      {
        type: 'command',
        command: hookCommand,
        timeout: 30,
      },
    ];
  } else {
    // Add new hook
    settings.hooks.PostToolUse.push({
      matcher: 'TodoWrite',
      hooks: [
        {
          type: 'command',
          command: hookCommand,
          timeout: 30,
        },
      ],
    });
  }

  saveSettings(settings);

  console.log('Hook installed successfully!\n');
  console.log('Configuration added to:', claudeSettingsPath);
  console.log('\nHook details:');
  console.log('  Event: PostToolUse');
  console.log('  Matcher: TodoWrite');
  console.log('  Command:', hookCommand);
  console.log('\nNext steps:');
  console.log('  1. Make sure you have built the hook: pnpm build');
  console.log('  2. Set your API keys in .env file');
  console.log('  3. Start the dashboard: pnpm dev');
  console.log('  4. Use Claude Code with any task that uses TodoWrite');
}

function uninstallHook(): void {
  console.log('Uninstalling JRPG Battle Visualizer hook...\n');

  const settings = loadSettings();

  if (!settings.hooks?.PostToolUse) {
    console.log('No hooks found, nothing to uninstall.');
    return;
  }

  // Remove the JRPG hook
  settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(
    (h) =>
      !(
        h.matcher === 'TodoWrite' &&
        h.hooks?.some((hook) => hook.command.includes('jrpg-battle-visualizer'))
      )
  );

  // Clean up empty arrays
  if (settings.hooks.PostToolUse.length === 0) {
    delete settings.hooks.PostToolUse;
  }

  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  saveSettings(settings);

  console.log('Hook uninstalled successfully!');
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--uninstall') || args.includes('-u')) {
  uninstallHook();
} else {
  installHook();
}
