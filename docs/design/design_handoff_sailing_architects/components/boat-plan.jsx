
// BoatPlan — Jeanneau Sun Odyssey 519 architectural floor plan
// 5 cabins × 2 berths = 10 bookable spots

const CABINS = [
  { id: 'A', label: 'Kabina A', position: 'Dziobowa', berths: ['A1','A2'] },
  { id: 'B', label: 'Kabina B', position: 'Rufowa lewa', berths: ['B1','B2'] },
  { id: 'C', label: 'Kabina C', position: 'Rufowa prawa', berths: ['C1','C2'] },
  { id: 'D', label: 'Kabina D', position: 'Środkowa lewa', berths: ['D1','D2'] },
  { id: 'E', label: 'Kabina E', position: 'Środkowa prawa', berths: ['E1','E2'] },
];

// Pre-taken berths (demo)
const TAKEN_BERTHS = new Set(['A2', 'C1', 'D2']);

function BerthHatch({ x, y, w, h, angle = 45 }) {
  const id = `hatch-${x}-${y}`;
  return (
    <g>
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform={`rotate(${angle})`}>
          <line x1="0" y1="0" x2="0" y2="6" stroke="#c4923a" strokeWidth="0.5" strokeOpacity="0.35" />
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#c4923a" strokeWidth="0.6" />
    </g>
  );
}

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
    if (s === 'taken') return 'rgba(13,27,46,0.55)';
    if (s === 'selected') return 'rgba(196,146,58,0.85)';
    if (s === 'hovered') return 'rgba(196,146,58,0.22)';
    return 'rgba(245,240,232,0.12)';
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

  // Cushion lines inside berth
  function BerthRect({ id, x, y, w, h, labelX, labelY, rot = 0 }) {
    const state = berthState(id);
    const clickable = !takenBerths.has(id);
    return (
      <g
        onClick={() => handleBerth(id)}
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
        style={{ cursor: clickable ? 'pointer' : 'not-allowed' }}
      >
        <rect
          x={x} y={y} width={w} height={h}
          fill={berthFill(id)}
          stroke={berthStroke(id)}
          strokeWidth={state === 'selected' ? 1.5 : 0.8}
          rx={0}
        />
        {state === 'taken' && (
          <line x1={x+4} y1={y+4} x2={x+w-4} y2={y+h-4} stroke="#3a4a5c" strokeWidth="0.8" />
        )}
        {state === 'selected' && (
          <>
            <line x1={x+w/2-4} y1={y+h/2} x2={x+w/2+4} y2={y+h/2} stroke="#fff" strokeWidth="1.2" />
            <line x1={x+w/2} y1={y+h/2-4} x2={x+w/2} y2={y+h/2+4} stroke="#fff" strokeWidth="1.2" />
          </>
        )}
        <text
          x={labelX ?? x + w/2}
          y={labelY ?? y + h/2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="7"
          fontFamily="DM Sans, sans-serif"
          fill={state === 'selected' ? '#fff' : state === 'taken' ? '#3a4a5c' : '#c4923a'}
          fontWeight="600"
          letterSpacing="0.5"
        >{id}</text>
      </g>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
      {/* SVG Plan */}
      <div style={{ position: 'relative' }}>
        <svg
          viewBox="0 0 200 520"
          width="200"
          height="520"
          style={{ display: 'block' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid / drawing paper feel */}
          <defs>
            <pattern id="grid" patternUnits="userSpaceOnUse" width="10" height="10">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(196,146,58,0.07)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="200" height="520" fill="url(#grid)" />

          {/* ── HULL OUTLINE ── */}
          <path
            d="M 100 8
               C 140 18, 186 80, 192 170
               L 192 370
               C 192 430, 168 470, 140 488
               L 60 488
               C 32 470, 8 430, 8 370
               L 8 170
               C 14 80, 60 18, 100 8 Z"
            fill="none"
            stroke="#c4923a"
            strokeWidth="1.5"
          />

          {/* ── KEEL LINE (centerline) ── */}
          <line x1="100" y1="8" x2="100" y2="488" stroke="rgba(196,146,58,0.2)" strokeWidth="0.5" strokeDasharray="4 3" />

          {/* ── FORWARD CABIN A ── */}
          {/* Bulkhead at y=175 */}
          <line x1="20" y1="175" x2="180" y2="175" stroke="#c4923a" strokeWidth="0.8" />
          {/* Cabin label */}
          <text x="100" y="22" textAnchor="middle" fontSize="6" fontFamily="DM Sans" fill="rgba(196,146,58,0.7)" letterSpacing="2">DZIÓB</text>
          {/* Cabin room label */}
          <text x="100" y="108" textAnchor="middle" fontSize="7.5" fontFamily="DM Sans" fill="rgba(196,146,58,0.5)" fontWeight="700" letterSpacing="1">A</text>

          {/* A1 — port berth */}
          <BerthRect id="A1" x={22} y={125} w={68} h={38} />
          {/* A2 — starboard berth */}
          <BerthRect id="A2" x={110} y={125} w={68} h={38} />

          {/* Pillar/column dots at forward cabin corners */}
          {[[22,125],[90,125],[110,125],[178,125],[22,163],[90,163],[110,163],[178,163]].map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="1.5" fill="#c4923a" opacity="0.6" />
          ))}

          {/* ── SALOON AREA ── */}
          {/* Bulkhead at y=295 */}
          <line x1="8" y1="295" x2="192" y2="295" stroke="#c4923a" strokeWidth="0.8" />
          {/* Saloon label */}
          <text x="100" y="237" textAnchor="middle" fontSize="6" fontFamily="DM Sans" fill="rgba(196,146,58,0.4)" letterSpacing="2">SALON</text>
          {/* Table */}
          <rect x="72" y="208" width="56" height="30" fill="none" stroke="rgba(196,146,58,0.25)" strokeWidth="0.7" />
          {/* Settees */}
          <rect x="20" y="200" width="45" height="44" fill="none" stroke="rgba(196,146,58,0.18)" strokeWidth="0.7" />
          <rect x="135" y="200" width="45" height="44" fill="none" stroke="rgba(196,146,58,0.18)" strokeWidth="0.7" />

          {/* Nav station */}
          <text x="160" y="190" textAnchor="middle" fontSize="4.5" fontFamily="DM Sans" fill="rgba(196,146,58,0.35)" letterSpacing="1">NAV</text>
          <rect x="136" y="177" width="44" height="20" fill="none" stroke="rgba(196,146,58,0.18)" strokeWidth="0.5" />

          {/* ── MID CABINS D (port) & E (starboard) ── */}
          {/* Center divider */}
          <line x1="100" y1="295" x2="100" y2="395" stroke="#c4923a" strokeWidth="0.8" />
          {/* Bulkhead at y=395 */}
          <line x1="15" y1="395" x2="185" y2="395" stroke="#c4923a" strokeWidth="0.8" />

          {/* Cabin D label */}
          <text x="54" y="308" textAnchor="middle" fontSize="7.5" fontFamily="DM Sans" fill="rgba(196,146,58,0.5)" fontWeight="700" letterSpacing="1">D</text>
          {/* D1 upper berth */}
          <BerthRect id="D1" x={12} y={318} w={82} h={32} />
          {/* D2 lower berth */}
          <BerthRect id="D2" x={12} y={355} w={82} h={32} />

          {/* Cabin E label */}
          <text x="146" y="308" textAnchor="middle" fontSize="7.5" fontFamily="DM Sans" fill="rgba(196,146,58,0.5)" fontWeight="700" letterSpacing="1">E</text>
          {/* E1 */}
          <BerthRect id="E1" x={106} y={318} w={82} h={32} />
          {/* E2 */}
          <BerthRect id="E2" x={106} y={355} w={82} h={32} />

          {/* ── AFT CABINS B (port) & C (starboard) ── */}
          {/* Center divider */}
          <line x1="100" y1="395" x2="100" y2="487" stroke="#c4923a" strokeWidth="0.8" />

          {/* Cabin B label */}
          <text x="54" y="408" textAnchor="middle" fontSize="7.5" fontFamily="DM Sans" fill="rgba(196,146,58,0.5)" fontWeight="700" letterSpacing="1">B</text>
          {/* B1 */}
          <BerthRect id="B1" x={12} y={418} w={82} h={30} />
          {/* B2 */}
          <BerthRect id="B2" x={12} y={452} w={82} h={28} />

          {/* Cabin C label */}
          <text x="146" y="408" textAnchor="middle" fontSize="7.5" fontFamily="DM Sans" fill="rgba(196,146,58,0.5)" fontWeight="700" letterSpacing="1">C</text>
          {/* C1 */}
          <BerthRect id="C1" x={106} y={418} w={82} h={30} />
          {/* C2 */}
          <BerthRect id="C2" x={106} y={452} w={82} h={28} />

          {/* ── COMPANIONWAY ── */}
          <rect x="72" y="290" width="56" height="8" fill="rgba(13,27,46,0.4)" stroke="rgba(196,146,58,0.3)" strokeWidth="0.6" />
          <text x="100" y="296.5" textAnchor="middle" fontSize="4" fontFamily="DM Sans" fill="rgba(196,146,58,0.5)" letterSpacing="1">ZEJŚCIE</text>

          {/* Compass rose - bottom right */}
          <g transform="translate(166, 258)">
            <circle cx="0" cy="0" r="10" fill="none" stroke="rgba(196,146,58,0.2)" strokeWidth="0.5" />
            <text x="0" y="-13" textAnchor="middle" fontSize="5" fontFamily="DM Sans" fill="rgba(196,146,58,0.4)" fontWeight="700">N</text>
            <line x1="0" y1="-9" x2="0" y2="9" stroke="rgba(196,146,58,0.3)" strokeWidth="0.6" />
            <line x1="-9" y1="0" x2="9" y2="0" stroke="rgba(196,146,58,0.3)" strokeWidth="0.6" />
          </g>

          {/* Scale bar */}
          <line x1="20" y1="505" x2="80" y2="505" stroke="rgba(196,146,58,0.4)" strokeWidth="0.8" />
          <line x1="20" y1="502" x2="20" y2="508" stroke="rgba(196,146,58,0.4)" strokeWidth="0.8" />
          <line x1="80" y1="502" x2="80" y2="508" stroke="rgba(196,146,58,0.4)" strokeWidth="0.8" />
          <text x="50" y="514" textAnchor="middle" fontSize="4.5" fontFamily="DM Sans" fill="rgba(196,146,58,0.4)">≈ 8m</text>

          {/* Title block */}
          <text x="130" y="504" textAnchor="middle" fontSize="5" fontFamily="DM Sans" fill="rgba(196,146,58,0.35)" letterSpacing="1">JEANNEAU SO 519</text>
          <text x="130" y="512" textAnchor="middle" fontSize="4" fontFamily="DM Sans" fill="rgba(196,146,58,0.25)" letterSpacing="0.5">rzut poziomy / plan kojowy</text>
        </svg>
      </div>

      {/* Legend + cabin list */}
      <div style={{ minWidth: '220px', maxWidth: '280px' }}>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', letterSpacing: '2px', color: 'rgba(196,146,58,0.7)', textTransform: 'uppercase', marginBottom: '12px' }}>Legenda</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { color: 'rgba(245,240,232,0.12)', border: '#c4923a', label: 'Dostępna koja', fill: false },
              { color: 'rgba(196,146,58,0.85)', border: '#c4923a', label: 'Wybrana koja', fill: true },
              { color: 'rgba(13,27,46,0.55)', border: '#3a4a5c', label: 'Zajęta koja', fill: false },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '12px', background: item.color, border: `1px solid ${item.border}`, flexShrink: 0 }} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(245,240,232,0.6)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cabin details */}
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', letterSpacing: '2px', color: 'rgba(196,146,58,0.7)', textTransform: 'uppercase', marginBottom: '12px' }}>Kajuty</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {CABINS.map(cabin => (
            <div key={cabin.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderLeft: '2px solid rgba(196,146,58,0.3)' }}>
              <div>
                <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '13px', color: 'rgba(245,240,232,0.9)', fontWeight: '600' }}>{cabin.label}</span>
                <span style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: '10px', color: 'rgba(245,240,232,0.4)', marginTop: '1px' }}>{cabin.position}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {cabin.berths.map(b => {
                  const state = berthState(b);
                  return (
                    <div
                      key={b}
                      onClick={() => handleBerth(b)}
                      style={{
                        width: '28px', height: '22px',
                        background: state === 'selected' ? '#c4923a' : state === 'taken' ? 'rgba(13,27,46,0.5)' : 'transparent',
                        border: `1px solid ${state === 'taken' ? '#3a4a5c' : '#c4923a'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: state === 'taken' ? 'not-allowed' : 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '9px',
                        fontWeight: '700',
                        letterSpacing: '0.3px',
                        color: state === 'selected' ? '#fff' : state === 'taken' ? '#3a4a5c' : '#c4923a',
                        transition: 'all 0.15s ease',
                      }}
                    >{b}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selectedBerth && (
          <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(196,146,58,0.12)', border: '1px solid rgba(196,146,58,0.4)' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', letterSpacing: '2px', color: '#c4923a', textTransform: 'uppercase', margin: '0 0 4px' }}>Wybrana</p>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#f5f0e8', margin: '0 0 2px' }}>Koja {selectedBerth}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(245,240,232,0.5)', margin: 0 }}>
              {CABINS.find(c => c.berths.includes(selectedBerth))?.label} · {CABINS.find(c => c.berths.includes(selectedBerth))?.position}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { BoatPlan, CABINS, TAKEN_BERTHS });
