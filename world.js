/* world.js — medieval Bosnia, 600-1463: population, regions, settlements,
   occupations, religions, rulers, noble houses and events. */

// Rough Bosnian population estimates. Not a census: the shape (steady growth
// with a plague dip in 1349 and collapse pressure after 1450) matters more
// than the exact figures.
const POPULATION = [
  [600, 20000], [700, 45000], [800, 90000], [900, 150000], [1000, 230000],
  [1100, 300000], [1200, 380000], [1300, 480000], [1340, 560000],
  [1355, 390000], [1400, 480000], [1440, 560000], [1463, 470000],
];

const REGIONS = [
  {
    id: 'usora', name: 'Usora', weight: 0.13, x: 196, y: 74,
    hint: 'the northern river valley, its low hills given to plough and orchard',
    towns: ['Tešanj', 'Doboj', 'Maglaj', 'Vranduk', 'Srebrenik', 'Zvornik', 'Gradačac'],
    villages: ['Uslonici', 'Teočak', 'Soko', 'Modriča', 'Bosanski Novi'],
    lords: [
    { from: 600, to: 1153, house: 'the village itself', note: 'no ban held this land yet; the elders and the river ruled' },
      { from: 1154, to: 1322, house: 'the Banate itself', note: 'held directly by the ban' },
      { from: 1322, to: 1428, house: 'the Zlatonosovići', note: 'Vukmir and Vukašin Zlatonosović held the northeast for the Kotromanići' },
      { from: 1428, to: 1463, house: 'the Radivojevići', note: 'Jurjević-Vlatković lords of Usora and Soli' },
    ],
  },
  {
    id: 'soli', name: 'Soli', weight: 0.09, x: 262, y: 84,
    hint: 'the salt-and-silver northeast, mining camps built on old salt springs',
    towns: ['Srebrenica', 'Zvornik', 'Tuzla', 'Osat'],
    villages: ['Birač', 'Sutjeska', 'Rogatica'],
    lords: [
    { from: 600, to: 1153, house: 'the village itself', note: 'no ban held this land yet; the elders and the river ruled' },
      { from: 1154, to: 1322, house: 'the Banate itself', note: 'held directly by the ban' },
      { from: 1322, to: 1428, house: 'the Zlatonosovići', note: 'keepers of the mines and the roads to Zvornik' },
      { from: 1428, to: 1463, house: 'the Radivojevići', note: 'Jurjević-Vlatković lords of Soli and Podrinje' },
    ],
  },
  {
    id: 'donjikraji', name: 'Donji Kraji', weight: 0.15, x: 118, y: 82,
    hint: 'the northwest lands, chestnut woods, rivers and armed kin-groups',
    towns: ['Banja Luka', 'Kotor Varoš', 'Ključ', 'Jajce', 'Zvečaj'],
    villages: ['Glaž', 'Sana', 'Vrbas', 'Uskoplje'],
    lords: [
    { from: 600, to: 1153, house: 'the village itself', note: 'no ban held this land yet; the elders and the river ruled' },
      { from: 1154, to: 1299, house: 'the Banate itself', note: 'held directly by the ban' },
      { from: 1299, to: 1322, house: 'the Šubići of Bribir', note: 'Mladen II Šubić ruled Bosnia from Klis as its overlord' },
      { from: 1322, to: 1416, house: 'the Hrvatinići', note: 'Hrvoje Vukčić Hrvatinić, Grand Duke of Bosnia, built Jajce and ruled Donji Kraji like a king' },
      { from: 1416, to: 1463, house: 'the Hrvatinići, diminished', note: 'Juraj Vojsalić kept what was left of Hrvoje\'s lordship' },
    ],
  },
  {
    id: 'podrinje', name: 'Podrinje', weight: 0.09, x: 298, y: 148,
    hint: 'the Drina frontier, mountain gorges where Bosnia faces Serbia',
    towns: ['Višegrad', 'Foča', 'Goražde', 'Rogatica', 'Sutjeska'],
    villages: ['Borač', 'Glasinac', 'Han'],
    lords: [
    { from: 600, to: 1153, house: 'the village itself', note: 'no ban held this land yet; the elders and the river ruled' },
      { from: 1154, to: 1322, house: 'the Banate itself', note: 'held directly by the ban' },
      { from: 1322, to: 1392, house: 'the Vojinovići', note: 'Miloš and the sons of Vojin held the Drina marches' },
      { from: 1392, to: 1435, house: 'the Pavlovići', note: 'Pavle Radinović and his sons held Podrinje for the crown' },
      { from: 1435, to: 1463, house: 'the Kosače', note: 'Stefan Vukčić Kosača, Herzog of St Sava, held the Drina and Hum as his own state' },
    ],
  },
  {
    id: 'vrhbosna', name: 'Vrhbosna', weight: 0.13, x: 208, y: 118,
    hint: 'the central highland basin, roads, mints and the crown\'s own towns',
    towns: ['Visoko', 'Mile', 'Bobovac', 'Fojnica', 'Kreševo', 'Olovo', 'Vareš', 'Kiseljak'],
    villages: ['Vrhbosna', 'Vogošća', 'Ilijaš'],
    lords: [
    { from: 600, to: 1153, house: 'the village itself', note: 'no ban held this land yet; the elders and the river ruled' },
      { from: 1154, to: 1392, house: 'the Banate itself', note: 'the crown\'s own highland, held directly' },
      { from: 1392, to: 1463, house: 'the Pavlovići', note: 'the Pavlovići held Vrhbosna towns and the roads to the coast' },
    ],
  },
  {
    id: 'rama', name: 'Rama', weight: 0.11, x: 176, y: 172,
    hint: 'the upper Neretva valley and its mountain pastures',
    towns: ['Prozor', 'Uskoplje', 'Konjic', 'Rama'],
    villages: ['Ramsko Polje', 'Ovča'],
    lords: [
    { from: 600, to: 1153, house: 'the village itself', note: 'no ban held this land yet; the elders and the river ruled' },
      { from: 1154, to: 1322, house: 'the Banate itself', note: 'held directly by the ban' },
      { from: 1322, to: 1463, house: 'the Kotromanići', note: 'kept close to the crown, its counts' },
    ],
  },
  {
    id: 'hum', name: 'Hum', weight: 0.17, x: 214, y: 234,
    hint: 'the karst south, olive terraces, coastal towns and old Roman roads',
    towns: ['Blagaj', 'Stolac', 'Počitelj', 'Mostar', 'Trebinje', 'Neum'],
    villages: ['Popovo', 'Dabar', 'Dubrave'],
    lords: [
    { from: 600, to: 1153, house: 'the village itself', note: 'no ban held this land yet; the elders and the river ruled' },
      { from: 1154, to: 1322, house: 'the Banate itself', note: 'held directly by the ban' },
      { from: 1322, to: 1392, house: 'the Vojinovići', note: 'lords of the south marches' },
      { from: 1392, to: 1435, house: 'the Kosače', note: 'Sandalj Hranić of the Kosače held Hum and the coastal towns' },
      { from: 1435, to: 1463, house: 'the Kosače', note: 'Stefan Vukčić Kosača, Herzog of St Sava, ruled Hum nearly as a king' },
    ],
  },
  {
    id: 'krajina', name: 'Krajina', weight: 0.13, x: 92, y: 146,
    hint: 'the western border, hills of oak and chestnut, wolves and Hungarian raiders',
    towns: ['Jajce', 'Banja Luka', 'Ključ', 'Vrbaški Grad'],
    villages: ['Glaž', 'Sana'],
    lords: [
    { from: 600, to: 1153, house: 'the village itself', note: 'no ban held this land yet; the elders and the river ruled' },
      { from: 1154, to: 1322, house: 'the Banate itself', note: 'held directly by the ban' },
      { from: 1322, to: 1416, house: 'the Hrvatinići', note: 'Hrvoje Vukčić Hrvatinić raised Jajce above the Pliva' },
      { from: 1416, to: 1463, house: 'the Hrvatinići, diminished', note: 'Juraj Vojsalić kept the western castles' },
    ],
  },
];

