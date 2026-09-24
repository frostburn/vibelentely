# Vibelentely

Luolalennokki ja muokattava soluautomaattimaasto selaimessa. Peliruutu on aina **320 × 200 pikseliä**, kartta **640 × 400 solua**. Kuva suurennetaan kokonaislukukertoimella ilman pehmennystä; käyttöliittymä käyttää tavallista selainresoluutiota.

## Käynnistä

Avaa `dist/index.html` selaimessa. Asennuksia, palvelinta, ulkoisia kirjastoja tai verkkoyhteyttä ei tarvita.

Areena avautuu kaksintaisteluun tekoälyä vastaan. Molemmat lennokit odottavat ensimmäistä ohjausta. Tekoälyn voi kytkeä pois vapaata harjoittelua varten. **Lennä**-tilassa kamera seuraa sitä. **Muokkaa**-tilassa taistelu ja molemmat lennokit pysähtyvät; maastosimulaatio jatkuu ja maastoa voi maalata. Materiaalin valitseminen vaihtaa suoraan muokkaustilaan.

| Ohjain | Toiminto |
| --- | --- |
| ↑ / W | Moottorityöntö |
| ← / A, → / D | Käännä lennokkia |
| ↓ / S | Ilmajarru |
| J / vasen hiiri lentotilassa | Pulssitykki |
| K | Kranaatti |
| L | Painevesitykki |
| I / oikea hiiri lentotilassa | Pidä keulakilpeä |
| Q | Lähisiirtymä keulan suuntaan |
| R | Uusi erä: lennokit ja varusteet lähtötilaan; muokattu maasto ja pisteet säilyvät |
| E | Vaihda lentämisen ja muokkaamisen välillä |
| C | Kameran seuranta päälle / pois |
| Välilyönti | Tauko |
| Piste | Yksi simulaatioaskel |
| Shift+R / Alusta | Koko kartta, lennokit ja pisteet alusta |
| F | Koko näyttö |
| 1–8 | Valitse materiaali ja siirry muokkaamaan |
| Vasen hiiri / kosketus | Maalaa muokkaustilassa |
| Oikea hiiri | Kaiva muokkaustilassa |
| Hiiren rulla / [ ] | Siveltimen koko |
| WASD / nuolet muokkaustilassa | Siirrä kameraa |
| Shift + veto / keskimmäinen hiiri | Siirrä kameraa |

Kosketusohjaimet ovat peliruudun alla. Pienoiskartan napsautus siirtää näkymän ja vapauttaa kameran seurannasta. Muokkaustilassa myös R aloittaa kartan alusta.

Lennokilla on painovoima, liikemäärä, ilmanvastus ja runkovauriot. Vesi hidastaa, laava vastustaa liikettä huomattavasti voimakkaammin ja kuumentaa sitä. Putoavan hiekkavirran läpi pääsee lentämään pienellä vastuksella; asettunut hiekkakasa on kiinteää maastoa. Läpäisy ei poista hiekan soluja. Kova törmäys tai rungon tuhoutuminen voi jättää jäljen maastoon. Palautus etsii vapaan lähtöpaikan muuttamatta rakennettuja patoja ja tunneleita.

## Taistelu

Sininen lennokki on pelaaja, oranssi vastustaja. Keula määrää sekä työntövoiman että aseiden ja kilven suunnan. Vastustajan merkki näkyy myös pienoiskartalla ja peliruudun reunassa sen lentäessä näkymän ulkopuolelle.

| Varuste | Toiminta ja rajoitukset |
| --- | --- |
| Pulssitykki | Nopea sarjatuli, 9 runkovauriota osumasta. Kaivaa hiekkaa ja mutaa, sytyttää ruudin, pysähtyy kiveen. Lämpenee ammuttaessa ja jäähtyy itsestään. Ylikuumeneminen estää tulen, kunnes ase on jäähtynyt. |
| Kranaatti | Perii lennokin nopeuden, pomppii seinistä, räjähtää 1,4 sekunnissa tai osumasta lennokkiin virittymisen jälkeen. Rikkoo kiveä ja vahingoittaa myös ampujaa. Kolme latausta; yksi palautuu 4 sekunnissa. |
| Painevesi | Työntää lennokkia ja irtoainesta, jäähdyttää laavaa ja kastelee maastoa. Suihkulla on rekyyli. Säiliö riittää noin 4 sekunnin suihkuun ja täyttyy nopeasti jo matalassa vedessä. Ei suoraa runkovauriota. |
| Keulakilpi | Noin 140 asteen sektori keulan edessä. Pysäyttää pulssit ja veden, kimmottaa kranaatit ja vaimentaa edestä tulevan räjähdyksen. Kuluu ajan ja osumien myötä, estää oman tulituksen ja latautuu alhaalla. Ei suojaa laavalta tai törmäyksiltä. |
| Lähisiirtymä | Enintään 54 solua keulan suuntaan, lataus 4 sekuntia. Ylittää ohuen seinän; koko rungon pitää mahtua päätepisteeseen. Ei laskeudu laavaan, tuleen, kartan ulkopuolelle tai toiseen lennokkiin. Säilyttää liikemäärän. Epäonnistunut siirtymä ei kuluta latausta. Uusi siirtymä vaatii uuden painalluksen. |

