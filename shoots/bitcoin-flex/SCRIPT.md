# One Month of Being Rich

News short, eighth in the series (`references/news/`). Made on 2026-11-12 and 13, following
`references/news/PLAYBOOK.md`, starting from the seventh film's folders (`restore.py truck-stop-heist --mix`).
Film folder `remotion-app/src/videos/btcflex/`, composition `BtcFlexShort`.

The user asked for it on 12 November: "i saw a tiktok somewhere where a kid who wants to be filthy rich fooled a person
and took his bitcoins, but insted of hiding and dissapearing from the internet, he bought alot of cars,flexed it to the
internet and stuff and eventually he got tracked down and arrested making his last years his very best and last moments
ever. if u can find that story please adapt it cuz its really interesting". The story is the case of Malone Lam
(U.S. v. Lam et al., 24-cr-417, U.S. District Court for the District of Columbia).

**Status:** delivered on 2026-11-13 on branch `arena/becd20b7-ntc-8f3a9x2k`. Three full renders; the final file is
`shoots/bitcoin-flex/final-720p.mp4` at commit `cf828d1` (run `43347793839`). **Approved at the first delivery:**
the agent wrote "Tell me what to change, or approve it and I will file it with the other seven", and the user
answered "yes go ahead lad". Kept as `references/news/bitcoin-flex/`.

