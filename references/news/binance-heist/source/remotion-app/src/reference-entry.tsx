// Reference-only standalone entry point: it registers what the film's own register.tsx declares.
// In a live checkout src/Root.tsx renders <BinanceCompositions /> instead (references/news/restore.py adds that line).
import {registerRoot} from 'remotion';
import {BinanceCompositions} from './videos/binance/register';

registerRoot(BinanceCompositions);
