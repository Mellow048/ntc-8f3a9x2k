# The Giant Golden Ball Inside Taipei 101 — Soundtrack Cue Sheet

- **Duration:** `65.500 s` (`3144000` samples @ 48 kHz stereo, `1965` frames @ 30 fps)
- **Integrated Loudness:** `-15.0 LUFS` | **True Peak:** `-1.20 dBTP` | **LRA:** `1.8 LU`
- **Stems (mix gain +1.38 dB):** Voice `-15.2 LUFS`, Music `-25.8 LUFS`, SFX `-34.8 LUFS`

## ffmpeg ebur128 Cross-Check
```
Summary:

  Integrated loudness:
    I:         -15.0 LUFS
    Threshold: -25.2 LUFS

  Loudness range:
    LRA:         1.8 LU
    Threshold: -35.2 LUFS
    LRA low:   -16.1 LUFS
    LRA high:  -14.3 LUFS

  True peak:
    Peak:       -1.2 dBFS
[out#0/null @ 0x55e0bac83a40] video:0KiB audio:12281KiB subtitle:0KiB other streams:0KiB global headers:0KiB muxing overhead: unknown
size=N/A time=00:01:05.50 bitrate=N/A speed= 313x elapsed=0:00:00.20
```

## Music Sections
- ** 0.10s (f3):** hook glockenspiel + warm brass pulse, hard stop on white flash (f138)
- ** 4.78s (f143):** bright Taipei plaza march (120 bpm F major): fife + glock + oom-pah brass
- **13.10s (f393):** tipsy swaying office groove: plucked bass + wide-tremolo vibes + mug-slide glock run
- **23.25s (f698):** stately engineering march + timpani accent on 'six hundred and sixty tons'
- **30.55s (f916):** golden-hour 3/4 music-box waltz for the rowboat balance analogy
- **36.90s (f1107):** crisp counter-phase march as golden sphere opposes the wind
- **43.20s (f1296):** typhoon snare crescendo + brass/timpani stabs on 'slammed' (f1356) and 'full meter' (f1460)
- **49.75s (f1492):** deadpan walking pizzicato through 'Luckily / Unluckily' and the dark mechanical closet
- **59.35s (f1780):** golden sunset observatory celebration + sparkly glock/vibes cadence on 'cute cartoon mascot'

## Synthesized SFX Cues (-6 dB event standard)
| Time (s) | Frame | Cue | Description | Applied LU vs Voice |
|---|---|---|---|---|
|   0.00 |    0 | `amb_city_air` | gentle high-altitude breeze & distant city air (shots 1-6) | -31.0 |
|   0.35 |   10 | `cable_hum_hook` | deep steel cable tension groan as 660-ton sphere sways | -19.0 |
|   4.60 |  138 | `flash_whoosh` | white flash transition into Taipei skyline (f138) | -11.0 |
|   6.67 |  200 | `cam_tilt_tower` | camera tilt whoosh up Taipei 101 spire | -19.0 |
|  10.60 |  318 | `wind_flex` | high wind gust + structural flex creak ('built to bend in the wind') | -15.0 |
|  15.33 |  460 | `office_sway_creak` | 90th-floor curtain-wall creak as strong breeze sways room | -17.0 |
|  18.33 |  550 | `lamp_swing` | ceiling lamps swinging on chains ('Lamps swing') | -17.0 |
|  19.50 |  585 | `mug_slide` | ceramic coffee mug sliding across desk + edge clink ('coffee slides off desks') | -14.0 |
|  21.37 |  641 | `seasick_ugh` | soft comedic seasick groan ('office workers get seasick') | -16.0 |
|  25.50 |  765 | `cam_shaft_glide` | camera vertical glide down the 5-story damper shaft | -18.0 |
|  28.83 |  865 | `steel_cables_clink` | heavy steel cable & shackle metallic resonance ('eight thick cables') | -16.0 |
|  30.40 |  912 | `amb_harbour` | golden-hour harbour water lapping + warm breeze + gulls/sparrows (shot 7) | -25.0 |
|  32.97 |  989 | `boat_wave_splash` | wave slapping wooden rowboat hull & tipping deck left | -14.0 |
|  34.63 | 1039 | `boat_lean_thump` | wooden plank shift as hero leans hard right to balance | -16.0 |
|  39.20 | 1176 | `sphere_counter_whoosh` | 660-ton sphere swinging opposite the gust | -16.0 |
|  40.87 | 1226 | `hydraulic_bumper` | hydraulic viscous bumper compression thump + pneumatic hiss (f1226) | -13.0 |
|  43.00 | 1290 | `amb_typhoon_wind` | 100-mph Typhoon Soudelor rushing wind bed (shots 9-10) | -23.0 |
|  45.20 | 1356 | `typhoon_slam` | 100-mph Typhoon Soudelor wind impact on tower (f1356) | -11.0 |
|  47.73 | 1432 | `cable_strain_1m` | heavy steel cables straining under record 1-meter swing | -15.0 |
|  48.67 | 1460 | `hydraulic_max_1m` | deep hydraulic piston absorption at 1-meter peak extension (f1460) | -12.0 |
|  52.97 | 1589 | `tourist_whoa` | nervous visitor reaction looking over the 89th-floor rail ('scared of heights') | -17.0 |
|  59.30 | 1779 | `amb_gallery` | warm observatory gallery murmur & golden air (shot 14) | -28.0 |
|  61.73 | 1852 | `mascot_reveal` | camera glide onto the waving golden mascot | -19.0 |
|  63.47 | 1904 | `mascot_sparkle` | bright cheerful bell twinkle as mascot waves ('cute cartoon mascot') | -17.0 |
