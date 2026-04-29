const Easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => --t * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - --t * t * t * t,
  easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },
  easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: t => Math.sin(t * Math.PI / 2),
  easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBack: t => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: t => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: t => {
    const c1 = 1.70158,
      c2 = c1 * 1.525;
    return t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  easeOutElastic: t => {
    const c4 = 2 * Math.PI / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
function interpolate(input, output, ease = Easing.linear) {
  return t => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? ease[i] || Easing.linear : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}
function animate({
  from = 0,
  to = 1,
  start = 0,
  end = 1,
  ease = Easing.easeInOutCubic
}) {
  return t => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}
const TimelineContext = React.createContext({
  time: 0,
  duration: 10,
  playing: false
});
const useTime = () => React.useContext(TimelineContext).time;
const useTimeline = () => React.useContext(TimelineContext);
const SpriteContext = React.createContext({
  localTime: 0,
  progress: 0,
  duration: 0
});
const useSprite = () => React.useContext(SpriteContext);
function Sprite({
  start = 0,
  end = Infinity,
  children,
  keepMounted = false
}) {
  const {
    time
  } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;
  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration) ? clamp(localTime / duration, 0, 1) : 0;
  const value = {
    localTime,
    progress,
    duration,
    visible
  };
  return React.createElement(SpriteContext.Provider, {
    value: value
  }, typeof children === 'function' ? children(value) : children);
}
function TextSprite({
  text,
  x = 0,
  y = 0,
  size = 48,
  color = '#111',
  font = 'Inter, system-ui, sans-serif',
  weight = 600,
  entryDur = 0.45,
  exitDur = 0.35,
  entryEase = Easing.easeOutBack,
  exitEase = Easing.easeInCubic,
  align = 'left',
  letterSpacing = '-0.01em'
}) {
  const {
    localTime,
    duration
  } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let ty = 0;
  if (localTime < entryDur) {
    const t = entryEase(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    ty = (1 - t) * 16;
  } else if (localTime > exitStart) {
    const t = exitEase(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    ty = -t * 8;
  }
  const translateX = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return React.createElement("div", {
    style: {
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(${translateX}, ${ty}px)`,
      opacity,
      fontFamily: font,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing,
      whiteSpace: 'pre',
      lineHeight: 1.1,
      willChange: 'transform, opacity'
    }
  }, text);
}
function ImageSprite({
  src,
  x = 0,
  y = 0,
  width = 400,
  height = 300,
  entryDur = 0.6,
  exitDur = 0.4,
  kenBurns = false,
  kenBurnsScale = 1.08,
  radius = 12,
  fit = 'cover',
  placeholder = null
}) {
  const {
    localTime,
    duration
  } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let scale = 1;
  if (localTime < entryDur) {
    const t = Easing.easeOutCubic(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    scale = 0.96 + 0.04 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInCubic(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = (kenBurns ? kenBurnsScale : 1) + 0.02 * t;
  } else if (kenBurns) {
    const holdSpan = exitStart - entryDur;
    const holdT = holdSpan > 0 ? (localTime - entryDur) / holdSpan : 0;
    scale = 1 + (kenBurnsScale - 1) * holdT;
  }
  const content = placeholder ? React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'repeating-linear-gradient(135deg, #e9e6df 0 10px, #dcd8cf 10px 20px)',
      color: '#6b6458',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      fontSize: 13,
      letterSpacing: '0.04em',
      textTransform: 'uppercase'
    }
  }, placeholder.label || 'image') : React.createElement("img", {
    src: src,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: fit,
      display: 'block'
    }
  });
  return React.createElement("div", {
    style: {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      borderRadius: radius,
      overflow: 'hidden',
      willChange: 'transform, opacity'
    }
  }, content);
}
function RectSprite({
  x = 0,
  y = 0,
  width = 100,
  height = 100,
  color = '#111',
  radius = 8,
  entryDur = 0.4,
  exitDur = 0.3,
  render
}) {
  const spriteCtx = useSprite();
  const {
    localTime,
    duration
  } = spriteCtx;
  const exitStart = Math.max(0, duration - exitDur);
  let opacity = 1;
  let scale = 1;
  if (localTime < entryDur) {
    const t = Easing.easeOutBack(clamp(localTime / entryDur, 0, 1));
    opacity = clamp(localTime / entryDur, 0, 1);
    scale = 0.4 + 0.6 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInQuad(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = 1 - 0.15 * t;
  }
  const overrides = render ? render(spriteCtx) : {};
  return React.createElement("div", {
    style: {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      background: color,
      borderRadius: radius,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      willChange: 'transform, opacity',
      ...overrides
    }
  });
}
function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = '#f6f4ef',
  fps = 60,
  loop = true,
  autoplay = true,
  persistKey = 'animstage',
  children
}) {
  const [time, setTime] = React.useState(() => {
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ':t') || '0');
      return isFinite(v) ? clamp(v, 0, duration) : 0;
    } catch {
      return 0;
    }
  });
  const [playing, setPlaying] = React.useState(autoplay);
  const [hoverTime, setHoverTime] = React.useState(null);
  const [scale, setScale] = React.useState(1);
  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);
  React.useEffect(() => {
    try {
      localStorage.setItem(persistKey + ':t', String(time));
    } catch {}
  }, [time, persistKey]);
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = 44;
      const s = Math.min(el.clientWidth / width, (el.clientHeight - barH) / height);
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width, height]);
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = ts => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime(t => {
        let next = t + dt;
        if (next >= duration) {
          if (loop) next = next % duration;else {
            next = duration;
            setPlaying(false);
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop]);
  React.useEffect(() => {
    const onKey = e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.code === 'ArrowLeft') {
        setTime(t => clamp(t - (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.code === 'ArrowRight') {
        setTime(t => clamp(t + (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.key === '0' || e.code === 'Home') {
        setTime(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration]);
  const displayTime = hoverTime != null ? hoverTime : time;
  const ctxValue = React.useMemo(() => ({
    time: displayTime,
    duration,
    playing,
    setTime,
    setPlaying
  }), [displayTime, duration, playing]);
  return React.createElement("div", {
    ref: stageRef,
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#0a0a0a',
      fontFamily: 'Inter, system-ui, sans-serif'
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      minHeight: 0
    }
  }, React.createElement("div", {
    ref: canvasRef,
    style: {
      width,
      height,
      background,
      position: 'relative',
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      flexShrink: 0,
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      overflow: 'hidden'
    }
  }, React.createElement(TimelineContext.Provider, {
    value: ctxValue
  }, children))), React.createElement(PlaybackBar, {
    time: displayTime,
    actualTime: time,
    duration: duration,
    playing: playing,
    onPlayPause: () => setPlaying(p => !p),
    onReset: () => {
      setTime(0);
    },
    onSeek: t => setTime(t),
    onHover: t => setHoverTime(t)
  }));
}
function PlaybackBar({
  time,
  duration,
  playing,
  onPlayPause,
  onReset,
  onSeek,
  onHover
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const timeFromEvent = React.useCallback(e => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    return x * duration;
  }, [duration]);
  const onTrackMove = e => {
    if (!trackRef.current) return;
    const t = timeFromEvent(e);
    if (dragging) {
      onSeek(t);
    } else {
      onHover(t);
    }
  };
  const onTrackLeave = () => {
    if (!dragging) onHover(null);
  };
  const onTrackDown = e => {
    setDragging(true);
    const t = timeFromEvent(e);
    onSeek(t);
    onHover(null);
  };
  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = e => {
      if (!trackRef.current) return;
      const t = timeFromEvent(e);
      onSeek(t);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [dragging, timeFromEvent, onSeek]);
  const pct = duration > 0 ? time / duration * 100 : 0;
  const fmt = t => {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const cs = Math.floor(total * 100 % 100);
    return `${String(m).padStart(1, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  const mono = 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace';
  return React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 16px',
      background: 'rgba(20,20,20,0.92)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      borderRadius: 8,
      color: '#f6f4ef',
      fontFamily: 'Inter, system-ui, sans-serif',
      userSelect: 'none',
      flexShrink: 0
    }
  }, React.createElement(IconButton, {
    onClick: onReset,
    title: "Return to start (0)"
  }, React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, React.createElement("path", {
    d: "M3 2v10M12 2L5 7l7 5V2z",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }))), React.createElement(IconButton, {
    onClick: onPlayPause,
    title: "Play/pause (space)"
  }, playing ? React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, React.createElement("rect", {
    x: "3",
    y: "2",
    width: "3",
    height: "10",
    fill: "currentColor"
  }), React.createElement("rect", {
    x: "8",
    y: "2",
    width: "3",
    height: "10",
    fill: "currentColor"
  })) : React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, React.createElement("path", {
    d: "M3 2l9 5-9 5V2z",
    fill: "currentColor"
  }))), React.createElement("div", {
    style: {
      fontFamily: mono,
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
      width: 64,
      textAlign: 'right',
      color: '#f6f4ef'
    }
  }, fmt(time)), React.createElement("div", {
    ref: trackRef,
    onMouseMove: onTrackMove,
    onMouseLeave: onTrackLeave,
    onMouseDown: onTrackDown,
    style: {
      flex: 1,
      height: 22,
      position: 'relative',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center'
    }
  }, React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 4,
      background: 'rgba(255,255,255,0.12)',
      borderRadius: 2
    }
  }), React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      width: `${pct}%`,
      height: 4,
      background: 'oklch(72% 0.12 250)',
      borderRadius: 2
    }
  }), React.createElement("div", {
    style: {
      position: 'absolute',
      left: `${pct}%`,
      top: '50%',
      width: 12,
      height: 12,
      marginLeft: -6,
      marginTop: -6,
      background: '#fff',
      borderRadius: 6,
      boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
    }
  })), React.createElement("div", {
    style: {
      fontFamily: mono,
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
      width: 64,
      textAlign: 'left',
      color: 'rgba(246,244,239,0.55)'
    }
  }, fmt(duration)));
}
function IconButton({
  children,
  onClick,
  title
}) {
  const [hover, setHover] = React.useState(false);
  return React.createElement("button", {
    onClick: onClick,
    title: title,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6,
      color: '#f6f4ef',
      cursor: 'pointer',
      padding: 0,
      transition: 'background 120ms'
    }
  }, children);
}
Object.assign(window, {
  Easing,
  interpolate,
  animate,
  clamp,
  TimelineContext,
  useTime,
  useTimeline,
  Sprite,
  SpriteContext,
  useSprite,
  TextSprite,
  ImageSprite,
  RectSprite,
  Stage,
  PlaybackBar
});
const TIER_NAMES = [{
  code: 'T1',
  name: 'Championship',
  players: 4
}, {
  code: 'T2',
  name: 'Contender',
  players: 4
}, {
  code: 'T3',
  name: 'Playoff',
  players: 4
}, {
  code: 'T4',
  name: 'Division',
  players: 4
}, {
  code: 'T5',
  name: 'Qualifier',
  players: 4
}, {
  code: 'T6',
  name: 'Rookie',
  players: 4
}];
const PLAYERS = [{
  id: 'P01',
  label: '01',
  name: 'Rivera',
  role: 'faller',
  color: '#ff6a1f'
}, {
  id: 'P02',
  label: '02',
  name: 'Okafor',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P03',
  label: '03',
  name: 'Kim',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P04',
  label: '04',
  name: 'Diaz',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P05',
  label: '05',
  name: 'Santos',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P06',
  label: '06',
  name: 'Harper',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P07',
  label: '07',
  name: 'Blake',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P08',
  label: '08',
  name: 'Moss',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P09',
  label: '09',
  name: 'Lenoir',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P10',
  label: '10',
  name: 'Park',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P11',
  label: '11',
  name: 'Vega',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P12',
  label: '12',
  name: 'Ortiz',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P13',
  label: '13',
  name: 'Shah',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P14',
  label: '14',
  name: 'Mbeki',
  role: 'grinder',
  color: '#60e0ff'
}, {
  id: 'P15',
  label: '15',
  name: 'Wolff',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P16',
  label: '16',
  name: 'Nakai',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P17',
  label: '17',
  name: 'Ellis',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P18',
  label: '18',
  name: 'Brant',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P19',
  label: '19',
  name: 'Cho',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P20',
  label: '20',
  name: 'Quinn',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P21',
  label: '21',
  name: 'Yara',
  role: 'climber',
  color: '#ffd93b'
}, {
  id: 'P22',
  label: '22',
  name: 'Iota',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P23',
  label: '23',
  name: 'Rue',
  role: 'background',
  color: '#b8ff2b'
}, {
  id: 'P24',
  label: '24',
  name: 'Oakes',
  role: 'background',
  color: '#b8ff2b'
}];
function tt(...tiers) {
  return tiers;
}
function buildPositions() {
  let state = [['P01', 'P02', 'P03', 'P04'], ['P05', 'P06', 'P07', 'P08'], ['P09', 'P10', 'P11', 'P12'], ['P13', 'P14', 'P15', 'P16'], ['P17', 'P18', 'P19', 'P20'], ['P21', 'P22', 'P23', 'P24']];
  const history = [JSON.parse(JSON.stringify(state))];
  const shifts = [{
    swaps: [['P21', 5]]
  }, {
    swaps: [['P17', 4], ['P01', 'down']]
  }, {
    swaps: [['P21', 4]]
  }, {
    swaps: [['P14', 3], ['P06', 'down']]
  }, {
    swaps: [['P21', 3]]
  }, {
    swaps: [['P09', 0]]
  }, {
    swaps: [['P03', 0]]
  }, {
    swaps: [['P21', 2]]
  }, {
    swaps: [['P01', 'down']]
  }, {
    swaps: [['P14', 2]]
  }, {
    swaps: [['P21', 1]]
  }, {
    swaps: [['P02', 'down']]
  }, {
    swaps: [['P10', 1]]
  }, {
    swaps: [['P14', 1]]
  }, {
    swaps: [['P06', 2]]
  }, {
    swaps: [['P14', 'down']]
  }, {
    swaps: [['P01', 'up']]
  }, {
    swaps: [['P14', 1]]
  }, {
    swaps: [['P05', 2]]
  }, {
    swaps: [['P21', 'hold']]
  }, {
    swaps: [['P12', 1]]
  }, {
    swaps: [['P14', 'down']]
  }, {
    swaps: [['P03', 'down']]
  }, {
    swaps: [['P14', 1]]
  }, {
    swaps: [['P01', 'down']]
  }, {
    swaps: [['P11', 1]]
  }, {
    swaps: [['P18', 4]]
  }, {
    swaps: [['P21', 'hold']]
  }];
  for (let i = 0; i < shifts.length; i++) {
    const {
      swaps
    } = shifts[i];
    for (const [pid, arg] of swaps) {
      if (arg === 'hold') continue;
      let curTier = -1,
        curIdx = -1;
      for (let t = 0; t < 6; t++) {
        const idx = state[t].indexOf(pid);
        if (idx !== -1) {
          curTier = t;
          curIdx = idx;
          break;
        }
      }
      if (curTier === -1) continue;
      let targetTier;
      if (typeof arg === 'number') targetTier = arg;else if (arg === 'down') targetTier = Math.min(5, curTier + 1);else if (arg === 'up') targetTier = Math.max(0, curTier - 1);else continue;
      if (targetTier === curTier) continue;
      const promoting = targetTier < curTier;
      const counterIdx = promoting ? state[targetTier].length - 1 : 0;
      const counter = state[targetTier][counterIdx];
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
function shiftLabel(i) {
  const week = Math.floor(i / 7) + 1;
  const day = i % 7 + 1;
  return {
    week,
    day,
    label: `W${week} · D${day}`
  };
}
const FEATURED = [{
  id: 'P21',
  title: 'The Climber',
  subtitle: 'Yara · T6 → T1',
  tone: 'climb'
}, {
  id: 'P01',
  title: 'The Fall',
  subtitle: 'Rivera · T1 → T3',
  tone: 'fall'
}, {
  id: 'P14',
  title: 'The Grinder',
  subtitle: 'Mbeki · T4 → T1',
  tone: 'grind'
}];
Object.assign(window, {
  TIER_NAMES,
  PLAYERS,
  POSITIONS,
  FEATURED,
  shiftLabel
});
const ACCENT = '#b8ff2b';
const ORANGE = '#ff6a1f';
const GOLD = '#ffd93b';
const BLUE = '#60e0ff';
const BG = '#0a0b0a';
const BG2 = '#111312';
const BG3 = '#16181a';
const INK = '#f3f3ee';
const INK2 = '#d0cec4';
const MUTED = '#6a6a5e';
const RULE = '#2a2c27';
const RULE2 = '#3a3d35';
const TIER_W = [380, 460, 540, 620, 700, 780];
const TIER_H = 86;
const TIER_GAP = 10;
const TIER_TOP_Y = 200;
function slotPos(tierIdx, slotIdx) {
  const w = TIER_W[tierIdx];
  const cx = 780;
  const tierLeft = cx - w / 2;
  const slotCount = 4;
  const labelReserve = 260;
  const dotArea = w - labelReserve;
  const dotStep = dotArea / slotCount;
  const x = tierLeft + labelReserve + slotIdx * dotStep + dotStep / 2;
  const y = TIER_TOP_Y + tierIdx * (TIER_H + TIER_GAP) + TIER_H / 2;
  return {
    x,
    y
  };
}
function tierLabelPos(tierIdx) {
  const w = TIER_W[tierIdx];
  const cx = 780;
  const tierLeft = cx - w / 2;
  const y = TIER_TOP_Y + tierIdx * (TIER_H + TIER_GAP);
  return {
    x: tierLeft,
    y,
    w
  };
}
const SHIFT_DUR = 1.1;
const INTRO = 1.2;
const OUTRO = 2.0;
const TOTAL = INTRO + POSITIONS.length * SHIFT_DUR + OUTRO;
function timeToShift(t) {
  if (t < INTRO) return 0;
  const local = t - INTRO;
  return Math.min(POSITIONS.length - 1, local / SHIFT_DUR);
}
function findPos(shiftIdx, playerId) {
  const snap = POSITIONS[shiftIdx];
  for (let t = 0; t < 6; t++) {
    const s = snap[t].indexOf(playerId);
    if (s !== -1) return {
      tier: t,
      slot: s
    };
  }
  return {
    tier: 5,
    slot: 0
  };
}
function TierCard({
  tierIdx
}) {
  const {
    x,
    y,
    w
  } = tierLabelPos(tierIdx);
  const tier = TIER_NAMES[tierIdx];
  return React.createElement("div", {
    style: {
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: TIER_H,
      background: BG2,
      border: `1px solid ${RULE2}`,
      borderLeft: tierIdx === 0 ? `3px solid ${ACCENT}` : tierIdx === 5 ? `3px solid ${ORANGE}` : `1px solid ${RULE2}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 18,
      boxSizing: 'border-box'
    }
  }, React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 13,
      letterSpacing: '0.12em',
      color: MUTED,
      textTransform: 'uppercase',
      width: 40
    }
  }, tier.code), React.createElement("div", {
    style: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: 22,
      fontWeight: 600,
      color: INK,
      letterSpacing: '-0.01em',
      width: 120
    }
  }, tier.name), React.createElement("div", {
    style: {
      position: 'absolute',
      right: 20,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      gap: 0,
      width: w - 260 - 20,
      justifyContent: 'space-around'
    }
  }, [0, 1, 2, 3].map(i => React.createElement("div", {
    key: i,
    style: {
      width: 44,
      height: 44,
      borderRadius: 22,
      border: `1px dashed ${RULE}`,
      boxSizing: 'border-box'
    }
  }))));
}
function PlayerDot({
  player,
  shiftFloat,
  allAnnotations
}) {
  const floor = Math.floor(shiftFloat);
  const ceil = Math.min(POSITIONS.length - 1, floor + 1);
  const frac = shiftFloat - floor;
  const eased = Easing.easeInOutCubic(frac);
  const from = findPos(floor, player.id);
  const to = findPos(ceil, player.id);
  const fromPt = slotPos(from.tier, from.slot);
  const toPt = slotPos(to.tier, to.slot);
  const tierDelta = to.tier - from.tier;
  const arcAmount = tierDelta !== 0 ? 40 * Math.abs(tierDelta) : 0;
  const arcX = tierDelta !== 0 ? tierDelta > 0 ? 30 : -30 : 0;
  const bulgeCurve = Math.sin(eased * Math.PI);
  const x = fromPt.x + (toPt.x - fromPt.x) * eased + arcX * bulgeCurve;
  const y = fromPt.y + (toPt.y - fromPt.y) * eased - arcAmount * bulgeCurve * 0.2;
  const isMoving = tierDelta !== 0 && frac > 0 && frac < 1;
  const isFeatured = player.role !== 'background';
  const size = isFeatured ? 36 : 30;
  const bg = player.color;
  const textColor = player.role === 'faller' ? '#fff' : '#0a0b0a';
  const showTrail = isMoving && isFeatured;
  return React.createElement(React.Fragment, null, showTrail && React.createElement("div", {
    style: {
      position: 'absolute',
      left: fromPt.x + (toPt.x - fromPt.x) * eased * 0.5,
      top: fromPt.y + (toPt.y - fromPt.y) * eased * 0.5,
      width: Math.max(40, Math.abs(toPt.y - fromPt.y) * 0.5),
      height: 2,
      background: `linear-gradient(90deg, transparent, ${bg}88, transparent)`,
      transform: `translate(-50%, -50%) rotate(${Math.atan2(toPt.y - fromPt.y, toPt.x - fromPt.x) * 180 / Math.PI}deg)`,
      pointerEvents: 'none'
    }
  }), React.createElement("div", {
    style: {
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      marginLeft: -size / 2,
      marginTop: -size / 2,
      borderRadius: size / 2,
      background: bg,
      color: textColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: isFeatured ? 13 : 11,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      boxShadow: isMoving ? `0 0 0 3px ${bg}33, 0 0 18px ${bg}66` : isFeatured ? `0 0 0 2px ${bg}33` : 'none',
      transition: 'box-shadow 200ms',
      zIndex: isFeatured ? 10 : 5
    }
  }, player.label));
}
function HighlightCard({
  feature,
  shiftIdx,
  top
}) {
  const player = PLAYERS.find(p => p.id === feature.id);
  const pos = findPos(Math.floor(shiftIdx), feature.id);
  const tier = TIER_NAMES[pos.tier];
  const toneColor = feature.tone === 'climb' ? GOLD : feature.tone === 'fall' ? ORANGE : BLUE;
  return React.createElement("div", {
    style: {
      position: 'absolute',
      left: 1220,
      top,
      width: 340,
      padding: '18px 20px',
      background: BG2,
      border: `1px solid ${RULE2}`,
      borderLeft: `3px solid ${toneColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12,
      letterSpacing: '0.14em',
      color: toneColor,
      textTransform: 'uppercase'
    }
  }, feature.title), React.createElement("div", {
    style: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: 22,
      fontWeight: 600,
      color: INK,
      letterSpacing: '-0.01em'
    }
  }, player.name, " ", React.createElement("span", {
    style: {
      color: MUTED,
      fontWeight: 400,
      fontSize: 16
    }
  }, "#", player.label)), React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 4
    }
  }, React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
      color: MUTED,
      letterSpacing: '0.1em'
    }
  }, "CURRENT"), React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 16,
      color: toneColor,
      fontWeight: 600
    }
  }, tier.code, " \xB7 ", tier.name)));
}
function WeekLabel({
  shiftIdx
}) {
  const {
    week,
    day
  } = shiftLabel(Math.min(27, Math.floor(shiftIdx)));
  return React.createElement("div", {
    style: {
      position: 'absolute',
      left: 60,
      top: 80,
      display: 'flex',
      alignItems: 'baseline',
      gap: 20
    }
  }, React.createElement("div", {
    style: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: 84,
      fontWeight: 500,
      color: INK,
      letterSpacing: '-0.03em',
      lineHeight: 1
    }
  }, "Week ", week), React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 20,
      color: MUTED,
      letterSpacing: '0.1em'
    }
  }, "\xB7 DAY ", day, " \xB7 SHIFT ", Math.min(28, Math.floor(shiftIdx) + 1), " / 28"));
}
function ShiftProgress({
  shiftIdx
}) {
  const total = 28;
  const progress = Math.min(total, shiftIdx);
  return React.createElement("div", {
    style: {
      position: 'absolute',
      left: 60,
      right: 60,
      bottom: 70,
      display: 'flex',
      gap: 3,
      height: 6
    }
  }, Array.from({
    length: total
  }).map((_, i) => {
    const weekEnd = (i + 1) % 7 === 0;
    const filled = i < progress;
    const partial = i === Math.floor(progress) && shiftIdx > Math.floor(shiftIdx);
    return React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        background: filled ? ACCENT : RULE,
        marginRight: weekEnd ? 16 : 0,
        position: 'relative'
      }
    }, partial && React.createElement("div", {
      style: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${(shiftIdx - Math.floor(shiftIdx)) * 100}%`,
        background: ACCENT
      }
    }));
  }));
}
function Ticker({
  shiftFloat
}) {
  const events = [];
  const intShift = Math.floor(shiftFloat);
  if (intShift > 0 && shiftFloat - intShift < 0.6) {
    const prev = POSITIONS[intShift - 1];
    const cur = POSITIONS[intShift];
    for (let t = 0; t < 6; t++) {
      for (const pid of cur[t]) {
        let prevTier = -1;
        for (let pt = 0; pt < 6; pt++) if (prev[pt].includes(pid)) {
          prevTier = pt;
          break;
        }
        if (prevTier !== -1 && prevTier !== t) {
          const player = PLAYERS.find(p => p.id === pid);
          const promoted = t < prevTier;
          events.push({
            player,
            from: prevTier,
            to: t,
            promoted
          });
        }
      }
    }
  }
  const fade = intShift > 0 ? Math.max(0, 1 - (shiftFloat - intShift) / 0.6) : 0;
  return React.createElement("div", {
    style: {
      position: 'absolute',
      left: 1220,
      top: 620,
      width: 340,
      minHeight: 120,
      padding: '16px 20px',
      background: BG2,
      border: `1px solid ${RULE2}`,
      opacity: events.length > 0 ? fade : 0.35,
      transition: 'opacity 200ms'
    }
  }, React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12,
      letterSpacing: '0.14em',
      color: MUTED,
      textTransform: 'uppercase',
      marginBottom: 10
    }
  }, "Shift Results"), events.length === 0 ? React.createElement("div", {
    style: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
      color: MUTED
    }
  }, "Matches in progress\u2026") : React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, events.slice(0, 3).map((e, i) => React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 13,
      color: INK2
    }
  }, React.createElement("span", {
    style: {
      color: e.promoted ? ACCENT : ORANGE,
      fontWeight: 700,
      width: 20
    }
  }, e.promoted ? '▲' : '▼'), React.createElement("span", {
    style: {
      color: e.player.color,
      fontWeight: 700
    }
  }, "#", e.player.label), React.createElement("span", {
    style: {
      color: INK
    }
  }, e.player.name), React.createElement("span", {
    style: {
      color: MUTED,
      marginLeft: 'auto',
      fontSize: 11
    }
  }, "T", e.from + 1, " \u2192 T", e.to + 1)))));
}
function PyramidScene() {
  const t = useTime();
  const introFade = t < INTRO ? Easing.easeOutCubic(clamp(t / INTRO, 0, 1)) : 1;
  const shiftFloat = timeToShift(t);
  const shiftIdx = Math.min(28, Math.floor(shiftFloat));
  return React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: BG,
      color: INK,
      fontFamily: 'Inter, sans-serif',
      backgroundImage: `linear-gradient(${RULE}22 1px, transparent 1px), linear-gradient(90deg, ${RULE}22 1px, transparent 1px)`,
      backgroundSize: '60px 60px',
      opacity: introFade
    }
  }, React.createElement("div", {
    style: {
      position: 'absolute',
      top: 24,
      left: 60,
      right: 60,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      letterSpacing: '0.14em',
      color: INK,
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      background: ACCENT
    }
  }), "SIS \xB7 LIVE LADDER SIMULATION"), React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      letterSpacing: '0.14em',
      color: MUTED
    }
  }, "NBA \xB7 6 STUDIOS \xB7 24 GAMERS \xB7 4 WEEKS \xB7 PILOT VIEW")), React.createElement(WeekLabel, {
    shiftIdx: shiftFloat
  }), React.createElement("div", {
    style: {
      position: 'absolute',
      left: 60,
      top: 188,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 13,
      color: MUTED,
      letterSpacing: '0.1em'
    }
  }, "EACH DOT = ONE GAMER \xB7 TOP-OF-TIER PROMOTES \xB7 BOTTOM RELEGATES"), TIER_NAMES.map((_, i) => React.createElement(TierCard, {
    key: i,
    tierIdx: i
  })), PLAYERS.map(p => React.createElement(PlayerDot, {
    key: p.id,
    player: p,
    shiftFloat: shiftFloat
  })), React.createElement("div", {
    style: {
      position: 'absolute',
      left: 60,
      top: 250,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12,
      color: MUTED,
      letterSpacing: '0.1em'
    }
  }, React.createElement("div", null, React.createElement("span", {
    style: {
      color: ACCENT,
      fontWeight: 700
    }
  }, "\u25B2"), " PROMOTE"), React.createElement("div", null, React.createElement("span", {
    style: {
      color: ORANGE,
      fontWeight: 700
    }
  }, "\u25BC"), " RELEGATE")), React.createElement("div", {
    style: {
      position: 'absolute',
      left: 1220,
      top: 135,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12,
      letterSpacing: '0.14em',
      color: MUTED,
      textTransform: 'uppercase'
    }
  }, "Featured Storylines"), React.createElement(HighlightCard, {
    feature: FEATURED[0],
    shiftIdx: shiftFloat,
    top: 170
  }), React.createElement(HighlightCard, {
    feature: FEATURED[1],
    shiftIdx: shiftFloat,
    top: 318
  }), React.createElement(HighlightCard, {
    feature: FEATURED[2],
    shiftIdx: shiftFloat,
    top: 466
  }), React.createElement(Ticker, {
    shiftFloat: shiftFloat
  }), React.createElement(ShiftProgress, {
    shiftIdx: shiftFloat
  }), React.createElement("div", {
    style: {
      position: 'absolute',
      left: 60,
      right: 60,
      bottom: 40,
      display: 'flex',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12,
      color: MUTED,
      letterSpacing: '0.12em'
    }
  }, [1, 2, 3, 4].map(w => React.createElement("div", {
    key: w,
    style: {
      flex: 1,
      marginRight: w < 4 ? 16 : 0,
      textAlign: 'left',
      color: Math.floor(shiftFloat / 7) + 1 >= w ? ACCENT : MUTED,
      transition: 'color 300ms'
    }
  }, "WEEK ", w))), t < INTRO && React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: BG,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 24,
      opacity: 1 - Easing.easeOutCubic(t / INTRO),
      pointerEvents: 'none'
    }
  }, React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 16,
      letterSpacing: '0.2em',
      color: ACCENT
    }
  }, React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 10,
      height: 10,
      background: ACCENT,
      marginRight: 10
    }
  }), "SIS LADDER \xB7 4-WEEK SIMULATION"), React.createElement("div", {
    style: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: 56,
      fontWeight: 500,
      color: INK,
      letterSpacing: '-0.02em'
    }
  }, "24 gamers. 6 tiers. 28 shifts."), React.createElement("div", {
    style: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 18,
      color: MUTED,
      marginTop: 12,
      maxWidth: 900,
      textAlign: 'center',
      lineHeight: 1.45
    }
  }, "Pilot cohort. At scale (1,200 gamers) the same pyramid shape holds with hundreds per tier \u2014 see Shift Economics Analysis for the scaled view.")), t > TOTAL - OUTRO && React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: `${BG}ee`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 18,
      opacity: Easing.easeInCubic(Math.min(1, (t - (TOTAL - OUTRO)) / (OUTRO * 0.6)))
    }
  }, React.createElement("div", {
    style: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      letterSpacing: '0.2em',
      color: ACCENT
    }
  }, "END OF CYCLE \xB7 MONTHLY RESEED"), React.createElement("div", {
    style: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: 56,
      fontWeight: 500,
      color: INK,
      letterSpacing: '-0.02em',
      textAlign: 'center',
      maxWidth: 1200,
      lineHeight: 1.1
    }
  }, "Every match mattered.", React.createElement("br", null), React.createElement("span", {
    style: {
      color: ACCENT
    }
  }, "Every climber"), " had a story."), React.createElement("div", {
    style: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 20,
      color: MUTED,
      marginTop: 12
    }
  }, "4 weeks \xB7 672 matches \xB7 0 cancellations because there was something to play for.")));
}
Object.assign(window, {
  PyramidScene,
  TOTAL
});
function App() {
  return React.createElement(Stage, {
    width: 1600,
    height: 900,
    duration: TOTAL,
    background: "#0a0b0a",
    persistKey: "sis-ladder-anim"
  }, React.createElement(PyramidScene, null));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App, null));