const SETTLEMENT_TYPES = [
  { id: 'village', weight: 0.55, label: 'a village' },
  { id: 'hamlet', weight: 0.10, label: 'a scattered hamlet' },
  { id: 'town', weight: 0.12, label: 'a market town' },
  { id: 'mining', weight: 0.07, label: 'a mining town' },
  { id: 'fortress', weight: 0.09, label: 'a fortress town' },
  { id: 'monastery', weight: 0.04, label: 'a monastery village' },
];

const NAMES = {
  male: {
    noble: ['Tvrtko', 'Stjepan', 'Vuk', 'Radivoj', 'Ostoja', 'Hrvoje', 'Sandalj', 'Pavle', 'Vlatko', 'Juraj', 'Grgur', 'Marko', 'Petar', 'Ninoslav', 'Radoslav', 'Batur', 'Dabiša'],
    common: ['Vuk', 'Stjepan', 'Petar', 'Marko', 'Bogdan', 'Pribil', 'Dragoslav', 'Ratko', 'Branko', 'Miloš', 'Nikola', 'Ognjen', 'Radoš', 'Vladoje', 'Tvrdoš', 'Bogdan', 'Dubravac', 'Radivoj', 'Boriša', 'Vukas'],
  },
  female: {
    noble: ['Jelena', 'Katarina', 'Ana', 'Dorothea', 'Marija', 'Vidosava', 'Vukava', 'Gruba'],
    common: ['Mara', 'Stana', 'Jelena', 'Ana', 'Cvjetana', 'Milica', 'Teodora', 'Vidosava', 'Pribava', 'Radosava', 'Stanka', 'Vedrana', 'Doroteja', 'Zavida', 'Ljubica'],
  },
};