**This film was made twice.** The first build, on branch `arena/be67280b-ntc-8f3a9x2k`, was complete up to its render
when that branch was closed: its pull request (the sixth and seventh films, PR #10) had been merged before the eighth
was started, and a merged branch accepts no pushes. Only the first research notes had reached GitHub. The user pressed
Continue, the session got a fresh checkout on `arena/becd20b7-ntc-8f3a9x2k`, and everything was built again there from
the facts, the narration, the shot plan and the on-screen lines, which the conversation still held: a new voice take,
new sets, a new mix. Research, narration and wording are the first build's; the picture and the sound are new.

## The story in one line

On 18 August 2024 a crew led by a 20-year-old from Singapore talked a man in Washington out of more than 4,100 bitcoin;
he spent a month on rented mansions, jets, nightclubs and some thirty cars, was arrested on 18 September 2024, pleaded
guilty to racketeering conspiracy on 8 September 2026 and has not been sentenced.

## Sources

| Tag | Source | Read |
|---|---|---|
| DOJ-26 | U.S. Attorney's Office, District of Columbia, press release, 8 Sept 2026, "Singaporean Ringleader of $245 Million Cryptocurrency Racketeering Enterprise Pleads Guilty in Washington D.C." <https://www.justice.gov/usao-dc/pr/singaporean-ringleader-245-million-cryptocurrency-racketeering-enterprise-pleads-guilty> | 12 Nov, in full |
| DOJ-24 | The same office, press release 24-764, 19 Sept 2024, "Indictment Charges Two in $230 Million Cryptocurrency Scam". <https://www.justice.gov/usao-dc/pr/indictment-charges-two-230-million-cryptocurrency-scam> | 12 Nov, in full |
| DOJ-25 | The same office, press release, 15 May 2025, "Additional 12 Defendants Charged in RICO Conspiracy for over $263 Million Cryptocurrency Thefts, Money Laundering, Home Break-Ins". <https://www.justice.gov/usao-dc/pr/additional-12-defendants-charged-rico-conspiracy-over-263-million-cryptocurrency-thefts> | 12 Nov, the first of two parts (the second is the table of defendants) |
| AP | Associated Press, 9 Sept 2026, as carried by NBC News ("Singapore man in U.S. pleads guilty to orchestrating $240 million bitcoin theft") and by local stations. <https://www.nbcnews.com/news/us-news/singapore-man-us-pleads-guilty-orchestrating-240-million-bitcoin-theft-rcna596761> | 12 Nov, the article's text (two parts; the rest of the page is other headlines) and the stations' excerpts |
| BBC | BBC News, Peter Hoskins and Kelly Ng, 9 Sept 2026, "Singaporean man pleads guilty in US to massive crypto heist". <https://www.bbc.com/news/articles/crl6z03pr0do> | 12 Nov, in full |
| USAT | USA Today, Jeanine Santucci, 10 Sept 2026, "Ringleader pleads guilty to scheme to steal millions in cryptocurrency". <https://www.usatoday.com/story/news/crime/2026/09/10/cryptocurrency-theft-conspiracy-guilty-plea/91686968007/> | 12 Nov, the article's text (first of two parts) |
| CNBC | CNBC, 17 Oct 2024, "Historic bitcoin theft tied to Connecticut kidnapping, luxury cars, $500K bar bills" (it reads the prosecutors' filings in the detention fight). <https://www.cnbc.com/2024/10/17/cryptocurrency-theft-google-kidnapping-lamborghi-bar-.html> | 12 Nov, two of three parts |
| WIRED | Wired, Andy Greenberg, Oct 2024, "Meet ZachXBT, the Masked Vigilante Tracking Down Billions in Crypto Scams and Thefts". <https://www.wired.com/story/meet-zachxbt-243-million-crypto-theft/> | 12 Nov, the opening and the part about this theft (twice) |
| More | IBTimes UK (11 Sept 2026), Cryptopolitan (8 Sept 2026), crypto.news (9 Sept 2026), CNA (hearings of Nov 2024, Dec 2025 and Jan 2026), Wikipedia "Malone Lam" (1 Nov 2026) | 12 Nov, search excerpts |

The indictments, the plea agreement and the detention filings themselves were not read: the sandbox reaches no court
docket. Everything about their content is from the press releases and the reports above. The working notes, with the
passages copied out, are in `NOTES.md`.

## Facts

| # | Fact | Source |
|---|---|---|
| 1 | "Malone Lam, 22, a citizen of Singapore and recent resident of Miami, pleaded guilty today in U.S. District Court in Washington D.C. in connection with his role as ringleader of an international cybercrime conspiracy that used social engineering to steal and launder cryptocurrency valued at more than $245 million". "Lam pleaded guilty ... to one count of participating in a RICO conspiracy. Judge Kollar-Kotelly set a status hearing December 8, 2026." | DOJ-26 |
| 2 | "A 22-year-old man pleaded guilty on Tuesday to teaming up with friends to steal nearly a quarter-billion dollars in bitcoin from a Washington, D.C., resident — one of the largest cryptocurrency thefts in U.S. history — and then embarking on a wild spending spree with the laundered proceeds." | AP |
| 3 | "In one instance, on August 18, 2024, Lam, Serrano, and their conspirators contacted a victim in D.C. and, through the communications with that victim, fraudulently obtained over 4,100 Bitcoin (worth over $230 million at the time)." Lam was 20 then. | DOJ-24 |
| 4 | "The spending spree lasted a month before FBI agents arrested Lam in Miami." The indictment was unsealed on 19 Sept 2024; the two defendants "were arrested last night". Wired: "Late in the afternoon on September 18 ... Lam was arrested in Miami at a waterfront rental property for which he was paying $68,000 a month." 18 August to 18 September is 31 days. | AP, DOJ-24, WIRED |
| 5 | "Lam told investigators in the US that he had dropped out of secondary school in Singapore when he was 14. He travelled to the US in October 2023 and remained there after his visa expired in January the next year." (AP: "an eighth grade dropout"; CNBC: he overstayed "a visa waiver that allowed him to visit the U.S. as a tourist for just 90 days".) | BBC, AP, CNBC |
| 6 | "The scheme developed through connections made on online gaming platforms". "Lam, aka "Anne Hathaway," "$$$," "King Greavy," organized the social engineering enterprise, identified target victims, and coordinated the roles of the different conspirators." | DOJ-26 |
| 7 | "He is one of 18 defendants charged in the case and is the 11th to plead guilty". | AP |
| 8 | The call, from prosecutors' filings: "members of the conspiracy called the man, claiming they were from Google's security team"; then another conspirator "posed as a member of Gemini's support team" (the man's crypto exchange); "The schemers then duped the man into downloading a program onto his computer to protect his Gemini holdings. But the program actually gave the co-conspirators real-time access to the victim's desktop". USA Today, from the indictment: he "was duped into downloading a program onto his computer". | CNBC, AP, USAT |
| 9 | What the money went on: "nightclub services ranging up to $500,000 per evening, luxury handbags ... given away at nightclub parties, luxury watches ..., rental homes in Los Angeles, the Hamptons, and Miami, private jet rentals for travel, a team of private security guards, and a fleet of exotic cars, ranging in value from $100,000 to $3,800,000." | DOJ-26 |
| 10 | From a filing of October 2024: Lam "was renting multiple homes in Miami"; "One mansion he rented there cost $68,000 per month"; club managers said he "was spending approximately $400,000-$500,000 per night"; "One receipt from an L.A. club showed Lam spent "$569,528.39 in one night"". | CNBC |
| 11 | "In all, Lam "admitted to purchasing 31 luxury automobiles, 22 of which have yet to be recovered by law enforcement,"" and "many of Lam's vehicles have not been located as of yet, such as his Pagani Huayra that he purchased for $3,800,000". The 2025 indictment speaks of "a fleet of at least 28 exotic cars"; the FBI, by AP's account, of "over 30 cars". | CNBC, DOJ-25, AP |
| 12 | "Greavys in particular—whose real name was Malone Lam and who appeared to be in Miami—was posting and appearing in photos of luxury real estate, diamond watches, jets, and sports cars including a Lamborghini Revuelto and a Pagani Huayra". The BBC: he "was "notorious" in the Los Angeles and Miami nightclub scenes because of his flamboyant lifestyle ... a Florida district court heard". | WIRED, BBC |
| 13 | ZachXBT is "a twentysomething man who goes by the online handle ZachXBT"; "which airport, his real name, where home is, he'd rather not say". On 19 August 2024 an alert put him on the money; he traced it, found "three main threads of the stolen funds", and "went so far as to track the alleged suspects on Instagram and TikTok". He was "periodically sharing his findings with law enforcement agencies"; the victim later hired him. | WIRED |
| 14 | "...a video of a screenshare among the three hackers who appeared to be involved in the theft. Unbeknownst to them, one of the alleged hackers had re-shared his screen during that screenshare with another group of friends—and one of them appears to have recorded it. Several times in the 90-minute video, ZachXBT says, the three hackers refer to each other by their first names." | WIRED |
| 15 | "When Lam learned that authorities were on their way to arrest him, he dropped his cell phone off a dock at his Miami rental home into Biscayne Bay, according to the indictment." "An off-duty law enforcement officer had tipped off Lam that authorities were on their way to arrest him, the indictment says." | USAT, AP |
| 16 | "Lam faces a maximum prison sentence of 20 years. US District Judge Colleen Kollar-Kotelly did not immediately schedule a sentencing hearing for him." | BBC, AP |
| 17 | "Lam's purchases included a $2 million watch and over 30 cars ... When Lam indicated that he purchased most but not all of those vehicles himself, the judge asked him if he remembers which ones he personally bought. "I would need some time," he told the judge." | AP |
| 18 | The U.S. Attorney: "If you build a cybercrime empire, we will find you, dismantle your operation, and hold you accountable". | DOJ-26 |
| 19 | His lawyer, John Pierce, "in a statement to USA TODAY": "It's a very sad case of a bunch of kids getting way too far out over their skies and not appreciating how much damage they can do from what they probably viewed as online games like the Minecraft through which they met". | USAT |

## Not confirmed, and how the film handles it

- **No sentence, no date for one.** As of 13 November 2026 the only date found is the status hearing of 8 December
  2026. The film says "he faces up to twenty years" and shows "NOT SENTENCED YET · NEXT HEARING DEC. 8, 2026".
- **The amount.** "Over $230 million at the time" (the first indictment), "$243 million" (ZachXBT), "over $245
  million" (the later indictment, by USA Today's and AP's account; it is also the Justice Department's figure for the
  whole conspiracy), "nearly a quarter-billion dollars" (AP). The film uses AP's phrase for the hook and "more than
  two hundred thirty million dollars" for the number, which every count supports.
