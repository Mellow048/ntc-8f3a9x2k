// Reference-only standalone entry point: it registers what the film's own register.tsx declares.
// In a live checkout src/Root.tsx renders <FakeBossCompositions /> instead (references/news/restore.py adds that line).
import {registerRoot} from 'remotion';
import {FakeBossCompositions} from './videos/fakeboss/register';

registerRoot(FakeBossCompositions);
