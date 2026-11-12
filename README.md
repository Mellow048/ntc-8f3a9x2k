# Cartoon 3D Shorts

Detailed painted/ink-outlined 3D worlds with expressive flat cartoon characters,
word-timed physical storytelling, original sound and Arena narration.

## Start here

- **[AGENTS.md](AGENTS.md)** — required reading order for every new agent.
- **[IMPORTANT.md](IMPORTANT.md)** — current release gates. **720×1280/30fps**
  and synchronized **1–2-word captions** override older 2K/no-caption defaults.
- **[VIDEO_HANDOFF.md](VIDEO_HANDOFF.md)** — user feedback, approvals, production
  checkpoints and lessons. Do not repeat rejected shortcuts.
- **[Approved reference library](references/approved/README.md)** — actual
  Taipei 101, Beer Flood and Köpenick MP4s **plus their source**, preserved on
  `main` so deleting a historical branch does not remove these examples.
- **[News reference](references/news/README.md)** — the seven approved news
  shorts (Nvidia, the GTA 6 leaker, the freezer hack, the Binance heist, the fake boss, the hackers who said sorry,
  the truck-stop heist), MP4s
  **plus source**, the order of work all seven followed and a playbook, in a folder of its own because news is a different
  category. **Only for requests about real-life news**; see below.

## Two kinds of short

| | Regular short (default) | News short |
|---|---|---|
| The user asks for | Something explained or an entertaining story: engineering, science, history, curiosities | A short about real-life news: real people, companies or events that are in the news |
| Study | [`references/approved/`](references/approved/README.md) | [`references/news/`](references/news/README.md) |
| Rules | [IMPORTANT.md](IMPORTANT.md) §1–5 | §1–5 plus the news gates in §6 |
| The other reference | Ignore `references/news/` | — |

News films are on a different level and in a different category. The user
called the Nvidia film "so well done and not lazy" and "maybe the best one".
The GTA 6 leaker film was made by following it and was approved at the first
delivery: "another banger". The freezer-hack and Binance films followed the
same order ("awesome sauce, same banger", "you are the best at this!"). Agents
making a news short must study them, read
[the playbook](references/news/PLAYBOOK.md) and work in
[the order they were made in](references/news/README.md#how-to-make-a-news-short-the-order-every-film-followed).
Agents making a regular short must leave them alone and not borrow their
structure, graphics, tone or music.

**New regular-story reference:** [The Shoemaker Who Borrowed an Army](references/approved/koepenick/README.md).
The user approved the complete music-v2 film—visuals, narration, pacing and
background music—and requested its exact MP4 and source on `main`. The guide
maps action beats to code and documents why a clearer groove, not lower music
volume, fixed the first soundtrack. Read the source; do not imitate screenshots
with placeholder props.

## Repository map

| Path | Purpose |
|---|---|
| `references/approved/` | User-approved original films, source snapshots, manifests and reproduction notes |
| `references/news/` | User-approved **news** shorts (Nvidia, the GTA 6 leaker, the freezer hack, the Binance heist), source snapshots, manifests, news rules, the order of work, `PLAYBOOK.md`, and `restore.py` / `make_reference.py` to copy a film out or keep a new one. Separate category: only for real-life news requests |
| `references/STYLE_BIBLE.md`, `frames/`, `reports/`, `sheets/` | Legacy private style study; not original film deliverables |
| `templates/bridge/` | Vendored renderer/style implementation; use with current overrides |
| `templates/audio/` | Audio implementation examples, not a mandatory recurring score |
| `templates/scripts/` | Frame/spec/loudness QA tools |
| `SKILL.md` | Upstream skill; current user gates take precedence over conflicting defaults |
| `VIDEO_HANDOFF.md` | Durable feedback, production recovery and current work |
| `docs/setup.md` | Remotion and GitHub Actions setup |
| `shoots/` | Production material present in this checkout; some older projects live only in history |

## Workflow

Study approved films and source → fact-checked script and ending → Arena voice
and word timings → distinct action-led shot plan → detailed sets and motion →
GitHub diagnostic previews → actual visual review → GitHub final render →
finished MP4 picture/audio review and technical QA → usable delivery link.

Recognizable assets and readable action matter more than polygon counts or
camera movement. A box labelled “car,” a blue slab labelled “water,” a repeated
facade tour or inaudible score is not a finished film. See the release gates.

Approved references preserve what worked; they do not waive new requirements.
Taipei's historical caption handling, for example, does not override today's
short synchronized caption requirement. Write new scripts, music and scenes
for new topics rather than recycling the reference film.

## License / origin

The vendored `cartoon-3d-short` skill comes from
[mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts)
(MIT). See `LICENSE` and `UPSTREAM-README.md`. Approved original film provenance
is recorded in `references/approved/*/manifest.json` and
`references/news/*/manifest.json`; legacy third-party study images remain
distinct from those originals.