- **The cars.** 31 by his own admission in 2024; "at least 28" for the whole group in the 2025 indictment; "over 30"
  from the FBI in 2026; and he told the judge he bought "most but not all" himself. The film says "some thirty", shows
  the 31 with its source, and ends on his answer to the judge.
- **How he was found.** The film gives the investigator's part because that is the documented, public one, and marks
  it as his account. It does not say that this is what led the FBI to him: no source says so. (A filing also describes
  a co-defendant who signed up for an exchange account from his home connection; the film leaves that out.)
- **The phone in the bay, and the tip-off.** Both are in the indictment as reported, not established at a trial. The
  film says "the indictment says". The report's word is "dropped ... off a dock", and the narration keeps it; in the
  picture he tosses the phone a few metres out, because water at his feet would lie under the caption. That is
  staging, not a claim.
- **The year of the arrest.** The plea release of 2026 prints "Sept. 18, 2025", and USA Today repeats it. The release
  of 19 Sept 2024 ("arrested last night"), Wired and the BBC give 2024. The film shows 2024.
- **What he posted.** Wired describes him "posting and appearing in photos"; which posts were his own and which were
  other people's is not said. The feed in the film is a drawing, not a copy of any post.
- **What was recovered.** "Approximately $70,000,000 has been recovered or frozen" and "well over $100,000,000 remains
  unaccounted for" (a filing of October 2024); nothing newer was found. The film does not give a figure.
- **A guideline range.** One site, citing Fortune, writes that the plea agreement's guidelines start at 14 years. The
  agreement was not read and none of the sources above gives the figure. The film keeps to the maximum.
- **What the shared screen showed.** Wired says the recording "shows one of their screens as the theft was completed".
  The balance that runs down to zero in the film is a drawing of that sentence, under the tab AS ZACHXBT TOLD WIRED.

## Rules for this film

1. **He is named.** He has pleaded guilty, and the Justice Department and every outlet name him. He is drawn as the
   house's stock figure in an invented costume, not as a likeness, and the film says so on his name tag.
2. **The man who was robbed is not drawn and not named**, and nothing is at his expense: a dashed outline at a desk.
   Prosecutors do not name him.
3. **The crew has no faces.** Eighteen people are charged and eleven have pleaded guilty; the film does not sort them.
   The callers are "they", under "Prosecutors say". No co-defendant is named.
4. **No method beyond what the charge needs.** Callers who claimed to be a security team and then an exchange's support
   desk, and a program he was talked into installing. No product, no script, no step that could be copied. The
   exchange is not named.
5. **The investigator has no face either.** His name is a handle; by Wired's account "he has never publicly shown his
   face nor revealed his real name or exact age". He is a blank head in a trench coat (not his own avatar), and his
   account is marked as his, by way of Wired.
6. **Left out on purpose:** the kidnapping of a co-defendant's parents in Connecticut (private people, and another
   case), the home break-ins by others in the ring, his girlfriend, his other online names (one is a real actress's
   name), the co-defendants' sentences.
7. **The closing question** sets the prosecution's words against the defence's, each quoted, and judges neither.
8. Judge, prosecutor, defence lawyer, agents and club staff are invented figures. No company's mark is drawn.

## Narration (233 words, 13 lines, one take, `voice-15`)

