# Prompt: Analiza Strategiczna DDD - Klasyfikacja Subdomen i Bounded Contexts

Jesteś ekspertem od Domain-Driven Design ze specjalizacją w fazie strategicznej (Strategic DDD). Twoim zadaniem jest analiza dostarczonego dokumentu strategicznego domeny biznesowej i przeprowadzenie wysokopoziomowej klasyfikacji zgodnie z wzorcami DDD.

## Kontekst
Pracujemy na poziomie strategicznym DDD, przygotowując fundamenty pod przyszłą implementację taktyczną. Analiza musi być wystarczająco szczegółowa, aby zespoły techniczne mogły na jej podstawie rozpocząć projektowanie architektury i podziału odpowiedzialności.

## Zadania do wykonania

### 1. Klasyfikacja Subdomen
Zidentyfikuj i sklasyfikuj wszystkie subdomeny według typologii:

**Core Subdomains** (Subdomeny Kluczowe)
- Unikalne capabilities dające przewagę konkurencyjną
- Obszary wymagające największej uwagi i najlepszych zasobów
- Uzasadnienie biznesowe dla każdej klasyfikacji

**Supporting Subdomains** (Subdomeny Wspierające)
- Niezbędne do funkcjonowania biznesu, ale nie dające przewagi
- Obszary możliwe do zbudowania wewnętrznie
- Potencjalne kandydaty do późniejszej standaryzacji

**Generic Subdomains** (Subdomeny Generyczne)
- Rozwiązania dostępne na rynku
- Kandydaci do outsourcingu lub użycia gotowych rozwiązań
- Rekomendacje narzędzi/usług zewnętrznych

Dla każdej subdomeny określ:
- Nazwę i zwięzły opis
- Klasyfikację z uzasadnieniem biznesowym
- Poziom złożoności (Low/Medium/High)
- Zmienność wymagań (Low/Medium/High)
- Priorytet implementacji

### 2. Identyfikacja Bounded Contexts
Wyodrębnij Bounded Contexts (konteksty ograniczone):

Dla każdego kontekstu zdefiniuj:
- **Nazwę** opisującą zakres odpowiedzialności
- **Boundaries** - jasne granice odpowiedzialności
- **Ubiquitous Language** - kluczowe terminy domenowe używane w kontekście
- **Odpowiedzialności** - co kontekst "posiada" i zarządza
- **Powiązanie z subdomenami** - który kontekst obsługuje które subdomeny
- **Autonomia** - poziom niezależności kontekstu (High/Medium/Low)

### 3. Context Mapping - Relacje między kontekstami
Zdefiniuj relacje używając wzorców DDD:

**Partnership** (Partnerstwo)
- Zespoły współpracują przy wspólnych celach
- Obustronny commitment do zmian

**Shared Kernel** (Wspólne jądro)
- Współdzielony kod/model
- Wymagana synchronizacja zespołów

**Customer-Supplier** (Klient-Dostawca)
- Upstream/Downstream z formalną współpracą
- Downstream wpływa na planning Upstream

**Conformist** (Konformista)
- Downstream akceptuje model Upstream
- Brak wpływu na Upstream

**Anticorruption Layer** (Warstwa antykorupcyjna)
- Izolacja od nieoptymalnych modeli
- Translacja między kontekstami

**Open Host Service** (Usługa otwartego hosta)
- Protokół integracyjny jako usługa
- API dla wielu konsumentów

**Published Language** (Język publikowany)
- Wspólny język wymiany danych
- Często w formie dokumentów/eventów

Przedstaw w formie:
- Diagram Mermaid kontekstów z zaznaczonymi relacjami
- Opis tekstowy każdej relacji
- Implikacje techniczne i organizacyjne
- Ryzyka każdej relacji

### 4. Integration Patterns
Określ strategie integracji:
- Synchroniczna vs Asynchroniczna
- Request-Response vs Event-Driven
- Konsekwencje wyboru dla konsystencji danych
- Bounded Context Events (kluczowe wydarzenia)

## Format odpowiedzi
- Używaj tabel Markdown dla klasyfikacji
- Diagramy w notacji tekstowej (Mermaid lub PlantUML)
- Sekcje z wyraźnymi nagłówkami
- Wypunktowania dla czytelności
- Callouts dla ważnych decyzji i ostrzeżeń

## Założenia
- Priorytetyzuj czytelność i poziom strategiczny nad technicznymi detalami
- Flaguj obszary wymagające dalszych konsultacji biznesowych
- Wskazuj trade-offs w decyzjach architektonicznych
- Myśl o długoterminowej ewolucji systemu
- Uwzględniaj ograniczenia zespołu (zespoły, budżet, czas)

## Analiza dokumentu
[TUTAJ WKLEJ DOKUMENT Z ANALIZĄ STRATEGICZNĄ]

---

Przeprowadź kompleksową analizę zgodnie z powyższymi wytycznymi. Pamiętaj: na tym etapie kształtujemy wyłącznie architekturę strategiczną.