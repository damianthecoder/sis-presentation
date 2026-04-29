// Pyramid animation scene — shows 24 players moving between 6 tiers across a sample cycle.

const ACCENT = '#b8ff2b';
const ORANGE = '#ff6a1f';
const GOLD   = '#ffd93b';
const BLUE   = '#60e0ff';
const BG     = '#0a0b0a';
const BG2    = '#111312';
const BG3    = '#16181a';
const INK    = '#f3f3ee';
const INK2   = '#d0cec4';
const MUTED  = '#6a6a5e';
const RULE   = '#2a2c27';
const RULE2  = '#3a3d35';

// Tier widths (pyramid staircase) — T1 narrowest at top, T6 widest at bottom
const TIER_W = [380, 460, 540, 620, 700, 780];
const TIER_H = 86;
const TIER_GAP = 10;
const TIER_TOP_Y = 200;

// Where a dot should sit, given tier index + slot index (0..3) + tier width
function slotPos(tierIdx, slotIdx) {
  const w = TIER_W[tierIdx];
  const cx = 780; // center of pyramid column (in 1600 canvas, shifted left)
  const tierLeft = cx - w / 2;
  const slotCount = 4;
  // dots arranged horizontally inside tier card, right side (leaving room for label)
  const labelReserve = 260;
  const dotArea = w - labelReserve;
  const dotStep = dotArea / slotCount;
  const x = tierLeft + labelReserve + slotIdx * dotStep + dotStep / 2;
  const y = TIER_TOP_Y + tierIdx * (TIER_H + TIER_GAP) + TIER_H / 2;
  return { x, y };
}

function tierLabelPos(tierIdx) {
  const w = TIER_W[tierIdx];
  const cx = 780;
  const tierLeft = cx - w / 2;
  const y = TIER_TOP_Y + tierIdx * (TIER_H + TIER_GAP);
  return { x: tierLeft, y, w };
}

// Total animation time: sample shifts × 1.1s each + intro(1.2s) + outro(2s) = ~34s
const SHIFT_DUR = 1.1;
const INTRO = 1.2;
const OUTRO = 2.0;
const TOTAL = INTRO + POSITIONS.length * SHIFT_DUR + OUTRO; // POSITIONS length is 29

// Given the time t, return current shift index (float) in [0, POSITIONS.length-1]
function timeToShift(t) {
  if (t < INTRO) return 0;
  const local = t - INTRO;
  return Math.min(POSITIONS.length - 1, local / SHIFT_DUR);
}

// Returns {tier, slot} for player at a given integer shift index
function findPos(shiftIdx, playerId) {
  const snap = POSITIONS[shiftIdx];
  for (let t = 0; t < 6; t++) {
    const s = snap[t].indexOf(playerId);
    if (s !== -1) return { tier: t, slot: s };
  }
  return { tier: 5, slot: 0 };
}