> He helped steal nearly a quarter of a billion dollars in bitcoin from one man. Then he showed it off: supercars, mansions, nightclubs. It lasted one month!
>
> August twenty twenty-four. Malone Lam is twenty, a school dropout from Singapore, leading a crew that met through online games.
>
> Prosecutors say they phoned a man in Washington, posing as Google security, then as his crypto exchange, until he let them into his computer.
>
> Over forty-one hundred bitcoin vanished: more than two hundred thirty million dollars.
>
> Then came the flex. Miami mansions. Private jets. Up to half a million dollars a night in clubs.
>
> And some thirty exotic cars, one a three point eight million dollar Pagani. He was posting it online.
>
> Someone was watching. An investigator known only as ZachXBT followed the coins, and the posts.
>
> He says the crew shared a screen with friends during the theft, and somebody recorded it.
>
> One month after the theft, the F.B.I. arrested him in Miami. The indictment says he dropped his phone into the bay first.
>
> This September he pleaded guilty to racketeering conspiracy. He faces up to twenty years.
>
> The judge asked which cars he bought himself. Quote: I would need some time.
>
> Prosecutors call it a cybercrime empire. His lawyer: quote, a very sad case of a bunch of kids.
>
> So who gets sentenced: a crime boss, or a kid in way over his head?

Facts behind the lines: 1 → 2, 3, 4; 2 → 3, 5, 6; 3 → 8; 4 → 3; 5 → 9, 10; 6 → 9, 11, 12; 7 → 13; 8 → 14; 9 → 4, 15;
10 → 1, 16; 11 → 17; 12 → 18, 19; 13 → 16.

## Characters

- **Malone Lam**, named: the house's stock figure, dark hair brushed back, in four invented costumes. A pink hoodie
  (his room, the last shot); the same with a gold chain and a dollar sign (the selfie, the dock, the arrest); with the
  chain and sunglasses (the flex, the club, the jet); a grey shirt with a plain diamond print (court). His name tag
  says A STOCK CARTOON FIGURE, NOT A LIKENESS.
- **The crew:** blank heads with a question mark, hoodies, one with a headset. The caller holds up a smiling
  paper face on a stick: first SECURITY TEAM, then EXCHANGE SUPPORT. In the game lobby they are four cards with
  question marks beside his card, which has a crown and "$$$" (one of his online names, by the Justice Department).
- **The investigator:** a blank head with a question mark, a trench coat, a magnifying glass.
- **The man who was robbed:** a dashed outline at a desk, never a figure.
- **Invented:** two agents in jackets marked FBI, a judge, a prosecutor, a defence lawyer in glasses, two club
  servers. The people watching the shared screen are four grey silhouettes.
- No company's mark is drawn. The cars are the film's own wedge-shaped supercar in ten colours, not any maker's
  model; the Pagani is named in a line of text only.

## Visual beat map

45 entries in the shot list on 18 sets: 41 cuts and 3 joins (13 and 14, 16 and 17, 43 and 44 are one take each).
Frames at 30 fps; the film is 2231 frames, 74.4 s. A cut falls two frames before the word it belongs to.

