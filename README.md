# JRPG Battle Visualizer

Transform your Claude Code work sessions into dramatic 16-bit JRPG battle visualizations!

When Claude works through a todo list, each task becomes a monster battle rendered in classic SNES-era pixel art style. Watch as Claude defeats the **Glitch Fiend** (bugs), battles the **Feature Dragon** (new implementations), and vanquishes the **Code Hydra** (refactoring tasks).

## Features

- **Real-time battle visualization** - Watch battles unfold as Claude works
- **AI-generated pixel art** - Each scene is uniquely generated via Google Gemini
- **Dramatic narration** - Battle descriptions written by Claude Opus 4.5
- **Style consistency** - Reference images maintain visual continuity
- **Live web dashboard** - See HP bars, battle log, and party status

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- [Anthropic API key](https://console.anthropic.com/)
- [Google Gemini API key](https://aistudio.google.com/apikey)

## Quick Start

```bash
# 1. Clone and install
cd /Users/kyle/Developer/jrpg-battle-visualizer
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env and add your API keys

# 3. Build all packages
pnpm build

# 4. Install the Claude Code hook
pnpm hook:install

# 5. Start the dashboard
pnpm dev
```

Open http://localhost:3000 to see the battle dashboard.

Now use Claude Code on any project with tasks - every todo transition triggers a battle scene!

## How It Works

```
┌──────────────────┐
│   Claude Code    │  1. You ask Claude to work on tasks
│   (Your Session) │
└────────┬─────────┘
         │ TodoWrite tool call
         ▼
┌──────────────────┐
│   Hook Script    │  2. Hook detects task state changes
│                  │     pending → in_progress = BATTLE START
│                  │     in_progress → completed = VICTORY
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ Claude │ │ Gemini │  3. Generate dramatic description + pixel art
│ Opus   │ │ Image  │
└────┬───┘ └────┬───┘
     └─────┬────┘
           ▼
┌──────────────────┐
│   Web Dashboard  │  4. Real-time battle display
│   localhost:3000 │
└──────────────────┘
```

## Enemy Types

Tasks are automatically mapped to enemies based on keywords:

| Task Keywords | Enemy | Weakness |
|---------------|-------|----------|
| bug, fix, error | Glitch Fiend | DEBUG |
| test, spec | Test Golem | ASSERT |
| refactor, clean | Code Hydra | PATTERN |
| implement, add, create | Feature Dragon | ARCHITECTURE |
| deploy, release | Deploy Titan | ASSERT |
| document, readme | Doc Specter | SYNTAX |
| security, auth | Shadow Guardian | LOGIC |

## Project Structure

```
jrpg-battle-visualizer/
├── packages/
│   ├── core/           # Shared types, prompts, utilities
│   ├── hook/           # Claude Code PostToolUse hook
│   └── dashboard/      # Next.js battle viewer
├── data/
│   ├── battles.db      # SQLite database
│   └── images/         # Generated battle images
└── scripts/
    ├── install-hook.ts # Hook installer
    └── seed-party.ts   # Initialize party members
```

## Commands

```bash
# Development
pnpm dev              # Start dashboard in dev mode
pnpm build            # Build all packages

# Hook management
pnpm hook:install     # Add hook to Claude Code
pnpm hook:uninstall   # Remove hook from Claude Code

# Database
pnpm setup:party      # Reset party members to defaults
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | (required) |
| `GEMINI_API_KEY` | Your Google Gemini API key | (required) |
| `DATABASE_PATH` | Path to SQLite database | `./data/battles.db` |
| `IMAGES_DIR` | Directory for generated images | `./data/images` |
| `DASHBOARD_URL` | Dashboard URL for notifications | `http://localhost:3000` |

## The Party

Your battle party consists of:

- **Claude** (Sage, Lv.50) - Master of all coding arts
- **TypeScript** (Guardian, Lv.45) - Protector of types
- **Git** (Chronomancer, Lv.40) - Master of time and versions

## Troubleshooting

**Hook not triggering?**
- Make sure you ran `pnpm build` after any changes
- Check that API keys are set in `.env`
- Verify hook is installed: check `~/.claude/settings.json`

**No images generating?**
- Confirm `GEMINI_API_KEY` is valid
- Check rate limiting (5s minimum between generations)
- Look for errors in hook output (set `DEBUG=1`)

**Dashboard not updating?**
- Ensure dashboard is running (`pnpm dev`)
- Check browser console for SSE connection errors
- Verify `DASHBOARD_URL` matches your setup

## License

MIT

---

*May your code be bug-free and your battles victorious!* ⚔️
