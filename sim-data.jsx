// Pre-computed sample simulation of 24 players across 6 tiers (4 per tier).
// Each "shift" = top finisher promotes, bottom relegates.
// We hand-scripted three featured storylines so the viewer sees narrative arcs.

// Tiers, top (T1) to bottom (T6)
const TIER_NAMES = [
  { code: 'T1', name: 'Championship', players: 4 },
  { code: 'T2', name: 'Contender',    players: 4 },
  { code: 'T3', name: 'Playoff',      players: 4 },
  { code: 'T4', name: 'Division',     players: 4 },
  { code: 'T5', name: 'Qualifier',    players: 4 },
  { code: 'T6', name: 'Rookie',       players: 4 },
];

// 24 players. Each has a unique id, display name, and a storyline role.
// role ∈ {'climber', 'faller', 'grinder', 'background'}.
const PLAYERS = [
  // T1 starters
  { id: 'P01', label: '01', name: 'Rivera',  role: 'faller',     color: '#ff6a1f' },
  { id: 'P02', label: '02', name: 'Okafor',  role: 'background', color: '#b8ff2b' },
  { id: 'P03', label: '03', name: 'Kim',     role: 'background', color: '#b8ff2b' },
  { id: 'P04', label: '04', name: 'Diaz',    role: 'background', color: '#b8ff2b' },
  // T2
  { id: 'P05', label: '05', name: 'Santos',  role: 'background', color: '#b8ff2b' },
  { id: 'P06', label: '06', name: 'Harper',  role: 'background', color: '#b8ff2b' },
  { id: 'P07', label: '07', name: 'Blake',   role: 'background', color: '#b8ff2b' },
  { id: 'P08', label: '08', name: 'Moss',    role: 'background', color: '#b8ff2b' },
  // T3
  { id: 'P09', label: '09', name: 'Lenoir',  role: 'background', color: '#b8ff2b' },
  { id: 'P10', label: '10', name: 'Park',    role: 'background', color: '#b8ff2b' },
  { id: 'P11', label: '11', name: 'Vega',    role: 'background', color: '#b8ff2b' },
  { id: 'P12', label: '12', name: 'Ortiz',   role: 'background', color: '#b8ff2b' },
  // T4
  { id: 'P13', label: '13', name: 'Shah',    role: 'background', color: '#b8ff2b' },
  { id: 'P14', label: '14', name: 'Mbeki',   role: 'grinder',    color: '#60e0ff' },
  { id: 'P15', label: '15', name: 'Wolff',   role: 'background', color: '#b8ff2b' },
  { id: 'P16', label: '16', name: 'Nakai',   role: 'background', color: '#b8ff2b' },
  // T5
  { id: 'P17', label: '17', name: 'Ellis',   role: 'background', color: '#b8ff2b' },
  { id: 'P18', label: '18', name: 'Brant',   role: 'background', color: '#b8ff2b' },
  { id: 'P19', label: '19', name: 'Cho',     role: 'background', color: '#b8ff2b' },
  { id: 'P20', label: '20', name: 'Quinn',   role: 'background', color: '#b8ff2b' },
  // T6
  { id: 'P21', label: '21', name: 'Yara',    role: 'climber',    color: '#ffd93b' },
  { id: 'P22', label: '22', name: 'Iota',    role: 'background', color: '#b8ff2b' },
  { id: 'P23', label: '23', name: 'Rue',     role: 'background', color: '#b8ff2b' },
  { id: 'P24', label: '24', name: 'Oakes',   role: 'background', color: '#b8ff2b' },
];

// Hand-scripted tier-per-shift for each player.
// 29 entries per player: state before shift 0, then after each sample shift.
// Tiers: 0 = T1 (top), 5 = T6 (bottom).
//
// Storylines:
//   P21 "Yara": T6 → T5 → T4 → T3 → T2 → T1 (climbs in ~12 shifts, then holds)
//   P01 "Rivera": T1 → T2 → T3 → T2 → T3 (falls, partial recovery)
//   P14 "Mbeki": T4 → T3 → T2 (steady grinder, bounces between 2-3)
//   Others: small realistic oscillations that never collide with the above.

function tt(...tiers) { return tiers; } // shorthand

// Because only one player promotes per tier per shift, and one relegates per
// tier per shift, movements are paired. We'll build a per-shift movement table
// and derive positions from it.

// Movements: [{shift, promoteId, relegateId, fromTier}]
// Each movement swaps positions: a promotes from T(n) to T(n-1), and whoever
// was bottom of T(n-1) drops to T(n). To keep it readable we only declare the
// PROMOTING player; the script infers the counterpart (bottom of target tier).

