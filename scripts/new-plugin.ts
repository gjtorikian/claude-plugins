import { mkdir, writeFile, access } from 'fs/promises';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const PLUGINS_DIR = join(ROOT, 'plugins');

const USAGE = `Usage: npx tsx scripts/new-plugin.ts <plugin-name>

Creates a new plugin scaffold under plugins/<plugin-name>/ with:
  .claude-plugin/plugin.json
  commands/
  README.md`;

async function exists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

async function main() {
    const name = process.argv[2];

    if (!name) {
        console.error(USAGE);
        process.exit(1);
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
        console.error(`Plugin name must be lowercase alphanumeric with hyphens only. Got: "${name}"`);
        process.exit(1);
    }

    const pluginDir = join(PLUGINS_DIR, name);

    if (await exists(pluginDir)) {
        console.error(`Plugin "${name}" already exists at ${pluginDir}`);
        process.exit(1);
    }

    // Create directories
    await mkdir(join(pluginDir, '.claude-plugin'), { recursive: true });
    await mkdir(join(pluginDir, 'commands'), { recursive: true });

    // Write plugin.json
    const pluginJson = {
        name,
        version: '0.1.0',
        description: '',
        author: {
            name: 'Garen Torikian',
        },
        keywords: [],
    };
    await writeFile(
        join(pluginDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify(pluginJson, null, 2) + '\n'
    );

    // Write README
    await writeFile(
        join(pluginDir, 'README.md'),
        `# ${name}\n\nTODO: Describe this plugin.\n`
    );

    console.log(`Created plugin scaffold at plugins/${name}/`);
    console.log(`\nNext steps:`);
    console.log(`  1. Edit plugins/${name}/.claude-plugin/plugin.json (add description, keywords)`);
    console.log(`  2. Add commands in plugins/${name}/commands/`);
    console.log(`  3. Run: npm run sync`);
}

main().catch(console.error);
