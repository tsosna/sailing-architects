
// BookingFlow — 5-step booking process

const STAGES = [
  { id: 1, label: 'Konto', icon: '01' },
  { id: 2, label: 'Dane załogi', icon: '02' },
  { id: 3, label: 'Potwierdzenie', icon: '03' },
  { id: 4, label: 'Płatność', icon: '04' },
  { id: 5, label: 'Gotowe', icon: '05' },
];

const VOYAGE_SEGMENTS = [
  { id: 's1', name: 'Majorka → Gibraltar', dates: '4–11.10.2026', days: 7, price: 1800 },
  { id: 's2', name: 'Gibraltar → Madera', dates: '12–21.10.2026', days: 9, price: 2300 },
  { id: 's3', name: 'Madera → Teneryfa', dates: '22–31.10.2026', days: 9, price: 2300 },
  { id: 's4', name: 'Teneryfa → Cabo Verde', dates: '1–14.11.2026', days: 13, price: 3200 },
];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '48px', justifyContent: 'center' }}>
      {STAGES.map((s, i) => {
        const done = s.id < current;
        const active = s.id === current;
        return (
          <React.Fragment key={s.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '32px', height: '32px',
                border: `1px solid ${done ? '#c4923a' : active ? '#c4923a' : 'rgba(196,146,58,0.25)'}`,
                background: done ? '#c4923a' : active ? 'transparent' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'DM Sans, sans-serif', fontSize: '10px', fontWeight: '700',
                letterSpacing: '0.5px',
                color: done ? '#0d1b2e' : active ? '#c4923a' : 'rgba(196,146,58,0.3)',
              }}>
                {done ? '✓' : s.icon}
              </div>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: active ? '#c4923a' : done ? 'rgba(196,146,58,0.7)' : 'rgba(196,146,58,0.25)' }}>{s.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{ width: '40px', height: '1px', background: s.id < current ? '#c4923a' : 'rgba(196,146,58,0.15)', marginBottom: '22px', flexShrink: 0 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Input({ label, type = 'text', value, onChange, required, hint, options }) {
  const st = {
    wrapper: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontFamily: 'DM Sans, sans-serif', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(196,146,58,0.7)' },
    input: {
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(196,146,58,0.25)',
      padding: '10px 14px', color: '#f5f0e8', fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
      outline: 'none', width: '100%', boxSizing: 'border-box', borderRadius: 0,
      appearance: 'none',
    },
    hint: { fontFamily: 'DM Sans, sans-serif', fontSize: '10px', color: 'rgba(245,240,232,0.3)' },
  };
  return (
    <div style={st.wrapper}>
      <label style={st.label}>{label}{required && ' *'}</label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...st.input, cursor: 'pointer' }}>
          {options.map(o => <option key={o.value} value={o.value} style={{ background: '#162840' }}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ ...st.input, resize: 'vertical' }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} style={st.input} />
      )}
      {hint && <span style={st.hint}>{hint}</span>}
    </div>
  );
}

function Step1({ onNext }) {
  const [mode, setMode] = React.useState('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  return (
    <div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', letterSpacing: '2px', color: 'rgba(196,146,58,0.6)', textTransform: 'uppercase', margin: '0 0 8px' }}>Krok 1</p>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#f5f0e8', margin: '0 0 32px', fontWeight: '400' }}>Zaloguj się lub utwórz konto</h2>

      <div style={{ display: 'flex', gap: 0, marginBottom: '32px', borderBottom: '1px solid rgba(196,146,58,0.15)' }}>
        {['signin','signup'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '10px 24px', background: 'none', border: 'none',
            borderBottom: `2px solid ${mode === m ? '#c4923a' : 'transparent'}`,
            color: mode === m ? '#c4923a' : 'rgba(245,240,232,0.4)',
            fontFamily: 'DM Sans, sans-serif', fontSize: '12px', letterSpacing: '1px',
            textTransform: 'uppercase', cursor: 'pointer', marginBottom: '-1px',
          }}>{m === 'signin' ? 'Logowanie' : 'Rejestracja'}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
        <Input label="E-mail" type="email" value={email} onChange={setEmail} required />
        <Input label="Hasło" type="password" value={password} onChange={setPassword} required />
        {mode === 'signup' && <Input label="Powtórz hasło" type="password" value="" onChange={() => {}} required />}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(196,146,58,0.15)' }} />
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', color: 'rgba(245,240,232,0.3)' }}>lub kontynuuj z</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(196,146,58,0.15)' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {['Google', 'Apple'].map(p => (
            <button key={p} style={{
              flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(196,146,58,0.2)', color: 'rgba(245,240,232,0.7)',
              fontFamily: 'DM Sans, sans-serif', fontSize: '12px', cursor: 'pointer', borderRadius: 0,
            }}>{p}</button>
          ))}
        </div>
      </div>

      <button onClick={onNext} style={{
        marginTop: '32px', padding: '14px 40px', background: '#c4923a', border: 'none',
        color: '#0d1b2e', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '700',
        letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0,
      }}>Dalej →</button>
    </div>
  );
}