const OCCUPATIONS = [
  { id: 'kmet', weight: 0.43, label: 'a peasant smallholder', noble: false },
  { id: 'vlastelic', weight: 0.03, label: 'a petty noble (vlasteličić)', noble: true },
  { id: 'pastir', weight: 0.10, label: 'a shepherd', noble: false },
  { id: 'rudar', weight: 0.05, label: 'a miner', noble: false },
  { id: 'trgovac', weight: 0.05, label: 'a trader', noble: false },
  { id: 'vojnik', weight: 0.13, label: 'a soldier', noble: false },
  { id: 'vlastelin', weight: 0.05, label: 'a noble', noble: true },
  { id: 'krstjanin', weight: 0.04, label: 'a krstjanin of the Bosnian Church', noble: false },
  { id: 'svecenik', weight: 0.03, label: 'a priest', noble: false },
  { id: 'domazet', weight: 0.05, label: 'a hired hand', noble: false },
  { id: 'pisar', weight: 0.02, label: 'a scribe', noble: false },
  { id: 'roblje', weight: 0.02, label: 'a slave in the trade to the coast', noble: false },
];

const RELIGIONS = [
  { id: 'catholic', weight: 0.42, label: 'Catholic, of the Latin rite' },
  { id: 'krstjanin', weight: 0.36, label: 'krstjanin of the Bosnian Church' },
  { id: 'orthodox', weight: 0.22, label: 'Eastern Orthodox' },
];

// Rulers of the Banate and Kingdom of Bosnia. `note` is written so it can be
// dropped into a sentence about the reader's own lifetime.
const RULERS = [
  { from: 600, to: 1153, name: 'no single ruler', title: 'the valley elders', note: 'Bosnia was still a land the outside world barely named, and no single ban held it' },
  { from: 1154, to: 1163, name: 'Ban Borić', title: 'Ban of Bosnia', note: 'Borić, a Hungarian-backed ban, held Bosnia as the crown\'s frontier' },
  { from: 1180, to: 1204, name: 'Ban Kulin', title: 'Ban of Bosnia', note: 'Kulin, whose charter of 1189 is the oldest written text Bosnia has, ruled at peace with Dubrovnik and with his own heretics' },
  { from: 1204, to: 1232, name: 'Ban Stjepan I', title: 'Ban of Bosnia', note: 'Stjepan Kulinić, Kulin\'s son, kept the peace his father made' },
  { from: 1232, to: 1250, name: 'Ban Matej Ninoslav', title: 'Ban of Bosnia', note: 'Matej Ninoslav, who rode out the Hungarian crusade and the Mongols, stood between Rome and his own krstjani' },
  { from: 1250, to: 1287, name: 'Ban Prijezda I', title: 'Ban of Bosnia', note: 'Prijezda, a convert from the Bosnian Church, leaned on Hungary and rooted out heresy' },
  { from: 1287, to: 1299, name: 'Ban Stjepan I Kotromanić', title: 'Ban of Bosnia', note: 'Stjepan I, the first Kotromanić, held the western lands in a hard marriage with the Šubići' },
  { from: 1299, to: 1322, name: 'Mladen II Šubić', title: 'Lord of all Bosnia', note: 'Mladen II Šubić of Bribir ruled Bosnia from Klis as an overlord, and grew to hate it' },
  { from: 1322, to: 1353, name: 'Ban Stjepan II Kotromanić', title: 'Ban of Bosnia', note: 'Stjepan II Kotromanić, who threw out the Šubići, took Hum, and made Bosnia rich on silver and trade' },
  { from: 1353, to: 1391, name: 'Ban Tvrtko I', title: 'Ban, then King of Bosnia', note: 'Tvrtko I, crowned king at Mile in 1377, beat the Ottomans at Bileća in 1388 and minted Bosnia\'s first coin' },
  { from: 1391, to: 1395, name: 'King Dabiša', title: 'King of Bosnia', note: 'Dabiša, Tvrtko\'s brother, who held the throne while the nobles circled' },
  { from: 1395, to: 1398, name: 'Queen Jelena Gruba', title: 'Queen of Bosnia', note: 'Jelena Gruba, the widow on the throne, ruling while the great lords settled the succession among their own houses' },
  { from: 1398, to: 1404, name: 'King Ostoja', title: 'King of Bosnia', note: 'Ostoja, an ill-fitting king of uncertain blood, crowned by the nobility and dropped by the same hands' },
  { from: 1404, to: 1409, name: 'King Tvrtko II', title: 'King of Bosnia', note: 'Tvrtko II, raised up by Hrvoje Vukčić and the nobility against Ostoja' },
  { from: 1409, to: 1418, name: 'King Ostoja, restored', title: 'King of Bosnia', note: 'Ostoja back on the throne, now a vassal of the Hungarian king' },
  { from: 1418, to: 1420, name: 'King Stjepan Ostojić', title: 'King of Bosnia', note: 'Stjepan Ostojić, Ostoja\'s son, holding the throne his father lost' },
  { from: 1420, to: 1443, name: 'King Tvrtko II, restored', title: 'King of Bosnia', note: 'Tvrtko II again, the longest and most cultured reign of the last Bosnian kings' },
  { from: 1443, to: 1461, name: 'King Stjepan Tomaš', title: 'King of Bosnia', note: 'Tomaš, the last capable king, who married Katarina Kosača and pressed the krstjani to convert' },
  { from: 1461, to: 1463, name: 'King Stjepan Tomašević', title: 'King of Bosnia', note: 'Tomašević, the last Bosnian king, whose kingdom fell in nineteen days' },
];