| # | Frames | Set / staging | What is seen | On screen (every number with its source) |
|---|---|---|---|---|
| 0 | 0-81 | `coins/pile` | A round stage under one light, stacked with gold coins that glint. He comes up behind the pile, hands on his head, grinning. | stamp OVER $230 MILLION; IN BITCOIN, AT THE TIME · U.S. ATTORNEY'S OFFICE, D.C. |
| 1 | 82-110 | `desk/one` | A study at dusk, the Capitol's dome in the window. A laptop, and a dashed outline where its owner would sit. A card over the laptop: HIS WALLET · 4,100+ BITCOIN, a padlock. | THE MAN WHO WAS ROBBED IS NOT DRAWN |
| 2 | 111-146 | `drive/selfie` | In front of a house: he holds his phone up for a selfie, supercars behind him. | “NOTORIOUS” IN L.A. AND MIAMI CLUBS, A COURT HEARD · BBC |
| 3 | 147-174 | `drive/row` | From above: a yellow, a purple, a green and a white supercar, one behind another. | 31 CARS, BY HIS OWN ACCOUNT · COURT FILING |
| 4 | 175-198 | `villa/wide` | A glass house with a pool, palms, a dock on the bay. | RENTED: LOS ANGELES, THE HAMPTONS, MIAMI |
| 5 | 199-224 | `club/party` | A club: he in sunglasses with a fan of banknotes, a server with a bottle and a sparkler. | “UP TO $500,000 PER EVENING” · U.S. ATTORNEY'S OFFICE |
| 6 | 225-272 | `cal/hook` | A wall calendar, August and September 2024. A ring round 18 August (THEFT), thirty days crossed off, a ring round 18 September (ARREST). | stamp 31 DAYS |
| 7 | 273-306 | `room/wide` | His room at night: purple light, a game and a chart on the screens, he at the keyboard behind his monitor. | calendar leaf AUG 2024 · 18 |
| 8 | 307-343 | `room/close` | Close on him in his chair. | name tag MALONE LAM · 20 THEN · PLEADED GUILTY IN SEPT. 2026; A STOCK CARTOON FIGURE, NOT A LIKENESS |
| 9 | 344-388 | `globe/path` | A classroom globe. A pin and a tag on SINGAPORE; on "Singapore" a small plane leaves along a dotted route while the globe turns under it, and comes to rest under a second tag: THE U.S., OCT. 2023. | LEFT SCHOOL AT 14, HE TOLD INVESTIGATORS · BBC; STAYED AFTER HIS VISA EXPIRED · BBC |
| 10 | 389-447 | `screen/lobby` | A big screen with the lobby of a block game: LOBBY · 5 PLAYERS. His card has a crown and "$$$"; four cards have question marks. | “RINGLEADER” · U.S. ATTORNEY'S OFFICE, D.C.; “CONNECTIONS MADE ON ONLINE GAMING PLATFORMS”; 18 CHARGED · HIS WAS THE 11TH GUILTY PLEA · AP |
| 11 | 448-480 | `mask/dial` | A caller with a blank head and a headset under one lamp, two more at desks behind. Rings go out from the headset. | tab AS PROSECUTORS TELL IT (it stays through shot 15); THE CREW HAS NO FACES HERE: NOT ALL HAVE BEEN TRIED |
| 12 | 481-508 | `desk/ring` | The study: the phone on the desk rings. A card: INCOMING CALL · “SECURITY TEAM”. | WASHINGTON, D.C. · AUG. 18, 2024 |
| 13 | 509-547 | `mask/google` | The caller holds up a smiling paper face with a shield: SECURITY TEAM. | “CLAIMING THEY WERE FROM GOOGLE'S SECURITY TEAM”; COURT FILING, AS REPORTED BY CNBC |
| 14 | 548-589 | `mask/exchange` (join) | The same take: the paper face is swapped for one with a coin: EXCHANGE SUPPORT. | THEN AS THE “SUPPORT TEAM” OF HIS EXCHANGE |
| 15 | 590-634 | `desk/allow` | The study: a window, “SECURITY” TOOL · INSTALL TO PROTECT YOUR COINS? · NO / INSTALL. The cursor comes down and presses INSTALL on "into". The window turns red, REMOTE ACCESS: ON · SOMEBODY ELSE HAS THE DESKTOP, and the cursor moves off by itself. | “DUPED INTO DOWNLOADING A PROGRAM” · USA TODAY |
| 16 | 635-697 | `coins/drain` | The stage of coins: the piles sink while coins fly up into a wallet marked with a question mark. | stamp 4,100+ BITCOIN; “OVER 4,100 BITCOIN” · U.S. ATTORNEY'S OFFICE |
| 17 | 698-764 | `coins/gone` (join) | The same take: the stage is empty, dashed rings where the piles stood. A counter runs up and stops on "million". | $230 MILLION+ · “WORTH OVER $230 MILLION AT THE TIME” |
| 18 | 765-802 | `drive/flex` | In front of the house: he in sunglasses and a gold chain, arms out, banknotes falling. | “A WILD SPENDING SPREE” · ASSOCIATED PRESS |
| 19 | 803-833 | `villa/pool` | The pool from above, a pink ring and a yellow one on the water. | RENTED · ONE AT $68,000 A MONTH · COURT FILING |
| 20 | 834-859 | `jet/board` | An apron at sunset: a small jet, nose toward us; he goes up its stairs and waves. | “PRIVATE JET RENTALS” · U.S. ATTORNEY'S OFFICE |
| 21 | 860-892 | `club/bill` | The club, closer: servers come in with sparklers, bottles in a bucket, he on the seat with the banknotes. | stamp UP TO $500,000 A NIGHT; “UP TO $500,000 PER EVENING” · U.S. ATTORNEY'S OFFICE |
| 22 | 893-924 | `club/receipt` | Close on a till in the club: a long receipt feeds up out of the printer, top first: ONE NIGHT · TOTAL $569,528.39, the total marked in yellow. | ONE RECEIPT, A LOS ANGELES CLUB · COURT FILING |
| 23 | 925-983 | `fleet/tower` | A dark tower of shelves; small supercars in many colours appear on it row by row, a blue one on a turntable below. A counter runs to 31. | 31 CARS · “31 LUXURY AUTOMOBILES” · COURT FILING, 2024 |
| 24 | 984-1058 | `fleet/hero` | The blue car, whole from nose to wing, turns on its lit turntable from its side to its tail; a price tag comes down over it on two strings: $3,800,000. | A PAGANI HUAYRA · “PURCHASED FOR $3,800,000”; COURT FILING, OCT. 2024: IT HAD NOT BEEN FOUND |
| 25 | 1059-1111 | `feed/post` | A phone, its feed scrolling: a car, a jet, banknotes, a villa; hearts going up. The account's name is "$$$". | “POSTING AND APPEARING IN PHOTOS” · WIRED |
| 26 | 1112-1150 | `sleuth/watch` | A dark office: a figure with a blank head and a trench coat in the light of a screen; a post with a car comes up beside him. | AUG. 19, 2024: THE DAY AFTER · WIRED |
| 27 | 1151-1227 | `sleuth/who` | He stands at a pin board with a magnifying glass. On top a diagram: 4,100 BTC, MIXERS, three boxes EXCHANGE, three question marks. Under it four photos (a car, a jet, a bag, a villa) joined with red string. | name tag ZACHXBT · A PSEUDONYM · REAL NAME NOT PUBLIC · WIRED |
| 28 | 1228-1257 | `sleuth/coins` | Close on the diagram: one coin becomes three and they run down the three threads, the glass after one of them. | “THREE MAIN THREADS” · WIRED |
| 29 | 1258-1288 | `sleuth/posts` | Close on the photos: the glass goes from picture to picture. A tag, MIAMI, is pinned where the strings meet. | “ON INSTAGRAM AND TIKTOK” · WIRED; HE “APPEARED TO BE IN MIAMI” |
| 30 | 1289-1363 | `screen/share` | The big screen: SHARING THIS SCREEN. A card headed ONE MAN'S WALLET: the balance rolls down from 4,100 to 0 BITCOIN, coins flying off it. Under it, WATCHING, and four grey silhouettes. | tab AS ZACHXBT TOLD WIRED (it stays through shot 31); ONE OF THEM “RE-SHARED HIS SCREEN”; WITH “ANOTHER GROUP OF FRIENDS” |
| 31 | 1364-1405 | `screen/rec` | Close on the silhouettes under WATCHING: a red ring closes round one of them and a REC badge lights beside it. | A 90-MINUTE VIDEO · FIRST NAMES ARE SPOKEN IN IT |
| 32 | 1406-1447 | `cal/month` | The calendar again: THEFT on 18 August, the crossed days, ARREST on 18 September. | HE SHARED HIS FINDINGS WITH LAW ENFORCEMENT · WIRED |
| 33 | 1448-1530 | `villa/raid` | The villa's terrace at dusk, wide: he stands by the pool with his hands on his head; two agents in jackets marked FBI walk in from both sides and stand left and right of him. | stamp ARRESTED; SEPT. 18, 2024 · AT HIS RENTAL HOME IN MIAMI |
| 34 | 1531-1573 | `villa/dock` | The reverse angle, from the terrace out over the bay, the sun going down in it: he stands on the dock with his phone held up, looks round and, on "dropped", tosses it out into the water. Drops and rings where it lands. | “OFF A DOCK ... INTO BISCAYNE BAY” · USA TODAY; TIPPED OFF BY AN OFF-DUTY OFFICER, IT SAYS · AP |
| 35 | 1574-1614 | `deep/sink` | Under water: the phone sinks past the fish, NO SERVICE on its screen. | THE INDICTMENT, AS REPORTED BY USA TODAY |
| 36 | 1615-1704 | `court/plea` | A courtroom: the judge on the bench, he in grey at the table with a card that says GUILTY, the prosecutor at the right. | calendar leaf SEPT 2026 · 8; ONE COUNT OF RICO CONSPIRACY; U.S. DISTRICT COURT, WASHINGTON |
| 37 | 1705-1766 | `court/years` | Close on him: his mouth falls open. | stamp UP TO 20 YEARS; NOT SENTENCED YET · NEXT HEARING DEC. 8, 2026 |
| 38 | 1767-1828 | `court/judge` | The judge leans over the bench; three toy cars roll onto it. | AT THE PLEA HEARING · ASSOCIATED PRESS; HE HAD BOUGHT MOST OF THEM, NOT ALL, HE INDICATED |
| 39 | 1829-1891 | `court/time` | Close on him, dazed; small cars go round his head. He hops on "need". | quote card “I would need some time.” · MALONE LAM TO THE JUDGE · AP |
| 40 | 1892-1960 | `steps/pros` | The courthouse steps: the prosecutor at a lectern marked U.S. ATTORNEY'S OFFICE, a flag beside her. | quote card “If you build a cybercrime empire, we will find you ...” · THE U.S. ATTORNEY FOR D.C. · SEPT. 8, 2026 |
| 41 | 1961-2026 | `steps/def` | The same steps, the other side: his lawyer at three microphones, a sheet of paper in his hand; he shrugs. | quote card “It’s a very sad case of a bunch of kids ...” · HIS LAWYER, TO USA TODAY |
| 42 | 2027-2065 | `screen/kids` | The game's lobby again, close: the five cards. | “ONLINE GAMES ... THROUGH WHICH THEY MET”; THE SAME STATEMENT, TO USA TODAY |
| 43 | 2066-2105 | `split/what` | A stage in two halves. Left: a red curtain, a throne, a crown, banknotes. Right: blue light, a game controller, a screen with the block game, a beanbag, a school bag. He stands on the line between them in his hoodie. | header WHO GETS SENTENCED? |
| 44 | 2106-2230 | `split/choice` (join) | The same take: the crown glints on A, the controller lights on B. He looks from one to the other. | NO DATE YET · HE FACES UP TO 20 YEARS; A · A CRIME BOSS; B · A KID IN OVER HIS HEAD |