const SWIMMING = [
  { value: '', label: 'Wybierz...' },
  { value: 'excellent', label: 'Doskonały pływak' },
  { value: 'good', label: 'Dobry pływak' },
  { value: 'basic', label: 'Podstawowy' },
  { value: 'none', label: 'Nie pływam' },
];
const EXPERIENCE = [
  { value: '', label: 'Wybierz...' },
  { value: 'skipper', label: 'Skipper / patent' },
  { value: 'crew', label: 'Doświadczony crew' },
  { value: 'beginner', label: 'Kilka rejsów' },
  { value: 'none', label: 'Pierwszy rejs' },
];

function Step2({ onNext, onBack }) {
  const [form, setForm] = React.useState({
    firstName: '', lastName: '', dob: '', nationality: 'PL',
    docType: 'passport', docNumber: '',
    emergencyName: '', emergencyPhone: '',
    swimming: '', experience: '', diet: '', medical: '',
  });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', letterSpacing: '2px', color: 'rgba(196,146,58,0.6)', textTransform: 'uppercase', margin: '0 0 8px' }}>Krok 2</p>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#f5f0e8', margin: '0 0 8px', fontWeight: '400' }}>Dane załogi</h2>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'rgba(245,240,232,0.4)', margin: '0 0 32px', maxWidth: '480px', lineHeight: '1.6' }}>
        Wymagane przez kapitana i władze portowe. Dane przechowywane bezpiecznie, widoczne tylko dla organizatora.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', maxWidth: '600px' }}>
        <Input label="Imię" value={form.firstName} onChange={set('firstName')} required />
        <Input label="Nazwisko" value={form.lastName} onChange={set('lastName')} required />
        <Input label="Data urodzenia" type="date" value={form.dob} onChange={set('dob')} required />
        <Input label="Narodowość" value={form.nationality} onChange={set('nationality')} required options={[{value:'PL',label:'Polska'},{value:'DE',label:'Niemcy'},{value:'UK',label:'Wielka Brytania'},{value:'other',label:'Inna'}]} />

        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(196,146,58,0.1)', paddingTop: '20px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(196,146,58,0.5)', margin: '0 0 16px' }}>Dokument tożsamości</p>
        </div>

        <Input label="Typ dokumentu" value={form.docType} onChange={set('docType')} options={[{value:'passport',label:'Paszport'},{value:'id',label:'Dowód osobisty'}]} />
        <Input label="Numer dokumentu" value={form.docNumber} onChange={set('docNumber')} required hint="Wymagane do rejestru jachtu" />

        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(196,146,58,0.1)', paddingTop: '20px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(196,146,58,0.5)', margin: '0 0 16px' }}>Kontakt alarmowy</p>
        </div>
        <Input label="Imię i nazwisko" value={form.emergencyName} onChange={set('emergencyName')} required />
        <Input label="Telefon" type="tel" value={form.emergencyPhone} onChange={set('emergencyPhone')} required />

        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(196,146,58,0.1)', paddingTop: '20px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(196,146,58,0.5)', margin: '0 0 16px' }}>Profil żeglarski</p>
        </div>
        <Input label="Umiejętności pływackie" value={form.swimming} onChange={set('swimming')} options={SWIMMING} />
        <Input label="Doświadczenie żeglarskie" value={form.experience} onChange={set('experience')} options={EXPERIENCE} />
        <Input label="Wymagania dietetyczne" type="textarea" value={form.diet} onChange={set('diet')} hint="Wegetarianizm, alergie, itp." />
        <Input label="Uwagi medyczne" type="textarea" value={form.medical} onChange={set('medical')} hint="Informacje istotne dla bezpieczeństwa" />
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
        <button onClick={onBack} style={{ padding: '14px 28px', background: 'none', border: '1px solid rgba(196,146,58,0.3)', color: 'rgba(245,240,232,0.6)', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}>← Wróć</button>
        <button onClick={onNext} style={{ padding: '14px 40px', background: '#c4923a', border: 'none', color: '#0d1b2e', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}>Dalej →</button>
      </div>
    </div>
  );
}

