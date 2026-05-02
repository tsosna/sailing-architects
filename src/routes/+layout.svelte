<script lang="ts">
	import '../app.css'
	import { setupConvex } from 'convex-svelte'
	import { ClerkProvider } from 'svelte-clerk'
	import { plPL } from '@clerk/localizations'
	import { PUBLIC_CONVEX_URL } from '$env/static/public'

	setupConvex(PUBLIC_CONVEX_URL)

	let { children } = $props()

	const clerkAppearance = {
		variables: {
			colorPrimary: '#c4923a',
			colorBackground: '#0d1b2e',
			colorText: '#f5f0e8',
			colorTextSecondary: 'rgba(245, 240, 232, 0.74)',
			colorInputBackground: '#162840',
			colorInputText: '#f5f0e8',
			colorInputBorder: 'rgba(212, 170, 90, 0.46)',
			fontFamily: 'DM Sans, system-ui, sans-serif',
			borderRadius: '2px'
		},
		elements: {
			card: {
				backgroundColor: '#07111e',
				border: '1px solid rgba(212, 170, 90, 0.46)',
				boxShadow: '0 28px 90px rgba(0, 0, 0, 0.34)'
			},
			formFieldLabel: {
				color: '#d4aa5a',
				fontSize: '12px',
				fontWeight: '600',
				letterSpacing: '0.04em'
			},
			formFieldInput: {
				backgroundColor: '#162840',
				borderColor: 'rgba(212, 170, 90, 0.46)',
				color: '#f5f0e8',
				fontSize: '14px'
			},
			formFieldInputShowPasswordButton: {
				color: '#d4aa5a'
			},
			formFieldInputShowPasswordIcon: {
				color: '#d4aa5a'
			},
			otpCodeFieldInput: {
				backgroundColor: '#162840',
				borderColor: 'rgba(212, 170, 90, 0.58)',
				color: '#f5f0e8',
				caretColor: '#d4aa5a'
			},
			identityPreviewEditButton: {
				color: '#d4aa5a'
			},
			formButtonPrimary: {
				backgroundColor: '#c4923a',
				color: '#07111e',
				fontWeight: '700',
				letterSpacing: '0.02em'
			},
			socialButtonsBlockButton: {
				height: '54px',
				backgroundColor: 'rgba(245, 240, 232, 0.08)',
				border: '1px solid rgba(212, 170, 90, 0.32)',
				color: '#f5f0e8'
			},
			socialButtonsIconButton: {
				width: '74px',
				height: '54px',
				backgroundColor: 'rgba(245, 240, 232, 0.08)',
				border: '1px solid rgba(212, 170, 90, 0.32)',
				color: '#f5f0e8'
			},
			socialButtonsBlockButton__icon: {
				width: '26px',
				height: '26px'
			},
			socialButtonsIconButton__icon: {
				width: '26px',
				height: '26px'
			},
			socialButtonsProviderIcon: {
				width: '26px',
				height: '26px'
			},
			dividerLine: {
				backgroundColor: 'rgba(212, 170, 90, 0.18)'
			},
			dividerText: {
				color: 'rgba(245, 240, 232, 0.52)'
			}
		}
	}
</script>

<ClerkProvider localization={plPL} appearance={clerkAppearance}>
	{@render children()}
</ClerkProvider>
