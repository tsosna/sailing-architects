Przygotuj i wdrażaj ochronę przed masowym blokowaniem dostępności bez zakupu.
Najpierw sprawdź rzeczywisty model sprzedaży: co blokuje koszyk — miejsca, kabiny czy cały rejs — oraz jak działają wygaśnięcie, płatność i ponowienia.
Przyjmij wspólny kierunek:
- maksymalnie dwa aktywne koszyki/blokady na konto w całym Sailing; przed implementacją potwierdź, jak odpowiada to obecnemu modelowi;
- osobny limit ilości zasobu w koszyku, uwzględniający legalne rezerwacje rodzinne i grupowe;
- ograniczenie częstotliwości tworzenia nowych blokad, którego anulowanie lub wygaśnięcie nie zeruje;
- ponowienie tego samego żądania nie tworzy kolejnej blokady ani nie przedłuża czasu;
- IP jako dodatkowy sygnał, bez sztywnego limitu dwóch koszyków na IP;
- nierozstrzygnięta płatność nie zwalnia miejsc automatycznie, a ograniczenie nowych prób nie blokuje zakończenia istniejącej płatności.
Zaproponuj konkretne progi i wyjątki grupowe do zatwierdzenia. Kontrole egzekwuj atomowo na serwerze, także przy bezpośrednim wywołaniu API. Nie twórz wspólnego licznika z Amarrą ani hotel-booking.
Sprawdź równoległe żądania, anulowanie i ponawianie, duplikaty płatności, wspólne IP oraz izolację użytkowników. Dodaj czytelne komunikaty i podstawowe monitorowanie blokad bez zakupu. Zapisz zlecenie i backlog, następnie realizuj zatwierdzony zakres etapami. Nowe koszty, zasady biznesowe i Production wymagają konsultacji.