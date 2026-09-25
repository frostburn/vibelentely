# Vibelentely

Luolalennokki ja muokattava soluautomaattimaasto selaimessa. Peliruutu on aina **320 × 200 pikseliä**, kartta **640 × 400 solua**. Kuva suurennetaan kokonaislukukertoimella ilman pehmennystä; käyttöliittymä käyttää tavallista selainresoluutiota.

## Käynnistä

Avaa `dist/index.html` selaimessa. Asennuksia, palvelinta, ulkoisia kirjastoja tai verkkoyhteyttä ei tarvita.

Päävalikosta valitaan **Tiimitaistelu**, **Soolokeikat** tai **Luolalabra**. Valikko pysäyttää pelin; kaikkien kolmen pelimuodon tilanne säilyy erikseen niin kauan kuin sivu on auki. Sivun lataaminen uudelleen aloittaa alusta.

## Soolokeikat

Kolme vapaasti valittavaa tehtävää omilla kartoillaan. Maasto, lennokki ja kello käynnistyvät ensimmäisestä ohjauksesta. Tavoite, eteneminen ja toimintaohje näkyvät peliruudun vieressä. Kohteet näkyvät pienoiskartalla ja ruudun reunoilla; vihreä **H** on kotiasema, keltainen henkilö on noutopaikka ja oranssi risti on avattava luukku.

| Tehtävä | Tavoite | Ratkaisu ja vaarat |
| --- | --- | --- |
| Pelastuspartio | Kolme kaivostyöläistä kahdelta suojalta kotiin 3 minuutissa | Laskeudu tai hidasta merkille 0,75 sekunniksi; nouto ja purku toimivat automaattisesti. Kyytiin mahtuu kaksi. Yksi matkustaja vähentää moottorin kiihtyvyyden noin 82 prosenttiin, kaksi noin 69 prosenttiin. Laava tai tuli miehitetyllä suojalla päättää tehtävän. |
| Luolaputkimies | Vähintään 1 200 solua vettä rajattuun keräysaltaaseen ja lennokki kotiin | Avaa yläsäiliön pohjapato louhintapanoksella. Vesi valuu todellista kanavaa pitkin. Älä räjäytä keräysaltaan pohjaa. |
| Hallittu sortuma | Vähintään 1 800 solua hiekkaa rajattuun kuiluun ja lennokki kotiin | Avaa alempi luukku ennen ylempää. Irtonainen hiekka päästää lennokin läpi, laskeutunut kasa tukkii reitin. Kallio pysyy paikallaan; sortuva materiaali on hiekkaa. |

Soolokeikoilla **K / Panos** ampuu maastoon tarttuvan louhintapanoksen. Sulake kestää 1,4 sekuntia laukaisusta, panoksia on kolme ja yksi palautuu neljässä sekunnissa. Oma räjähdys sattuu. Tiimitaistelussa ja Luolalabrassa K käyttää edelleen pomppivaa kranaattia. Muut varusteet, kuten painevesi ja lähisiirtymä, toimivat kaikissa pelimuodoissa.

Altaan tai kuilun tavoitemäärän pitää säilyä vähintään sekunti. Pelkkä täyttö ei riitä: palaa elossa kotiasemalle ja hidasta. Jos täyttö laskee alle tavoitteen ennen paluuta, sitä pitää korjata. Kotiasema tai suojan merkki toimii alle 19 solun etäisyydeltä, alle 18 solun sekuntinopeudella ja esteettömällä näkölinjalla. Noudon ja purun eteneminen näkyy tilatekstissä.

**R / Yritä alusta** palauttaa saman tehtävän kartan, kellon ja varusteet. Voiton jälkeen R jatkaa seuraavaan tehtävään ja viimeisestä päävalikkoon. Valikosta voi valita minkä tahansa tehtävän uudelleen. Suoritukset ja parhaat ajat säilyvät sivun aukiolon ajan. Valikko ja tauko pysäyttävät myös määräajan; ikkunan tai välilehden jättäminen tauottaa tehtävän automaattisesti.

## Tiimitaistelu

