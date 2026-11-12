// Reference-only standalone entry point: it registers what the film's own register.tsx declares.
// In a live checkout src/Root.tsx renders <TruckStopCompositions /> instead (references/news/restore.py adds that line).
import {registerRoot} from 'remotion';
import {TruckStopCompositions} from './videos/truckstop/register';

registerRoot(TruckStopCompositions);
