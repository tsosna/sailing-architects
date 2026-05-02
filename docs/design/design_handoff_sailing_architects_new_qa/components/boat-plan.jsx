
// BoatPlan — Jeanneau Sun Odyssey 519 architectural floor plan
// Cabin layout per actual SO519 plan:
//   A  — forward island double (dziobowa, łóżko małżeńskie)
//   B  — aft port double (rufowa lewa)
//   C  — aft starboard double (rufowa prawa)
//   D  — mid port, dwa posłania obok siebie (środkowa lewa)
//   E  — mid starboard, ŁÓŻKO PIĘTROWE (środkowa prawa)

const CABINS = [
  { id: 'A', label: 'Kabina A', position: 'Dziobowa · łóżko wyspowe', berths: ['A1','A2'] },
  { id: 'B', label: 'Kabina B', position: 'Rufowa lewa · podwójne', berths: ['B1','B2'] },
  { id: 'C', label: 'Kabina C', position: 'Rufowa prawa · podwójne', berths: ['C1','C2'] },
  { id: 'D', label: 'Kabina D', position: 'Środkowa lewa · dwa single', berths: ['D1','D2'] },
  { id: 'E', label: 'Kabina E', position: 'Środkowa prawa · piętrowe', berths: ['E1','E2'], bunk: true },
];

const TAKEN_BERTHS = new Set(['A2', 'C1', 'D2']);

