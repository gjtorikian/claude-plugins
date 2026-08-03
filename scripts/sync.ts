import { access, readdir, readFile, writeFile } from 'fs/promises';
import { basename, join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const PLUGINS_DIR = join(ROOT, 'plugins');
const PACKAGE_PATH = join(ROOT, 'package.json');
const CLAUDE_MARKETPLACE_PATH = join(ROOT, '.claude-plugin', 'marketplace.json');
const CODEX_MARKETPLACE_PATH = join(ROOT, '.agents', 'plugins', 'marketplace.json');

interface JsonObject {
    [key: string]: unknown;
}

interface PluginEntry {
    directory: string;
    name: string;
    source: string;
    description: string;
    version: string;
    category: string;
    skillCount: number;
}

function isObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function exists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

async function readJson(path: string): Promise<JsonObject> {
    const value: unknown = JSON.parse(await readFile(path, 'utf-8'));
    if (!isObject(value)) {
        throw new Error(`${path} must contain a JSON object`);
    }
    return value;
}

function requireString(value: unknown, label: string): string {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${label} must be a non-empty string`);
    }
    return value;
}

function requireStringArray(value: unknown, label: string): string[] {
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
        throw new Error(`${label} must be an array of strings`);
    }
    return value;
}

function unquoteYamlScalar(value: string): string {
    const trimmed = value.trim();
    if (
        trimmed.length >= 2 &&
        ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'")))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

async function validateSkill(skillDirectory: string): Promise<void> {
    const skillPath = join(skillDirectory, 'SKILL.md');
    const content = await readFile(skillPath, 'utf-8');
    const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!frontmatter) {
        throw new Error(`${skillPath} must begin with YAML frontmatter`);
    }

    const nameMatch = frontmatter[1].match(/^name:\s*(.+)$/m);
    const descriptionMatch = frontmatter[1].match(/^description:\s*(.+)$/m);
    if (!nameMatch || !descriptionMatch) {
        throw new Error(`${skillPath} must define name and description`);
    }

    const name = unquoteYamlScalar(nameMatch[1]);
    const description = unquoteYamlScalar(descriptionMatch[1]);
    const directoryName = basename(skillDirectory);

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
        throw new Error(`${skillPath} has an invalid Agent Skills name: ${name}`);
    }
    if (name !== directoryName) {
        throw new Error(`${skillPath} name must match its parent directory: ${directoryName}`);
    }
    if (description.length === 0 || description.length > 1024) {
        throw new Error(`${skillPath} description must contain 1-1024 characters`);
    }
}

async function discoverPlugins(): Promise<PluginEntry[]> {
    const plugins: PluginEntry[] = [];
    const entries = await readdir(PLUGINS_DIR, { withFileTypes: true });

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (!entry.isDirectory()) continue;

        const pluginRoot = join(PLUGINS_DIR, entry.name);
        const claudePath = join(pluginRoot, '.claude-plugin', 'plugin.json');
        const codexPath = join(pluginRoot, '.codex-plugin', 'plugin.json');
        const hasClaudeManifest = await exists(claudePath);
        const hasCodexManifest = await exists(codexPath);

        // Non-plugin work under plugins/ is outside this script's scope.
        if (!hasClaudeManifest && !hasCodexManifest) continue;
        if (!hasClaudeManifest || !hasCodexManifest) {
            throw new Error(
                `${entry.name} must contain both .claude-plugin/plugin.json and .codex-plugin/plugin.json`
            );
        }

        const [claude, codex] = await Promise.all([readJson(claudePath), readJson(codexPath)]);
        const name = requireString(claude.name, `${claudePath} name`);
        const version = requireString(claude.version, `${claudePath} version`);
        const description = requireString(claude.description, `${claudePath} description`);

        if (name !== entry.name) {
            throw new Error(`${claudePath} name must match the plugin directory: ${entry.name}`);
        }
        if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
            throw new Error(`${claudePath} version must use semantic versioning`);
        }
        for (const field of ['name', 'version', 'description'] as const) {
            if (claude[field] !== codex[field]) {
                throw new Error(`${entry.name} manifests disagree on ${field}`);
            }
        }
        for (const field of ['author', 'repository', 'license', 'keywords', 'skills'] as const) {
            if (JSON.stringify(claude[field]) !== JSON.stringify(codex[field])) {
                throw new Error(`${entry.name} manifests disagree on ${field}`);
            }
        }
        if (claude.skills !== './skills/' || codex.skills !== './skills/') {
            throw new Error(`${entry.name} manifests must point skills at ./skills/`);
        }

        const author = claude.author;
        if (!isObject(author)) {
            throw new Error(`${claudePath} must define an author object`);
        }
        requireString(author.name, `${claudePath} author.name`);
        requireString(claude.repository, `${claudePath} repository`);
        requireString(claude.license, `${claudePath} license`);
        requireStringArray(claude.keywords, `${claudePath} keywords`);

        const interfaceValue = codex.interface;
        if (!isObject(interfaceValue)) {
            throw new Error(`${codexPath} must define an interface object`);
        }
        for (const field of [
            'displayName',
            'shortDescription',
            'longDescription',
            'developerName',
            'category',
        ]) {
            requireString(interfaceValue[field], `${codexPath} interface.${field}`);
        }
        requireStringArray(interfaceValue.capabilities, `${codexPath} interface.capabilities`);
        const defaultPrompt = requireStringArray(
            interfaceValue.defaultPrompt,
            `${codexPath} interface.defaultPrompt`
        );
        if (defaultPrompt.length === 0 || defaultPrompt.length > 3) {
            throw new Error(`${codexPath} interface.defaultPrompt must contain 1-3 prompts`);
        }
        if (defaultPrompt.some((prompt) => prompt.trim() === '' || prompt.length > 128)) {
            throw new Error(`${codexPath} interface.defaultPrompt entries must contain 1-128 characters`);
        }
        const category = requireString(interfaceValue.category, `${codexPath} interface.category`);

        const skillsDirectory = join(pluginRoot, 'skills');
        if (!(await exists(skillsDirectory))) {
            throw new Error(`${entry.name} is missing its skills directory`);
        }
        const skillEntries = (await readdir(skillsDirectory, { withFileTypes: true })).filter(
            (skill) => skill.isDirectory()
        );
        if (skillEntries.length === 0) {
            throw new Error(`${entry.name} must contain at least one skill`);
        }
        for (const skill of skillEntries) {
            await validateSkill(join(skillsDirectory, skill.name));
        }

        plugins.push({
            directory: entry.name,
            name,
            source: `./plugins/${entry.name}`,
            description,
            version,
            category,
            skillCount: skillEntries.length,
        });
        console.log(`✓ Discovered: ${entry.name} (${skillEntries.length} skill${skillEntries.length === 1 ? '' : 's'})`);
    }

    if (plugins.length === 0) {
        throw new Error('No cross-host plugins were discovered');
    }
    return plugins;
}

async function validatePiPackage(): Promise<void> {
    const packageJson = await readJson(PACKAGE_PATH);
    const keywords = requireStringArray(packageJson.keywords, `${PACKAGE_PATH} keywords`);
    if (!keywords.includes('pi-package')) {
        throw new Error(`${PACKAGE_PATH} keywords must include pi-package`);
    }

    const pi = packageJson.pi;
    if (!isObject(pi)) {
        throw new Error(`${PACKAGE_PATH} must define a pi package manifest`);
    }
    const skillPaths = requireStringArray(pi.skills, `${PACKAGE_PATH} pi.skills`);
    if (!skillPaths.includes('./plugins/*/skills')) {
        throw new Error(`${PACKAGE_PATH} pi.skills must include ./plugins/*/skills`);
    }
}

function buildClaudeMarketplace(existing: JsonObject, plugins: PluginEntry[]): JsonObject {
    return {
        ...existing,
        name: existing.name ?? 'gjtorikian-plugins',
        owner: existing.owner ?? {
            name: 'Garen J. Torikian',
            github: 'gjtorikian',
        },
        version: existing.version ?? '0.1.0',
        description: 'Portable agent workflow plugins for Claude Code, Codex, and Pi',
        plugins: plugins.map(({ name, source, description, version }) => ({
            name,
            source,
            description,
            version,
        })),
    };
}

function buildCodexMarketplace(existing: JsonObject, plugins: PluginEntry[]): JsonObject {
    return {
        ...existing,
        name: existing.name ?? 'gjtorikian-plugins',
        interface: existing.interface ?? {
            displayName: 'GJTorikian Agent Plugins',
        },
        plugins: plugins.map(({ name, source, category }) => ({
            name,
            source: {
                source: 'local',
                path: source,
            },
            policy: {
                installation: 'AVAILABLE',
                authentication: 'ON_INSTALL',
            },
            category,
        })),
    };
}

function serialize(value: JsonObject): string {
    return `${JSON.stringify(value, null, 2)}\n`;
}

async function syncFile(path: string, expected: JsonObject, check: boolean): Promise<void> {
    const serialized = serialize(expected);
    if (check) {
        const current = (await exists(path)) ? await readFile(path, 'utf-8') : '';
        if (current !== serialized) {
            throw new Error(`${path} is out of sync; run npm run sync`);
        }
        return;
    }
    await writeFile(path, serialized);
}

async function main(): Promise<void> {
    const check = process.argv.includes('--check');
    console.log(check ? 'Checking plugins...\n' : 'Syncing plugins...\n');

    await validatePiPackage();
    const plugins = await discoverPlugins();
    const [claudeExisting, codexExisting] = await Promise.all([
        readJson(CLAUDE_MARKETPLACE_PATH),
        readJson(CODEX_MARKETPLACE_PATH),
    ]);

    await syncFile(
        CLAUDE_MARKETPLACE_PATH,
        buildClaudeMarketplace(claudeExisting, plugins),
        check
    );
    await syncFile(CODEX_MARKETPLACE_PATH, buildCodexMarketplace(codexExisting, plugins), check);

    const skillCount = plugins.reduce((sum, plugin) => sum + plugin.skillCount, 0);
    if (check) {
        console.log(`\n✓ Validated ${plugins.length} plugins and ${skillCount} skills`);
        console.log('✓ Both marketplaces are in sync');
    } else {
        console.log(`\n✓ Updated both marketplaces with ${plugins.length} plugins`);
    }
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? `\n✗ ${error.message}` : error);
    process.exitCode = 1;
});