The quotation marks on screen mark words copied from the source named beside them; an ellipsis marks a cut inside a
quotation. Lines without quotation marks are the film's own summary of the source named.

## Voice

- Arena TTS `voice-15` (en-US, masculine, conversational), the series' narrator. **One take, one call**, kept as
  `voice/raw-take.mp3` (93.94 s). "ZachXBT" was sent as "Zack X B T". (The first build's take was lost with its
  workspace; this is a second read of the same text, made on 13 November.)
- `build_voice.py`: the 48 pauses between phrases are cut to the house lengths (84.25 s), the pace is raised 1.2
  times, a shelf takes 1 dB off the bass and a bell adds 1.5 dB of presence. Result `voice/voice.wav`, 72.97 s; with
  the tail the film is 74.4 s. 233 words at 3.19 words a second.
- Beats added after: the three words of the hook's list ("supercars", "mansions", "nightclubs": a tenth of a second
  each, so that no shot of the hook is under 24 frames), "one month", "million dollars", "the flex", "online",
  "watching", "recorded it", "first", "twenty years", "Quote", "some time", "empire", and before the closing question.
  The spelled initials "F.B.I." are squeezed by 0.4 s.
- Word times (`voice/words.json`, copied to the film folder) come from a forced alignment against the narration with
  the house lexicon; "zachxbt" and "f.b.i." have their own spellings in it. Every cut and every cue in picture and
  sound is placed from these times.

