// Kit contract kept for the World/composition wiring: this short builds its set 100% procedurally
// (canvas textures + three.js primitives), so loadKit() resolves to an empty kit. No Kenney assets needed.
export type Kit = Record<string, never>;