function BoatPlan({ selectedBerth, onSelectBerth, takenBerths = TAKEN_BERTHS }) {
  const [hovered, setHovered] = React.useState(null);

  function berthState(id) {
    if (takenBerths.has(id)) return 'taken';
    if (selectedBerth === id) return 'selected';
    if (hovered === id) return 'hovered';
    return 'available';
  }

  function berthFill(id) {
    const s = berthState(id);
    if (s === 'taken') return 'rgba(13,27,46,0.65)';
    if (s === 'selected') return 'rgba(196,146,58,0.85)';
    if (s === 'hovered') return 'rgba(196,146,58,0.25)';
    return 'rgba(245,240,232,0.10)';
  }

  function berthStroke(id) {
    const s = berthState(id);
    if (s === 'taken') return '#3a4a5c';
    if (s === 'selected') return '#c4923a';
    return '#c4923a';
  }

  function handleBerth(id) {
    if (takenBerths.has(id)) return;
    onSelectBerth(selectedBerth === id ? null : id);
  }

  // Standard berth rectangle
  function BerthRect({ id, x, y, w, h, labelX, labelY }) {
    const state = berthState(id);
    const clickable = !takenBerths.has(id);
    return (
      <g
        onClick={() => handleBerth(id)}
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
        style={{ cursor: clickable ? 'pointer' : 'not-allowed' }}
      >
        <rect x={x} y={y} width={w} height={h}
          fill={berthFill(id)}
          stroke={berthStroke(id)}
          strokeWidth={state === 'selected' ? 1.5 : 0.8}
        />
        {state === 'taken' && (
          <line x1={x+4} y1={y+4} x2={x+w-4} y2={y+h-4} stroke="#3a4a5c" strokeWidth="0.8" />
        )}
        {state === 'selected' && (
          <>
            <line x1={(labelX??x+w/2)-4} y1={labelY??y+h/2} x2={(labelX??x+w/2)+4} y2={labelY??y+h/2} stroke="#fff" strokeWidth="1.2" />
            <line x1={labelX??x+w/2} y1={(labelY??y+h/2)-4} x2={labelX??x+w/2} y2={(labelY??y+h/2)+4} stroke="#fff" strokeWidth="1.2" />
          </>
        )}
        <text x={labelX??x+w/2} y={labelY??y+h/2}
          textAnchor="middle" dominantBaseline="central"
          fontSize="7" fontFamily="DM Sans, sans-serif"
          fill={state === 'selected' ? '#fff' : state === 'taken' ? '#3a4a5c' : '#c4923a'}
          fontWeight="600" letterSpacing="0.5"
        >{id}</text>
      </g>
    );
  }

  // Bunk bed — E1 upper (dashed overlay), E2 lower (solid base)
  // Displayed as one stacked unit, both clickable separately
  function BunkBed({ x, y, w, h }) {
    const stateE2 = berthState('E2'); // lower — solid
    const stateE1 = berthState('E1'); // upper — dashed overlay

    // Hit zones: lower = bottom half, upper = top half (or just two rows)
    const rowH = h / 2;

    return (
      <g>
        {/* ── LOWER BERTH E2 ── */}
        <g
          onClick={() => handleBerth('E2')}
          onMouseEnter={() => setHovered('E2')}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: takenBerths.has('E2') ? 'not-allowed' : 'pointer' }}
        >
          <rect x={x} y={y+rowH} width={w} height={rowH}
            fill={berthFill('E2')}
            stroke={berthStroke('E2')}
            strokeWidth={stateE2 === 'selected' ? 1.5 : 0.8}
          />
          {stateE2 === 'taken' && <line x1={x+4} y1={y+rowH+4} x2={x+w-4} y2={y+h-4} stroke="#3a4a5c" strokeWidth="0.8" />}
          {stateE2 === 'selected' && (
            <>
              <line x1={x+w/2-4} y1={y+rowH+rowH/2} x2={x+w/2+4} y2={y+rowH+rowH/2} stroke="#fff" strokeWidth="1.2" />
              <line x1={x+w/2} y1={y+rowH+rowH/2-4} x2={x+w/2} y2={y+rowH+rowH/2+4} stroke="#fff" strokeWidth="1.2" />
            </>
          )}
          <text x={x+w/2} y={y+rowH+rowH/2}
            textAnchor="middle" dominantBaseline="central"
            fontSize="6.5" fontFamily="DM Sans, sans-serif"
            fill={stateE2 === 'selected' ? '#fff' : stateE2 === 'taken' ? '#3a4a5c' : '#c4923a'}
            fontWeight="600"
          >E2</text>
          {/* "dół" label */}
          <text x={x+w-3} y={y+rowH+rowH/2}
            textAnchor="end" dominantBaseline="central"
            fontSize="4" fontFamily="DM Sans, sans-serif"
            fill="rgba(196,146,58,0.4)" letterSpacing="0.3"
          >dół</text>
        </g>

        {/* ── UPPER BERTH E1 — dashed border + hatch ── */}
        <g
          onClick={() => handleBerth('E1')}
          onMouseEnter={() => setHovered('E1')}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: takenBerths.has('E1') ? 'not-allowed' : 'pointer' }}
        >
          {/* Hatch fill indicating upper bunk */}
          <defs>
            <pattern id="bunk-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5"
                stroke={stateE1 === 'selected' ? 'rgba(255,255,255,0.4)' : stateE1 === 'taken' ? 'rgba(58,74,92,0.4)' : 'rgba(196,146,58,0.18)'}
                strokeWidth="1" />
            </pattern>
          </defs>
          <rect x={x} y={y} width={w} height={rowH}
            fill={stateE1 === 'selected' ? 'rgba(196,146,58,0.75)' : stateE1 === 'taken' ? 'rgba(13,27,46,0.55)' : 'url(#bunk-hatch)'}
          />
          {/* Dashed border for upper bunk */}
          <rect x={x} y={y} width={w} height={rowH}
            fill="none"
            stroke={berthStroke('E1')}
            strokeWidth={stateE1 === 'selected' ? 1.5 : 0.8}
            strokeDasharray={stateE1 === 'selected' ? 'none' : '3 2'}
          />
          {stateE1 === 'taken' && <line x1={x+4} y1={y+4} x2={x+w-4} y2={y+rowH-4} stroke="#3a4a5c" strokeWidth="0.8" />}
          {stateE1 === 'selected' && (
            <>
              <line x1={x+w/2-4} y1={y+rowH/2} x2={x+w/2+4} y2={y+rowH/2} stroke="#fff" strokeWidth="1.2" />
              <line x1={x+w/2} y1={y+rowH/2-4} x2={x+w/2} y2={y+rowH/2+4} stroke="#fff" strokeWidth="1.2" />
            </>
          )}
          <text x={x+w/2} y={y+rowH/2}
            textAnchor="middle" dominantBaseline="central"
            fontSize="6.5" fontFamily="DM Sans, sans-serif"
            fill={stateE1 === 'selected' ? '#fff' : stateE1 === 'taken' ? '#3a4a5c' : '#c4923a'}
            fontWeight="600"
          >E1</text>
          {/* "góra" label */}
          <text x={x+w-3} y={y+rowH/2}
            textAnchor="end" dominantBaseline="central"
            fontSize="4" fontFamily="DM Sans, sans-serif"
            fill="rgba(196,146,58,0.4)" letterSpacing="0.3"
          >góra</text>
        </g>

        {/* ── LADDER symbol — left edge of bunk unit ── */}
        <g opacity="0.5">
          {/* Ladder rails */}
          <line x1={x-1} y1={y+4} x2={x-1} y2={y+h-4} stroke="#c4923a" strokeWidth="0.7" />
          <line x1={x+4} y1={y+4} x2={x+4} y2={y+h-4} stroke="#c4923a" strokeWidth="0.7" />
          {/* Ladder rungs */}
          {[0.2, 0.4, 0.6, 0.8].map((t, i) => (
            <line key={i} x1={x-1} y1={y+h*t} x2={x+4} y2={y+h*t} stroke="#c4923a" strokeWidth="0.6" />
          ))}
        </g>

        {/* Separator line between bunks */}
        <line x1={x} y1={y+rowH} x2={x+w} y2={y+rowH} stroke="#c4923a" strokeWidth="0.5" />
      </g>
    );
  }

  // Island double bed (Kabina A) — single wide berth with rounded head
  function IslandBed({ x, y, w, h, id1, id2 }) {
    // A1 = left side, A2 = right side of the island bed
    const midX = x + w / 2;
    return (
      <g>
        {/* Bed outline */}
        <rect x={x} y={y} width={w} height={h}
          fill="rgba(245,240,232,0.06)"
          stroke="rgba(196,146,58,0.3)"
          strokeWidth="0.6"
        />
        {/* Pillow row at top */}
        <rect x={x+4} y={y+3} width={w/2-8} height={10}
          fill={berthFill(id1)} stroke={berthStroke(id1)} strokeWidth="0.7" rx="1"
          onClick={() => handleBerth(id1)}
          onMouseEnter={() => setHovered(id1)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: takenBerths.has(id1) ? 'not-allowed' : 'pointer' }}
        />
        <rect x={midX+4} y={y+3} width={w/2-8} height={10}
          fill={berthFill(id2)} stroke={berthStroke(id2)} strokeWidth="0.7" rx="1"
          onClick={() => handleBerth(id2)}
          onMouseEnter={() => setHovered(id2)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: takenBerths.has(id2) ? 'not-allowed' : 'pointer' }}
        />
        {/* Main bed surface — two click zones */}
        <rect x={x+2} y={y+16} width={w/2-4} height={h-20}
          fill={berthFill(id1)} stroke={berthStroke(id1)} strokeWidth="0.8"
          onClick={() => handleBerth(id1)}
          onMouseEnter={() => setHovered(id1)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: takenBerths.has(id1) ? 'not-allowed' : 'pointer' }}
        />
        <rect x={midX+2} y={y+16} width={w/2-4} height={h-20}
          fill={berthFill(id2)} stroke={berthStroke(id2)} strokeWidth="0.8"
          onClick={() => handleBerth(id2)}
          onMouseEnter={() => setHovered(id2)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: takenBerths.has(id2) ? 'not-allowed' : 'pointer' }}
        />
        {/* Center walkway divider */}
        <line x1={midX} y1={y} x2={midX} y2={y+h} stroke="rgba(196,146,58,0.2)" strokeWidth="0.5" strokeDasharray="2 2" />
        {/* Labels */}
        <text x={x+w/4} y={y+h/2+6} textAnchor="middle" dominantBaseline="central"
          fontSize="7" fontFamily="DM Sans, sans-serif"
          fill={berthState(id1)==='selected'?'#fff':berthState(id1)==='taken'?'#3a4a5c':'#c4923a'}
          fontWeight="600">{id1}</text>
        <text x={x+3*w/4} y={y+h/2+6} textAnchor="middle" dominantBaseline="central"
          fontSize="7" fontFamily="DM Sans, sans-serif"
          fill={berthState(id2)==='selected'?'#fff':berthState(id2)==='taken'?'#3a4a5c':'#c4923a'}
          fontWeight="600">{id2}</text>
        {/* Taken overlays */}
        {berthState(id1)==='taken' && <line x1={x+4} y1={y+16} x2={midX-2} y2={y+h-2} stroke="#3a4a5c" strokeWidth="0.8" />}
        {berthState(id2)==='taken' && <line x1={midX+4} y1={y+16} x2={x+w-4} y2={y+h-2} stroke="#3a4a5c" strokeWidth="0.8" />}
        {/* Selected markers */}
        {berthState(id1)==='selected' && <>
          <line x1={x+w/4-4} y1={y+h/2+6} x2={x+w/4+4} y2={y+h/2+6} stroke="#fff" strokeWidth="1.2" />
          <line x1={x+w/4} y1={y+h/2+2} x2={x+w/4} y2={y+h/2+10} stroke="#fff" strokeWidth="1.2" />
        </>}
        {berthState(id2)==='selected' && <>
          <line x1={x+3*w/4-4} y1={y+h/2+6} x2={x+3*w/4+4} y2={y+h/2+6} stroke="#fff" strokeWidth="1.2" />
          <line x1={x+3*w/4} y1={y+h/2+2} x2={x+3*w/4} y2={y+h/2+10} stroke="#fff" strokeWidth="1.2" />
        </>}
      </g>
    );
  }

  // Double berth (B, C) — wide single rectangle split into two click zones
  function DoubleBerth({ x, y, w, h, id1, id2, split = 'v' }) {
    // split='h' = horizontal split (left/right), split='v' = vertical (top/bottom)
    const isH = split === 'h';
    const midX = x + w / 2;
    const midY = y + h / 2;
    return (
      <g>
        <rect x={x} y={y} width={w} height={h}
          fill="rgba(245,240,232,0.04)" stroke="rgba(196,146,58,0.2)" strokeWidth="0.5" />

        {/* Zone 1 */}
        <rect
          x={x} y={y}
          width={isH ? w/2 : w}
          height={isH ? h : h/2}
          fill={berthFill(id1)} stroke={berthStroke(id1)} strokeWidth="0.8"
          onClick={() => handleBerth(id1)}
          onMouseEnter={() => setHovered(id1)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: takenBerths.has(id1) ? 'not-allowed' : 'pointer' }}
        />
        {berthState(id1)==='taken' && <line x1={x+3} y1={y+3} x2={isH?midX-3:x+w-3} y2={isH?y+h-3:midY-3} stroke="#3a4a5c" strokeWidth="0.8" />}
        {berthState(id1)==='selected' && <>
          <line x1={isH?x+w/4-4:x+w/2-4} y1={isH?y+h/2:y+h/4} x2={isH?x+w/4+4:x+w/2+4} y2={isH?y+h/2:y+h/4} stroke="#fff" strokeWidth="1.2" />
          <line x1={isH?x+w/4:x+w/2} y1={isH?y+h/2-4:y+h/4-4} x2={isH?x+w/4:x+w/2} y2={isH?y+h/2+4:y+h/4+4} stroke="#fff" strokeWidth="1.2" />
        </>}
        <text
          x={isH ? x+w/4 : x+w/2}
          y={isH ? y+h/2 : y+h/4}
          textAnchor="middle" dominantBaseline="central"
          fontSize="7" fontFamily="DM Sans, sans-serif"
          fill={berthState(id1)==='selected'?'#fff':berthState(id1)==='taken'?'#3a4a5c':'#c4923a'}
          fontWeight="600"
        >{id1}</text>

        {/* Zone 2 */}
        <rect
          x={isH ? midX : x}
          y={isH ? y : midY}
          width={isH ? w/2 : w}
          height={isH ? h : h/2}
          fill={berthFill(id2)} stroke={berthStroke(id2)} strokeWidth="0.8"
          onClick={() => handleBerth(id2)}
          onMouseEnter={() => setHovered(id2)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: takenBerths.has(id2) ? 'not-allowed' : 'pointer' }}
        />
        {berthState(id2)==='taken' && <line x1={isH?midX+3:x+3} y1={isH?y+3:midY+3} x2={x+w-3} y2={y+h-3} stroke="#3a4a5c" strokeWidth="0.8" />}
        {berthState(id2)==='selected' && <>
          <line x1={isH?x+3*w/4-4:x+w/2-4} y1={isH?y+h/2:y+3*h/4} x2={isH?x+3*w/4+4:x+w/2+4} y2={isH?y+h/2:y+3*h/4} stroke="#fff" strokeWidth="1.2" />
          <line x1={isH?x+3*w/4:x+w/2} y1={isH?y+h/2-4:y+3*h/4-4} x2={isH?x+3*w/4:x+w/2} y2={isH?y+h/2+4:y+3*h/4+4} stroke="#fff" strokeWidth="1.2" />
        </>}
        <text
          x={isH ? x+3*w/4 : x+w/2}
          y={isH ? y+h/2 : y+3*h/4}
          textAnchor="middle" dominantBaseline="central"
          fontSize="7" fontFamily="DM Sans, sans-serif"
          fill={berthState(id2)==='selected'?'#fff':berthState(id2)==='taken'?'#3a4a5c':'#c4923a'}
          fontWeight="600"
        >{id2}</text>

        {/* Divider */}
        {isH
          ? <line x1={midX} y1={y} x2={midX} y2={y+h} stroke="rgba(196,146,58,0.25)" strokeWidth="0.5" strokeDasharray="2 2" />
          : <line x1={x} y1={midY} x2={x+w} y2={midY} stroke="rgba(196,146,58,0.25)" strokeWidth="0.5" strokeDasharray="2 2" />
        }
      </g>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
      {/* ── SVG PLAN ── */}
      <div style={{ position: 'relative' }}>
        <svg viewBox="0 0 210 540" width="210" height="540" style={{ display: 'block' }}>
          <defs>
            <pattern id="grid" patternUnits="userSpaceOnUse" width="10" height="10">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(196,146,58,0.06)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="210" height="540" fill="url(#grid)" />

          {/* ── HULL ── */}
          <path
            d="M 105 10
               C 145 20, 192 82, 196 175
               L 196 378
               C 196 438, 170 478, 140 496
               L 70 496
               C 40 478, 14 438, 14 378
               L 14 175
               C 18 82, 65 20, 105 10 Z"
            fill="none" stroke="#c4923a" strokeWidth="1.5"
          />

          {/* Centerline */}
          <line x1="105" y1="10" x2="105" y2="496" stroke="rgba(196,146,58,0.15)" strokeWidth="0.5" strokeDasharray="4 3" />

          {/* ── DZIÓB label ── */}
          <text x="105" y="24" textAnchor="middle" fontSize="5.5" fontFamily="DM Sans" fill="rgba(196,146,58,0.5)" letterSpacing="2">DZIÓB</text>

          {/* ── KABINA A — island double, forward ── */}
          {/* Bulkhead forward at y=52 (narrow hull) */}
          <text x="105" y="54" textAnchor="middle" fontSize="6" fontFamily="DM Sans" fill="rgba(196,146,58,0.45)" fontWeight="700" letterSpacing="1">A</text>
          {/* Island bed centered */}
          <IslandBed x={38} y={62} w={134} h={72} id1="A1" id2="A2" />
          {/* Walkway sides annotation */}
          <text x="26" y="98" textAnchor="middle" fontSize="4" fontFamily="DM Sans" fill="rgba(196,146,58,0.2)" transform="rotate(-90 26 98)">przejście</text>
          <text x="184" y="98" textAnchor="middle" fontSize="4" fontFamily="DM Sans" fill="rgba(196,146,58,0.2)" transform="rotate(90 184 98)">przejście</text>

          {/* Bulkhead at y=140 */}
          <line x1="26" y1="140" x2="184" y2="140" stroke="#c4923a" strokeWidth="0.8" />

          {/* ── SALON / SALOON ── */}
          <text x="105" y="155" textAnchor="middle" fontSize="5.5" fontFamily="DM Sans" fill="rgba(196,146,58,0.35)" letterSpacing="2">SALON</text>
          {/* Port settee */}
          <rect x="16" y="160" width="42" height="52" fill="none" stroke="rgba(196,146,58,0.15)" strokeWidth="0.6" />
          {/* Starboard settee */}
          <rect x="152" y="160" width="42" height="52" fill="none" stroke="rgba(196,146,58,0.15)" strokeWidth="0.6" />
          {/* Table */}
          <rect x="72" y="166" width="66" height="40" fill="none" stroke="rgba(196,146,58,0.2)" strokeWidth="0.6" />
          {/* Galley port */}
          <rect x="16" y="215" width="42" height="28" fill="none" stroke="rgba(196,146,58,0.12)" strokeWidth="0.5" />
          <text x="37" y="230" textAnchor="middle" fontSize="4" fontFamily="DM Sans" fill="rgba(196,146,58,0.25)" letterSpacing="1">GALLEY</text>
          {/* Nav station starboard */}
          <rect x="152" y="215" width="42" height="22" fill="none" stroke="rgba(196,146,58,0.12)" strokeWidth="0.5" />
          <text x="173" y="228" textAnchor="middle" fontSize="4" fontFamily="DM Sans" fill="rgba(196,146,58,0.25)" letterSpacing="1">NAV</text>

          {/* Companionway */}
          <rect x="76" y="247" width="58" height="9" fill="rgba(13,27,46,0.5)" stroke="rgba(196,146,58,0.3)" strokeWidth="0.6" />
          <text x="105" y="253.5" textAnchor="middle" fontSize="4" fontFamily="DM Sans" fill="rgba(196,146,58,0.5)" letterSpacing="1">ZEJŚCIE</text>

          {/* Bulkhead at y=262 */}
          <line x1="14" y1="262" x2="196" y2="262" stroke="#c4923a" strokeWidth="0.9" />

          {/* ── MID CABINS D (port) & E (starboard) ── */}
          {/* Center divider */}
          <line x1="105" y1="262" x2="105" y2="382" stroke="#c4923a" strokeWidth="0.8" />
          {/* Bulkhead at y=382 */}
          <line x1="14" y1="382" x2="196" y2="382" stroke="#c4923a" strokeWidth="0.9" />

          {/* KABINA D — port mid, dwa single obok siebie (fore/aft) */}
          <text x="59" y="274" textAnchor="middle" fontSize="6" fontFamily="DM Sans" fill="rgba(196,146,58,0.45)" fontWeight="700" letterSpacing="1">D</text>
          <DoubleBerth x={16} y={282} w={87} h={92} id1="D1" id2="D2" split="v" />

          {/* KABINA E — starboard mid, PIĘTROWE */}
          <text x="151" y="274" textAnchor="middle" fontSize="6" fontFamily="DM Sans" fill="rgba(196,146,58,0.45)" fontWeight="700" letterSpacing="1">E</text>
          {/* "piętrowe" badge */}
          <text x="164" y="274" textAnchor="middle" fontSize="4" fontFamily="DM Sans" fill="rgba(196,146,58,0.55)" letterSpacing="0.5">piętrowe</text>
          <BunkBed x={107} y={282} w={87} h={92} />

          {/* ── AFT CABINS B (port) & C (starboard) ── */}
          {/* Center divider */}
          <line x1="105" y1="382" x2="105" y2="495" stroke="#c4923a" strokeWidth="0.8" />

          {/* KABINA B — port aft, double */}
          <text x="59" y="393" textAnchor="middle" fontSize="6" fontFamily="DM Sans" fill="rgba(196,146,58,0.45)" fontWeight="700" letterSpacing="1">B</text>
          <DoubleBerth x={16} y={400} w={87} h={87} id1="B1" id2="B2" split="v" />

          {/* KABINA C — starboard aft, double */}
          <text x="151" y="393" textAnchor="middle" fontSize="6" fontFamily="DM Sans" fill="rgba(196,146,58,0.45)" fontWeight="700" letterSpacing="1">C</text>
          <DoubleBerth x={107} y={400} w={87} h={87} id1="C1" id2="C2" split="v" />

          {/* RUFA label */}
          <text x="105" y="510" textAnchor="middle" fontSize="5.5" fontFamily="DM Sans" fill="rgba(196,146,58,0.4)" letterSpacing="2">RUFA</text>

          {/* Title */}
          <text x="105" y="527" textAnchor="middle" fontSize="4.5" fontFamily="DM Sans" fill="rgba(196,146,58,0.25)" letterSpacing="1">JEANNEAU SUN ODYSSEY 519 · rzut kojowy</text>
        </svg>
      </div>

      {/* ── LEGEND + CABIN LIST ── */}
      <div style={{ minWidth: '230px', maxWidth: '290px' }}>

        {/* Legend */}
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', letterSpacing: '2px', color: 'rgba(196,146,58,0.7)', textTransform: 'uppercase', marginBottom: '12px' }}>Legenda</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {[
            { bg: 'rgba(245,240,232,0.10)', border: '#c4923a', dash: false, label: 'Dostępna koja' },
            { bg: 'rgba(196,146,58,0.85)', border: '#c4923a', dash: false, label: 'Wybrana koja' },
            { bg: 'rgba(13,27,46,0.55)', border: '#3a4a5c', dash: false, label: 'Zajęta koja' },
            { bg: 'rgba(196,146,58,0.08)', border: '#c4923a', dash: true, label: 'Koja górna (piętrowa)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '22px', height: '13px', background: item.bg, border: `1px ${item.dash ? 'dashed' : 'solid'} ${item.border}`, flexShrink: 0 }} />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(245,240,232,0.6)' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Cabin list */}
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', letterSpacing: '2px', color: 'rgba(196,146,58,0.7)', textTransform: 'uppercase', marginBottom: '12px' }}>Kajuty</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {CABINS.map(cabin => (
            <div key={cabin.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderLeft: `2px solid ${cabin.bunk ? '#c4923a' : 'rgba(196,146,58,0.3)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '13px', color: 'rgba(245,240,232,0.9)', fontWeight: '600' }}>
                    {cabin.label}
                    {cabin.bunk && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '9px', color: '#c4923a', letterSpacing: '1px', marginLeft: '6px', textTransform: 'uppercase', verticalAlign: 'middle' }}>piętrowe</span>}
                  </span>
                  <span style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: '10px', color: 'rgba(245,240,232,0.4)', marginTop: '1px' }}>{cabin.position}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {cabin.berths.map((b, bi) => {
                    const state = berthState(b);
                    const isUpper = cabin.bunk && bi === 0;
                    return (
                      <div key={b} onClick={() => handleBerth(b)} style={{
                        width: '32px', height: '24px',
                        background: state === 'selected' ? '#c4923a' : state === 'taken' ? 'rgba(13,27,46,0.5)' : 'transparent',
                        border: `${isUpper ? 'dashed' : 'solid'} 1px ${state === 'taken' ? '#3a4a5c' : '#c4923a'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                        cursor: state === 'taken' ? 'not-allowed' : 'pointer',
                        fontFamily: 'DM Sans, sans-serif', fontSize: '9px', fontWeight: '700',
                        color: state === 'selected' ? '#fff' : state === 'taken' ? '#3a4a5c' : '#c4923a',
                        transition: 'all 0.15s ease',
                        gap: '1px',
                      }}>
                        <span>{b}</span>
                        {cabin.bunk && <span style={{ fontSize: '5px', opacity: 0.7, letterSpacing: 0 }}>{bi === 0 ? 'góra' : 'dół'}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected berth info */}
        {selectedBerth && (
          <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(196,146,58,0.12)', border: '1px solid rgba(196,146,58,0.4)' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', letterSpacing: '2px', color: '#c4923a', textTransform: 'uppercase', margin: '0 0 4px' }}>Wybrana</p>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#f5f0e8', margin: '0 0 2px' }}>Koja {selectedBerth}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(245,240,232,0.5)', margin: 0 }}>
              {CABINS.find(c => c.berths.includes(selectedBerth))?.label}
              {' · '}
              {CABINS.find(c => c.berths.includes(selectedBerth))?.bunk
                ? (selectedBerth.endsWith('1') ? 'koja górna' : 'koja dolna')
                : CABINS.find(c => c.berths.includes(selectedBerth))?.position
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { BoatPlan, CABINS, TAKEN_BERTHS });
