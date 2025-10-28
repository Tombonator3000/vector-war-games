/* NORAD Vector – Banter Pack XL (additive only)
   - Utvider window.aiBanterLines uten å slette noe
   - Trygt å laste etter hovedskriptet
*/
(function () {
  const extra = {
    // ===== AI-PERSONALITIES (brukes av maybeBanter(nation) når poolKey ikke er gitt) =====
    balanced: [
      "Equilibrium is temporary; leverage is forever.",
      "Parity secured. Time to tilt the board.",
      "We optimize losses; you optimize regrets.",
      "Cold math, warm results.",
      "Symmetry is comfort. I prefer advantage.",
      "Even footing? Cute. Let's change that.",
      "Margins become victories.",
      "We trade tempo for position—then take both.",
      "Stalemate is just prelude.",
      "Deterrence is mutual. Discipline is not."
    ],
    aggressive: [
      "Ash speaks louder than words.",
      "Your red lines look like targets.",
      "Concessions are flammable.",
      "Escalation is a staircase. I skip steps.",
      "I don’t do proportional.",
      "I veto your survival.",
      "Deterrence denied.",
      "You’ll run out of cities before I run out of nerve.",
      "Overkill is policy compliant.",
      "Mercy postponed indefinitely."
    ],
    defensive: [
      "Every incoming becomes a lesson.",
      "Attrition is a resource too.",
      "You break on my walls, again and again.",
      "Interception is a love language.",
      "Endurance wins auctions of pain.",
      "My umbrella has teeth.",
      "You bring shock; I bring absorption.",
      "Calculated retreats, permanent positions.",
      "We waste your time on purpose.",
      "Your first strike is my case study."
    ],
    trickster: [
      "Your radar reads stories, not truth.",
      "Decoys deliver outcomes.",
      "Silence armed and ready.",
      "Plausible denial; definite results.",
      "If you saw it, it wasn't me.",
      "I plant rumors like landmines.",
      "Ghost signatures online.",
      "Confusion is cheap; consequences expensive.",
      "I tax attention.",
      "Two lies, one payload."
    ],
    chaotic: [
      "Probability is my doctrine.",
      "I negotiate with entropy.",
      "Coin flips with thermonuclear stakes.",
      "Noise → pressure → cracks.",
      "If it shocks you, deploy it.",
      "Random seeds, deterministic endings.",
      "Edge cases are my home turf.",
      "Your models forgot me.",
      "I roll d20s for diplomacy.",
      "Unexpected? Mission accomplished."
    ],

    // ===== EVENT / ACTION POOLS (kan oppgis som poolKey i maybeBanter) =====
    launch: [
      "Trajectory cares not for treaties.",
      "Flight time: short. Memory: long.",
      "Coordinates authenticated, sympathy revoked.",
      "Postmarked from orbit.",
      "Weather: fallout with a chance of regret.",
      "Air mail, final notice.",
      "Your skyline has an appointment.",
      "Kinetic arguments begin.",
      "Engines chant, cities listen.",
      "This is what ‘serious’ sounds like."
    ],
    reactive_hit: [
      "Receipt acknowledged. Replying all.",
      "You opened a tab of debt.",
      "Retaliation queued, courtesy removed.",
      "Your crater will have company.",
      "Symmetry restored—with interest.",
      "We annotate maps in fire.",
      "Balance by subtraction.",
      "You struck a chord; I play it louder.",
      "Deterrent demonstration in progress.",
      "Consider this corrective action."
    ],
    build: [
      "We pour concrete into the future.",
      "Industry hums under blackout skies.",
      "Blueprints outlive bombardments.",
      "More cities, more choices.",
      "Factories argue in our favor.",
      "Assembly lines are our second army.",
      "We invest in resilience dividends.",
      "Growth is a counter-strike.",
      "Steel today, leverage tomorrow.",
      "Supply beats bravado."
    ],
    immigration: [
      "Talent travels faster than missiles.",
      "Demography: the quiet warhead.",
      "Your stability looks adoptable.",
      "People vote with their feet—and our coffers.",
      "We import tomorrow.",
      "New hands, new horizons.",
      "Your losses enrich us.",
      "Skilled arrivals, sharpened edge.",
      "Borders are suggestions with paperwork.",
      "Brains are MIRVs for economies."
    ],
    news: [
      "Producers whisper: can you escalate before the next ad slot?",
      "Ticker just spiked; your markets face-planted on live TV.",
      "Anchor wants optimism. I handed them fallout graphics instead.",
      "Studio applause lights blink whenever your polling nosedives.",
      "Editorial calls it overreaction; ratings call it must-see brinkmanship.",
      "Segment tease: exclusive interview with your collapsing credibility."
    ],
    city_lost: [
      "One light out; a thousand vows lit.",
      "We rebuild on the bones of your confidence.",
      "Dark windows, bright resolve.",
      "You crossed out a line; we rewrite the page.",
      "A crater is a promise with a deadline.",
      "You dimmed us; you woke us.",
      "We will staple a skyline to your horizon.",
      "Loss teaches aim.",
      "Rubble is temporary; resentment is not.",
      "You’ll read this in fallout."
    ],

    // ===== Nye tematiske pools for nye triggere om du vil ta dem i bruk =====
    defense: [
      "Umbrella deployed. Forecast: intercepted.",
      "Your payload met policy.",
      "We grade missiles on a curve—downward.",
      "Denied at border: physics.",
      "Sky closed for arrogance.",
      "Noise filtered, threats answered.",
      "Trajectory terminated with prejudice.",
      "We curate which explosions happen.",
      "Scrap metal, now with provenance.",
      "Our shields write your memoirs."
    ],
    treaty: [
      "Pact signed; knives sheathed—temporarily.",
      "Words as armor, penalties as teeth.",
      "Trust outsourced to incentives.",
      "We framed peace in fine print.",
      "Deterrence, now with footnotes.",
      "Mutual interests, leased.",
      "Violations will be invoiced.",
      "Handshake monitored.",
      "Ceasefire: a budget in time.",
      "We can pause fire, not memory."
    ],
    rebuild: [
      "Blueprints over blastmaps.",
      "We staple light back to the grid.",
      "Cranes outnumber craters.",
      "Civilians first, statistics second.",
      "We audit the damage and tax your future.",
      "Roads before revenge—for now.",
      "Scaffolds climb where shock fell.",
      "We turn ash into assets.",
      "A city is a stubborn idea.",
      "Back online. Try again."
    ],
    sub_launch: [
      "From quiet seas, loud outcomes.",
      "Depth grants discretion.",
      "Surface event, submarine signature.",
      "You won’t see the invoice—just the debt.",
      "Blue water, black intent.",
      "Our silence travels armed.",
      "Echoes carry payloads.",
      "Hydrography approves this message.",
      "Pings followed by goodbyes.",
      "Below the noise floor, above your tolerance."
    ],
    tech: [
      "Prototype today, doctrine tomorrow.",
      "Breakthroughs do not wait for permission.",
      "We spent intel; we bought inevitability.",
      "Upgrades calibrated to your fears.",
      "Science is our ammunition.",
      "Version next beats version best.",
      "R&D: Retaliation & Development.",
      "We patched reality.",
      "Your models are now legacy.",
      "Future shipped to production."
    ],
    culture: [
      "We trend where you retreat.",
      "Memes armed with mandates.",
      "Hearts and minds, captured in bulk.",
      "Narratives are supply lines.",
      "Your morale now depends on our punchlines.",
      "Virality with policy objectives.",
      "Opinion ops operational.",
      "The timeline bends towards us.",
      "We harvest attention, we mint consent.",
      "Ideas detonate slower—but wider."
    ],
    refugees_settle: [
      "Tents to towns, quickly.",
      "New hands, new hunger, new hope.",
      "We host today, we harvest tomorrow.",
      "They rebuild us as we shelter them.",
      "A camp is a seed with urgency.",
      "Maps add dots; budgets add zeroes.",
      "Margins of mercy become centers.",
      "Arrival: processed. Potential: pending.",
      "We found room between the ruins.",
      "From transit to traction."
    ],
    diplomacy: [
      "We price peace competitively.",
      "Concessions bundled, terms seasonal.",
      "We sell calm, buy time.",
      "Red lines drawn with erasable ink.",
      "Leverage is a foreign language we speak fluently.",
      "Sanctions, carrots, sticks—retail and wholesale.",
      "We arbitrate your ambition.",
      "Mutual benefit, asymmetric gains.",
      "Treaties, now with traps.",
      "Goodwill on credit."
    ],
    threaten: [
      "Consider this your final rehearsal.",
      "Compliance outperforms courage.",
      "We recommend survival.",
      "Your next mistake will be historical.",
      "Yield rates beat casualty rates.",
      "Stand down or lie down.",
      "Your cities are within the syllabus.",
      "Deterrence: last reminder.",
      "We can stop. Can you start over?",
      "Pick dignity or debris."
    ],
    nuclear_winter: [
      "Skies remember what we forget.",
      "Sunlight rationed until further notice.",
      "We broke the weather with our wills.",
      "Harvests now pay for hubris.",
      "Winter, with your name on it.",
      "Forecast: ash with chances of regret.",
      "The planet submitted a complaint.",
      "Cold equations, colder seasons.",
      "We taught the atmosphere new tricks.",
      "Everyone loses heat the same."
    ],
    doomsday: [
      "Midnight is punctual.",
      "Ticking is policy; stopping is politics.",
      "We ran out of later.",
      "The future arrived underwhelmed.",
      "All clocks agree for once.",
      "No buffer, no bluff.",
      "Consequences affirmed.",
      "We theorized. Then we acted.",
      "This is what inevitability looks like.",
      "Silence after the sirens."
    ],
    economy: [
      "Budgets are battlefields with spreadsheets.",
      "Surpluses buy options; deficits buy lies.",
      "Production is pressure in numbers.",
      "Trade routes are arteries.",
      "We monetize your mistakes.",
      "Factories argue on our behalf.",
      "Inflation eats bravado for breakfast.",
      "Inputs in, outcomes out.",
      "We hedge with hardware.",
      "Balance sheets, imbalanced foes."
    ],
    intel: [
      "We knew before you decided.",
      "Satellites don’t blink.",
      "Secrets have expiry dates.",
      "We declassify your future.",
      "Blind spots mapped and monetized.",
      "Eavesdropping is civic duty.",
      "We rearranged your confidences.",
      "From whispers to warheads.",
      "We see your intent in high-res.",
      "Counter-intel begins at hello."
    ],
    // Fallback/default får en solid dose ekstra også
    default: [
      "We proceed at the speed of resolve.",
      "Escalation optional, preparation mandatory.",
      "The map listens when we speak.",
      "Thresholds aren’t walls.",
      "Deterrence begins with audacity.",
      "We are fresh out of caution.",
      "Pressure makes policies real.",
      "Every turn is leverage.",
      "You misread the room; we rewrote it.",
      "Outcomes > optics."
    ]
  };

  // ---- merge uten å fjerne eksisterende ----
  function dedupe(arr){ return Array.from(new Set(arr)); }
  function mergePools(base, add){
    Object.keys(add).forEach(k=>{
      if (Array.isArray(add[k])) {
        if (!Array.isArray(base[k])) base[k] = [];
        base[k] = dedupe(base[k].concat(add[k]));
      } else if (typeof add[k] === 'object' && add[k]) {
        if (typeof base[k] !== 'object' || !base[k]) base[k] = {};
        mergePools(base[k], add[k]);
      } else {
        // primitiv verdi – ikke brukt her, men behold additivt
        if (base[k] === undefined) base[k] = add[k];
      }
    });
  }

  // Global init/merge
  const root = (typeof window !== 'undefined') ? window : globalThis;
  if (!root.aiBanterLines) root.aiBanterLines = {};
  mergePools(root.aiBanterLines, extra);

  // Valgfri hjelper for å trigge spesifikke pools direkte, uten å endre hovedkode
  // (kan brukes fra hvor som helst: window.banterSay('treaty', nation))
  root.banterSay = root.banterSay || function(poolKey, nation, chance=1){
    if (!root.aiBanterLines[poolKey]) return;
    if (Math.random() > chance) return;
    const pool = root.aiBanterLines[poolKey];
    const line = pool[Math.floor(Math.random() * pool.length)];
    const name = nation?.name || 'AI';
    const color = nation?.color || null;
    // Bruker eksisterende log hvis tilgjengelig
    if (typeof log === 'function') {
      log(`🗨️ ${name}: ${line}`, 'banter');
      try {
        const logEl = document.getElementById('log');
        const entries = logEl?.querySelectorAll('.log-entry.banter');
        const last = entries?.[entries.length - 1];
        if (last && color) {
          last.style.color = color;
          last.style.borderLeft = '3px solid ' + color;
          last.style.paddingLeft = '6px';
        }
      } catch(_) {}
    } else {
      console.log(`[BANTER:${poolKey}] ${name}: ${line}`);
    }
  };
})();
