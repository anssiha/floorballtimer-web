# 🏑 Salibandykello – Floorball Match Timer

> **🚀 Avaa sovellus verkossa / Live App:**  
> 👉 **[Pelikello](https://anssiha.github.io/floorballtimer-web/)**

Nykyaikainen, selkeä ja responsiivinen salibandyn ottelukello ja tulostaulukello, joka toimii suoraan selaimessa ja asennettavana PWA-sovelluksena (Progressive Web App) puhelimella, tabletilla sekä tietokoneella.
 
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
| **Ajan suunta** | Tarkka nouseva aika (`00:00` alkaen kohti erän päättymistä) tai perinteinen laskeva aika (`20:00` kohti nollaa). |
| **Ajan suorasäätö (+ / −)** | Kellon molemmin puolin sijoitetut kookkaat `+` ja `−` -painikkeet minuuteille (`min`) ja sekunneille (`sek`). Tukee kerta-napautusta (1 yksikkö) sekä pitkää painallusta kiihtyvällä säädöllä ilman erillisiä ponnahdusikkunoita. |
| **Pelikatkon huomiovalo** | Erän ollessa pysähdyksissä (`Tauko`) kellotauluun syttyy huomiota herättävä sykkivä oranssi valokehys ja **PELIKATKO**-tilaruutu. Erätauoilla merkkivalo ei häiritse. |
| **Saumaton erän päättyminen** | Erän päättyessä ei tule ruutua peittäviä ikkunoita: pääpainike vaihtuu suoraan toimintoon *Aloita erätauko* tai *Seuraava erä*. Aikaa voi myös säätää suoraan taaksepäin (`−`), jos kello ehti käydä liian pitkälle. |
| **Screen Wake Lock** | Pitää mobiililaitteen tai tietokoneen näytön aktiivisena kellon käydessä sekä pelikatkoilla (tauolla), jottei näyttö sammu kesken erän. Sisältää 15 minuutin suojakatkaisun akun säästämiseksi. |
| **Maalivahtien torjunnat** | Koti- ja vierasjoukkueen maalivahtien torjuntalaskurit suoraan päänäytöllä. Nopea `+1` / `-1` -kirjaus, tuki maalivahdin vaihdolle ja eräkohtainen torjuntayhteenveto pöytäkirjaa varten. |
| **Erittäin kookas pääpainike** | Korkea ja leveä alareunan toimintopainike, johon osuu helposti myös vaihtoaitio-olosuhteissa. |
| **Välilyöntituki** | Välilyöntiä painamalla kello käynnistyy ja pysähtyy nopeasti ilman hiirtä. |
| **Värinäpalaute (Haptics)** | Värinäpalaute erän päättymisestä ja painalluksista tuetuilla mobiililaitteilla. |
| **Tilan tallennus** | Pelitilanne ja asetukset tallentuvat automaattisesti selaimeen. Vahingossa suljettu tai päivitetty sivu palauttaa käynnissä olevan ajan. |
| **PWA & Offline** | Voidaan asentaa laitteen kotivalikkoon ja toimii ilman verkkoyhteyttä. |
| **Kielituki** | Suomi (FI) ja englanti (EN). |

---

## 📋 Käyttöohje

### 1. Kellon käynnistäminen ja pysäyttäminen
- **Käynnistä / Pysäytä:** Paina erittäin suurta alareunan pääpainiketta (**Aloita** / **Tauko** / **Jatka**).
- **Pelikatkon huomiovalo (PELIKATKO):** Kellon ollessa pysähdyksissä erän aikana kellotauluun syttyy huomiota herättävä sykkivä oranssi valokehys sekä **⏸ PELIKATKO** -tilaruutu. Erätauoilla merkkivalo pysyy poissa.
- **Pikanäppäin:** Voit käynnistää ja pysäyttää kellon myös painamalla **Välilyöntiä** (Spacebar), kun mikään asetusikkuna ei ole auki.

### 2. Ajan säätäminen kesken pelin (Suorasäätö)
Jos kelloa täytyy korjata esimerkiksi tuomariston päätöksellä tai vihellyksen myöhästyessä:
1. Pysäytä kello (**Tauko**). Kellotaulun ympärille syttyy oranssi **PELIKATKO**-merkkivalo.
2. Käytä suoraan aikanäytön molemmin puolin sijaitsevia säätöpainikkeita:
   - **Minuutit (vasen puoli, `min`):** `+` lisää minuutin, `−` vähentää minuutin.
   - **Sekunnit (oikea puoli, `sek`):** `+` lisää sekunnin, `−` vähentää sekunnin.
3. **Kertapainallus vs. pohjassa pitäminen (kiihtyvä säätö):**
   - Yksittäinen napautus siirtää aikaa tasan 1 sekunnin tai 1 minuutin.
   - Pitämällä painiketta pohjassa säätö alkaa rauhallisesti (helppo pysäyttää tarkasti esim. 3–5 sekuntiin), nopeutuu 1,5 sekunnin jälkeen ja kiihtyy täyteen vauhtiin 3 sekunnin jälkeen.
   - Sormen tai hiiren vapauttaminen pysäyttää ajan rullauksen välittömästi.
4. **Erärajat:** Aika on suojattu automaattisesti kuluvan erän aikarajoihin, joten aika ei voi vahingossa liukua edellisen tai seuraavan erän puolelle.

### 3. Erien vaihtuminen ja erätauko
- Kun eräaika täyttyy, puhelin värisee, kello vilkkuu ja tilaruutuun vaihtuu *Erä päättynyt*.
- **Ei ruutua peittäviä ponnahdusikkunoita:** Näyttö ja kellonsäätimet pysyvät täysin esteettöminä ja käytettävissä.
- Pääpainike vaihtuu automaattisesti seuraavaan toimintoon:
  - Jos **erätauko** on käytössä: **Aloita erätauko** (painikkeesta aukeavasta valikosta voi valita myös *Ohita erätauko*).
  - Jos taukoa ei ole käytössä: **Seuraava erä**.
- **Erätauko** käynnistyy heti ja lasketaan alaspäin (esim. `10:00 → 00:00`). Taukoa ei voi pysäyttää, mutta aikaa voi korjata `+`/`−`-painikkeilla. Pääpainike **Seuraava erä** päättää tauon etuajassa (varmistuksen jälkeen) ja siirtää kellon seuraavan erän alkuun.
  - Viimeisen erän jälkeen: **Aloita jatkoerä** (mikäli jatkoerä on kytketty päälle) tai **Päätä ottelu**.
- **Ajan korjaus erän päättyessä:** Jos kello ehti käydä erän loppuun (esim. `20:00`) liian aikaisin, paina suoraan sekuntien `−`-painiketta (esim. aikaan `19:55`). Kello palaa heti tilaan **Tauko** (PELIKATKO) ja pääpainikkeeksi vaihtuu **Jatka**, jolloin peliä voi jatkaa välittömästi.

### 4. Otteluasetusten muuttaminen
Paina oikeassa yläkulmassa olevaa rataskuvaketta (**⚙️ Asetukset**). Muutokset tallentuvat heti; sulje näkymä painikkeella **Valmis**. Asetukset on jaettu kolmeen osioon:

**Ottelu**
- **Erät:** 1, 2 tai 3 erää.
- **Erän pituus:** 10, 15, 20 minuuttia tai oma valintasi (*Muu...*).
- **Kello:** Nouseva (esim. `00:00 → 60:00`) tai Laskeva (esim. `20:00 → 00:00`).
- **Erätauko:** Kytke erätauko päälle/pois ja aseta sen pituus (5, 10, 12, 15 min tai oma valinta). Tauko lasketaan aina alaspäin (esim. `10:00 → 00:00`) ja käynnistyy heti, kun painat **Aloita erätauko**.
- **Jatkoerä:** Kytke jatkoerä päälle/pois ja valitse sen kesto (5, 10, 20 min tai oma valinta).

> Kun ottelu on aloitettu, erien määrää, erän pituutta ja kellon suuntaa ei voi muuttaa ennen kuin ottelu nollataan. Erätauon ja jatkoerän asetuksia voi muuttaa kesken ottelun, paitsi silloin kun tauko tai jatkoerä on käynnissä.

**Seuranta**
- **Maalivahtien torjunnat:** Kytke torjuntalaskurikortit näkyviin tai pois päänäytöltä.

**Laite**
- **Kieli:** Suomi tai English.
- **Näyttö päällä pelikatkoilla:** Estää näytön sammumisen myös pelikatkoilla (tauolla).
- **Värinäpalaute:** Kytke haptinen palaute päälle tai pois.

### 5. Korjaukset ja uusi ottelu
Pääpainikkeen vieressä on **Korjaa**-painike, josta avautuu valikko pelin aikaisia korjauksia varten:
- **⏪ Edellinen erä:** Palauttaa kellon edellisen erän loppuun taukotilaan (näkyy 2. tai 3. erässä, tauolla ja jatkoerässä). Peruu vahingossa liian aikaisin aloitetun erän.
- **Nollaa tämä erä:** Palauttaa kuluvan erän aloitusaikaan ja nollaa erän torjunnat. Pelatut erät säilyvät.
- **⏪ Peru ottelun päättyminen:** Näkyy, kun ottelu on päätetty. Palauttaa viimeisen erän loppuun.

Koko ottelun nollaus:
- Kun ottelu on päättynyt, pääpainikkeeksi vaihtuu **Uusi ottelu**.
- Kesken ottelun koko ottelun voi nollata asetuksista (**Nollaa koko ottelu**).
- Uusi ottelu nollaa kellon ja torjunnat. Joukkueiden nimet ja maalivahdit säilyvät.

> Kaikki nollaustoiminnot kysyvät varmistuksen ennen toimenpidettä.

### 6. Asentaminen laitteelle (PWA)
Salibandykelloa voi käyttää sellaisenaan selaimessa tai asentaa täyden ruudun sovellukseksi:
- **Android (Chrome):** Avaa sivusto Chromella, avaa valikko (⋮) ja valitse **Lisää aloitusnäyttöön** tai **Asenna sovellus**.
- **iOS (Safari):** Avaa sivu Safarilla, paina jakopainiketta (neliö ja nuoli ylös) ja valitse **Lisää Koti-valikkoon**.
- **Tietokone (Chrome / Edge):** Osoiterivin oikeaan reunaan ilmestyy asennuskuvake (Asenna Salibandykello).

### 7. Maalivahtien torjuntojen kirjaaminen
Kun torjuntalaskuri on käytössä:
- **Lisää torjunta (+1):** Napauta koti- tai vierasjoukkueen suurta torjuntapainiketta. Laskuri kasvattaa kuluvan erän torjuntoja ja näyttää samalla ottelun kokonaistorjunnat.
- **Peruuta / vähennä (-1):** Napauta kortin alakulman `−1`-painiketta, jos kirjasit torjunnan vahingossa.
- **Joukkueen nimi:** Napauta joukkueen nimeä (tai maalivahtipainiketta) ja kirjoita nimi kohtaan *Joukkueen nimi*. Tyhjä nimi näytetään muodossa *Koti* / *Vieras*.
- **Vaihda maalivahti:** Napauta joukkueen maalivahtipainiketta (esim. `🥅 #1 ▾`). Avautuvasta valikosta voit:
  - Valita joukkueen toisen aiemmin pelanneen maalivahdin.
  - Lisätä uuden maalivahdin numeron tai nimen (esim. `#30`), jolloin torjunnat alkavat kertyä tälle maalivahdille.
- **Eräkohtainen torjuntayhteenveto:** Korttien alareunassa näkyy kuluvan erän numero ja joukkueen kokonaistorjunnat; maalivahtivalikossa näkyvät maalivahtikohtaiset kokonaismäärät.

---

## 🛠 Tekninen toteutus & Kehitys

Sovellus on toteutettu moderneilla verkkoteknologioilla ilman ulkoisia UI-kirjastoja, jotta suorituskyky pysyy maksimaalisena:

- **React 19** – Käyttöliittymäkomponentit ja tilanhallinta
- **TypeScript** – Vahva tyypitys
- **Vite 8** – Nopea kehitysympäristö ja optimoitu tuotantopaketointi
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

## 🌐 English Summary

**Floorball Timer** is a modern, lightweight, and touch-optimized match timer designed specifically for floorball games, scrimmages, tournaments, and practice sessions.

- **Configurable Match Formats:** 1 to 3 periods, standard presets (10, 15, 20 min) or custom duration, optional intermission breaks, and overtime.
- **Timer Direction:** Accurate count-up (`00:00` → `20:00`) or count-down (`20:00` → `00:00`).
- **Direct On-Screen Steppers:** Symmetrical `+` and `−` unit buttons on the clock face for both **minutes** and **seconds** with smart hold-to-accelerate (smooth single taps or fast scrolling with instant stop on release).
- **Clear "Game Stopped" (PELIKATKO) Indicator:** High-contrast pulsing amber glowing border and status badge when play is stopped during active periods.
- **Seamless Period Flow:** No screen-blocking popups at period end; the primary button dynamically offers "Start Break" or "Next Period", while `-` buttons let you easily pull time back if the clock ran too far.
- **Bench-Friendly Controls:** Extra-tall Start/Pause button (`clamp(126px, 18vh, 150px)`) and Spacebar shortcut.
- **Screen Wake Lock:** Prevents screen dimming and sleeping while running and during play stoppages (with 15-minute inactivity safety).
- **Goalie Saves Tracker:** Track saves per period for home and away goalies directly on the main screen, with support for mid-game goalie changes and period summaries.
- **Persistent State:** Saves ongoing match state automatically to `localStorage` (safely resumes even after page reload).
- **PWA & Offline Ready:** Can be installed on Android, iOS, Windows, and macOS for full-screen offline use.
- **Bilingual:** Fully localized in Finnish (FI) and English (EN).

---

## 📄 Lisenssi

Tämä projekti on yksityinen / vapaasti hyödynnettävissä omiin salibandyotteluihin ja turnauksiin.
