# Vibelentely

Luolalennokki ja muokattava soluautomaattimaasto selaimessa. Peliruutu on aina **320 × 200 pikseliä**, kartta **640 × 400 solua**. Kuva suurennetaan kokonaislukukertoimella ilman pehmennystä; käyttöliittymä käyttää tavallista selainresoluutiota.

## Käynnistä

Avaa `dist/index.html` selaimessa. Asennuksia, palvelinta, ulkoisia kirjastoja tai verkkoyhteyttä ei tarvita.

Päävalikosta valitaan **Tiimitaistelu**, **Soolokeikat** tai **Luolalabra**. Valikko pysäyttää pelin; kaikkien kolmen pelimuodon tilanne säilyy erikseen niin kauan kuin sivu on auki. Sivun lataaminen uudelleen aloittaa alusta.

## Äänet

Moottori kohisee hillityllä voimakkuudella ajassa kvantisoidulla kohinalla: näyte vaihtuu noin 1,3–2 kHz tahdissa ja pysyy välissä vakiona. Pulssitykki sirisee, ja räjähdyksen alkupamausta seuraa matala, lyhyt kumina (noin 0,45–0,75 s koon mukaan). Mutapommin laukaisussa ja osumassa on pieni nouseva ”bloub!” ja karkea, märkä loppuääni. Vesi ja imu kuulostavat erilaisilta; blasterin nousuääni kertoo latauksesta, täysi lataus kilahtaa ja ylikuumeneminen lässähtää. Kilven osuma, lähisiirtymä, runkovaurio, nouto, toimitus ja erän tulos saavat omat lyhyet merkkinsä. Kaukaiset tapahtumat kuuluvat hiljempaa. Tehosteet ja musiikki syntyvät koodissa ilman ladattavia äänitiedostoja.

Koko monomiksaus kulkee yhden purkin läpi:

`Tehosteet + musiikki → yhteinen miksaus → kiinteä ajotaso → 11 025 Hz näytteenpito + 8-bittinen kvantisointi → 180 Hz ylipäästö → kaksi 2 300 Hz alipäästöä → master-gain → kaiuttimet`

Voimakkuussäädin on **kaiken tuhnutuksen jälkeen**. Se ei muuta kvantisoinnin askelkokoa, suodatusta tai miksauksen säröytymistä. Säädön vaste on neliöllinen ja muutokset pehmennetään, jotta pieniäkin voimakkuuksia on helppo käyttää. Mykistys säilyttää valitun voimakkuuden; molemmat asetukset muistetaan selaimessa, jos paikallinen tallennus on käytettävissä.

Ääni käynnistyy ensimmäisestä näppäin- tai osoitineleestä. Valikko pysäyttää tehosteet, mutta musiikki jatkuu. Tauko, ikkunan fokuksen menetys ja piilotettu välilehti hiljentävät kaiken; musiikin paikka säilyy. Pelitilan vaihto tai uusi yritys ei toista vanhoja tehosteita eikä aloita biisiä alusta. Äänet toimivat ensisijaisesti AudioWorkletissa; jos se ei ole saatavilla esimerkiksi paikallista HTML-tiedostoa avattaessa, ScriptProcessor ajaa saman synteesin ja purkkiketjun. Peli toimii myös ilman Web Audiota.

### Taustamusiikki

Kolme alkuperäistä suomichip-kappaletta, jokainen 64 tahtia ja 4/4. Kaikilla on oma melodia, sointukierto ja sovitus.

| Biisi | Sävellaji | Tempo | Yksi kierto | Sovitus |
| --- | --- | --- | --- | --- |
| Basalttiyö | E-molli | 132 BPM | 1:56 | Kulkijan ja kaiun kysymykset, duuriin avautuva toive ja roolien vaihto |
| Kuparisydän | D-molli | 148 BPM | 1:44 | Sepän koputusaihe, koneen katkonaiset vastaukset ja yhteinen F-duuriteema |
| Revontulivirta | A-doorinen | 116 BPM | 2:12 | Joen ja taivaan pitkät kaaret, helähtävät vastaukset ja lyhyt varovainen kiertotie |