// Historical events that touch Bosnian lives. `regions` is a region id or
// 'all'; `classes` is an occupation id or 'all'. Text is written to be dropped
// into a life's story.
const EVENTS = [
  { year: 626, end: 650, kind: 'settlement', regions: 'all', classes: 'all',
    text: 'The Slavs were moving down the river valleys, a settlement that would become the people of Bosnia.' },
  { year: 867, end: 880, kind: 'religion', regions: 'all', classes: 'all',
    text: 'Slavonic church books were spreading through the Balkans, and with those books the first written words in the language people spoke at home.' },
  { year: 950, kind: 'context', regions: 'all', classes: 'all',
    text: 'In Constantinople the emperor\'s scribes wrote the name Bosnia down, a land of forests between Croatia and Serbia.' },
  { year: 1136, end: 1141, kind: 'war', regions: 'all', classes: 'all',
    text: 'Hungarian armies came down the valleys and Bosnia passed to the Hungarian crown.' },
  { year: 1154, kind: 'context', regions: 'all', classes: 'all',
    text: 'Bosnia got its own ban again: Borić, a Hungarian man, holding the land as the crown\'s frontier.' },
  { year: 1054, kind: 'religion', regions: 'all', classes: 'all',
    text: 'Rome and Constantinople broke with each other, and Bosnia sat on the seam between them.' },
  { year: 1167, kind: 'war', regions: ['usora', 'donjikraji'], classes: 'all',
    text: 'Byzantine and Hungarian armies fought over the mountain interior, and Bosnia was the prize both sides wanted.' },
  { year: 1412, kind: 'context', regions: 'all', classes: 'all',
    text: 'The Hungarian court held its great jousts at Buda, and Bosnian nobles who travelled north saw the chivalry of the age at full tilt.' },
  { year: 1362, kind: 'context', regions: ['hum'], classes: 'all',
    text: 'The feast of St Blaise in Dubrovnik drew traders from Hum, and the city opened its gates for days of trade and music.' },
  { year: 1371, kind: 'war', regions: ['podrinje', 'hum'], classes: 'all',
    text: 'The Serbian empire collapsed after Maritsa, and Bosnia gained room to claim what Serbia lost.' },
  { year: 1339, kind: 'religion', regions: 'all', classes: 'all',
    text: 'Franciscan friars organised a Bosnian vicariate, and Latin missions became a fixture of the court and the mining towns.' },
  { year: 1385, kind: 'war', regions: ['podrinje', 'hum'], classes: 'all',
    text: 'Ottoman raiders reached eastern Bosnia for the first time, and the frontier learned new methods of war.' },
  { year: 1404, end: 1418, kind: 'context', regions: 'all', classes: 'all',
    text: 'The nobility deposed and restored kings in a stanak of great lords, and the crown became a thing the magnates negotiated over.' },
  { year: 1451, kind: 'context', regions: ['vrhbosna', 'podrinje'], classes: 'all',
    text: 'The Ottomans formalised their Bosnian frontier district and took the Vrhbosna basin.' },
  { year: 1459, kind: 'religion', regions: 'all', classes: 'all',
    text: 'The king ordered the Bosnian Church clergy to convert to Catholicism or leave, and the old church broke a few years before the state did.' },
  { year: 1461, kind: 'coronation', regions: 'all', classes: 'all',
    text: 'The last king was crowned with a papal crown, a last attempt to bind Bosnia to Latin Europe.' },
  { year: 1189, kind: 'treaty', regions: 'all', classes: 'all',
    text: 'Ban Kulin sealed his charter to Dubrovnik, the oldest Bosnian document, promising the Ragusans free passage and protection.' },
  { year: 1203, kind: 'religion', regions: 'all', classes: 'all',
    text: 'At Bolino Polje, before the papal legate, the Bosnian Church promised obedience to Rome while keeping its own rite and its own elders.' },
  { year: 1235, end: 1244, kind: 'war', regions: 'all', classes: 'all',
    text: 'Pope Gregory IX called a crusade against the Bosnians as heretics, and Hungarian armies under the archbishop of Kaloča came down year after year.' },
  { year: 1241, kind: 'war', regions: 'all', classes: 'all',
    text: 'The Mongols broke the Hungarian kingdom, and Bosnian men who went to help died in the field at Mohi.' },
  { year: 1242, kind: 'war', regions: 'all', classes: 'all',
    text: 'Mongol raiders swept through Bosnia itself that year, and villages emptied before them.' },
  { year: 1326, kind: 'war', regions: ['hum', 'podrinje'], classes: 'all',
    text: 'Ban Stjepan II took Hum and its coastal towns into Bosnia.' },
  { year: 1330, kind: 'context', regions: 'all', classes: 'all',
    text: 'Serbia beat Byzantium at Velbužd, and the balance of the Balkans tilted east.' },
  { year: 1333, kind: 'treaty', regions: ['hum'], classes: 'all',
    text: 'Stjepan II sold the Hum coast to Dubrovnik, and Ragusan money and Ragusan law moved in along the old Roman roads.' },
  { year: 1340, kind: 'religion', regions: 'all', classes: 'all',
    text: 'Franciscan friars were beginning to work their way into Bosnia, taking the Catholic mission that the older bishopric had lost.' },
  { year: 1349, end: 1351, kind: 'plague', regions: 'all', classes: 'all',
    text: 'The great plague came through the valleys and took roughly one house in three.' },
  { year: 1366, end: 1367, kind: 'war', regions: 'all', classes: 'all',
    text: 'The great nobles rose against the young Ban Tvrtko, and for a year Bosnia was in arms against its own crown.' },
  { year: 1377, kind: 'coronation', regions: 'all', classes: 'all',
    text: 'Tvrtko was crowned king at the monastery near Mile, first King of Bosnia — and of the Serbs, and of the coast.' },
  { year: 1388, kind: 'war', regions: ['hum', 'podrinje', 'rama'], classes: 'all',
    text: 'Vlatko Vuković\'s Bosnian army met Ottoman raiders at Bileća and broke the raiders in the karst.' },
  { year: 1389, kind: 'war', regions: 'all', classes: 'all',
    text: 'Bosnian men marched south to Kosovo Polje, where the Serbian empire ended and the Ottomans advanced.' },
  { year: 1396, kind: 'war', regions: 'all', classes: 'all',
    text: 'Bosnian knights rode east to Nikopolje on the Danube with the Hungarian king, and the great crusade was destroyed in an afternoon.' },
  { year: 1408, kind: 'war', regions: ['donjikraji', 'krajina', 'usora'], classes: 'all',
    text: 'Sigismund of Hungary invaded Donji Kraji and put one hundred and seventy captured Bosnian nobles to the sword at Dobor.' },
  { year: 1415, kind: 'war', regions: ['podrinje', 'soli'], classes: 'all',
    text: 'Ottoman raiders came up the Drina and crushed the Bosnian army near Višegrad; Pavle Radinović died among his own men.' },
  { year: 1421, end: 1424, kind: 'war', regions: ['soli', 'podrinje', 'usora'], classes: 'all',
    text: 'The Ottomans and the Serbian despotate together took the eastern towns, and the frontier moved back year by year.' },
  { year: 1435, kind: 'context', regions: ['hum', 'podrinje'], classes: 'all',
    text: 'Stefan Vukčić Kosača took his father\'s place in Hum, and ruled the south nearly as a king.' },
  { year: 1443, kind: 'context', regions: 'all', classes: 'all',
    text: 'Tvrtko II died and Stjepan Tomaš was crowned, the last reign that mattered.' },
  { year: 1448, kind: 'context', regions: ['hum', 'podrinje'], classes: 'all',
    text: 'Stefan Vukčić was granted the title Herzog of St Sava, and the south slid out of the kingdom\'s hands.' },
  { year: 1453, kind: 'context', regions: 'all', classes: 'all',
    text: 'Constantinople fell to Mehmed II, and every border in the Balkans learned its new meaning.' },
  { year: 1459, kind: 'war', regions: 'all', classes: 'all',
    text: 'Serbia fell with Smederevo, and Bosnia stood alone against the Ottomans.' },
  { year: 1463, end: 1463, kind: 'conquest', regions: 'all', classes: 'all',
    text: 'Mehmed II came into Bosnia in May; Bobovac surrendered in days and King Tomašević was beheaded at Carevo Polje. Bosnia ceased to be.' },
];

