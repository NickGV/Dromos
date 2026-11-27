// Shared helpers of the Node art tools: the repository root, Chrome through playwright-core, esbuild bundles of
// the harnesses that import the plugin's own source, and the CPU measurement. No path is tied to one machine:
// PLAYWRIGHT_CORE and CHROME name the programs, and otherwise they are discovered.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { pathToFileURL } = require('url');

/** The repository root: tools/art/lib is three levels down. */
const REPO = path.resolve(__dirname, '..', '..', '..');
/** The plugin's stylesheet, which the harness pages link. */
const STYLES = path.join(REPO, 'styles.css');

const fileUrl = (p) => pathToFileURL(path.resolve(p)).href;

function onPath(name) {
	for (const dir of (process.env.PATH || '').split(path.delimiter)) {
		if (!dir) continue;
		const candidate = path.join(dir, name);
		try {
			fs.accessSync(candidate, fs.constants.X_OK);
			if (fs.statSync(candidate).isFile()) return candidate;
		} catch {
			// not here
		}
	}
	return null;
}

/** playwright-core: PLAYWRIGHT_CORE (its folder), else the repository's node_modules, else a global npm install. */
function playwright() {
	if (process.env.PLAYWRIGHT_CORE) return require(path.resolve(process.env.PLAYWRIGHT_CORE));
	try {
		return require(require.resolve('playwright-core', { paths: [REPO, __dirname] }));
	} catch {
		// not installed locally
	}
	let root = null;
	try {
		root = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		// no npm on PATH
	}
	if (root) {
		for (const rel of ['playwright-core', 'playwright/node_modules/playwright-core', '@playwright/test/node_modules/playwright-core', '@playwright/cli/node_modules/playwright-core']) {
			const dir = path.join(root, rel);
			if (fs.existsSync(path.join(dir, 'package.json'))) return require(dir);
		}
	}
	throw new Error('playwright-core not found: install it globally (npm install -g playwright-core) or set PLAYWRIGHT_CORE to its folder.');
}

/** CHROME, else Chrome or Chromium on PATH, else undefined: Playwright's own Chromium, if it downloaded one. */
function chromePath() {
	if (process.env.CHROME) return process.env.CHROME;
	for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
		const found = onPath(name);
		if (found) return found;
	}
	return undefined;
}

/** Chrome, headless, allowed to load the file:// pages, styles, images and videos the tools write. */
function launch(args = []) {
	const { chromium } = playwright();
	return chromium.launch({ executablePath: chromePath(), args: ['--allow-file-access-from-files', ...args] });
}

/** A fresh temporary folder, outside the repository, and a function that removes it. */
function tempDir() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dromos-art-'));
	return { dir, remove: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

/**
 * Bundles a harness entry with the repository's esbuild into `outDir`: for Node (CommonJS, to require) or for the
 * browser (an IIFE, production React, minified like the plugin). Returns the bundle's path.
 */
async function bundle(entry, outDir, platform) {
	const esbuild = require(require.resolve('esbuild', { paths: [REPO] }));
	const node = platform === 'node';
	const outfile = path.join(outDir, node ? 'bundle.cjs' : 'bundle.js');
	await esbuild.build({
		entryPoints: [entry],
		bundle: true,
		outfile,
		platform,
		format: node ? 'cjs' : 'iife',
		jsx: 'automatic',
		target: 'es2021',
		minify: !node,
		define: node ? undefined : { 'process.env.NODE_ENV': '"production"' },
		logLevel: 'warning',
	});
	return outfile;
}

/** The options of `argv` as { name: value }, flags as true, and the rest as `_`. */
function parseArgs(argv, flags = []) {
	const out = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (!a.startsWith('--')) out._.push(a);
		else if (flags.includes(a.slice(2))) out[a.slice(2)] = true;
		else out[a.slice(2)] = argv[++i];
	}
	return out;
}

// ---------------------------------------------------------------- CPU (Linux)

let clockTicks = null;

/** The CPU time (user + system, in clock ticks) of every process started by this one: Chrome and its helpers. */
function childTicks() {
	if (process.platform !== 'linux') throw new Error('The CPU measurement reads /proc, so it runs on Linux only.');
	const parent = new Map();
	for (const pid of fs.readdirSync('/proc').filter((n) => /^\d+$/.test(n))) {
		try {
			const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
			const f = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
			parent.set(Number(pid), { ppid: Number(f[1]), cpu: Number(f[11]) + Number(f[12]) });
		} catch {
			// the process ended meanwhile
		}
	}
	const tree = [process.pid];
	for (let i = 0; i < tree.length; i++) for (const [pid, v] of parent) if (v.ppid === tree[i]) tree.push(pid);
	return tree.slice(1).reduce((sum, pid) => sum + (parent.get(pid)?.cpu ?? 0), 0);
}

/** CPU of every Chrome process over `measure` ms after `warmup` ms, in % of one core (the letter-art method: 3 s, then 10 s). */
async function cpu(page, { warmup = 3000, measure = 10000 } = {}) {
	if (clockTicks === null) {
		try {
			clockTicks = Number(execSync('getconf CLK_TCK', { encoding: 'utf8' }).trim()) || 100;
		} catch {
			clockTicks = 100;
		}
	}
	await page.waitForTimeout(warmup);
	const t0 = childTicks();
	const w0 = Date.now();
	await page.waitForTimeout(measure);
	const t1 = childTicks();
	return (100 * (t1 - t0)) / clockTicks / ((Date.now() - w0) / 1000);
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** Prints the median of each case's rounds. */
function printMedians(results, rounds, pad) {
	console.log(`--- median of ${rounds}`);
	for (const [name, v] of Object.entries(results)) console.log(`${name.padEnd(pad)} ${median(v).toFixed(1).padStart(5)}%   (all: ${v.map((x) => x.toFixed(1)).join(', ')})`);
}

module.exports = { REPO, STYLES, fileUrl, playwright, chromePath, launch, tempDir, bundle, parseArgs, cpu, median, printMedians };