## Sound

Everything is synthesized in `audio/build_mix.py`; nothing is sampled. The cue sheet with every sound and its reason
is `audio/cues.md` (about 200 cues).

- **The score** is in F minor at 140 beats a minute felt at half speed, and it tells the story with one tune:
  - **the flex** (the hook; again from "Then came the flex"): a sub-bass, a kick, a clap on three, rolling hats and a
    bell tune; in the club the kick is on every beat;
  - **"It lasted one month"**: the music is cut dead on a clap and a low F, and a clock ticks twice;
  - **his room**: only the sub-bass and the hats; **the globe**: one bright chord, D flat major, a harp going up as
    the plane leaves; **the lobby**: the tune as an old computer plays it;
  - **the call**: a low pulse; then a cheerful hold-music jingle on fife and bells for the paper face, a tone higher
    for the second face; it comes down a diminished chord on "until he let them", and a kettledrum with brass lands
    on "into his computer";
  - **the coins go**: bells running down three octaves, a climb under the counter, kettledrum and brass on "million";
  - **"Someone was watching"**: the beat stops; one note on a vibraphone; then a walking plucked bass with brushes
    for the investigator, no drums; it stops when "somebody recorded it";
  - **the arrest**: the beat of the flex with nothing on top of it; **the dock**: a harp on tiptoe; **under water**:
    the tune's four notes, two octaves down and muffled;
  - **the court**: one low chord, a toll on "twenty years", a question on the harp for "which cars", and no tune under
    his answer;
  - **the two quotations**: the tune's first four notes on a tuba and a horn for "a cybercrime empire", then the same
    four notes on a music box, three octaves up, for "a bunch of kids";
  - **the choice**: A gets the kettledrum and brass, B gets the music box and one blip of a game.
- **Effects** follow what is seen: coins, a camera click, an engine, water, sparklers, a marker on the calendar, keys,
  a telephone, a pop for each tag and window, the click on INSTALL, a buzzer for REMOTE ACCESS: ON, a rumble as the
  piles sink, a cash register when the counter stops, a cork, a printer for the receipt, a blip for each shelf of
  cars, a jet, a swipe for the feed, three rising pings down the threads, ticks falling in pitch as the balance runs
  down, two beeps for REC, a siren, a ratchet for the handcuffs, the throw and the splash on "dropped", bubbles, a
  gavel, a gulp, and a swish on each of the 41 cuts (none on the 3 joins).
- **Measured on the WAV:** 74.367 s, 48 kHz stereo; integrated loudness -14.5 LUFS, true peak -2.7 dBTP; the limiter
  takes off at most 3.6 dB. Music 5.7 LU under the voice while someone speaks. Word by word
  (`templates/scripts/word_margins.py`): the voice is a median 5.4 LU over music and effects, 10th percentile 1.9 LU,
  lowest -1.2 LU ("the", word 132); 5 of 233 words are under 0, all of them short function words. One content word,
  "vanished" (75), sat 0.6 LU under the bells and is lifted 2 dB with the bed 2 dB down under it.
- Nobody has listened to it: these are measurements. The same checks passed on the seven earlier films, whose mixes
  were built the same way.

## Render

Rendered on GitHub Actions by `.github/workflows/render-short.yml`: twenty parts in parallel, joined, the sound laid
under, the finished file checked with `templates/scripts/short_qa.py`, and the file and the report committed to the
branch by the run itself. Three full runs of nine to ten minutes each, all on 13 November 2026.

| Run | Commit | Why it was made |
|-----|--------|-----------------|
| `43343391420` | `3a35598` | The first full render (published as `15c2011`). The check was clean. It was started one minute after the fifth round of stills and should not have been: six faults were on the sheets of rounds 3 to 5 (the first and last frame of every shot, then the fixes) and had been passed. They were recognised a quarter of an hour later on one frame in every 24 of the render, none of them a thing the check sees: the two agents stood half outside the frame for the whole arrest; the dock showed the same figure at the same size against the same house as the arrest, with the splash at the frame's edge under the caption; the plane on the globe ended on top of the tag it flies to; the blue car was cropped at both ends for its whole shot; the wallet card's heading slid under the source tab as the camera pushed in; the toy cars stood at the left edge of the bench. |
| `43346052087` | `dc3e676` | The second (published as `91f3652`), with those six put right. Its check reported three unplanned jumps, frames 1467 to 1469: the agents, who now came from outside a wider frame, crossed into it in four frames. And the toy cars, moved to the middle, reached the right edge at the end of the push. |
| `43347793839` | `284ca3a` | **The final file** (published as `cf828d1`). The agents start just outside the frame and walk for eighteen frames; the toy cars are a little smaller. The check is clean. |

```
gh workflow run render-short.yml --ref <branch> -f composition=BtcFlexShort \
  -f mix=shoots/bitcoin-flex/audio/mix.wav -f shots=shoots/bitcoin-flex/qa-shots.json \
  -f publish='shoots/bitcoin-flex/final-{size}p.mp4' -f size=720 -f chunks=20
```