// Everyday texture events. Not historical; they mark an ordinary life.
const PERSONAL_EVENTS = [
  { kind: 'harvest', regions: 'all', classes: 'all',
    text: 'The harvest was poor and the winter that followed was tight.' },
  { kind: 'raid', regions: 'all', classes: 'all',
    text: 'Raiders came down the valley and the cattle were driven off.' },
  { kind: 'fair', regions: 'all', classes: 'all',
    text: 'The fair at the nearest town was the biggest thing that happened that year.' },
  { kind: 'tithe', regions: 'all', classes: 'all',
    text: 'The tithe was paid in kind: grain, a pig, a string of dried fish.' },
  { kind: 'feast', regions: 'all', classes: 'all',
    text: 'The family feast was kept, and for one day the house smelled of roasting.' },
  { kind: 'illness', regions: 'all', classes: 'all',
    text: 'A fever went through the house and left them thinner.' },
  { kind: 'wedding', regions: 'all', classes: 'all',
    text: 'A wedding in the neighbourhood took three days and emptied the granary.' },
  { kind: 'child', regions: 'all', classes: 'all',
    text: 'A child was born in the house.' },
  { kind: 'death', regions: 'all', classes: 'all',
    text: 'A burial was held.' },
  { kind: 'coin', regions: 'all', classes: 'all',
    text: 'Ragusan coins were passing through their hands that year.' },
  { kind: 'refugee', regions: 'all', classes: 'all',
    text: 'Refugees came up the road with news from the south, and the village listened.' },
  { kind: 'stecci', regions: 'all', classes: 'all',
    text: 'A stone tomb was raised for a dead neighbour, carved in the old way.' },
  { kind: 'liturgy', regions: 'all', classes: 'all',
    text: 'The liturgy was sung in Slavonic, the language people actually spoke.' },
  { kind: 'caravan', regions: 'all', classes: 'all',
    text: 'A Ragusan caravan passed through, mules loaded with salt and cloth.' },

];