Jokaisella vaikeustasolla pelataan samalla kokoonpanolla, kunnes jompikumpi joukkue saa **viisi voittoa**. Kun voitat tason, seuraava kokoonpano vaikeutuu ja molempien pisteet nollataan. Yksittäinen voitto tai tappio ei vaihda kokoonpanoa; tasapeli ei anna pisteitä. Jos viholliset ehtivät ensin viiteen voittoon, ottelu päättyy.

| Taso | Kokoonpano koko viiden voiton sarjan ajan |
| --- | --- |
| 1 | Sinä + Siipi vastaan 1 vihollinen |
| 2 | Sinä vastaan 1 vihollinen |
| 3 | Sinä vastaan 2 vihollista |
| 4 | Sinä vastaan 3 vihollista |
| 5 | Sinä vastaan 4 vihollista |
| … | Seuraavilla tasoilla aina yksi vihollinen lisää |

Erä ratkeaa vasta koko joukkueen tuhouduttua. Jos putoat ensin, Siipi jatkaa taistelua ja kamera seuraa sitä. Erätauolla näkyvät pisteet, seuraava kokoonpano ja seuraavan kentän nimi. Seuraava erä vaihtaa luolan ja palauttaa kaikki varusteet; maasto ja lennokit odottavat ensimmäistä ohjausta. Ottelun aikana **R / Luovuta erä** antaa vihollisille yhden pisteen. Erätauolla R jatkaa samalla tasolla. Viidennen voiton jälkeen **R / Seuraava taso** jatkaa seuraavaan kokoonpanoon. Häviön jälkeen R aloittaa uuden ottelun alusta.

**Esc / Valikko** säilyttää tilanteen. Uusi ottelu aloitetaan valikosta. Välilyönti pysäyttää pelin, ja selainikkunan tai välilehden jättäminen pysäyttää taistelun automaattisesti. Maaston muokkaaminen, ajan nopeuttaminen ja vastustajan poistaminen kuuluvat Luolalabraan.

## Kahdeksan taistelukenttää

Kenttä vaihtuu **joka erässä**: voiton, tappion, tasapelin ja luovutuksen jälkeen. Kierto jatkuu vaikeustason vaihtuessa samasta kohdasta, joten viiden voiton laskuri ei määrää karttaa. Kahdeksannen kentän jälkeen palataan ensimmäiseen. Uusi ottelu alkaa Graniittisillalta.

| Kenttä | Reitit ja vaarat | Ulkoasu |
| --- | --- | --- |
| Graniittisilta | Kaaren ylä- ja alapuoliset lentoreitit, vesiallas alla | Graniitti, kultahiekka, sininen vesi |
| Ruostekuilu | Eri korkeuksilla olevat kammiot ja kolme kiertoreittiä | Punainen hiekkakivi ja hiekka, turkoosi vesi |
| Kalkkiholvit | Kolme holvia, kaksi kulkukorkeutta, pienet altaat | Kalkkikivi, valkoinen hiekka, kirkas vesi |
| Mustat portaat | Viistot laavakielekkeet, viileä vesitasku vasemmalla | Basaltti, tumma hiekka |
| Smaragdialtaat | Saarekkeet ja suuri yhteinen vesiallas | Vihreä liuske ja vesi, vaalea hiekka |
| Tiimalasi | Ylä- ja alakammio, hiekkasateinen kurkku ja sivutunnelit | Kerroshiekkakivi, okrahiekka |
| Ametistipesä | Teräviä kideharjanteita ja keskellä kierrettävä suoja | Ametisti ja kvartsi, hopeahiekka, violetti vesi |
| Ruutilouhos | Räjähtäviä ruutitaskuja eri korkeuksilla olevilla hyllyillä | Poimuttunut gneissi, harmaa hiekka |

Kivilajien kuviot sekä hiekan ja veden värit ovat kenttäkohtaisia. Fysiikan säännöt säilyvät samoina: vihreä ja violetti vesi ovat tavallista vettä, kivi rikkoutuu räjähdyksissä ja hiekan läpi pääsee sen pudotessa. Jäähtynyt laava erottuu muusta kivestä. Myös pienoiskartta, lähteet, vesisuihku ja labran materiaalivärit seuraavat teemaa. Lennokkien joukkuevärit säilyvät samoina.

