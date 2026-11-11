# Approval record — Köpenick, music-v2

## Explicit user approval

After receiving the revised MP4 from commit
`5cae0e6b752fc56434d806740a59d23c94f44c7a`, the user wrote:

> im loving this, visuals, narration, pacing, backround music etc. all perfect.
> congrats you are accepted into the reference folder in main branch, i need
> your source code and the mp4 and put it in reference folder in the main branch
> for other agents to see how to make shorts like this.

This approves the **complete revised film**, including the new 112 BPM Python
score, and explicitly authorizes preservation of this MP4 and its source on
`main`. It is not merely a technical pass or approval of the initial script.
The earlier v1 music was not the final approved music.

The user also emphasized that recognizable objects must be genuinely modeled
and detailed, not primitive placeholders defended with labels. Future agents
must study the actual source and finished film, not copy its appearance
superficially or claim a cube is a finished prop.

## Exactly what is preserved

- Title: **The Shoemaker Who Borrowed an Army**.
- Subject: Wilhelm Voigt, Captain of Köpenick (1906).
- Canonical artifact: `final-720p.mp4` in this folder.
- Accepted commit: `5cae0e6b752fc56434d806740a59d23c94f44c7a`.
- Original path: `deliveries/koepenick/koepenick-720p.mp4`.
- MP4: 81,965,458 bytes; SHA-256
  `4167efa884652be33fd8f92181d53d60c83ecfa1a23fe29664193476741334a6`.
- Source snapshot: renderer and procedural sets/cast/style, captions and timing,
  source-mapped narration/script, original Arena take + conformed voice + word
  timestamps, accepted Python score/DSP/instruments, foley/mix/remux, QA tools,
  dependency lock, production notes and historical workflow.
- Only new renderer scaffolding: standalone registration adapter plus its entry
  shim. Renderer, action data and audio source are unchanged from the commit.
- The MP4 was relocated without re-encoding. It is not duplicated as another
  79 MB working export; prior versions remain accessible through Git history.

## Review boundaries

Before the user's playback approval, the agent checked decoded shot/motion
samples, final-file specs/loudness/silences, and identical H.264 packet hashes
across the music-only revision. It could not listen to the audio. During
preservation, checksum verification, standalone import/type/timing checks and
Python score/remux reconstruction were performed. No new full 3D render was
needed. Do not rewrite those checks as agent listening or real-time viewing.

Older source production notes saying "pending" and discussing the initial
116 BPM score are frozen provenance. This record supersedes their approval
status; `audio/groove.py` and `audio/cues.md` hold the accepted music-v2 design.
