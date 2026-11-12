// Reference-only standalone entry point: it registers what the film's own register.tsx declares.
// In a live checkout src/Root.tsx renders <FridgeCompositions /> instead (references/news/restore.py adds that line).
import {registerRoot} from 'remotion';
import {FridgeCompositions} from './videos/fridge/register';

registerRoot(FridgeCompositions);