function Step3({ selectedBerth, selectedSegment, onNext, onBack }) {
  const seg = VOYAGE_SEGMENTS.find(s => s.id === selectedSegment) || VOYAGE_SEGMENTS[0];
  const cabin = CABINS.find(c => c.berths.includes(selectedBerth));
  return (
    <div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', letterSpacing: '2px', color: 'rgba(196,146,58,0.6)', textTransform: 'uppercase', margin: '0 0 8px' }}>Krok 3</p>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#f5f0e8', margin: '0 0 32px', fontWeight: '400' }}>Potwierdzenie rezerwacji</h2>
      <div style={{ maxWidth: '480px', border: '1px solid rgba(196,146,58,0.25)', padding: '0' }}>
        <div style={{ background: 'rgba(196,146,58,0.08)', padding: '20px 24px', borderBottom: '1px solid rgba(196,146,58,0.15)' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(196,146,58,0.6)', margin: '0 0 4px' }}>Rejs</p>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#f5f0e8', margin: 0 }}>Sail Adventure 2026</p>
        </div>
        {[
          ['Etap', seg.name],
          ['Termin', seg.dates],
          ['Czas trwania', `${seg.days} dni`],
          ['Koja', `${selectedBerth || 'A1'} — ${cabin?.label || 'Kabina A'}`],
          ['Pozycja', cabin?.position || 'Dziobowa'],
          ['Cena', `${seg.price.toLocaleString('pl-PL')} zł / osoba`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid rgba(196,146,58,0.08)' }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(245,240,232,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>{k}</span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#f5f0e8', fontWeight: '500' }}>{v}</span>
          </div>
        ))}
        <div style={{ padding: '14px 24px', background: 'rgba(196,146,58,0.05)' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', color: 'rgba(245,240,232,0.3)', margin: 0, lineHeight: '1.6' }}>
            Cena nie zawiera: kosztów dojazdu do mariny, opłat portowych i paliwa (ok. 150–200 EUR/os), ubezpieczenia turystycznego (ok. 250 zł/os).
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
        <button onClick={onBack} style={{ padding: '14px 28px', background: 'none', border: '1px solid rgba(196,146,58,0.3)', color: 'rgba(245,240,232,0.6)', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}>← Wróć</button>
        <button onClick={onNext} style={{ padding: '14px 40px', background: '#c4923a', border: 'none', color: '#0d1b2e', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}>Przejdź do płatności →</button>
      </div>
    </div>
  );
}

function Step4({ selectedSegment, onNext, onBack }) {
  const seg = VOYAGE_SEGMENTS.find(s => s.id === selectedSegment) || VOYAGE_SEGMENTS[0];
  const [card, setCard] = React.useState('');
  const [exp, setExp] = React.useState('');
  const [cvc, setCvc] = React.useState('');
  const [name, setName] = React.useState('');

  return (
    <div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', letterSpacing: '2px', color: 'rgba(196,146,58,0.6)', textTransform: 'uppercase', margin: '0 0 8px' }}>Krok 4</p>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#f5f0e8', margin: '0 0 32px', fontWeight: '400' }}>Płatność</h2>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1', minWidth: '280px', maxWidth: '380px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(196,146,58,0.08)', border: '1px solid rgba(196,146,58,0.2)', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(245,240,232,0.5)' }}>
              🔒 Płatność obsługiwana przez Stripe. Twoje dane są bezpieczne.
            </div>
            <Input label="Numer karty" value={card} onChange={setCard} hint="1234 5678 9012 3456" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="Data ważności" value={exp} onChange={setExp} hint="MM/RR" />
              <Input label="CVC" value={cvc} onChange={setCvc} hint="3 cyfry" />
            </div>
            <Input label="Imię i nazwisko na karcie" value={name} onChange={setName} required />
          </div>
        </div>

        <div style={{ width: '220px', padding: '20px', border: '1px solid rgba(196,146,58,0.2)', background: 'rgba(196,146,58,0.04)' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(196,146,58,0.6)', margin: '0 0 16px' }}>Podsumowanie</p>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '13px', color: 'rgba(245,240,232,0.8)', margin: '0 0 4px' }}>{seg.name}</p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(245,240,232,0.4)', margin: '0 0 20px' }}>{seg.dates}</p>
          <div style={{ borderTop: '1px solid rgba(196,146,58,0.15)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(245,240,232,0.4)' }}>Koja</span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#f5f0e8' }}>{seg.price.toLocaleString('pl-PL')} zł</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(196,146,58,0.15)', paddingTop: '12px', marginTop: '4px' }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '700', color: '#c4923a', letterSpacing: '1px' }}>RAZEM</span>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#c4923a' }}>{seg.price.toLocaleString('pl-PL')} zł</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
        <button onClick={onBack} style={{ padding: '14px 28px', background: 'none', border: '1px solid rgba(196,146,58,0.3)', color: 'rgba(245,240,232,0.6)', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}>← Wróć</button>
        <button onClick={onNext} style={{ padding: '14px 40px', background: '#c4923a', border: 'none', color: '#0d1b2e', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}>Zapłać {seg.price.toLocaleString('pl-PL')} zł →</button>
      </div>
    </div>
  );
}