// Generate positions table
function buildPositions() {
  // Initial layout: 4 players per tier, indexed in PLAYERS order
  let state = [
    ['P01','P02','P03','P04'], // T1
    ['P05','P06','P07','P08'], // T2
    ['P09','P10','P11','P12'], // T3
    ['P13','P14','P15','P16'], // T4
    ['P17','P18','P19','P20'], // T5
    ['P21','P22','P23','P24'], // T6
  ];
  const history = [JSON.parse(JSON.stringify(state))];

  // Script: each entry = array of {promoter, direction} to run on that shift.
  // direction: 'up' (promoted from lower tier) or 'down' (relegated from higher)
  // Most shifts: one swap between two adjacent tiers. Some shifts: multiple.
  const shifts = [
    // Cycle 1 — Yara rising, Rivera wobble starts
    { swaps: [['P21',5]] },                 // Yara: T6→T5
    { swaps: [['P17',4], ['P01','down']] }, // Ellis T5→T4; Rivera T1→T2
    { swaps: [['P21',4]] },                 // Yara: T5→T4
    { swaps: [['P14',3], ['P06','down']] }, // Mbeki T4→T3; Harper T2→T3
    { swaps: [['P21',3]] },                 // Yara: T4→T3
    { swaps: [['P09',0]] },                 // Lenoir T3→T2 (just background noise... actually skip)
    { swaps: [['P03',0]] },                 // small T1 reshuffle - use no-op

    // Cycle 2 — Yara jumps to T2, Rivera keeps sliding
    { swaps: [['P21',2]] },                 // Yara T3→T2
    { swaps: [['P01','down']] },            // Rivera T2→T3
    { swaps: [['P14',2]] },                 // Mbeki T3→T2
    { swaps: [['P21',1]] },                 // Yara T2→T1 !
    { swaps: [['P02','down']] },            // Okafor T1→T2 (pushed out by Yara earlier logic)
    { swaps: [['P10',1]] },                 // Park T3→T2
    { swaps: [['P14',1]] },                 // Mbeki T2→T1

    // Cycle 3 — Yara holds T1, Mbeki flirts with T1
    { swaps: [['P06',2]] },
    { swaps: [['P14','down']] },            // Mbeki T1→T2
    { swaps: [['P01','up']] },              // Rivera T3→T2 (partial recovery)
    { swaps: [['P14',1]] },                 // Mbeki T2→T1 again
    { swaps: [['P05',2]] },
    { swaps: [['P21','hold']] },            // filler: no movement for Yara
    { swaps: [['P12',1]] },

    // Cycle 4 — Yara caps champion, Rivera stuck, Mbeki locked in T1-T2
    { swaps: [['P14','down']] },            // Mbeki T1→T2
    { swaps: [['P03','down']] },            // Kim T1→T2
    { swaps: [['P14',1]] },                 // Mbeki T2→T1
    { swaps: [['P01','down']] },            // Rivera T2→T3
    { swaps: [['P11',1]] },
    { swaps: [['P18',4]] },
    { swaps: [['P21','hold']] },
  ];

  for (let i = 0; i < shifts.length; i++) {
    const { swaps } = shifts[i];
    for (const [pid, arg] of swaps) {
      if (arg === 'hold') continue;
      // Find the player's current tier
      let curTier = -1, curIdx = -1;
      for (let t = 0; t < 6; t++) {
        const idx = state[t].indexOf(pid);
        if (idx !== -1) { curTier = t; curIdx = idx; break; }
      }
      if (curTier === -1) continue;

      let targetTier;
      if (typeof arg === 'number') targetTier = arg;
      else if (arg === 'down') targetTier = Math.min(5, curTier + 1);
      else if (arg === 'up') targetTier = Math.max(0, curTier - 1);
      else continue;

      if (targetTier === curTier) continue;

      // Swap: pick a counterpart in targetTier (last if promoting, first if relegating)
      const promoting = targetTier < curTier;
      const counterIdx = promoting ? state[targetTier].length - 1 : 0;
      const counter = state[targetTier][counterIdx];

      // Move pid → targetTier (at top if promoting, bottom if relegating)
      state[curTier].splice(curIdx, 1);
      state[targetTier].splice(counterIdx, 1);

      if (promoting) {
        state[targetTier].unshift(pid);
        state[curTier].push(counter);
      } else {
        state[targetTier].push(pid);
        state[curTier].unshift(counter);
      }
    }
    history.push(JSON.parse(JSON.stringify(state)));
  }
  return history;
}

const POSITIONS = buildPositions();
// POSITIONS[shift] = [[T1 players], [T2 players], ...] (length 29: initial + sample shifts)

// Day/cycle labels for each shift index
function shiftLabel(i) {
  const cycle = Math.floor(i / 7) + 1;
  const day = (i % 7) + 1;
  return { cycle, day, label: `C${cycle} · D${day}` };
}

// Featured storylines — for right-side highlight cards
const FEATURED = [
  { id: 'P21', title: 'The Climber',  subtitle: 'Yara · T6 → T1',  tone: 'climb' },
  { id: 'P01', title: 'The Fall',     subtitle: 'Rivera · T1 → T3', tone: 'fall'  },
  { id: 'P14', title: 'The Grinder',  subtitle: 'Mbeki · T4 → T1',  tone: 'grind' },
];

Object.assign(window, { TIER_NAMES, PLAYERS, POSITIONS, FEATURED, shiftLabel });