// Occupation detail: one sentence of how this life worked, dropped into the
// story after the opening. Keyed by occupation id.
const OCCUPATION_DETAIL = {
  kmet: 'They worked the family\'s fields, owed labour days and grain to the lord, and were never entirely free of the lord\'s court.',
  pastir: 'They drove sheep and goats to the high summer pastures, paid the cheese-and-wool dues, and knew the katun camps like a map.',
  rudar: 'They dug silver and lead in the mines, alongside Saxons and Ragusans who came for the ore, and learned that the mountain eats its workers.',
  trgovac: 'They ran mule caravans between the inland towns and the coast, trading silver, wax, hides and livestock for salt, cloth and wine.',
  vojnik: 'They served in a lord\'s retinue, rode to war when called, and stood watch on a wall when the frontier was quiet.',
  vlastelin: 'They were of the vlastela: castle rights, toll rights, a seat at court when the ban summoned the great lords.',
  vlastelic: 'They were a vlasteličić — one fortified tower, a few households of kmetovi, and hard choices between greater lords.',
  krstjanin: 'They belonged to the Bosnian Church, kept to its own elders and its own liturgy, and were called heretics by nearly everyone else.',
  svecenik: 'They served at the altar, heard confession where they could, and were a familiar face at the village\'s baptisms, weddings and burials.',
  domazet: 'They worked as a hired hand on someone else\'s land, and the margin between a good year and hunger was thin.',
  pisar: 'They could write — charters, letters, coin inscriptions — which made them worth more than most men-at-arms.',
  roblje: 'They had been captured and were being sold toward the coast, one name in a trade the neighbours preferred not to discuss.',
};

// What a life could be known for in its own neighbourhood.
const QUIRKS = [
  'famous for a voice that could be heard across a valley',
  'known for the best plum brandy within a day\'s walk',
  'remembered for winning a wrestling match nobody expected',
  'known for arguing with the parish priest and winning',
  'the one everyone asked to settle a boundary dispute',
  'known for a flock of sheep that never strayed',
  'remembered for surviving a fever that took two siblings',
  'the first in the village to own a Ragusan coin outright',
  'known for a hand at carving stone',
  'remembered for walking to the coast and back once, just to see it',
  'known for never having lost a lawsuit',
  'remembered for the tallest haystack anyone had seen',
];

// How this life ended. Keyed by class and era; the plague and the conquest
// years are their own windows.
const DEATHS = {
  plague: 'The plague of 1349 took them, as it took a third of the neighbourhood.',
  conquest: 'The Ottoman conquest reached them in 1463, and their world ended with the kingdom.',
  war: 'They died in the fighting, as a great many in their family had.',
  childbirth: 'They died in childbirth, in the way so many women of that time did.',
  illness: 'They died of an illness that a modern village doctor would have treated in a week.',
  old: 'They died in bed, old for their time and luckier than most.',
  infant: 'They died before they could remember the world they were born into.',
};

function deathCause(life) {
  const d = life.deathYear, b = life.year;
  if (life.lifespan < 6) return DEATHS.infant;
  if (d >= 1463) return DEATHS.conquest;
  if (d >= 1349 && d <= 1351) return DEATHS.plague;
  if (life.occ.id === 'vojnik' && d >= 1388 && d <= 1463) return DEATHS.war;
  if (life.sex === 'female' && life.lifespan >= 16 && life.lifespan <= 42) return DEATHS.childbirth;
  if (life.lifespan >= 55) return DEATHS.old;
  return DEATHS.illness;
}

/* ---------- everyday life, culture and sources ---------- */