## Luolalabra

Vapaa lentely ja maaston muokkaus neljällä alkuperäisellä kartalla sekä kahdeksalla uudella taistelukentällä. Valitse uusi luola **Taistelukenttä**-valikosta; valinta ei muuta keskeneräistä ottelua. **Lennä**-tilassa kamera seuraa lennokkia. **Muokkaa**-tilassa taistelu ja lennokit pysähtyvät; maastosimulaatio jatkuu ja maastoa voi maalata. Materiaalin valitseminen vaihtaa suoraan muokkaustilaan. Tekoälyvastustajan voi kytkeä päälle harjoittelua varten. **R** palauttaa lennokit ja varusteet; muokattu maasto ja harjoittelupisteet säilyvät. **Shift+R / Alusta** palauttaa myös kartan ja pisteet.

## Ohjaimet

| Ohjain | Toiminto |
| --- | --- |
| ↑ / W | Moottorityöntö |
| ← / A, → / D | Käännä lennokkia |
| ↓ / S | Ilmajarru |
| J / vasen hiiri lentotilassa | Pulssitykki |
| K | Soolokeikoilla tarttuva louhintapanos, muualla pomppiva kranaatti |
| L | Painevesitykki |
| I / oikea hiiri lentotilassa | Pidä keulakilpeä |
| Q | Lähisiirtymä keulan suuntaan |
| R | Soolokeikalla yritä alusta / seuraava tehtävä; taistelussa luovuta / seuraava erä / uusi ottelu; labrassa uusi lennokki |
| Esc | Päävalikko; tilanne säilyy |
| E | Labrassa vaihda lentämisen ja muokkaamisen välillä |
| C | Kameran seuranta päälle / pois |
| Välilyönti | Tauko |
| Piste | Labrassa yksi simulaatioaskel |
| Shift+R / Alusta | Labran kartta, lennokit ja pisteet alusta |
| F | Koko näyttö |
| 1–8 | Labrassa valitse materiaali ja siirry muokkaamaan |
| Vasen hiiri / kosketus | Maalaa muokkaustilassa |
| Oikea hiiri | Kaiva muokkaustilassa |
| Hiiren rulla / [ ] | Siveltimen koko |
| WASD / nuolet muokkaustilassa | Siirrä kameraa |
| Shift + veto / keskimmäinen hiiri | Siirrä kameraa |

Kosketusohjaimet ovat peliruudun alla. Pienoiskartan napsautus siirtää näkymän ja vapauttaa kameran seurannasta. Muokkaustilassa myös R aloittaa kartan alusta.

Lennokilla on painovoima, liikemäärä, ilmanvastus ja runkovauriot. Vesi hidastaa, laava vastustaa liikettä huomattavasti voimakkaammin ja kuumentaa sitä. Putoavan hiekkavirran läpi pääsee lentämään pienellä vastuksella; asettunut hiekkakasa on kiinteää maastoa. Läpäisy ei poista hiekan soluja. Kova törmäys tai rungon tuhoutuminen voi jättää jäljen maastoon. Palautus etsii vapaan lähtöpaikan muuttamatta rakennettuja patoja ja tunneleita.

## Taistelu

Sininen lennokki on pelaaja, vihreä plussalla merkitty Siipi on kaveri ja oranssit ovat vihollisia. Keula määrää sekä työntövoiman että aseiden ja kilven suunnan. Kaikki kaverit ja viholliset näkyvät pienoiskartalla ja peliruudun reunassa niiden lentäessä näkymän ulkopuolelle. Joukkuepaneeli näyttää myös pudotetut lennokit. Oman joukkueen ammukset kulkevat kavereiden läpi. Kranaattien ja lennokkien suorat räjähdysvauriot eivät osu kavereihin; oma kranaatti sattuu edelleen, ja maastoon syntyvät tuli, ruudin ketjureaktiot ja muut vaarat vahingoittavat kaikkia.