// ── Pyramid tier card ──────────────────────────────────────────────────────
function TierCard({ tierIdx }) {
  const { x, y, w } = tierLabelPos(tierIdx);
  const tier = TIER_NAMES[tierIdx];

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y, width: w, height: TIER_H,
      background: BG2,
      border: `1px solid ${RULE2}`,
      borderLeft: tierIdx === 0 ? `3px solid ${ACCENT}` : tierIdx === 5 ? `3px solid ${ORANGE}` : `1px solid ${RULE2}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 18,
      boxSizing: 'border-box',
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13,
        letterSpacing: '0.12em',
        color: MUTED,
        textTransform: 'uppercase',
        width: 40,
      }}>
        {tier.code}
      </div>
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 22,
        fontWeight: 600,
        color: INK,
        letterSpacing: '-0.01em',
        width: 120,
      }}>
        {tier.name}
      </div>
      {/* 4 empty slot markers behind dots */}
      <div style={{
        position: 'absolute',
        right: 20, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', gap: 0,
        width: w - 260 - 20,
        justifyContent: 'space-around',
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 44, height: 44,
            borderRadius: 22,
            border: `1px dashed ${RULE}`,
            boxSizing: 'border-box',
          }}/>
        ))}
      </div>
    </div>
  );
}

// ── Player dot ─────────────────────────────────────────────────────────────
function PlayerDot({ player, shiftFloat, allAnnotations }) {
  // Interpolate between snap [floor] and snap [ceil]
  const floor = Math.floor(shiftFloat);
  const ceil = Math.min(POSITIONS.length - 1, floor + 1);
  const frac = shiftFloat - floor;
  const eased = Easing.easeInOutCubic(frac);

  const from = findPos(floor, player.id);
  const to = findPos(ceil, player.id);

  const fromPt = slotPos(from.tier, from.slot);
  const toPt = slotPos(to.tier, to.slot);

  // Add a little arc when moving between tiers (bulge out in direction of motion)
  const tierDelta = to.tier - from.tier;
  const arcAmount = tierDelta !== 0 ? 40 * Math.abs(tierDelta) : 0;
  const arcX = tierDelta !== 0 ? (tierDelta > 0 ? 30 : -30) : 0;

  const bulgeCurve = Math.sin(eased * Math.PI); // 0→1→0
  const x = fromPt.x + (toPt.x - fromPt.x) * eased + arcX * bulgeCurve;
  const y = fromPt.y + (toPt.y - fromPt.y) * eased - arcAmount * bulgeCurve * 0.2;

  const isMoving = tierDelta !== 0 && frac > 0 && frac < 1;
  const isFeatured = player.role !== 'background';
  const size = isFeatured ? 36 : 30;
  const bg = player.color;
  const textColor = player.role === 'faller' ? '#fff' : '#0a0b0a';

  // Trail effect when moving — a faint streak
  const showTrail = isMoving && isFeatured;

  return (
    <>
      {showTrail && (
        <div style={{
          position: 'absolute',
          left: fromPt.x + (toPt.x - fromPt.x) * eased * 0.5,
          top: fromPt.y + (toPt.y - fromPt.y) * eased * 0.5,
          width: Math.max(40, Math.abs(toPt.y - fromPt.y) * 0.5),
          height: 2,
          background: `linear-gradient(90deg, transparent, ${bg}88, transparent)`,
          transform: `translate(-50%, -50%) rotate(${Math.atan2(toPt.y - fromPt.y, toPt.x - fromPt.x) * 180 / Math.PI}deg)`,
          pointerEvents: 'none',
        }}/>
      )}
      <div style={{
        position: 'absolute',
        left: x, top: y,
        width: size, height: size,
        marginLeft: -size/2, marginTop: -size/2,
        borderRadius: size / 2,
        background: bg,
        color: textColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: isFeatured ? 13 : 11,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        boxShadow: isMoving
          ? `0 0 0 3px ${bg}33, 0 0 18px ${bg}66`
          : isFeatured ? `0 0 0 2px ${bg}33` : 'none',
        transition: 'box-shadow 200ms',
        zIndex: isFeatured ? 10 : 5,
      }}>
        {player.label}
      </div>
    </>
  );
}

// ── Right-side highlight card for featured storylines ──────────────────────
function HighlightCard({ feature, shiftIdx, top }) {
  const player = PLAYERS.find(p => p.id === feature.id);
  const pos = findPos(Math.floor(shiftIdx), feature.id);
  const tier = TIER_NAMES[pos.tier];

  const toneColor = feature.tone === 'climb' ? GOLD
                  : feature.tone === 'fall'  ? ORANGE
                  : BLUE;

  return (
    <div style={{
      position: 'absolute',
      left: 1220, top,
      width: 340,
      padding: '18px 20px',
      background: BG2,
      border: `1px solid ${RULE2}`,
      borderLeft: `3px solid ${toneColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        letterSpacing: '0.14em',
        color: toneColor,
        textTransform: 'uppercase',
      }}>
        {feature.title}
      </div>
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 22,
        fontWeight: 600,
        color: INK,
        letterSpacing: '-0.01em',
      }}>
        {player.name} <span style={{ color: MUTED, fontWeight: 400, fontSize: 16 }}>#{player.label}</span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: MUTED,
          letterSpacing: '0.1em',
        }}>
          CURRENT
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 16,
          color: toneColor,
          fontWeight: 600,
        }}>
          {tier.code} · {tier.name}
        </div>
      </div>
    </div>
  );
}

// ── Cycle marker on timeline ───────────────────────────────────────────────
function WeekLabel({ shiftIdx }) {
  const { cycle, day } = shiftLabel(Math.min(27, Math.floor(shiftIdx)));
  return (
    <div style={{
      position: 'absolute',
      left: 60, top: 80,
      display: 'flex',
      alignItems: 'baseline',
      gap: 20,
    }}>
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 84,
        fontWeight: 500,
        color: INK,
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        Cycle {cycle}
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 20,
        color: MUTED,
        letterSpacing: '0.1em',
      }}>
        · DAY {day} · SHIFT {Math.min(28, Math.floor(shiftIdx) + 1)} / 28
      </div>
    </div>
  );
}