// Named places with rough map coordinates, so a click on the map can snap to
// the closest place we actually have data on. Coordinates are schematic
// (same 400x300 space as the region map), not survey positions.
// kind: village | town | mining | fortress | monastery | market
for (const r of REGIONS) {
  r.places = [];
}
function addPlace(regionId, name, x, y, kind) {
  const r = REGIONS.find(z => z.id === regionId);
  if (r) r.places.push({ name, x, y, kind });
}
addPlace('usora', 'Tešanj', 188, 66, 'fortress');
addPlace('usora', 'Doboj', 202, 70, 'fortress');
addPlace('usora', 'Maglaj', 196, 60, 'fortress');
addPlace('usora', 'Vranduk', 206, 66, 'fortress');
addPlace('usora', 'Srebrenik', 214, 62, 'fortress');
addPlace('usora', 'Gradačac', 226, 58, 'town');
addPlace('usora', 'Modriča', 210, 54, 'village');
addPlace('soli', 'Srebrenica', 288, 96, 'mining');
addPlace('soli', 'Zvornik', 276, 78, 'fortress');
addPlace('soli', 'Osat', 296, 86, 'village');
addPlace('soli', 'Tuzla', 258, 74, 'market');
addPlace('donjikraji', 'Banja Luka', 104, 74, 'town');
addPlace('donjikraji', 'Kotor Varoš', 122, 78, 'town');
addPlace('donjikraji', 'Ključ', 108, 92, 'fortress');
addPlace('donjikraji', 'Zvečaj', 112, 68, 'fortress');
addPlace('krajina', 'Jajce', 96, 138, 'fortress');
addPlace('krajina', 'Ključ', 106, 128, 'fortress');
addPlace('krajina', 'Vrbaški Grad', 88, 130, 'village');
addPlace('podrinje', 'Višegrad', 306, 140, 'town');
addPlace('podrinje', 'Foča', 312, 156, 'town');
addPlace('podrinje', 'Goražde', 300, 148, 'town');
addPlace('podrinje', 'Rogatica', 296, 134, 'village');
addPlace('vrhbosna', 'Visoko', 212, 112, 'market');
addPlace('vrhbosna', 'Mile', 208, 108, 'monastery');
addPlace('vrhbosna', 'Bobovac', 220, 106, 'fortress');
addPlace('vrhbosna', 'Fojnica', 204, 118, 'mining');
addPlace('vrhbosna', 'Kreševo', 202, 122, 'mining');
addPlace('vrhbosna', 'Olovo', 232, 108, 'mining');
addPlace('vrhbosna', 'Vareš', 226, 114, 'mining');
addPlace('vrhbosna', 'Kiseljak', 206, 120, 'town');
addPlace('rama', 'Prozor', 172, 168, 'town');
addPlace('rama', 'Uskoplje', 164, 160, 'town');
addPlace('rama', 'Konjic', 192, 176, 'town');
addPlace('rama', 'Rama', 168, 176, 'village');
addPlace('hum', 'Blagaj', 208, 236, 'fortress');
addPlace('hum', 'Stolac', 222, 244, 'town');
addPlace('hum', 'Počitelj', 200, 246, 'fortress');
addPlace('hum', 'Mostar', 204, 240, 'town');
addPlace('hum', 'Trebinje', 236, 252, 'town');
addPlace('hum', 'Neum', 186, 254, 'village');
addPlace('hum', 'Popovo', 228, 236, 'village');
addPlace('hum', 'Dabar', 240, 240, 'village');

// Everyday life: customs, food, clothing, song, appearance. Every entry
// carries a source key and, where the record is thin, an `estimate` flag so
// the app can say plainly that it is a reconstruction.
const SOURCES = [
  { key: 'fine', label: 'Fine, The Late Medieval Balkans' },
  { key: 'fine-early', label: 'Fine, The Early Medieval Balkans' },
  { key: 'malcolm', label: 'Malcolm, Bosnia: A Short History' },
  { key: 'cirkovic', label: 'Ćirković, The Double Wreath' },
  { key: 'church', label: 'Fine, The Bosnian Church' },
  { key: 'dai', label: 'Constantine VII, De Administrando Imperio (primary)' },
  { key: 'kulin', label: 'Charter of Ban Kulin, 1189 (primary)' },
  { key: 'franciscans', label: 'Cholewicki, Franciscans in the Kingdom of Bosnia' },
  { key: 'coins', label: 'Central Bank of BiH, medieval Bosnian coinage' },
  { key: 'relations', label: 'Dautović, Filipović & Isailović, Medieval Bosnia and South-East European Relations' },
];