function Step5({ selectedBerth, selectedSegment, onDashboard }) {
  const seg = VOYAGE_SEGMENTS.find(s => s.id === selectedSegment) || VOYAGE_SEGMENTS[0];
  return (
    <div style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto', paddingTop: '20px' }}>
      <div style={{ width: '64px', height: '64px', border: '2px solid #c4923a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', fontSize: '24px', color: '#c4923a' }}>✓</div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', letterSpacing: '3px', color: 'rgba(196,146,58,0.6)', textTransform: 'uppercase', margin: '0 0 12px' }}>Rezerwacja potwierdzona</p>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: '#f5f0e8', margin: '0 0 12px', fontWeight: '400' }}>Witaj na pokładzie!</h2>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'rgba(245,240,232,0.5)', margin: '0 0 40px', lineHeight: '1.7' }}>
        Koja <strong style={{ color: '#f5f0e8' }}>{selectedBerth || 'A1'}</strong> na etapie <strong style={{ color: '#f5f0e8' }}>{seg.name}</strong> ({seg.dates}) jest Twoja. Potwierdzenie zostało wysłane e-mailem.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button onClick={onDashboard} style={{ padding: '14px 32px', background: '#c4923a', border: 'none', color: '#0d1b2e', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}>Mój panel</button>
        <button style={{ padding: '14px 24px', background: 'none', border: '1px solid rgba(196,146,58,0.3)', color: 'rgba(245,240,232,0.6)', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}>↓ Pobierz PDF</button>
      </div>
    </div>
  );
}

function BookingFlow({ selectedBerth, selectedSegment, onBack: backToLanding, onDashboard }) {
  const [step, setStep] = React.useState(1);
  const next = () => setStep(s => Math.min(s + 1, 5));
  const back = () => step === 1 ? backToLanding() : setStep(s => s - 1);

  return (
    <div style={{ minHeight: '100vh', background: '#0d1b2e', padding: '60px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={backToLanding} style={{ background: 'none', border: 'none', color: 'rgba(196,146,58,0.5)', fontFamily: 'DM Sans, sans-serif', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', marginBottom: '40px', padding: 0 }}>← Wróć do strony głównej</button>
        <StepIndicator current={step} />
        {step === 1 && <Step1 onNext={next} />}
        {step === 2 && <Step2 onNext={next} onBack={back} />}
        {step === 3 && <Step3 selectedBerth={selectedBerth} selectedSegment={selectedSegment} onNext={next} onBack={back} />}
        {step === 4 && <Step4 selectedSegment={selectedSegment} onNext={next} onBack={back} />}
        {step === 5 && <Step5 selectedBerth={selectedBerth} selectedSegment={selectedSegment} onDashboard={onDashboard} />}
      </div>
    </div>
  );
}

Object.assign(window, { BookingFlow, VOYAGE_SEGMENTS });
