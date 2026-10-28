# Changelog

All notable changes to Dromos are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.0.1] - 2026-10-28

### Added

- Plugin scaffold from the official Obsidian sample plugin: esbuild, TypeScript strict, eslint with Obsidian rules, release workflow on tags.
- React 18 view `Dromos` (`ItemView`) opened from a ribbon icon and the `Dromos: Open` command, mounted in a main tab.
- Hexagonal folder layout (`domain`, `application`, `ports`, `adapters`, `ui`).
- Domain `LevelCurve` with the character and skill curves, covered by Vitest.
- Warm palette exposed as CSS custom properties on the view root.
- `npm run install:local` to copy the build into a local vault.