| Varuste | Toiminta ja rajoitukset |
| --- | --- |
| Pulssitykki | Nopea sarjatuli, 9 runkovauriota osumasta. Kaivaa hiekkaa ja mutaa, sytyttää ruudin, pysähtyy kiveen. Lämpenee ammuttaessa ja jäähtyy itsestään. Ylikuumeneminen estää tulen, kunnes ase on jäähtynyt. |
| Kranaatti | Perii lennokin nopeuden, pomppii seinistä, räjähtää 1,4 sekunnissa tai osumasta lennokkiin virittymisen jälkeen. Rikkoo kiveä ja vahingoittaa myös ampujaa. Kolme latausta; yksi palautuu 4 sekunnissa. |
| Painevesi | Työntää lennokkia ja irtoainesta, jäähdyttää laavaa ja kastelee maastoa. Suihkulla on rekyyli. Säiliö riittää noin 4 sekunnin suihkuun ja täyttyy nopeasti jo matalassa vedessä. Ei suoraa runkovauriota. |
| Keulakilpi | Noin 140 asteen sektori keulan edessä. Pysäyttää pulssit ja veden, kimmottaa kranaatit ja vaimentaa edestä tulevan räjähdyksen. Kuluu ajan ja osumien myötä, estää oman tulituksen ja latautuu alhaalla. Ei suojaa laavalta tai törmäyksiltä. |
| Lähisiirtymä | Enintään 54 solua keulan suuntaan, lataus 4 sekuntia. Ylittää ohuen seinän; koko rungon pitää mahtua päätepisteeseen. Ei laskeudu laavaan, tuleen, kartan ulkopuolelle tai toiseen lennokkiin. Säilyttää liikemäärän. Epäonnistunut siirtymä ei kuluta latausta. Uusi siirtymä vaatii uuden painalluksen. |

Pieni risti näyttää lähisiirtymän vapaan päätepisteen sen ollessa valmis. Asepainikkeet näyttävät lämpötilan, panokset ja lataukset. Näppäimistön lisäksi kaikkia aseita ja kykyjä voi käyttää ruudun alapuolisista painikkeista.

Tiimitaistelussa erä päättyy joukkueen viimeisen lennokin hajotessa. Luolalabran harjoitusvastustajan kanssa erät ovat yksittäisiä kaksintaisteluja. Aineiden lähteitä ja simulaation nopeutta voi säätää labrassa.

### Tekoäly

Sekä Siipi että viholliset käyttävät samaa `Drone`-fysiikkaa ja samoja ase-, kilpi- ja siirtymäfunktioita kuin pelaaja. Tekoälyllä ei ole ylimääräisiä runkopisteitä tai panoksia. Lentäminen perustuu ohjauskomentoihin, ei suoraan sijainnin muuttamiseen.

Ohjaaja etsii muokattavasta kartasta lennokin levyisiä reittejä ja ampumapaikkoja, joissa on tilaa pudota tähtäämisen aikana, väistää laavaa sekä laskee reitin uudelleen noin 0,65 sekunnin välein. Tähtäys käyttää 0,14 sekunnin välein havaittua sijaintia ja nopeutta. Se vuorottelee lentämistä ja tähtäämistä, torjuu lähestyviä ammuksia, käyttää vettä lähietäisyydeltä, pudottaa kranaatteja alaspäin ja yrittää siirtyä pois jumista tai vaarasta. Kartta ja pelaajan sijainti ovat sen tiedossa myös seinän takana, mutta se ei ammu ilman avointa näkölinjaa. Jokaisella lennokilla on oma ohjaaja, havainto ja reitti. Ohjaaja valitsee lähimmän elossa olevan vastajoukkueen lennokin ja vaihtaa kohdetta sen tuhouduttua. Usean ohjaajan reitinhaut ja tähtäysjaksot on porrastettu. Vaikeus kasvaa vihollisten määrällä, ei vahinkobonuksilla.

## Materiaalit