const CULTURE = {
  customs: [
    { text: 'Weddings ran for three days, with the bride led from her village on horseback and the two households trading gifts of grain, cloth and livestock.', src: 'fine', estimate: true },
    { text: 'The dead were buried under a stećak — the great carved stone chests of the Bosnian highlands — often with a figure carved standing, hand raised in oath.', src: 'fine', estimate: false },
    { text: 'Feast days of the church calendar structured the year: Christmas, St George\'s day, St Demetrius, each with its own foods, visits and obligations.', src: 'malcolm', estimate: true },
    { text: 'A slava — the household\'s own patron saint\'s day — was kept in Orthodox homes with a cake of bread and a censer of smoke.', src: 'malcolm', estimate: true },
    { text: 'Blood-feud was settled by oath and by payment of grain and coin; the community stood surety for both sides.', src: 'cirkovic', estimate: true },
    { text: 'The krstjani kept their own house of prayer, received visitors with a kiss of peace, and were buried in the same highland cemeteries as their Catholic neighbours.', src: 'church', estimate: false },
  ],
  food: [
    { text: 'Bread of wheat and barley when the harvest allowed, otherwise porridge of millet and beans; bread was the mark of a household that had managed a good year.', src: 'fine', estimate: true },
    { text: 'Sheep\'s milk and cheese, kept through winter in brine; kajmak-style clotted cream as the mountain treat.', src: 'fine', estimate: true },
    { text: 'Cured and salted pork for the winter, game and river fish when the lord\'s forest or the river allowed.', src: 'fine', estimate: true },
    { text: 'Wine from the Hum coast and the Dalmatian towns, arriving in Ragusan barrels and drunk thin and warmed; ale and mead in the inland houses.', src: 'malcolm', estimate: true },
    { text: 'Cabbage, turnip, onion and garlic from the garden patch; walnuts and wild berries in season.', src: 'fine', estimate: true },
  ],
  clothing: [
    { text: 'Coarse woollen tunic and cloak, a leather belt with knife and purse, sandals or ankle boots of hide; the wealth was in the wool, not the cloth.', src: 'fine', estimate: true },
    { text: 'Nobles wore finer wool, fur-trimmed cloaks, and silk or brocade bought through Dubrovnik; a sword at the belt, not a knife.', src: 'fine', estimate: true },
    { text: 'Felt caps for men, linen head-cloths for women; unmarried girls wore their hair braided and visible.', src: 'fine', estimate: true },
    { text: 'The great carved stećci show the dead exactly so: standing figures with raised hands, swords and staffs, belts and long robes.', src: 'fine', estimate: false },
  ],
  songs: [
    { text: 'Epic songs of the frontier, sung to the one-string gusle — the South-Slavic tradition of praising a lord\'s courage in verse long predates its written record.', src: 'malcolm', estimate: true },
    { text: 'Laments at the graveside, sung by women, telling the life of the dead in a rising, repeated line.', src: 'fine', estimate: true },
    { text: 'Wedding songs with a refrain the whole village could join; church singing in Slavonic in the Orthodox east, in Latin in the Catholic west.', src: 'malcolm', estimate: true },
  ],
  appearance: [
    { text: 'A life of fields, mines and mountain tracks built hard, lean bodies; most adults were shorter than today, and a man of 170 cm was a tall one.', src: 'fine', estimate: true },
    { text: 'Teeth worn from stone-ground bread; scars from farm tools and, in the east, from Ottoman raids.', src: 'fine', estimate: true },
    { text: 'Skin weathered by sun and wind; hair worn long or covered by head-cloth or felt cap.', src: 'fine', estimate: true },
  ],
};

// A representative real photo per region — what the place looks like today
// (the same fortress, necropolis, bridge or valley stands where it stood).
const SITE_IMAGES = {
  vrhbosna: { img: 'bobovac', then: 'Bobovac, the royal fortress above the Vareš roads', now: 'The walls still stand above the valley; you can walk the ridge today.' },
  hum: { img: 'humtekke', then: 'Blagaj and the Buna spring, the Kosača seat in Hum', now: 'The Blagaj Tekke and the Buna spring draw visitors today.' },
  krajina: { img: 'jajce', then: 'Jajce, the late fortress capital of the kingdom', now: 'The fortress and the Pliva waterfall are the town\'s great sights.' },
  donjikraji: { img: 'blagaj', then: 'The Blagaj fort on the Sana, in Donji Kraji', now: 'The ruin still marks the frontier the Hrvatinići held.' },
  usora: { img: 'srebrenik', then: 'Srebrenik, a seat of the Bosnian kings in Usora', now: 'The castle is a visitable ruin above the modern town.' },
  soli: { img: 'srebrenik', then: 'Srebrenik, near the salt-and-silver lands of Soli', now: 'The castle is a visitable ruin above the modern town.' },
  podrinje: { img: 'visebro', then: 'The Drina crossing at Višegrad, on the caravan road', now: 'The famous bridge stands today (built later, in 1577).' },
  rama: { img: 'blagaj', then: 'The Blagaj fort, near the Rama routes to the coast', now: 'The ruin still marks the road the mule trains took.' },
  stecci: { img: 'stecci', then: 'A necropolis of stećci — the carved stone tombs of the highlands', now: 'Radimlja is the best-known necropolis; the stones are still standing.' },
};
