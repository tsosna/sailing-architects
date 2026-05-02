// crew-guide.js — wspólny moduł treści Q&A
// Źródło: docs/design/Q&A-sailing-architects.md
// Używany przez: landing page (featured FAQ) + /poradnik (pełny poradnik)

var CREW_GUIDE = {

  // ── KATEGORIE ────────────────────────────────────────────
  categories: [
    { id: 'przed-rejsem',   label: 'Przed rezerwacją',     icon: '◇' },
    { id: 'kto-plynie',     label: 'Kto płynie',           icon: '◇' },
    { id: 'zycie-na-pokladzie', label: 'Życie na pokładzie', icon: '◇' },
    { id: 'bezpieczenstwo', label: 'Bezpieczeństwo',       icon: '◇' },
    { id: 'logistyka',      label: 'Logistyka i koszty',   icon: '◇' },
    { id: 'pakowanie',      label: 'Co zabrać',            icon: '◇' },
  ],

  // ── CHECKLISTY ───────────────────────────────────────────
  checklists: {
    dokumenty: {
      title: 'Dokumenty',
      phase: '7 dni przed rejsem',
      items: [
        'Dowód osobisty lub paszport (ważny min. 6 miesięcy)',
        'Ubezpieczenie turystyczne z klauzulą sportów wodnych',
        'Leki osobiste z opisem dawkowania',
        'Karta EKUZ (jeśli płyniesz do krajów UE)',
        'Kontakt alarmowy — przekazany organizatorowi',
        'Patent żeglarski (jeśli posiadasz)',
      ]
    },
    pakowanie: {
      title: 'Pakowanie',
      phase: 'Co zabrać',
      items: [
        'Miękka torba — bez twardej walizki (nie ma gdzie schować)',
        'Sztormiak — kurtka i spodnie przeciwdeszczowe',
        'Ciepłe warstwy — nawet latem bywa chłodno na nocnych wachtach',
        'Buty z białą podeszwą — niezostawiające śladów na pokładzie',
        'Rękawiczki żeglarskie',
        'Czapka i komin na nocne wachty',
        'Krem UV + okulary przeciwsłoneczne z filtrem UV',
        'Latarka czołowa (najlepiej z czerwonym trybem nocnym)',
        'Leki na chorobę morską (np. Aviomarin)',
      ]
    },
    platnosci: {
      title: 'Płatności i formalności',
      phase: 'Po rezerwacji',
      items: [
        'Wpłata zaliczki w terminie wskazanym przez organizatora',
        'Wypełnienie formularza danych załogi (dane do rejestru jachtu)',
        'Podpisanie regulaminu rejsu',
        'Ustalenie preferencji kajutowych (damska / męska / mieszana)',
        'Poinformowanie o alergiach i wymaganiach dietetycznych',
        'Przekazanie kontaktu alarmowego',
        'Potwierdzenie środka transportu na miejsce startu',
      ]
    },
  },

  // ── PEŁNE Q&A pogrupowane tematycznie ────────────────────
  qa: [

    // PRZED REZERWACJĄ
    {
      id: 'q1', category: 'przed-rejsem', featured: true,
      phase: 'Przed rezerwacją',
      q: 'Czy to rejs dla początkujących?',
      a: 'Tak. Nie wymagamy wcześniejszego doświadczenia żeglarskiego. Każdy uczestnik przechodzi szkolenie z bezpieczeństwa oraz obsługi jachtu. Zostajesz pełnoprawnym członkiem załogi i bierzesz czynny udział we wszystkich czynnościach na jachcie.'
    },
    {
      id: 'q2', category: 'przed-rejsem', featured: true,
      phase: 'Przed rezerwacją',
      q: 'Czy trzeba mieć uprawnienia żeglarskie?',
      a: 'Nie. Jacht prowadzi kapitan z odpowiednimi kwalifikacjami. Jeśli jednak masz doświadczenie – będziesz mógł/mogła aktywnie uczestniczyć w prowadzeniu jednostki. Jeżeli masz patent lub planujesz kurs, daj nam znać — po rejsie wystawiamy opinię zgodną z wymogami PZŻ.'
    },
    {
      id: 'q3', category: 'przed-rejsem',
      phase: 'Przed rezerwacją',
      q: 'Czy trzeba być w bardzo dobrej kondycji fizycznej?',
      a: 'Nie trzeba być sportowcem, ale warto mieć podstawową sprawność. Na jachcie poruszamy się po przechylonym pokładzie, pracujemy przy linach i żaglach. Jeśli masz wątpliwości zdrowotne — skonsultuj je z nami przed rejsem.'
    },
    {
      id: 'q4', category: 'przed-rejsem',
      phase: 'Przed rezerwacją',
      q: 'Czy trzeba umieć pływać?',
      a: 'Nie jest to wymóg formalny. W trudnych warunkach stosujemy kamizelki ratunkowe, szelki bezpieczeństwa i lonże, którymi dopinamy się do jachtu. Umiejętność pływania jest przydatna, ale jej brak nie wyklucza.'
    },
    {
      id: 'q5', category: 'przed-rejsem', featured: true,
      phase: 'Przed rezerwacją',
      q: 'Czy można się wycofać w trakcie odcinka oceanicznego?',
      a: 'Podczas odcinka bez lądu nie ma możliwości zejścia na brzeg. Dlatego ważne jest świadome podjęcie decyzji o udziale i uczciwa rozmowa z organizatorem o ewentualnych wątpliwościach — najlepiej przed rezerwacją.'
    },

    // KTO PŁYNIE
    {
      id: 'q6', category: 'kto-plynie',
      phase: 'Przed rezerwacją',
      q: 'Jaki charakter ma rejs z załogą mieszaną?',
      a: 'To rejs integracyjny, oparty na współpracy, komunikacji i budowaniu relacji. Łączy przygodę, elementy rozwoju osobistego i pracę zespołową. Atmosfera jest swobodna i oparta na wzajemnym szacunku.'
    },
    {
      id: 'q7', category: 'kto-plynie', featured: true,
      phase: 'Przed rezerwacją',
      q: 'Jak wygląda kwestia kajut — czy kobiety i mężczyźni śpią osobno?',
      a: 'Kwestie zakwaterowania ustalane są przed rejsem indywidualnie. Możliwe są kajuty damskie, kajuty męskie lub kajuty mieszane (za zgodą uczestników). Jeżeli jedziesz w pojedynkę — dobieramy Ci towarzysza tej samej płci.'
    },
    {
      id: 'q8', category: 'kto-plynie',
      phase: 'Przed rezerwacją',
      q: 'Jadę sam/sama — z kim będę spać w kajucie?',
      a: 'Kajuty są dwuosobowe. Staramy się łączyć osoby tej samej płci, które nie znają się przed rejsem. W kajucie jest jeden materac dwuosobowy i dwa oddzielne zestawy pościeli.'
    },
    {
      id: 'q9', category: 'kto-plynie',
      phase: 'Przed rezerwacją',
      q: 'Dla kogo jest ten rejs?',
      a: 'Dla osób otwartych na nowe doświadczenia, gotowych na przygodę, ceniących relacje i wspólne działanie. Nie musisz być żeglarzem — musisz być gotowy na kilka dni bez lądu, bez zasięgu i bez ucieczki.'
    },

    // ŻYCIE NA POKŁADZIE
    {
      id: 'q10', category: 'zycie-na-pokladzie', featured: true,
      phase: 'Na pokładzie',
      q: 'Jak wygląda dzień na oceanie?',
      a: 'Dzień organizowany jest w systemie wacht. Wachty nawigacyjne trwają 4 godziny, potem 8 godzin odpoczynku — łącznie 2 warty i 2 przerwy na dobę. W czasie wachty: sterowanie, obserwacja, kontrola żagli, nauka nawigacji. Poza wachtą: sen, rozmowy, czytanie, wspólne gotowanie, obserwacja oceanu. Osobny cykl to wachty kambuzowe — przygotowanie 3 posiłków dziennie i sprzątanie.'
    },
    {
      id: 'q11', category: 'zycie-na-pokladzie',
      phase: 'Na pokładzie',
      q: 'Czy każdy musi brać udział w wachtach?',
      a: 'Tak — szczególnie na odcinku oceanicznym rejs to współpraca całej załogi. System wacht jest jednak dostosowany tak, by każdy miał czas na regenerację i czas dla siebie.'
    },
    {
      id: 'q12', category: 'zycie-na-pokladzie',
      phase: 'Na pokładzie',
      q: 'Jak wygląda wyżywienie?',
      a: 'Załoga wspólnie robi zakupy przed wypłynięciem, planując posiłki z góry. Gotujemy na zmianę w kambuzie podczas wacht kambuzowych. Na odcinek oceaniczny przygotowujemy zapasy długoterminowe. Dieta jest ustalana z uwzględnieniem alergii i preferencji żywieniowych.'
    },
    {
      id: 'q13', category: 'zycie-na-pokladzie',
      phase: 'Na pokładzie',
      q: 'Jak wygląda kwestia higieny osobistej?',
      a: 'Na jachcie są łazienki z prysznicem, ale ilość wody w zbiornikach jest ograniczona. Na odcinku oceanicznym mocno oszczędzamy wodę. W portach korzystamy z sanitariatów portowych — zazwyczaj dobrze utrzymanych.'
    },
    {
      id: 'q14', category: 'zycie-na-pokladzie',
      phase: 'Na pokładzie',
      q: 'Czy podczas rejsu spożywany jest alkohol?',
      a: 'Na odcinku oceanicznym obowiązują zaostrzone zasady: dozwolona rozsądna ilość alkoholu po zejściu z wachty, pod warunkiem pełnej trzeźwości 8 godzin przed kolejną wachtą. Absolutny zakaz alkoholu podczas wacht i trudnych warunków. W portach po zacumowaniu ograniczenia znikają — prosimy o rozsądek i umiar.'
    },
    {
      id: 'q15', category: 'zycie-na-pokladzie',
      phase: 'Na pokładzie',
      q: 'Czy będziemy obserwować nocne niebo?',
      a: 'Tak — brak światła z lądu daje niezwykłe warunki do obserwacji gwiazd. To jeden z najbardziej magicznych momentów rejsu oceanicznego, według uczestników niezapomniany.'
    },
    {
      id: 'q16', category: 'zycie-na-pokladzie',
      phase: 'Na pokładzie',
      q: 'Co jeśli pojawi się konflikt w załodze?',
      a: 'Rejs opiera się na jasnych zasadach komunikacji i szacunku. Kapitan i organizator dbają o dobrą atmosferę oraz mediację w razie potrzeby. Każdą sytuację da się rozwiązać.'
    },

    // BEZPIECZEŃSTWO
    {
      id: 'q17', category: 'bezpieczenstwo',
      phase: 'Przed rejsem',
      q: 'Jak wygląda kilkudniowy odcinek bez kontaktu z lądem?',
      a: 'Przez kilka dni jesteśmy wyłącznie na oceanie — bez widoku lądu, bez zasięgu telefonu, w pełnym rytmie morza. Życie organizuje się w systemie wacht, a czas płynie inaczej niż na lądzie. To najbardziej wyjątkowa i wymagająca część wyprawy.'
    },
    {
      id: 'q18', category: 'bezpieczenstwo',
      phase: 'Przed rejsem',
      q: 'Czy brak kontaktu z lądem jest bezpieczny?',
      a: 'Tak. Jacht wyposażony jest w łączność satelitarną, radio VHF, AIS, GPS i zapasowe systemy nawigacyjne, tratwę ratunkową oraz środki bezpieczeństwa zgodne z przepisami oceanicznymi. Kapitan monitoruje prognozy i podejmuje decyzje zgodnie z zasadą pełnego bezpieczeństwa.'
    },
    {
      id: 'q19', category: 'bezpieczenstwo',
      phase: 'Przed rejsem',
      q: 'Czy podczas rejsu będę mieć dostęp do internetu?',
      a: 'Na odcinku oceanicznym — nie. To świadomy element wyprawy. Na jachcie będzie internet satelitarny używany do monitorowania pogody i nawigacji. W bardzo pilnych sytuacjach możliwe będzie odebranie poczty lub połączenie przez WhatsApp.'
    },
    {
      id: 'q20', category: 'bezpieczenstwo',
      phase: 'Przed rejsem',
      q: 'Czy mogą wystąpić trudne warunki pogodowe?',
      a: 'Tak — to morze i ocean. Możemy doświadczyć silniejszego wiatru, fali czy deszczu. Jacht i kapitan są przygotowani na trudne warunki, a decyzje nawigacyjne zawsze podejmowane są z priorytetem bezpieczeństwa załogi.'
    },
    {
      id: 'q21', category: 'bezpieczenstwo',
      phase: 'Na pokładzie',
      q: 'Co z chorobą morską?',
      a: 'Nie każdy jej doświadcza. Zazwyczaj mija po 1–3 dniach. Warto zabrać leki przeciw chorobie lokomocyjnej, być na świeżym powietrzu, patrzeć w horyzont i pić dużo wody. Kapitan ma na pokładzie specjalistyczne tabletki na trudniejsze przypadki.'
    },

    // LOGISTYKA I KOSZTY
    {
      id: 'q22', category: 'logistyka', featured: true,
      phase: 'Przed rezerwacją',
      q: 'Co jest wliczone w cenę rejsu?',
      a: 'Cena zawiera: koszt czarteru jachtu, prowadzenie przez skippera, przygotowanie rejsu, ubezpieczenie rejsu, pamiątkową koszulkę z rejsu.'
    },
    {
      id: 'q23', category: 'logistyka', featured: true,
      phase: 'Przed rezerwacją',
      q: 'Co nie jest wliczone w cenę?',
      a: 'Poza ceną: dojazd na miejsce startu i powrót, wyżywienie, paliwo do jachtu i opłaty portowe (składka pokładowa ok. 150–200 EUR/os na 7 dni), koszty pamiątek i wydatki osobiste, ubezpieczenie turystyczne.'
    },
    {
      id: 'q24', category: 'logistyka',
      phase: 'Przed rezerwacją',
      q: 'Co to jest składka pokładowa?',
      a: 'Składka pokładowa jest zbierana od całej załogi (bez skippera) i pokrywa wspólne zakupy spożywcze, opłaty portowe i paliwo. Jeżeli po rejsie zostaje nie wykorzystana część — dzielimy ją i zwracamy załodze. Średnio na 7-dniowy rejs to 150–200 EUR/osobę.'
    },
    {
      id: 'q25', category: 'logistyka',
      phase: 'Po rezerwacji',
      q: 'Co daje rejs — jakie jest jego centrum?',
      a: 'Po kilku dniach bez lądu dzieje się coś niezwykłego. Znika napięcie, zostaje obecność. Uczestnicy mówią, że kilka dni na oceanie daje więcej refleksji niż rok na lądzie. Cisza, przestrzeń i współpraca w wymagających warunkach pozwalają spojrzeć na życie z innej perspektywy.'
    },

    // CO ZABRAĆ
    {
      id: 'q26', category: 'pakowanie', featured: false,
      phase: '7 dni przed rejsem',
      q: 'Co spakować na rejs oceaniczny?',
      a: 'Miękką torbę (bez twardej walizki), sztormiak (kurtka + spodnie), ciepłe warstwy, buty z białą podeszwą, rękawiczki żeglarskie, czapkę i komin, krem UV, okulary z filtrem UV, latarkę czołową (z czerwonym trybem), dokumenty i leki osobiste. Masz wątpliwości co do konkretnego przedmiotu? Zapytaj — chętnie odpiszemy.'
    },
    {
      id: 'q27', category: 'pakowanie',
      phase: '7 dni przed rejsem',
      q: 'Dlaczego nie można wziąć twardej walizki?',
      a: 'Na jachcie każdy centymetr przestrzeni jest na wagę złota. Twarda walizka zajmuje dużo miejsca i nie daje się schować w kojach ani schowkach. Miękka torba lub plecak da się zrolować i wepchnąć w dowolne miejsce.'
    },
  ],

  // ── FEATURED — 6-8 pytań na landing page ─────────────────
  get featured() {
    return this.qa.filter(q => q.featured);
  },
};

// Eksport globalny
window.CREW_GUIDE = CREW_GUIDE;