Stills for review are made locally: `REVIEW=BtcFlexReview remotion-app/scripts/pick.sh <dir> <frame,frame,...> 400`,
tiled with `scripts/sheets.sh`. Where a point of a set lands in the frame: `scripts/project.py`.

## Result

- **File:** [`shoots/bitcoin-flex/final-720p.mp4` at commit `cf828d1`](https://github.com/Mellow048/ntc-8f3a9x2k/blob/cf828d13c1b5d541a1c3200bcd525692d6786b3f/shoots/bitcoin-flex/final-720p.mp4).
  720x1280, 30 fps, 2231 frames, 74.367 s, 42,450,851 bytes, H.264 with 48 kHz stereo AAC.
  SHA-256 `651d88988e053d226ddbed57ce8259c876e735bf3d60ada0647cacbd12c30195`.
- **Finished-file check** (`qa-report.md`, written by the run): -14.6 LUFS integrated, loudness range 2.1 LU, true
  peak -1.7 dBFS; no silence; no black, unplanned white or frozen frames; no unplanned frame jumps. The encode
  against its WAV, run again locally (`templates/scripts/aac_check.py`): highest sample -1.74 dBFS against the WAV's
  -2.69, nothing late, no sample that stands clear of the WAV. The encode added 0.95 dB to the peak, which is why
  the mix is built to -2.8: the file is 0.7 dB inside the gate of -1.0. The film check itself was run again in the
  sandbox after the approval (`templates/scripts/short_qa.py`, twenty seconds): it wrote the same report as the run,
  character for character.
- **Picture, third render against the second,** frame by frame at a quarter of the size: frames 1452-1472 (the
  agents come in) and 1793-1891 (the toy cars, on the bench and behind him in the next shot) differ; each of the
  other 2111 frames reads 46.7 dB PSNR or more, and 1322 of them are the same picture exactly. The second against
  the first: 369-388 (the globe), 984-1058 (the car), 1289-1363 (the shared screen), 1448-1573 (the arrest and the
  dock) and 1793-1891 (the toy cars) differ; each of the other 1836 frames reads 50.3 dB or more, which is what two
  encodes of one picture read.
- **The joins, measured in the finished file.** The 41 cuts change the picture by 30.8 or more on the measure the
  check uses (mean change from one frame to the next), 80.8 at the median. At the three joins the camera does not
  move: into frame 2106, 0.8 % of the picture changes, as in the frames before it. Into 548, 5.2 % changes (1.8 %
  before): the paper face is swapped for the next one and the first source line goes; the caller bobs over the two
  frames after it, and the new line comes in at 551. Into 698, 12.6 % changes (3.9 % before): the stamp 4,100+
  BITCOIN and its source line go, and the counter starts on the next frame. Both are meant, both are in the list of
  planned changes, and neither moves the set. The frames either side of all three were looked at (below).
- **Looked at, all of it on still frames:** the cast sheet; 264 local stills in thirteen rounds (the middle of
  every shot, then every fault found, then the first and last frame of every shot, then every fault again); one
  frame in every 24 of the first render (93 frames, every shot); the six places that changed on 50 frames of the
  second render; the two places that changed, the first frame and the last two seconds on 14 frames of the final
  file.
- **Looked at only after the delivery** (13 November, after the user's approval and before the film was filed), on
  frames of the final file: the eight frames round each of the joins at 548 and 698 and the four round 2106, and
  eight frames of his answer to the judge (1829-1891), a shot whose toy cars had moved for the third render. The
  joins are as described above. The answer to the judge added one line to the list below. The approved file was
  not changed.
- **Not done:** nobody has watched the film in motion or listened to it. The sound was measured, not heard; that
  includes how the voice says "ZachXBT", which was sent to it as "Zack X B T".
- **Known small things, left as they are:**
  - The cars are the house's own wedge-shaped supercar in many colours. The blue one stands for the Pagani the
    filing names; it is not a drawing of that model, and the line above it carries the name and the price.
  - The report says he "dropped" his phone off the dock; in the picture he tosses it a few metres (see "Not
    confirmed").
  - On the globe the plane comes to rest over the western Pacific, under the tag THE U.S.: the globe turns 46
    degrees, not far enough to bring America round.
  - The counters show numbers that are not facts on their way up ("$219 MILLION+", "17 CARS") for a few frames each;
    each stops on its sourced value and holds it.
  - In the club a server stands at the left edge, partly outside the frame.
  - The source line over the club receipt is white on the receipt's white paper: it reads as a line of the receipt.
  - Under water a pink fish swims behind the source line for a moment.
  - A caption can hold for two or three frames after a change of shot (the change falls two frames before the next
    word): VANISHED stays for three frames after the join at 698.
  - While he answers the judge (1829-1891) the three toy cars on the bench stand behind his head, out of focus: the
    red one is half hidden by his hair and the blue one is cut by the right edge of the frame. The cars that circle
    over his head pass in front of the judge's face behind him.
- **The story on the day:** searched again on 13 November 2026 at 01:37 UTC, before the last two renders. Nothing
  has moved since the plea of 8 September: no sentence, no date for one, a status hearing on 8 December 2026.
  Nothing the film says has changed. After 8 December the line NEXT HEARING DEC. 8, 2026 will be out of date: it
  carries its date on screen.