- **Hiekka:** putoaa rakeina ja kasautuu 45 asteen rinteiksi.
- **Vesi:** putoaa pisaroina ja tasaantuu avoimia reittejä pitkin lätäköiksi.
- **Muta:** yhdeksän solun säteinen koheesio ja pinnan hidas siirtyminen pyöristävät terävän huipun. Paino välittyy myös vinosti koskettaviin soluihin, joten jatkuva syöttö ei rakenna jäykkää neulaa. Myötöraja pysäyttää asettuneen köntin.
- **Laava:** solulla on täyttöaste (1/256-solun tarkkuus), lämpötila, virtaustila ja tieto viimeisestä sisäänvirtauksesta. Tilavuus siirtyy rajattuina virtauksina seuraavaan tilaan. Syötetty soluketju säilyttää ohuen yhdistävän kerroksen, joten reunan yli valuva virta pysyy koossa. Jäähtyminen tuottaa tummaa kiveä. Osittain täyttyneiden solujen tilavuus säilyy myös kivettyessä.
- **Höyry:** nousee ja hajoaa 1,5–2,5 sekunnissa. Kylmään kattoon osuvasta höyrystä pieni osa tiivistyy pisaroiksi; muu höyry poistuu simulaatiosta.
- **Ruuti:** valuu ja syttyy laavasta tai räjähdyksestä ketjureaktioksi.

Luolalabrassa säilyvät alkuperäinen areena, luola, neljän altaan koekenttä ja tyhjä rakennuskenttä sekä valittavat uudet taisteluluolat. Materiaalilähteet voi kytkeä pois vertailukokeita varten. Räjähdykset poistavat materiaalia tarkoituksella.

## Kehitys

Node.js 24 riittää tarkistuksiin ja vientiin. Riippuvuuksia ei tarvitse asentaa.

GitHub Actions ajaa alla olevat tarkistukset yhdellä Node 24 -työllä PR:issä sekä `main`-haaran päivityksissä. Uusi päivitys peruuttaa saman haaran vanhentuneen ajon.

Valmiin CI-ajon **Artifacts**-osiosta voi ladata `vibelentely`-paketin. Pura ZIP ja avaa sen sisältämä itsenäinen `vibelentely.html` selaimessa.

```
npm run check
npm test
npm run export -- /absoluuttinen/polku/vibelentely.html
```

Vienti tuottaa yhden itsenäisen HTML-tiedoston. `dist/`-hakemiston voi myös palvella sellaisenaan millä tahansa staattisella web-palvelimella.

| Tiedosto | Vastuu |
| --- | --- |
| `dist/simulation.js` | Siementetty kartta, materiaalit, lämpö ja virtaus |
| `dist/levels.js` | Kahdeksan luolaa, geometriat, lähtöpaikat, kierto ja materiaaliteemat |
| `dist/flight.js` | Lennokin fysiikka, ainevastus, törmäykset ja lähtöpaikan etsintä |
| `dist/combat.js` | Joukkueet, aseet, ammusten törmäykset, kilpi, siirtymä ja eräpisteet |
| `dist/match.js` | Viiden voiton sarjat, vaikeusportaat, jokaisen erän kenttävaihto ja luovutus |
| `dist/solo.js` | Kolmen soolotehtävän kartat, tavoitteet, lasti, nouto, purku, määräaika ja tulokset |
| `dist/ai.js` | Reitinhaku, tähtäys, lentäminen ja tekoälyn varustevalinnat |
| `dist/render.js` | Pikselipiirto, lennokin rasterisprite ja pienoiskartta |
| `dist/app.js` | Päävalikko, erilliset pelitilanteet, ohjaimet, kamera ja kiinteä aika-askel |
| `test/` | Materiaalien, lentämisen, taistelun, tekoälyn ja soolotehtävien regressiotestit |

Simulaatio käyttää 60 kiinteää aika-askelta sekunnissa myös näkymän ulkopuolella. Lennokin liike tarkistetaan alle solun pituisina osina, jotta ohut seinä ei jää nopean liikkeen väliin. Raskaimmissa tilanteissa simulaatio hidastuu rajattoman aikavelan keräämisen sijaan. Piirtonopeus ei muuta fysiikan askelpituutta. Konsolin `vibelentely`-olio tarjoaa maailman, lennokin, `combat`-taistelutilan, kameran ja ohjaustilan tarkasteltavaksi.

MIT-lisenssi. Katso `LICENSE`.
