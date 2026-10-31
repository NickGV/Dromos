import type { es } from './es';

/** Every piece of interface copy. Spanish is the reference; English must define the same keys. */
export type MessageKey = keyof typeof es;

/** A plural pair: `<base>.one` for exactly one, `<base>.other` for the rest. */
export type PluralBase = { [K in MessageKey]: K extends `${infer Base}.one` ? Base : never }[MessageKey];
