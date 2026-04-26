// Dashboard — user's booking summary + profile management

function Dashboard({ onBack }) {
	const [tab, setTab] = React.useState('booking')
	const booking = {
		seg: {
			name: 'Gibraltar → Madera',
			dates: '12–21.10.2026',
			days: 9,
			price: 2300
		},
		berth: 'B1',
		cabin: 'Kabina B',
		position: 'Rufowa lewa',
		status: 'confirmed',
		paid: true,
		ref: 'SA-2026-0047'
	}

	const TabBtn = ({ id, label }) => (
		<button
			onClick={() => setTab(id)}
			style={{
				padding: '10px 24px',
				background: 'none',
				border: 'none',
				borderBottom: `2px solid ${tab === id ? '#c4923a' : 'transparent'}`,
				color: tab === id ? '#c4923a' : 'rgba(245,240,232,0.4)',
				fontFamily: 'DM Sans, sans-serif',
				fontSize: '12px',
				letterSpacing: '1px',
				textTransform: 'uppercase',
				cursor: 'pointer',
				marginBottom: '-1px'
			}}
		>
			{label}
		</button>
	)

	return (
		<div
			style={{
				minHeight: '100vh',
				background: '#0d1b2e',
				padding: '60px 24px'
			}}
		>
			<div style={{ maxWidth: '860px', margin: '0 auto' }}>
				{/* Header */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						marginBottom: '48px',
						flexWrap: 'wrap',
						gap: '16px'
					}}
				>
					<div>
						<button
							onClick={onBack}
							style={{
								background: 'none',
								border: 'none',
								color: 'rgba(196,146,58,0.5)',
								fontFamily: 'DM Sans, sans-serif',
								fontSize: '11px',
								letterSpacing: '2px',
								textTransform: 'uppercase',
								cursor: 'pointer',
								padding: 0,
								marginBottom: '20px',
								display: 'block'
							}}
						>
							← Strona główna
						</button>
						<p
							style={{
								fontFamily: 'DM Sans, sans-serif',
								fontSize: '11px',
								letterSpacing: '3px',
								color: 'rgba(196,146,58,0.6)',
								textTransform: 'uppercase',
								margin: '0 0 6px'
							}}
						>
							Panel użytkownika
						</p>
						<h1
							style={{
								fontFamily: 'Playfair Display, serif',
								fontSize: '32px',
								color: '#f5f0e8',
								margin: 0,
								fontWeight: '400'
							}}
						>
							Cześć, Michał
						</h1>
					</div>
					<div
						style={{
							padding: '12px 20px',
							border: '1px solid rgba(196,146,58,0.25)',
							background: 'rgba(196,146,58,0.05)'
						}}
					>
						<p
							style={{
								fontFamily: 'DM Sans, sans-serif',
								fontSize: '9px',
								letterSpacing: '2px',
								textTransform: 'uppercase',
								color: 'rgba(196,146,58,0.5)',
								margin: '0 0 4px'
							}}
						>
							Numer rezerwacji
						</p>
						<p
							style={{
								fontFamily: 'Playfair Display, serif',
								fontSize: '20px',
								color: '#c4923a',
								margin: 0
							}}
						>
							{booking.ref}
						</p>
					</div>
				</div>

				{/* Tabs */}
				<div
					style={{
						borderBottom: '1px solid rgba(196,146,58,0.15)',
						marginBottom: '40px',
						display: 'flex'
					}}
				>
					<TabBtn id="booking" label="Rezerwacja" />
					<TabBtn id="profile" label="Dane załogi" />
					<TabBtn id="docs" label="Dokumenty" />
				</div>

				{/* Booking tab */}
				{tab === 'booking' && (
					<div>
						{/* Status banner */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								padding: '14px 20px',
								background: 'rgba(80,160,80,0.08)',
								border: '1px solid rgba(80,160,80,0.25)',
								marginBottom: '32px'
							}}
						>
							<div
								style={{
									width: '8px',
									height: '8px',
									background: '#50a050',
									borderRadius: '50%',
									flexShrink: 0
								}}
							/>
							<span
								style={{
									fontFamily: 'DM Sans, sans-serif',
									fontSize: '12px',
									color: 'rgba(245,240,232,0.7)',
									letterSpacing: '0.5px'
								}}
							>
								Rezerwacja potwierdzona · Płatność zrealizowana
							</span>
						</div>

						{/* Voyage card */}
						<div
							style={{
								border: '1px solid rgba(196,146,58,0.2)',
								marginBottom: '32px'
							}}
						>
							<div
								style={{
									padding: '20px 24px',
									background: 'rgba(196,146,58,0.06)',
									borderBottom: '1px solid rgba(196,146,58,0.12)'
								}}
							>
								<p
									style={{
										fontFamily: 'DM Sans, sans-serif',
										fontSize: '10px',
										letterSpacing: '2px',
										textTransform: 'uppercase',
										color: 'rgba(196,146,58,0.6)',
										margin: '0 0 4px'
									}}
								>
									Sail Adventure 2026
								</p>
								<h3
									style={{
										fontFamily: 'Playfair Display, serif',
										fontSize: '22px',
										color: '#f5f0e8',
										margin: 0,
										fontWeight: '400'
									}}
								>
									{booking.seg.name}
								</h3>
							</div>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))'
								}}
							>
								{[
									['Termin', booking.seg.dates],
									['Dni', booking.seg.days],
									['Koja', booking.berth],
									['Kabina', booking.cabin],
									['Pozycja', booking.position],
									['Cena', `${booking.seg.price.toLocaleString('pl-PL')} zł`]
								].map(([k, v]) => (
									<div
										key={k}
										style={{
											padding: '16px 20px',
											borderRight: '1px solid rgba(196,146,58,0.08)',
											borderBottom: '1px solid rgba(196,146,58,0.08)'
										}}
									>
										<p
											style={{
												fontFamily: 'DM Sans, sans-serif',
												fontSize: '9px',
												letterSpacing: '2px',
												textTransform: 'uppercase',
												color: 'rgba(196,146,58,0.45)',
												margin: '0 0 4px'
											}}
										>
											{k}
										</p>
										<p
											style={{
												fontFamily: 'DM Sans, sans-serif',
												fontSize: '14px',
												color: '#f5f0e8',
												margin: 0,
												fontWeight: '500'
											}}
										>
											{v}
										</p>
									</div>
								))}
							</div>
						</div>

						{/* Route timeline */}
						<div style={{ marginBottom: '32px' }}>
							<p
								style={{
									fontFamily: 'DM Sans, sans-serif',
									fontSize: '10px',
									letterSpacing: '2px',
									textTransform: 'uppercase',
									color: 'rgba(196,146,58,0.5)',
									margin: '0 0 16px'
								}}
							>
								Cała trasa rejsu
							</p>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 0,
									overflowX: 'auto',
									paddingBottom: '8px'
								}}
							>
								{[
									{ port: 'Palma de Mallorca', date: '4.10' },
									{ port: 'Gibraltar', date: '11.10', active: true },
									{ port: 'Madera', date: '21.10', active: true },
									{ port: 'Teneryfa', date: '31.10' },
									{ port: 'Cabo Verde', date: '14.11' }
								].map((p, i, arr) => (
									<React.Fragment key={p.port}>
										<div
											style={{
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												gap: '4px',
												minWidth: '80px'
											}}
										>
											<div
												style={{
													width: '10px',
													height: '10px',
													border: `1.5px solid ${p.active ? '#c4923a' : 'rgba(196,146,58,0.3)'}`,
													background: p.active ? '#c4923a' : 'transparent',
													transform: 'rotate(45deg)',
													flexShrink: 0
												}}
											/>
											<span
												style={{
													fontFamily: 'DM Sans, sans-serif',
													fontSize: '10px',
													color: p.active
														? '#f5f0e8'
														: 'rgba(245,240,232,0.35)',
													textAlign: 'center',
													lineHeight: '1.3'
												}}
											>
												{p.port}
											</span>
											<span
												style={{
													fontFamily: 'DM Sans, sans-serif',
													fontSize: '9px',
													color: p.active ? '#c4923a' : 'rgba(196,146,58,0.3)'
												}}
											>
												{p.date}
											</span>
										</div>
										{i < arr.length - 1 && (
											<div
												style={{
													flex: 1,
													height: '1px',
													background:
														i >= 1 && i <= 2
															? '#c4923a'
															: 'rgba(196,146,58,0.15)',
													minWidth: '24px',
													marginBottom: '30px'
												}}
											/>
										)}
									</React.Fragment>
								))}
							</div>
						</div>

						<div style={{ display: 'flex', gap: '12px' }}>
							<button
								style={{
									padding: '12px 28px',
									background: '#c4923a',
									border: 'none',
									color: '#0d1b2e',
									fontFamily: 'DM Sans, sans-serif',
									fontSize: '11px',
									fontWeight: '700',
									letterSpacing: '2px',
									textTransform: 'uppercase',
									cursor: 'pointer',
									borderRadius: 0
								}}
							>
								↓ Pobierz potwierdzenie
							</button>
							<button
								style={{
									padding: '12px 24px',
									background: 'none',
									border: '1px solid rgba(196,146,58,0.25)',
									color: 'rgba(245,240,232,0.5)',
									fontFamily: 'DM Sans, sans-serif',
									fontSize: '11px',
									letterSpacing: '2px',
									textTransform: 'uppercase',
									cursor: 'pointer',
									borderRadius: 0
								}}
							>
								Kontakt z organizatorem
							</button>
						</div>
					</div>
				)}

				{/* Profile tab */}
				{tab === 'profile' && (
					<div>
						<p
							style={{
								fontFamily: 'DM Sans, sans-serif',
								fontSize: '13px',
								color: 'rgba(245,240,232,0.4)',
								margin: '0 0 32px',
								lineHeight: '1.6'
							}}
						>
							Dane wymagane przez kapitana. Możesz je aktualizować do 30 dni
							przed rejsem.
						</p>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
								gap: '20px',
								maxWidth: '600px'
							}}
						>
							{[
								['Imię i nazwisko', 'Michał Kowalski'],
								['Data urodzenia', '15.03.1985'],
								['Narodowość', 'Polska'],
								['Typ dokumentu', 'Paszport'],
								['Numer dokumentu', 'AB 1234567'],
								['Kontakt alarmowy', 'Anna Kowalska'],
								['Tel. alarmowy', '+48 601 234 567'],
								['Umiejętności pływackie', 'Dobry pływak'],
								['Doświadczenie', 'Kilka rejsów']
							].map(([label, value]) => (
								<div
									key={label}
									style={{
										padding: '14px 16px',
										background: 'rgba(255,255,255,0.03)',
										borderLeft: '2px solid rgba(196,146,58,0.2)'
									}}
								>
									<p
										style={{
											fontFamily: 'DM Sans, sans-serif',
											fontSize: '9px',
											letterSpacing: '2px',
											textTransform: 'uppercase',
											color: 'rgba(196,146,58,0.45)',
											margin: '0 0 4px'
										}}
									>
										{label}
									</p>
									<p
										style={{
											fontFamily: 'DM Sans, sans-serif',
											fontSize: '13px',
											color: '#f5f0e8',
											margin: 0
										}}
									>
										{value}
									</p>
								</div>
							))}
						</div>
						<button
							style={{
								marginTop: '28px',
								padding: '12px 28px',
								background: 'none',
								border: '1px solid rgba(196,146,58,0.35)',
								color: '#c4923a',
								fontFamily: 'DM Sans, sans-serif',
								fontSize: '11px',
								letterSpacing: '2px',
								textTransform: 'uppercase',
								cursor: 'pointer',
								borderRadius: 0
							}}
						>
							Edytuj dane
						</button>
					</div>
				)}

				{/* Docs tab */}
				{tab === 'docs' && (
					<div>
						<p
							style={{
								fontFamily: 'DM Sans, sans-serif',
								fontSize: '13px',
								color: 'rgba(245,240,232,0.4)',
								margin: '0 0 32px'
							}}
						>
							Dokumenty do pobrania
						</p>
						{[
							{
								name: 'Potwierdzenie rezerwacji',
								date: '24.04.2026',
								type: 'PDF'
							},
							{ name: 'Regulamin rejsu', date: '01.01.2026', type: 'PDF' },
							{
								name: 'Lista rzeczy do zabrania',
								date: '01.01.2026',
								type: 'PDF'
							},
							{
								name: 'Plan trasy szczegółowy',
								date: '01.03.2026',
								type: 'PDF'
							}
						].map((doc) => (
							<div
								key={doc.name}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '16px 20px',
									border: '1px solid rgba(196,146,58,0.12)',
									marginBottom: '8px',
									cursor: 'pointer'
								}}
							>
								<div>
									<p
										style={{
											fontFamily: 'DM Sans, sans-serif',
											fontSize: '13px',
											color: '#f5f0e8',
											margin: '0 0 2px'
										}}
									>
										{doc.name}
									</p>
									<p
										style={{
											fontFamily: 'DM Sans, sans-serif',
											fontSize: '10px',
											color: 'rgba(245,240,232,0.3)',
											margin: 0
										}}
									>
										{doc.type} · {doc.date}
									</p>
								</div>
								<span
									style={{
										fontFamily: 'DM Sans, sans-serif',
										fontSize: '11px',
										color: '#c4923a',
										letterSpacing: '1px'
									}}
								>
									↓
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

Object.assign(window, { Dashboard })