Pieni risti näyttää lähisiirtymän vapaan päätepisteen sen ollessa valmis. Asepainikkeet näyttävät lämpötilan, panokset ja lataukset. Näppäimistön lisäksi kaikkia aseita ja kykyjä voi käyttää ruudun alapuolisista painikkeista.

Erä päättyy lennokin hajotessa. **R** aloittaa heti uuden erän samalla muokatulla maastolla ja päivittää molempien varusteet. **Shift+R** palauttaa myös kartan ja nollaa pisteet. Aineiden lähteet voi sulkea ja taistelun voi pysäyttää välilyönnillä; piste etenee yhden simulaatioaskeleen.

### Tekoäly

Vastustaja käyttää samaa `Drone`-fysiikkaa ja samoja ase-, kilpi- ja siirtymäfunktioita kuin pelaaja. Sillä ei ole ylimääräisiä runkopisteitä tai panoksia. Lentäminen perustuu ohjauskomentoihin, ei suoraan sijainnin muuttamiseen.

Ohjaaja etsii muokattavasta kartasta lennokin levyisiä reittejä ja ampumapaikkoja, väistää laavaa sekä laskee reitin uudelleen noin 0,65 sekunnin välein. Tähtäys käyttää 0,14 sekunnin välein havaittua sijaintia ja nopeutta. Se vuorottelee lentämistä ja tähtäämistä, torjuu lähestyviä ammuksia, käyttää vettä lähietäisyydeltä, pudottaa kranaatteja alaspäin ja yrittää siirtyä pois jumista tai vaarasta. Kartta ja pelaajan sijainti ovat sen tiedossa myös seinän takana, mutta se ei ammu ilman avointa näkölinjaa. Tämä on ensimmäinen pelattava vastustaja, ei vaikeustasojärjestelmä.

## Materiaalit

- **Hiekka:** putoaa rakeina ja kasautuu 45 asteen rinteiksi.
- **Vesi:** putoaa pisaroina ja tasaantuu avoimia reittejä pitkin lätäköiksi.
- **Muta:** yhdeksän solun säteinen koheesio ja pinnan hidas siirtyminen pyöristävät terävän huipun. Paino välittyy myös vinosti koskettaviin soluihin, joten jatkuva syöttö ei rakenna jäykkää neulaa. Myötöraja pysäyttää asettuneen köntin.
- **Laava:** solulla on täyttöaste (1/256-solun tarkkuus), lämpötila, virtaustila ja tieto viimeisestä sisäänvirtauksesta. Tilavuus siirtyy rajattuina virtauksina seuraavaan tilaan. Syötetty soluketju säilyttää ohuen yhdistävän kerroksen, joten reunan yli valuva virta pysyy koossa. Jäähtyminen tuottaa tummaa kiveä. Osittain täyttyneiden solujen tilavuus säilyy myös kivettyessä.
- **Höyry:** nousee ja hajoaa 1,5–2,5 sekunnissa. Kylmään kattoon osuvasta höyrystä pieni osa tiivistyy pisaroiksi; muu höyry poistuu simulaatiosta.
- **Ruuti:** valuu ja syttyy laavasta tai räjähdyksestä ketjureaktioksi.

Kaksintaisteluareenan ja luolan rinnalla on neljän saman kokoisen altaan koekenttä sekä tyhjä rakennuskenttä. Materiaalilähteet voi kytkeä pois vertailukokeita varten. Räjähdykset poistavat materiaalia tarkoituksella.

## Kehitys

Node.js 24 riittää tarkistuksiin ja vientiin. Riippuvuuksia ei tarvitse asentaa.

GitHub Actions ajaa alla olevat tarkistukset yhdellä Node 24 -työllä PR:issä sekä `main`-haaran päivityksissä. Uusi päivitys peruuttaa saman haaran vanhentuneen ajon.

```
npm run check
npm test
npm run export -- /absoluuttinen/polku/vibelentely.html
```

Vienti tuottaa yhden itsenäisen HTML-tiedoston. `dist/`-hakemiston voi myös palvella sellaisenaan millä tahansa staattisella web-palvelimella.

| Tiedosto | Vastuu |
| --- | --- |
| `dist/simulation.js` | Siementetty kartta, materiaalit, lämpö ja virtaus |
| `dist/flight.js` | Lennokin fysiikka, ainevastus, törmäykset ja lähtöpaikan etsintä |
| `dist/combat.js` | Aseet, ammusten törmäykset, kilpi, siirtymä, erät ja pisteet |
| `dist/ai.js` | Reitinhaku, tähtäys, lentäminen ja tekoälyn varustevalinnat |
| `dist/render.js` | Pikselipiirto, lennokin rasterisprite ja pienoiskartta |
| `dist/app.js` | Ohjaimet, kamera ja kiinteän aika-askeleen päivitys |
| `test/` | Materiaalien, lentämisen, taistelun ja tekoälyn regressiotestit |

Simulaatio käyttää 60 kiinteää aika-askelta sekunnissa myös näkymän ulkopuolella. Lennokin liike tarkistetaan alle solun pituisina osina, jotta ohut seinä ei jää nopean liikkeen väliin. Raskaimmissa tilanteissa simulaatio hidastuu rajattoman aikavelan keräämisen sijaan. Piirtonopeus ei muuta fysiikan askelpituutta. Konsolin `vibelentely`-olio tarjoaa maailman, lennokin, `combat`-taistelutilan, kameran ja ohjaustilan tarkasteltavaksi.

MIT-lisenssi. Katso `LICENSE`.
