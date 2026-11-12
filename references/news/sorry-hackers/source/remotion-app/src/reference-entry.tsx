// Reference-only standalone entry point: it registers what the film's own register.tsx declares.
// In a live checkout src/Root.tsx renders <SorryHackCompositions /> instead (references/news/restore.py adds that line).
import {registerRoot} from 'remotion';
import {SorryHackCompositions} from './videos/sorryhack/register';

registerRoot(SorryHackCompositions);
