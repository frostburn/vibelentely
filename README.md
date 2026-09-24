# Vibelentely

Luolalennokki ja muokattava soluautomaattimaasto selaimessa. Peliruutu on aina **320 × 200 pikseliä**, kartta **640 × 400 solua**. Kuva suurennetaan kokonaislukukertoimella ilman pehmennystä; käyttöliittymä käyttää tavallista selainresoluutiota.

## Käynnistä

Avaa `dist/index.html` selaimessa. Asennuksia, palvelinta, ulkoisia kirjastoja tai verkkoyhteyttä ei tarvita.

Lennokki odottaa ensimmäistä ohjausta. **Lennä**-tilassa kamera seuraa sitä. **Muokkaa**-tilassa lennokki pysähtyy ja maastoa voi maalata. Materiaalin valitseminen vaihtaa suoraan muokkaustilaan.

| Ohjain | Toiminto |
| --- | --- |
| ↑ / W | Moottorityöntö |
| ← / A, → / D | Käännä lennokkia |
| ↓ / S | Ilmajarru |
| R | Uusi lennokki lähtöpaikalle; muokattu maasto säilyy |
| E | Vaihda lentämisen ja muokkaamisen välillä |
| C | Kameran seuranta päälle / pois |
| Välilyönti | Tauko |
| Piste | Yksi simulaatioaskel |
| Shift+R / Alusta | Koko kartta ja lennokki alusta |
| F | Koko näyttö |
| 1–8 | Valitse materiaali ja siirry muokkaamaan |
| Vasen hiiri / kosketus | Maalaa muokkaustilassa |
| Oikea hiiri | Kaiva muokkaustilassa |
| Hiiren rulla / [ ] | Siveltimen koko |
| WASD / nuolet muokkaustilassa | Siirrä kameraa |
| Shift + veto / keskimmäinen hiiri | Siirrä kameraa |

Kosketusohjaimet ovat peliruudun alla. Pienoiskartan napsautus siirtää näkymän ja vapauttaa kameran seurannasta. Muokkaustilassa myös R aloittaa kartan alusta.

Lennokilla on painovoima, liikemäärä, ilmanvastus ja runkovauriot. Vesi hidastaa ja laava kuumentaa sitä. Kova törmäys tai rungon tuhoutuminen voi jättää jäljen maastoon. Palautus etsii vapaan lähtöpaikan muuttamatta rakennettuja patoja ja tunneleita.

## Materiaalit

- **Hiekka:** putoaa rakeina ja kasautuu 45 asteen rinteiksi.
- **Vesi:** putoaa pisaroina ja tasaantuu avoimia reittejä pitkin lätäköiksi.
- **Muta:** yhdeksän solun säteinen koheesio ja pinnan hidas siirtyminen pyöristävät terävän huipun. Paino välittyy myös vinosti koskettaviin soluihin, joten jatkuva syöttö ei rakenna jäykkää neulaa. Myötöraja pysäyttää asettuneen köntin.
- **Laava:** solulla on täyttöaste (1/256-solun tarkkuus), lämpötila, virtaustila ja tieto viimeisestä sisäänvirtauksesta. Tilavuus siirtyy rajattuina virtauksina seuraavaan tilaan. Syötetty soluketju säilyttää ohuen yhdistävän kerroksen, joten reunan yli valuva virta pysyy koossa. Jäähtyminen tuottaa tummaa kiveä. Osittain täyttyneiden solujen tilavuus säilyy myös kivettyessä.
- **Höyry:** nousee ja hajoaa 1,5–2,5 sekunnissa. Kylmään kattoon osuvasta höyrystä pieni osa tiivistyy pisaroiksi; muu höyry poistuu simulaatiosta.
- **Ruuti:** valuu ja syttyy laavasta tai räjähdyksestä ketjureaktioksi.

Luolan rinnalla on neljän saman kokoisen altaan koekenttä sekä tyhjä rakennuskenttä. Materiaalilähteet voi kytkeä pois vertailukokeita varten. Räjähdykset poistavat materiaalia tarkoituksella.

## Kehitys

Node.js 24 riittää tarkistuksiin ja vientiin. Riippuvuuksia ei tarvitse asentaa.

```
npm run check
npm test
npm run export -- /absoluuttinen/polku/vibelentely.html
```

Vienti tuottaa yhden itsenäisen HTML-tiedoston. `dist/`-hakemiston voi myös palvella sellaisenaan millä tahansa staattisella web-palvelimella.

| Tiedosto | Vastuu |
| --- | --- |
| `dist/simulation.js` | Siementetty kartta, materiaalit, lämpö ja virtaus |
| `dist/flight.js` | Lennokin fysiikka, törmäykset ja lähtöpaikan etsintä |
| `dist/render.js` | Pikselipiirto, lennokin rasterisprite ja pienoiskartta |
| `dist/app.js` | Ohjaimet, kamera ja kiinteän aika-askeleen päivitys |
| `test/` | Materiaalien, tilavuuden, virran jatkuvuuden ja lennokin regressiotestit |

Simulaatio käyttää 60 kiinteää aika-askelta sekunnissa myös näkymän ulkopuolella. Lennokin liike tarkistetaan alle solun pituisina osina, jotta ohut seinä ei jää nopean liikkeen väliin. Raskaimmissa tilanteissa simulaatio hidastuu rajattoman aikavelan keräämisen sijaan. Piirtonopeus ei muuta fysiikan askelpituutta. Konsolin `vibelentely`-olio tarjoaa maailman, lennokin, kameran ja ohjaustilan tarkasteltavaksi.

MIT-lisenssi. Katso `LICENSE`.
