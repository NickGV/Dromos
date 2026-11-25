import type { ArtFile } from '../domain';

/** A file of the art folder, as the source lists it. */
export type Painting = ArtFile;

/** Where the user's paintings live (own-art S1): `<Dromos folder>/Arte/` in the vault. */
export interface PaintingSource {
	/** The files of the art folder with the URL each is served at; none when the folder does not exist. May throw. */
	list(): readonly Painting[];
}