// ── Progress bar along bottom: 28 segments, active ones filled ────────────
function ShiftProgress({ shiftIdx }) {
  const total = 28;
  const progress = Math.min(total, shiftIdx);
  return (
    <div style={{
      position: 'absolute',
      left: 60, right: 60, bottom: 70,
      display: 'flex', gap: 3,
      height: 6,
    }}>
      {Array.from({length: total}).map((_, i) => {
        const weekEnd = (i + 1) % 7 === 0;
        const filled = i < progress;
        const partial = i === Math.floor(progress) && shiftIdx > Math.floor(shiftIdx);
        return (
          <div key={i} style={{
            flex: 1,
            background: filled ? ACCENT : RULE,
            marginRight: weekEnd ? 16 : 0,
            position: 'relative',
          }}>
            {partial && (
              <div style={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: `${(shiftIdx - Math.floor(shiftIdx)) * 100}%`,
                background: ACCENT,
              }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Ticker: shows recent promote/relegate events ──────────────────────────
function Ticker({ shiftFloat }) {
  // Find events at floor shift (transition from floor-1 → floor)
  const events = [];
  const intShift = Math.floor(shiftFloat);
  if (intShift > 0 && shiftFloat - intShift < 0.6) {
    const prev = POSITIONS[intShift - 1];
    const cur = POSITIONS[intShift];
    for (let t = 0; t < 6; t++) {
      for (const pid of cur[t]) {
        let prevTier = -1;
        for (let pt = 0; pt < 6; pt++) if (prev[pt].includes(pid)) { prevTier = pt; break; }
        if (prevTier !== -1 && prevTier !== t) {
          const player = PLAYERS.find(p => p.id === pid);
          const promoted = t < prevTier;
          events.push({ player, from: prevTier, to: t, promoted });
        }
      }
    }
  }

  const fade = intShift > 0 ? Math.max(0, 1 - (shiftFloat - intShift) / 0.6) : 0;

  return (
    <div style={{
      position: 'absolute',
      left: 1220, top: 620,
      width: 340,
      minHeight: 120,
      padding: '16px 20px',
      background: BG2,
      border: `1px solid ${RULE2}`,
      opacity: events.length > 0 ? fade : 0.35,
      transition: 'opacity 200ms',
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        letterSpacing: '0.14em',
        color: MUTED,
        textTransform: 'uppercase',
        marginBottom: 10,
      }}>
        Shift Results
      </div>
      {events.length === 0 ? (
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          color: MUTED,
        }}>
          Matches in progress…
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.slice(0, 3).map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              color: INK2,
            }}>
              <span style={{
                color: e.promoted ? ACCENT : ORANGE,
                fontWeight: 700,
                width: 20,
              }}>
                {e.promoted ? '▲' : '▼'}
              </span>
              <span style={{ color: e.player.color, fontWeight: 700 }}>#{e.player.label}</span>
              <span style={{ color: INK }}>{e.player.name}</span>
              <span style={{ color: MUTED, marginLeft: 'auto', fontSize: 11 }}>
                T{e.from+1} → T{e.to+1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── The scene ──────────────────────────────────────────────────────────────
function PyramidScene() {
  const t = useTime();

  // Fade in during intro
  const introFade = t < INTRO ? Easing.easeOutCubic(clamp(t / INTRO, 0, 1)) : 1;
  const shiftFloat = timeToShift(t);
  const shiftIdx = Math.min(28, Math.floor(shiftFloat));

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: BG,
      color: INK,
      fontFamily: 'Inter, sans-serif',
      backgroundImage: `linear-gradient(${RULE}22 1px, transparent 1px), linear-gradient(90deg, ${RULE}22 1px, transparent 1px)`,
      backgroundSize: '60px 60px',
      opacity: introFade,
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 24, left: 60, right: 60,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14, letterSpacing: '0.14em',
          color: INK,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 8, height: 8, background: ACCENT }}/>
          SIS · LIVE LADDER SIMULATION
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14, letterSpacing: '0.14em',
          color: MUTED,
        }}>
          NBA · 6 STUDIOS · 24 GAMERS · SIX-WEEK TRIAL VIEW
        </div>
      </div>

      {/* Cycle label — bottom-left big */}
      <WeekLabel shiftIdx={shiftFloat} />

      {/* Legend under week label */}
      <div style={{
        position: 'absolute',
        left: 60, top: 188,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13,
        color: MUTED,
        letterSpacing: '0.1em',
      }}>
        EACH DOT = ONE GAMER · TOP-OF-TIER PROMOTES · BOTTOM RELEGATES
      </div>

      {/* Tier cards */}
      {TIER_NAMES.map((_, i) => <TierCard key={i} tierIdx={i} />)}

      {/* Player dots */}
      {PLAYERS.map(p => (
        <PlayerDot key={p.id} player={p} shiftFloat={shiftFloat} />
      ))}

      {/* Arrows for legend (top-left of pyramid column) */}
      <div style={{
        position: 'absolute',
        left: 60, top: 250,
        display: 'flex', flexDirection: 'column', gap: 8,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        color: MUTED,
        letterSpacing: '0.1em',
      }}>
        <div><span style={{ color: ACCENT, fontWeight: 700 }}>▲</span> PROMOTE</div>
        <div><span style={{ color: ORANGE, fontWeight: 700 }}>▼</span> RELEGATE</div>
      </div>

      {/* Highlight cards — right column */}
      <div style={{
        position: 'absolute', left: 1220, top: 135,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        letterSpacing: '0.14em',
        color: MUTED,
        textTransform: 'uppercase',
      }}>
        Featured Storylines
      </div>
      <HighlightCard feature={FEATURED[0]} shiftIdx={shiftFloat} top={170} />
      <HighlightCard feature={FEATURED[1]} shiftIdx={shiftFloat} top={318} />
      <HighlightCard feature={FEATURED[2]} shiftIdx={shiftFloat} top={466} />

      {/* Recent event ticker */}
      <Ticker shiftFloat={shiftFloat} />

      {/* Shift progress bar */}
      <ShiftProgress shiftIdx={shiftFloat} />

      {/* Cycle markers below progress */}
      <div style={{
        position: 'absolute',
        left: 60, right: 60, bottom: 40,
        display: 'flex',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        color: MUTED,
        letterSpacing: '0.12em',
      }}>
        {[1,2,3,4].map(w => (
          <div key={w} style={{
            flex: 1,
            marginRight: w < 4 ? 16 : 0,
            textAlign: 'left',
            color: Math.floor(shiftFloat / 7) + 1 >= w ? ACCENT : MUTED,
            transition: 'color 300ms',
          }}>
            CYCLE {w}
          </div>
        ))}
      </div>

      {/* Intro overlay — fade out */}
      {t < INTRO && (
        <div style={{
          position: 'absolute', inset: 0,
          background: BG,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
          gap: 24,
          opacity: 1 - Easing.easeOutCubic(t / INTRO),
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 16, letterSpacing: '0.2em',
            color: ACCENT,
          }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: ACCENT, marginRight: 10 }}/>
            SIS LADDER · RELIABILITY SIMULATION
          </div>
          <div style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 56, fontWeight: 500,
            color: INK, letterSpacing: '-0.02em',
          }}>
            24 gamers. 6 tiers. Sample shift cycle.
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 18, color: MUTED,
            marginTop: 12,
            maxWidth: 900,
            textAlign: 'center',
            lineHeight: 1.45,
          }}>
            Trial cohort. At scale (1,200 gamers) the same pyramid shape holds with hundreds per tier — see Shift Economics Analysis for the scaled view.
          </div>
        </div>
      )}

      {/* Outro summary */}
      {t > TOTAL - OUTRO && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `${BG}ee`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
          gap: 18,
          opacity: Easing.easeInCubic(Math.min(1, (t - (TOTAL - OUTRO)) / (OUTRO * 0.6))),
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 14, letterSpacing: '0.2em',
            color: ACCENT,
          }}>
            END OF CYCLE · MONTHLY RESEED
          </div>
          <div style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 56, fontWeight: 500,
            color: INK, letterSpacing: '-0.02em',
            textAlign: 'center',
            maxWidth: 1200,
            lineHeight: 1.1,
          }}>
            Every match mattered.<br/>
            <span style={{ color: ACCENT }}>Every climber</span> had a story.
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 20, color: MUTED,
            marginTop: 12,
          }}>
            Reliability ladder · 672 sample matches · 0 cancellations because there was something to play for.
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PyramidScene, TOTAL });
