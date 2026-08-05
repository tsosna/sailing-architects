// Audyt kontrastu WCAG — wklej do konsoli przeglądarki na dowolnej stronie.
// Zwraca listę elementów tekstowych poniżej progu AA (4.5 zwykły / 3.0 duży).
//
// Ograniczenia (świadome):
// - tło liczone z łańcucha background-color przodków; ZDJĘCIA I <img> POD TEKSTEM NIE SĄ WIDZIANE
// - stany :hover / :focus / :active nigdy nie są wyrenderowane, więc nie są mierzone
// - elementy ukryte przy tej szerokości okna są pomijane — puść ponownie po resize
// - strony za logowaniem trzeba otworzyć zalogowanym
(() => {
	const srgb = (c) => {
		c /= 255;
		return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	};
	const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
	const parse = (s) => {
		const m = s.match(/[\d.]+/g);
		if (!m) return null;
		return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]];
	};
	const over = (fg, bg) => [0, 1, 2].map((i) => fg[3] * fg[i] + (1 - fg[3]) * bg[i]);
	const ratio = (a, b) => {
		const l1 = lum(a),
			l2 = lum(b);
		const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
		return (hi + 0.05) / (lo + 0.05);
	};

	function bgOf(el) {
		let layers = [],
			img = false,
			node = el;
		while (node) {
			const cs = getComputedStyle(node);
			if (cs.backgroundImage && cs.backgroundImage !== 'none') img = true;
			const c = parse(cs.backgroundColor);
			if (c && c[3] > 0) {
				layers.push(c);
				if (c[3] === 1) break;
			}
			node = node.parentElement;
		}
		let base = [255, 255, 255];
		for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
		return { rgb: base, img };
	}

	const out = [];
	document.querySelectorAll('*').forEach((el) => {
		const hasText = [...el.childNodes].some(
			(n) => n.nodeType === 3 && n.textContent.trim().length > 1
		);
		if (!hasText) return;
		const cs = getComputedStyle(el);
		if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
		const r = el.getBoundingClientRect();
		if (r.width === 0 || r.height === 0) return;
		const fg = parse(cs.color);
		if (!fg) return;
		const bg = bgOf(el);
		const eff = over(fg, bg.rgb);
		const size = parseFloat(cs.fontSize),
			weight = +cs.fontWeight || 400;
		const need = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
		const cr = ratio(eff, bg.rgb);
		if (cr < need)
			out.push({
				cr: +cr.toFixed(2),
				need,
				size,
				cls: (el.className && el.className.baseVal !== undefined
					? el.className.baseVal
					: el.className || ''
				)
					.toString()
					.replace(/svelte-\w+/g, '')
					.trim(),
				tag: el.tagName.toLowerCase(),
				color: cs.color,
				overImage: bg.img,
				text: el.textContent.trim().slice(0, 40)
			});
	});
	const seen = new Set();
	const uniq = out.filter((o) => {
		const k = o.tag + o.cls + o.color;
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
	console.table(uniq.sort((a, b) => a.cr - b.cr));
	return { path: location.pathname, width: innerWidth, total: uniq.length };
})();