Sointuarpeggio on [trackerien `0xy`-efektin](https://milkytracker.org/docs/manual/MilkyTracker.html#fx0xy) tapainen yhden pulssikanavan sävelkorkeuskierto. Sävel vaihtuu kaikissa biiseissä **50 kertaa sekunnissa**: yksi sävel kestää 20 ms ja kolmen sävelen sointu kiertää noin 16,7 kertaa sekunnissa. Efektin näytekello ja oskillaattorin vaihe jatkuvat kompin iskujen ja arpin taukojen yli.

Biisit on rytmitetty [kolmen lyhyen kävelynäytelmän](docs/music-scenes.md) vuoropuhelun mukaan. Avausaiheet ja suuremmat jaksot palaavat tunnistettavina, mutta fraasien pituudet, jatkot ja soitinroolit vaihtelevat. Pulssi ja **FM-kantele** soittavat myös pidempiä melodioita toisen tukiessa, keskeyttävät lyhyillä vastauksilla ja vaihtavat tuttuja teemoja keskenään. Kantele on oma monofoninen soitin. Sen karkea oskillaattorivaihe ja yliohjattu aaltomuoto tuovat särmää; FM-sävy säilyy myös äänen hännässä. Väri vaihtelee kappaleittain.

Basson neljäsosat ja vuorottelevat rumpuiskut pitävät kävelyn liikkeessä myös hiljaisissa jaksoissa. Harvoissa kohdissa bassolla on oma vastaus, pohjasävel jää soimaan tai rumpujen painotus siirtyy. Kukin kappale pysähtyy kuuntelemaan vain kerran, lyhyesti. Arppi jää enimmäkseen taustan lehtien havinaksi, josta nousee muutama lyhyt puuska. FM-kantele, muut soittimet ja melodiakaiku kulkevat yhteisen 11 025 Hz / 8-bit -tuhnuketjun läpi ennen lopullista master-gainia.

`dist/music.js`-tiedoston `phrases` on pulssin ja kanteleen yhteinen fraasikirja. `order`-rivin alkiot ovat **sointu, pulssifraasi, komppi, arppikuvio, kantelefraasi**; kaksi viimeistä ovat valinnaisia. `grooves` määrittää bassokuvion, rumpuiskut ja dynamiikan. `arps` sisältää arppikuviot: `x` aloittaa painotuksen, `-` pitää ääntä ja `.` vapauttaa sen. `gain` määrää kuvion tason ja `octave` valinnaisen siirron puolisävelaskelina.

**Päävalikon Biisi-valitsin** vaihtaa kappaletta heti lyhyellä ristihäivytyksellä ja aloittaa uuden kappaleen alusta. Oletuksena soitin käy listaa järjestyksessä: kolme kokonaista toistoa per kappale, sitten seuraava; viimeisestä palataan ensimmäiseen. Poista valinta **Vaihda biisiä 3 kierroksen jälkeen**, jos haluat kuunnella valittua biisiä jatkuvasti. Toistotavan vaihtaminen ei aloita kappaletta alusta. Biisivalinta ja toistotapa muistetaan selaimessa. Pelin äänisäätimien vieressä näkyy kulloinenkin kappale myös automaattisen vaihdon jälkeen.

Musiikilla on oma muistettava tasosäädin ja päälle/pois-painike. Tasosäädin muuttaa musiikin osuutta **ennen yhteistä tuhnuketjua**; yleinen voimakkuussäädin on edelleen ketjun jälkeen. Musiikin mykistys tai nollataso pysäyttää sen toiston samaan kohtaan, eikä hiljainen aika kuluta kierroksia. Soitin seuraa äänilaitteen näytekelloa, joten grafiikan hidastuminen tai Luolalabran nopeussäädin eivät muuta tempoa. Nuotit, soinnut ja kappalerakenteet ovat muokattavissa `dist/music.js`-tiedostossa; piste on tauko ja viiva pitää edellisen nuotin. Kaikki kolme sävellystä sisältyvät yhden HTML-tiedoston exportiin.

### Arppilabra-debug-build

CI:n **vibelentely-debug**-paketissa on itsenäinen `vibelentely-debug.html`. Avaa se ja paina **Kuuntele**. Sivun yläreunan paneelissa voi valita biisin, soolottaa arppikanavan ja säätää nopeutta lennossa **1–300 sävelenvaihtoon sekunnissa**. Liukusäätimen lisäksi on numerokenttä ja vertailupresetit 25, 50, 75, 100, 150 ja 225. Lukema näyttää myös yhden sävelen keston ja kokonaisen kolmisoinnun kiertotaajuuden. **Biisin oletus** palauttaa kappalekohtaisen nopeuden.

Soolotus hiljentää melodian, basson, kaiun, rummut ja pelitehosteet. Arpin sovituksen tauot kuuluvat myös soolotettuna. **Ohita tuhnuketju** ohittaa sekä kvantisoinnin että suodatuksen vertailukuuntelua varten. Lopullinen master-gain toimii myös ohituksessa. Nopeuden vaihto säilyttää toistokohdan ja efektin vaiheen; soolotus ja suodatuksen vaihto häivytetään lyhyesti.

Ensimmäisellä avauksella debug-build soolottaa arpin nopeudella 50 sävelenvaihtoa/s ja pitää automaattisen biisivaihdon pois päältä. Debug-kuuntelun asetukset tallennetaan erikseen. Tavallinen export sisältää normaalin pelin käyttöliittymän ja käyttää omia ääniasetuksiaan.

## Soolokeikat

Kaksitoista vapaasti valittavaa tehtävää omilla kartoillaan. Maasto, lennokki ja kello käynnistyvät ensimmäisestä ohjauksesta. Tavoite, eteneminen ja toimintaohje näkyvät peliruudun vieressä. Kohteet näkyvät pienoiskartalla ja ruudun reunoilla; vihreä **H** on kotiasema, keltainen henkilö tai paketti on noutopaikka, oranssi risti on avattava luukku ja ruskea plus on paikattava vuoto. Punainen huutomerkki ja ympyrä osoittavat räjähdyksille herkän koneiston.

| Tehtävä | Tavoite | Ratkaisu ja vaarat |
| --- | --- | --- |
| Pelastuspartio | Kolme kaivostyöläistä kahdelta suojalta kotiin 3 minuutissa | Laskeudu tai hidasta merkille 0,75 sekunniksi; nouto ja purku toimivat automaattisesti. Kyytiin mahtuu kaksi. Yksi matkustaja vähentää moottorin kiihtyvyyden noin 82 prosenttiin, kaksi noin 69 prosenttiin. Laava tai tuli miehitetyllä suojalla päättää tehtävän. |
| Luolaputkimies | Vähintään 1 200 solua vettä rajattuun keräysaltaaseen ja lennokki kotiin | Avaa yläsäiliön pohjapato louhintapanoksella. Vesi valuu todellista kanavaa pitkin. Älä räjäytä keräysaltaan pohjaa. |
| Hallittu sortuma | Vähintään 1 800 solua hiekkaa rajattuun kuiluun ja lennokki kotiin | Avaa alempi luukku ennen ylempää. Irtonainen hiekka päästää lennokin läpi, laskeutunut kasa tukkii reitin. Kallio pysyy paikallaan; sortuva materiaali on hiekkaa. |
| Vuotava pato | Mutapaikka sekä 1 200 solua vettä altaaseen | Mutapommi tarvitsee tuekseen vuodon alla olevan kielekkeen. Jatkuva vedensyöttö paljastaa vuotavan korjauksen. |
| Pumppaamo tukossa | Ime vesi ja muta pois; enintään 35 solua saa jäädä | Koneisto ei kestä räjähdyksiä. Imu ei kulje kiviseinän läpi. |
| Kuivatelakka | Paikkaa syöttöputki mudalla ja ime telakka kuivaksi | Mutapaikan ja kuivan altaan pitää säilyä yhtä aikaa. Räjäyttäminen rikkoo telakan. |
| Kova kuori | Nouda ydinmoduuli lujan kallion sisältä | Tavallinen kranaatti ei riko juovaista lujaa kiveä. Avaa lennokin levyinen reitti täysillä blasterilaukauksilla. |
| Uusi vesireitti | Paikkaa alavuoto ja avaa luja yläpato; kerää 1 100 solua vettä | Mutapommi ja blasteri toimivat työparina. Tee paikka ennen veden vapauttamista. |
| Tulivirran tulppa | Patoa jatkuva laavavirta mudalla ja pidä alavirta kylmänä 5 sekuntia | Kivihylly tukee mutapatoa. Laava kuivattaa kosketuspinnan hiekaksi; kuivuminen jäähdyttää ohuen laavakalvon kivikuoreksi. Jälkivirtaa voi jäähdyttää painevedellä. |
| Kadonnut arkisto | Ime kaksi hiekka- ja mutakerrostumaa pois ja tuo molemmat moduulit kotiin | Kaiva kerros kerrallaan. Arkisto ei kestä räjähdyksiä. Molempien noutopaikkojen pitää pysyä avoimina myös kuljetuksen valmistuessa. |
| Jäähdytyskeikka | Kivetä vähintään 300 solua laavaa ja jätä altaaseen 500 solua vettä | Jäähdytä läheltä ja täytä korkeammalta, jotta pisarat satavat altaaseen. Täydennä vesivarastoa vasemmalla. Altaassa ei saa olla sulaa laavaa. |
| Kaksi janoa | Jaa äärellinen vesivarasto kahteen altaaseen, vähintään 900 solua kumpaankin | Paikkaa vasen pohjavuoto mudalla ennen kahden syöttöluukun avaamista blasterilla. Yhden altaan ylitäyttö ei korvaa toista. |

Soolokeikoilla **Kranaatti / panos** ampuu maastoon tarttuvan louhintapanoksen. Sulake kestää 1,4 sekuntia laukaisusta, panoksia on kolme ja yksi palautuu neljässä sekunnissa. Oma räjähdys sattuu. Tiimitaistelussa ja Luolalabrassa tämä varuste käyttää pomppivaa kranaattia.

### Kaksi varustepaikkaa

**J** käyttää aina pulssitykkiä, **I** kilpeä ja **Q** lähisiirtymää. **K** ja **L** käyttävät kahta valittua varustetta: kranaatti/panos, painevesi, mutapommi, imutykki tai blasteri. Sama varuste ei voi täyttää molempia paikkoja; toisen paikan varusteen valinta vaihtaa niiden järjestyksen.

Vaihda varusteita ennen lähtöä, taisteluerien välissä tai soolokeikalla pysähtymällä kotiasemalle. Labrassa vaihtaminen on vapaata. Varusteen vaihtaminen ei palauta ammuksia eikä poista lämpöä, ja se peruuttaa blasterin latauksen. Uusintayritys säilyttää oman valinnan; seuraava soolotehtävä tarjoaa sille sopivan oletusparin. Tekoäly käyttää tuttuja kranaatti- ja vesivarusteita.

| Uusi varuste | Toiminta |
| --- | --- |
| Mutapommi | Räjähtää mudaksi osumasta tai 1,1 s kuluttua. Jättää enintään 377 solua oikeaa mutaa; kiveä ja laavaa se ei korvaa. Vedessä muta syrjäyttää vastaavan määrän vettä. Kaksi latausta, yksi palautuu 6 sekunnissa. Muta voi tukkia myös oman tien. |
| Imutykki | Tuhoaa hiekan, veden ja mudan keulan edestä enintään 46 solun päästä. Ei säiliötä tai lastia. Kivi ja muu kiinteä maasto pysäyttävät imun. Laavasolun imeminen ylikuumentaa heti; imuri pysähtyy noin 3,3 sekunnin jäähdytyksen ajaksi. |
| Ladattava blasteri | Pidä ja vapauta: myös vajaa lataus ampuu. Vajaan laukauksen enimmäisvahinko on latauksesta riippuen 12–45 ja räjähdyssäde 5–14 solua; se ei riko lujaa kalliota. Täysi lataus syntyy 1,2 sekunnissa ja antaa selvän tehopiikin (enimmäisvahinko 125). Täysi ammus lentää 430 solua/s ja räjähtää osumasta 30 solun säteellä; myös oma lennokki voi tuhoutua. Rikkoo lujaa kiveä. Täytenä pitäminen nostaa lämpöä ja ylikuumentaa kylmän aseen 1,6 sekunnissa. Ylikuumeneminen hukkaa latauksen: vapauta nappi ja odota jäähdytystä. Laukauskin lämmittää asetta, joten valmiiksi lämpimän blasterin varoaika on lyhyempi. |

Lataus ja lämpö näkyvät varustenapissa sekä blasterin keulavalossa. Tauko, valikko, ikkunan tai välilehden jättäminen ja varusteen vaihtaminen peruuttavat latauksen ampumatta. Jäähdytys ja lataus käyttävät samaa pysähtyvää peliaikaa kuin muutkin aseet.

Maastotavoitteiden pitää säilyä yhtä aikaa vähintään sekunti; Tulivirran tulpassa varmistus kestää viisi sekuntia ja Jäähdytyskeikalla kolme. Laskuri näkyy tehtäväpaneelissa ja alkaa alusta, jos yksikin tavoite pettää. Arkistokeikalla sekä kuljetus että noutopaikkojen puhdistus vaaditaan. Pelkkä täyttö ei riitä: palaa elossa kotiasemalle ja hidasta. Jos täyttö laskee alle tavoitteen ennen paluuta, sitä pitää korjata. Kotiasema tai suojan merkki toimii alle 19 solun etäisyydeltä, alle 18 solun sekuntinopeudella ja esteettömällä näkölinjalla. Noudon ja purun eteneminen näkyy tilatekstissä.

**R / Yritä alusta** palauttaa saman tehtävän kartan, kellon ja varusteet. Voiton jälkeen R jatkaa seuraavaan tehtävään ja viimeisestä päävalikkoon. Valikosta voi valita minkä tahansa tehtävän uudelleen. Suoritukset ja parhaat ajat säilyvät sivun aukiolon ajan. Valikko ja tauko pysäyttävät myös määräajan; ikkunan tai välilehden jättäminen tauottaa tehtävän automaattisesti.

## Tiimitaistelu

Jokaisella vaikeustasolla pelataan samalla kokoonpanolla, kunnes jompikumpi joukkue saa **viisi voittoa**. Kun voitat tason, seuraava kokoonpano vaikeutuu ja molempien pisteet nollataan. Yksittäinen voitto tai tappio ei vaihda kokoonpanoa; tasapeli ei anna pisteitä. Jos viholliset ehtivät ensin viiteen voittoon, ottelu päättyy.

| Taso | Kokoonpano koko viiden voiton sarjan ajan |
| --- | --- |
| 1 | Sinä + Siipi vastaan 1 vihollinen |
| 2 | Sinä + 2 siipimiestä vastaan 2 vihollista |
| 3 | Sinä + 2 siipimiestä vastaan 3 vihollista |
| 4 | Sinä + 2 siipimiestä vastaan 4 vihollista |
| 5 | Sinä + 2 siipimiestä vastaan 5 vihollista |
| … | Seuraavilla tasoilla aina yksi vihollinen lisää |

Erä ratkeaa vasta koko joukkueen tuhouduttua. Jos putoat ensin, siipimiehet jatkavat taistelua ja kamera seuraa elossa olevaa kaveria. Toiselta vaikeustasolta lähtien molemmat siipimiehet pysyvät mukana; myöhemmillä tasoilla vihollisten määrä kasvaa. Erätauolla näkyvät pisteet, seuraava kokoonpano ja seuraavan kentän nimi. Seuraava erä vaihtaa luolan ja palauttaa kaikki varusteet; maasto ja lennokit odottavat ensimmäistä ohjausta. Ottelun aikana **R / Luovuta erä** antaa vihollisille yhden pisteen. Erätauolla R jatkaa samalla tasolla. Viidennen voiton jälkeen **R / Seuraava taso** jatkaa seuraavaan kokoonpanoon. Häviön jälkeen R aloittaa uuden ottelun alusta.

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
| K | Valittu varuste paikassa 1; blasterilla pidä ja vapauta |
| L | Valittu varuste paikassa 2; blasterilla pidä ja vapauta |
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

Valmiin CI-ajon **Artifacts**-osiosta voi ladata `vibelentely`-paketin tai kuuntelusäätimillä varustetun `vibelentely-debug`-paketin. Pura ZIP ja avaa sen sisältämä itsenäinen HTML-tiedosto selaimessa.

```
npm run check
npm test
npm run export -- /absoluuttinen/polku/vibelentely.html
npm run export:debug -- /absoluuttinen/polku/vibelentely-debug.html
```

Vienti tuottaa yhden itsenäisen HTML-tiedoston. `dist/`-hakemiston voi myös palvella sellaisenaan millä tahansa staattisella web-palvelimella.

| Tiedosto | Vastuu |
| --- | --- |
| `dist/simulation.js` | Siementetty kartta, materiaalit, lämpö ja virtaus |
| `dist/levels.js` | Kahdeksan luolaa, geometriat, lähtöpaikat, kierto ja materiaaliteemat |
| `dist/flight.js` | Lennokin fysiikka, ainevastus, törmäykset ja lähtöpaikan etsintä |
| `dist/combat.js` | Joukkueet, aseet, ammusten törmäykset, kilpi, siirtymä ja eräpisteet |
| `dist/tools.js` | Kaksi varustepaikkaa, mutapommi, imu, blasterin lataus ja ylikuumeneminen |
| `dist/match.js` | Viiden voiton sarjat, vaikeusportaat, jokaisen erän kenttävaihto ja luovutus |
| `dist/solo.js` | Kaksitoista soolotehtävää, maasto- ja kuljetustavoitteet, varmistusajat, herkkä koneisto ja tulokset |
| `dist/ai.js` | Reitinhaku, tähtäys, lentäminen ja tekoälyn varustevalinnat |
| `dist/render.js` | Pikselipiirto, lennokin rasterisprite ja pienoiskartta |
| `dist/music.js` | Kolme 64 tahdin vuoropuhelua, pulssi ja FM-kantele, tracker-soitin ja toistokierto |
| `docs/music-scenes.md` | Biisien lyhyet näytelmät, vuorot ja tahtikartta |
| `dist/audio-dsp.js` | Synteesi, 24 äänen raja, 8-bittinen näytteenpito ja purkkisuodatus |
| `dist/audio.js` | Äänitapahtumat, selainäänen käynnistys, asetukset ja viimeinen master-gain |
| `debug/audio.html`, `debug/audio.js` | Debug-exportin arppisoolo, nopeussäädin ja tuhnuketjun vertailu |
| `dist/app.js` | Päävalikko, erilliset pelitilanteet, ohjaimet, kamera ja kiinteä aika-askel |
| `test/` | Materiaalien, lentämisen, taistelun, tekoälyn ja soolotehtävien regressiotestit |

Simulaatio käyttää 60 kiinteää aika-askelta sekunnissa myös näkymän ulkopuolella. Lennokin liike tarkistetaan alle solun pituisina osina, jotta ohut seinä ei jää nopean liikkeen väliin. Raskaimmissa tilanteissa simulaatio hidastuu rajattoman aikavelan keräämisen sijaan. Piirtonopeus ei muuta fysiikan askelpituutta. Konsolin `vibelentely`-olio tarjoaa maailman, lennokin, `combat`-taistelutilan, kameran ja ohjaustilan tarkasteltavaksi.

MIT-lisenssi. Katso `LICENSE`.
