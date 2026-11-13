// Reference-only standalone entry point: it registers what the film's own register.tsx declares.
// In a live checkout src/Root.tsx renders <BtcFlexCompositions /> instead (references/news/restore.py adds that line).
import {registerRoot} from 'remotion';
import {BtcFlexCompositions} from './videos/btcflex/register';

registerRoot(BtcFlexCompositions);
