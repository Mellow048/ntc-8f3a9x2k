import {SHOTS, shotEnd} from './src/videos/sanjose/story';
console.log(SHOTS.map((s, i) => Math.round((s.at + shotEnd(i)) / 2)).join(","));
