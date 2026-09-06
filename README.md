# 🏑 Salibandykello – Floorball Match Timer

> **🚀 Avaa sovellus verkossa / Live App:**  
> 👉 **[Pelikello](https://anssiha.github.io/floorballtimer-web/)**

Nykyaikainen, selkeä ja responsiivinen salibandyn ottelukello ja tulostaulukello, joka toimii suoraan selaimessa ja asennettavana PWA-sovelluksena (Progressive Web App) puhelimella, tabletilla sekä tietokoneella.

---

## 🌐 English Summary

**Floorball Timer** is a modern, lightweight, and touch-optimized match timer designed specifically for floorball games, scrimmages, tournaments, and practice sessions.

- **Configurable Match Formats:** 1 to 3 periods, standard presets (10, 15, 20 min) or custom duration, optional intermission breaks, and overtime.
- **Timer Direction:** Count-up (`00:00` → `20:00`) or count-down (`20:00` → `00:00`).
- **Realistic Arena Horn:** Web Audio API generated stadium buzzer horn — no external sound files required.
- **Screen Wake Lock:** Prevents screen dimming and sleeping while running and during play stoppages (with 15-minute inactivity safety).
- **Manual Time Adjustment:** Tap digits directly to fine-tune seconds and minutes on the fly.
- **Quick Controls:** Extra-large bench-friendly buttons and Spacebar shortcut for Start/Pause.
- **Persistent State:** Saves ongoing match state automatically to `localStorage` (safely resumes even after page reload).
- **PWA & Offline Ready:** Can be installed on Android, iOS, Windows, and macOS for full-screen offline use.
- **Bilingual:** Fully localized in Finnish (FI) and English (EN).

---

## 📖 Sovelluksen esittely

**Salibandykello** on suunniteltu erityisesti salibandyotteluiden toimitsijoille, valmentajille ja joukkueille. Sovellus tarjoaa ammattimaisen, selkeälukuisen ja helppokäyttöisen käyttöliittymän, joka toimii luotettavasti myös vaihtoaitiossa ja toimitsijapöydän äärellä kosketusnäytöltä tai näppäimistöltä.

Kello on optimoitu sekä vaakasuuntaisille että pystysuuntaisille näytöille ja skaalautuu automaattisesti aina puhelimen ruudulta suurelle toimitsijanäytölle tai TV-ruudulle.

---

## ✨ Pääominaisuudet

| Ominaisuus | Kuvaus |
| :--- | :--- |
| **Eräasetukset** | Valittavissa 1, 2 tai 3 erää. Pituuden pikavalinnat 10, 15 ja 20 minuuttia sekä vapaa minuuttiasetus (1–60 min). |
| **Erätauko** | Mahdollisuus ottaa käyttöön erätauko (5, 10, 12 tai 15 min tai oma valinta). Erän päätyttyä tauon voi käynnistää tai hypätä suoraan seuraavaan erään. |
| **Jatkoerä (Overtime)** | Valinnainen jatkoerä (5, 10 tai 20 min), joka aktivoituu varsinaisen peliajan päätyttyä. |
| **Ajan suunta** | Nouseva aika (`00:00` alkaen kohti erän päättymistä) tai perinteinen laskeva aika (`20:00` kohti nollaa). |
| **Hallisumutorvi** | Autenttinen monitaajuuksinen areenatorvi, joka soi erän ja ottelun päättyessä. Toteutettu suoraan Web Audio API:lla ilman raskaita äänitiedostoja. |
| **Ajan pikasäätö** | Aikanäyttöä napauttamalla aukeaa säätöikkuna, josta aikaa voi korjata välittömästi (+/-1 min, +/-10 s, +/-1 s tai suora syöttö). |
| **Screen Wake Lock** | Pitää mobiililaitteen tai tietokoneen näytön aktiivisena kellon käydessä sekä pelikatkoilla (tauolla), jottei näyttö sammu kesken erän. Sisältää 15 minuutin suojakatkaisun akun säästämiseksi. |
| **Välilyöntituki** | Välilyöntiä painamalla kello käynnistyy ja pysähtyy nopeasti ilman hiirtä. |
| **Värinäpalaute (Haptics)** | Värinäpalaute erän päättymisestä ja painalluksista tuetuilla mobiililaitteilla. |
| **Tilan tallennus** | Pelitilanne ja asetukset tallentuvat automaattisesti selaimeen. Vahingossa suljettu tai päivitetty sivu palauttaa käynnissä olevan ajan. |
| **PWA & Offline** | Voidaan asentaa laitteen kotivalikkoon ja toimii ilman verkkoyhteyttä. |
| **Kielituki** | Suomi (FI) ja englanti (EN). |

---

## 📋 Käyttöohje

### 1. Kellon käynnistäminen ja pysäyttäminen
- **Käynnistä / Pysäytä:** Paina suurta alareunan painiketta (**Aloita** / **Tauko** / **Jatka**).
- **Pikanäppäin:** Voit käynnistää ja pysäyttää kellon myös painamalla **Välilyöntiä** (Spacebar), kun mikään asetusikkuna ei ole auki.

### 2. Ajan säätäminen kesken pelin (Manuaalinen korjaus)
Jos kelloa täytyy korjata esimerkiksi tuomariston päätöksellä:
1. Pysäytä kello (**Tauko**).
2. **Napauta suurta aikanäyttöä** (minuutit ja sekunnit).
3. Säätöikkunassa voit:
   - Käyttää pikanappeja: `+1 min`, `-1 min`, `+10 s`, `-10 s`, `+1 s` tai `-1 s`.
   - Syöttää haluamasi minuutit ja sekunnit suoraan numerokenttiin.
4. Paina **Tallenna** ottaaksesi muutetun ajan käyttöön.

### 3. Erien vaihtuminen ja erätauko
- Kun eräaika täyttyy, summeri soi ja ruudulle ilmestyy ilmoitus erän päättymisestä.
- Paina **Kuittaa** sulkeaksesi hälytyksen.
- Pääpainike vaihtuu automaattisesti seuraavaan toimintoon:
  - Jos **erätauko** on käytössä, painike ehdottaa erätauon aloittamista. Voit joko aloittaa erätauon laskennan tai valita *Siirry suoraan seuraavaan erään*.
  - Jos taukoa ei ole käytössä, painike siirtää suoraan seuraavaan erään (**Seuraava erä**).
  - Viimeisen erän jälkeen painike tarjoaa **Aloita jatkoerä** (mikäli jatkoerä on kytketty päälle) tai **Päätä ottelu**.

### 4. Otteluasetusten muuttaminen
Paina oikeassa yläkulmassa olevaa rataskuvaketta (**⚙️ Asetukset**). Asetuksista voit säätää:
- **Kieli:** Suomi tai English.
- **Erien määrä:** 1, 2 tai 3 erää.
- **Erän pituus:** 10, 15, 20 minuuttia tai oma valintasi (*Muu...*).
- **Erätauko:** Kytke erätauko päälle/pois ja aseta sen pituus (5, 10, 12, 15 min tai oma valinta).
- **Jatkoerä:** Kytke jatkoerä päälle/pois ja valitse sen kesto (5, 10 tai 20 min).
- **Ajan suunta:** Nouseva (`00:00 ->`) tai Laskeva (`-> 00:00`).
- **Sumutorvi / Ääni:** Kytke äänimerkki päälle/pois sekä testaa summeria painikkeesta **📢 Testaa sumutorvea**.
- **Värinäpalaute:** Kytke haptinen palaute päälle tai pois.
- **Näyttö päällä pelikatkoilla:** Estää näytön sammumisen myös pelikatkoilla (tauolla).

### 5. Erän tai ottelun nollaus
Pääpainikkeen vieressä on nollauspainike (**Nollaa**):
- **Nollaa tämä erä:** Palauttaa kuluvan erän aloitusajan, mutta säilyttää ottelun tilanteen ja pelatut erät.
- **Nollaa koko ottelu:** Nollaa koko ottelukellon takaisin 1. erän alkuun.
> Molemmat nollaukset kysyvät varmistuksen ennen toimenpidettä.

### 6. Asentaminen laitteelle (PWA)
Salibandykelloa voi käyttää sellaisenaan selaimessa tai asentaa täyden ruudun sovellukseksi:
- **Android (Chrome):** Avaa sivusto Chromella, avaa valikko (⋮) ja valitse **Lisää aloitusnäyttöön** tai **Asenna sovellus**.
- **iOS (Safari):** Avaa sivu Safarilla, paina jakopainiketta (neliö ja nuoli ylös) ja valitse **Lisää Koti-valikkoon**.
- **Tietokone (Chrome / Edge):** Osoiterivin oikeaan reunaan ilmestyy asennuskuvake (Asenna Salibandykello).

---

## 🛠 Tekninen toteutus & Kehitys

Sovellus on toteutettu moderneilla verkkoteknologioilla ilman ulkoisia UI-kirjastoja, jotta suorituskyky pysyy maksimaalisena:

- **React 19** – Käyttöliittymäkomponentit ja tilanhallinta
- **TypeScript** – Vahva tyypitys
- **Vite 8** – Nopea kehitysympäristö ja optimoitu tuotantopaketointi
- **Web Audio API** – Syntetisoitu hallisummeri ilman äänitiedostoja
- **Screen Wake Lock API** – Näytön virransäästön esto
- **Vanilla CSS** – Räätälöity tumma ja selkeä design-järjestelmä
- **Oxlint** – Erittäin nopea koodin staattinen analyysi

### Paikallinen kehitys

Asenna riippuvuudet ja käynnistä kehityspalvelin:

```bash
# Asenna riippuvuudet
npm install

# Käynnistä paikallinen kehityspalvelin
npm run dev

# Tarkista koodin laatu (lint)
npm run lint

# Rakenna tuotantoversio
npm run build

# Esikatsele tuotantoversiota paikallisesti
npm run preview
```

---

## 📄 Lisenssi

Tämä projekti on yksityinen / vapaasti hyödynnettävissä omiin salibandyotteluihin ja turnauksiin.
