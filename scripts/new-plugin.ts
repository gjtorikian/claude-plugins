import { access, mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const PLUGINS_DIR = join(ROOT, 'plugins');

const USAGE = `Usage: npm run new -- <plugin-name>

Creates a portable plugin scaffold under plugins/<plugin-name>/ with:
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  skills/<plugin-name>/SKILL.md
  skills/<plugin-name>/agents/openai.yaml
  README.md`;

async function exists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

function displayName(name: string): string {
    return name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

async function writeJson(path: string, value: unknown): Promise<void> {
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function main(): Promise<void> {
    const name = process.argv[2];

    if (!name) {
        console.error(USAGE);
        process.exitCode = 1;
        return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
        console.error(
            `Plugin name must be 1-64 lowercase letters, numbers, or single hyphens. Got: "${name}"`
        );
        process.exitCode = 1;
        return;
    }

    const pluginDir = join(PLUGINS_DIR, name);
    if (await exists(pluginDir)) {
        console.error(`Plugin "${name}" already exists at ${pluginDir}`);
        process.exitCode = 1;
        return;
    }

    const title = displayName(name);
    const description = `${title} agent workflow skill.`;
    const skillDir = join(pluginDir, 'skills', name);

    await Promise.all([
        mkdir(join(pluginDir, '.claude-plugin'), { recursive: true }),
        mkdir(join(pluginDir, '.codex-plugin'), { recursive: true }),
        mkdir(join(skillDir, 'agents'), { recursive: true }),
    ]);

    const sharedManifest = {
        name,
        version: '0.1.0',
        description,
        author: {
            name: 'Garen J. Torikian',
        },
        repository: 'https://github.com/gjtorikian/agent-plugins',
        license: 'MIT',
        keywords: [name],
        skills: './skills/',
    };

    await Promise.all([
        writeJson(join(pluginDir, '.claude-plugin', 'plugin.json'), sharedManifest),
        writeJson(join(pluginDir, '.codex-plugin', 'plugin.json'), {
            ...sharedManifest,
            interface: {
                displayName: title,
                shortDescription: description,
                longDescription: description,
                developerName: 'Garen J. Torikian',
                category: 'Productivity',
                capabilities: ['Read', 'Write'],
                defaultPrompt: [`Use ${title}.`],
            },
        }),
        writeFile(
            join(skillDir, 'SKILL.md'),
            `---\nname: ${name}\ndescription: ${description} Use when the user asks for the ${title} workflow.\n---\n\n# ${title}\n\nFollow the requested ${title} workflow. Replace this scaffold with specific, host-neutral steps before publishing.\n`
        ),
        writeFile(
            join(skillDir, 'agents', 'openai.yaml'),
            `interface:\n  display_name: "${title}"\n  short_description: "${description}"\n  default_prompt: "Use $${name} for the ${title} workflow."\n`
        ),
        writeFile(
            join(pluginDir, 'README.md'),
            `# ${name}\n\nPortable ${title} workflow skill for Claude Code, Codex, and Pi.\n`
        ),
    ]);

    console.log(`Created portable plugin scaffold at plugins/${name}/`);
    console.log('\nNext steps:');
    console.log(`  1. Replace the scaffold workflow in plugins/${name}/skills/${name}/SKILL.md`);
    console.log('  2. Keep both manifest versions and descriptions in sync');
    console.log('  3. Run: npm run sync && npm run check');
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
