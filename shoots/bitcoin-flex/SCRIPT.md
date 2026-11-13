# One Month of Being Rich

News short, eighth in the series (`references/news/`). Made on 2026-11-12 and 13, following
`references/news/PLAYBOOK.md`, starting from the seventh film's folders (`restore.py truck-stop-heist --mix`).
Film folder `remotion-app/src/videos/btcflex/`, composition `BtcFlexShort`.

The user asked for it on 12 November: "i saw a tiktok somewhere where a kid who wants to be filthy rich fooled a person
and took his bitcoins, but insted of hiding and dissapearing from the internet, he bought alot of cars,flexed it to the
internet and stuff and eventually he got tracked down and arrested making his last years his very best and last moments
ever. if u can find that story please adapt it cuz its really interesting". The story is the case of Malone Lam
(U.S. v. Lam et al., 24-cr-417, U.S. District Court for the District of Columbia).

**Status:** see "Result" at the end.

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
  film says "the indictment says".
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
