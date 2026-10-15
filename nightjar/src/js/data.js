/* ============================================================
   Fictional data. Names, firms, numbers and events are invented.
   Phone numbers use the 555-01xx range reserved for fiction;
   IP addresses use the 192.0.2.x / 198.51.100.x / 203.0.113.x
   documentation ranges.
   ============================================================ */

const STATUS = {
  'PRIORITY TARGET': { cls: 't-red', rank: 0 },
  'WATCHLIST': { cls: 't-amb', rank: 1 },
  'MONITORED': { cls: 't-acc', rank: 2 },
  'ASSET — ACTIVE': { cls: 't-ok', rank: 3 },
  'CLEARED': { cls: 't-dim', rank: 4 }
};

const SUBJECT_SEED = [
  { first: 'Daniel', mi: 'R', last: 'Mercer', ph: 147, plate: 'KXR-2190', sex: 'M', age: 41, occ: 'Systems Engineer', emp: 'Halvorsen Aerodynamics', city: 'Arlington, VA', area: '703', status: 'PRIORITY TARGET', threat: 91, alias: ['D. Merrick', '"COPPERHEAD"'], hair: 'BROWN', eyes: 'GRAY',
    notes: 'Subject accessed the restricted design archive [[HALVORSEN PROJECT 7]] on three occasions outside authorized hours. Encrypted traffic to an unidentified relay in [[REDACTED]] observed 02:14–02:31 EST. Subject has varied his commute on 6 of the last 7 days. Recommend continuous physical surveillance. DO NOT APPROACH.' },
  { first: 'Elena', mi: 'M', last: 'Vasquez-Hart', ph: 171, sex: 'F', age: 36, occ: 'Investigative Journalist', emp: 'The Meridian Ledger', city: 'Washington, DC', area: '202', status: 'WATCHLIST', threat: 64, alias: [], hair: 'BLACK', eyes: 'BROWN',
    notes: 'Subject has filed four records requests referencing [[NIGHTJAR]] since August. Meets a source of unknown identity at irregular intervals. Source believed to have access to [[REDACTED]]. Media handling rules apply — no direct contact without Director approval.' },
  { first: 'Marcus', mi: 'A', last: 'Okafor', sex: 'M', age: 29, occ: 'Doctoral Candidate, Applied Cryptography', emp: 'Chesapeake Institute of Technology', city: 'Baltimore, MD', area: '410', status: 'MONITORED', threat: 38, alias: ['"m_okfr"'], hair: 'BLACK', eyes: 'BROWN',
    notes: 'Published a paper on lattice-based key exchange that was cited in intercepted correspondence. No evidence of direct involvement. Passive monitoring of public forums only.' },
  { first: 'Lydia', mi: 'J', last: 'Chen', sex: 'F', age: 47, occ: 'Harbor Inspector', emp: 'Chesapeake Freight Terminal', city: 'Norfolk, VA', area: '757', status: 'CLEARED', threat: 12, alias: [], hair: 'BLACK', eyes: 'BROWN',
    notes: 'Flagged an irregular manifest from CALDER BAY MARITIME on 09/12 and reported it through proper channels. Cleared. Potential cooperative witness.' },
  { first: 'Thomas', mi: 'W', last: 'Kessler', ph: 133, sex: 'M', age: 58, occ: 'Defense Consultant (Retired)', emp: 'Self-employed', city: 'Alexandria, VA', area: '571', status: 'WATCHLIST', threat: 71, alias: ['T. Kesler', '"FOXGLOVE"'], hair: 'GRAY', eyes: 'BLUE',
    notes: 'Former program manager with [[TS/SCI]] access, which lapsed in 2023. Maintains contact with three current program staff. Two unreported foreign trips in the last 18 months ([[REDACTED]]). Financial review pending.' },
  { first: 'Amira', mi: 'S', last: 'Haddad', sex: 'F', age: 33, occ: 'Trauma Surgeon', emp: 'St. Brennan Medical Center', city: 'Philadelphia, PA', area: '215', status: 'CLEARED', threat: 8, alias: [], hair: 'BROWN', eyes: 'BROWN',
    notes: 'Treated an unidentified male with injuries consistent with [[REDACTED]] on 09/17. Hospital records obtained under Directive 41-C. No further interest.' },
  { first: 'Jonah', mi: 'T', last: 'Pruitt', ph: 119, sex: 'M', age: 24, occ: 'Freelance Network Technician', emp: 'Self-employed', city: 'Richmond, VA', area: '804', status: 'PRIORITY TARGET', threat: 86, alias: ['"SIGNALFIRE"', 'J. Pratt'], hair: 'BLONDE', eyes: 'GREEN',
    notes: 'Operates a relay network used to move the stolen archive. Purchased satellite modem hardware with cash under an alias. Highly technical. Assume all known devices are compromised or decoys. [[REDACTED]] authorized.' },
  { first: 'Sofia', mi: 'L', last: 'Marchetti', sex: 'F', age: 39, occ: 'Art Dealer', emp: 'Marchetti & Vale Gallery', city: 'New York, NY', area: '212', status: 'MONITORED', threat: 45, alias: [], hair: 'AUBURN', eyes: 'HAZEL',
    notes: 'Gallery shipments routed through CALDER BAY MARITIME. Declared values do not match insurance filings. Possible laundering channel. Financial liaison notified.' },
  { first: 'Victor', mi: 'E', last: 'Lang', ph: 164, sex: 'M', age: 52, occ: 'Logistics Director', emp: 'Calder Bay Maritime', city: 'Norfolk, VA', area: '757', status: 'PRIORITY TARGET', threat: 88, alias: ['"HARBORMASTER"', 'V. Laing'], hair: 'GRAY', eyes: 'BLUE',
    notes: 'Controls container scheduling at Pier 9. Linked to $2.4M in structured payments over 11 months. Coordinates with MERCER through an intermediary. Subject is believed to be armed.' },
  { first: 'Grace', mi: 'E', last: 'Whitfield', ph: 190, sex: 'F', age: 61, occ: 'Retired Federal Analyst', emp: 'None', city: 'Silver Spring, MD', area: '301', status: 'WATCHLIST', threat: 57, alias: [], hair: 'WHITE', eyes: 'BLUE',
    notes: 'Retired analyst who was briefed on [[PROJECT NIGHTJAR]] Phase I. Interviewed by VASQUEZ-HART on 08/29. Content of the interview is unknown. Mail cover in place.' },
  { first: 'Samuel', mi: 'D', last: 'Ortega', ph: 128, sex: 'M', age: 45, occ: 'Charter Pilot / Operator', emp: 'Ortega Air Charter', city: 'Miami, FL', area: '305', status: 'MONITORED', threat: 49, alias: [], hair: 'BLACK', eyes: 'BROWN',
    notes: 'Flew six unscheduled charters from a regional strip near Norfolk. Passenger manifests were incomplete. Aircraft tail number [[REDACTED]] is tracked by transponder.' },
  { first: 'Nadia', mi: 'K', last: 'Petrova', sex: 'F', age: 31, occ: 'Software Developer', emp: 'Lumina Grid Systems', city: 'Chicago, IL', area: '312', status: 'CLEARED', threat: 19, alias: [], hair: 'BLONDE', eyes: 'BLUE',
    notes: 'Co-authored an open-source library with OKAFOR. Code was later found in relay software attributed to PRUITT. No knowing involvement found.' },
  { first: 'Owen', mi: 'P', last: 'Gallagher', sex: 'M', age: 34, occ: 'Paramedic', emp: 'Boston EMS District 4', city: 'Boston, MA', area: '617', status: 'CLEARED', threat: 6, alias: [], hair: 'RED', eyes: 'GREEN',
    notes: 'Brother-in-law of DOYLE. Incidental collection only. Records minimized.' },
  { first: 'Hana', mi: 'M', last: 'Takeda', sex: 'F', age: 28, occ: 'Satellite Communications Engineer', emp: 'Polaris Uplink Corp.', city: 'Denver, CO', area: '720', status: 'MONITORED', threat: 41, alias: [], hair: 'BLACK', eyes: 'BROWN',
    notes: 'Sold modem firmware licenses to a shell company tied to PRUITT. Subject is likely unaware of the end user. Possible cooperative source.' },
  { first: 'Raymond', mi: 'J', last: 'Doyle', ph: 156, sex: 'M', age: 49, occ: 'Private Investigator', emp: 'Doyle Investigations LLC', city: 'Baltimore, MD', area: '443', status: 'WATCHLIST', threat: 62, alias: ['"THE PLUMBER"'], hair: 'BROWN', eyes: 'BROWN',
    notes: 'Retained by VASQUEZ-HART. Has conducted counter-surveillance sweeps on her residence. Ex-police (Baltimore County, 1998–2016). Professional. Expect him to detect static surveillance.' },
  { first: 'Isabel', mi: 'C', last: 'Moreau', sex: 'F', age: 44, occ: 'Contract Translator', emp: 'Lindqvist Language Services', city: 'Washington, DC', area: '202', status: 'ASSET — ACTIVE', threat: 22, alias: ['CODENAME: WREN'], hair: 'BROWN', eyes: 'GREEN',
    notes: 'Controlled asset, codename WREN. Handled by [[REDACTED]]. Embedded with MERCER\'s social circle since June. Reporting is reliable. PROTECT IDENTITY. Access restricted to Level 5.' }
];

const LINKS = [
  [0, 6, 'ENCRYPTED CONTACT'], [0, 8, 'PAYMENTS VIA INTERMEDIARY'], [0, 4, 'FORMER COLLEAGUE'], [0, 1, 'SUSPECTED SOURCE'], [0, 15, 'SOCIAL CONTACT'],
  [1, 14, 'HIRED INVESTIGATOR'], [1, 9, 'INTERVIEW 08/29'], [2, 6, 'FORUM CONTACT'], [2, 11, 'CO-AUTHOR'],
  [3, 8, 'PORT INSPECTIONS'], [4, 9, 'FORMER COLLEAGUE'], [5, 12, 'MEDICAL CONFERENCE'], [6, 13, 'HARDWARE PURCHASE'],
  [7, 8, 'SHIPMENTS'], [7, 10, 'CHARTER CLIENT'], [8, 10, 'CHARTER FLIGHTS'], [9, 15, 'UNKNOWN — 6 MEETINGS'], [14, 15, 'COUNTER-SURVEILLANCE'],
  [11, 13, 'PERSONAL'], [12, 14, 'BROTHER-IN-LAW']
];

const STREETS = ['Larkmoor Ave', 'Ashgrove St', 'Kettering Pl', 'Hollis Ridge Rd', 'Brantwood Ct', 'Cobalt Way', 'Marlowe St', 'Wrenfield Dr', 'Pellham Ave', 'Stonecrest Ln', 'Halsey St', 'Dunmore Rd', 'Quarry Bend', 'Talbot Sq'];
const PLACES = [
  'UNION TRANSIT CONCOURSE B', 'HALSEY ST & 14TH', 'PIER 9 — CALDER BAY', 'LOT 4 PARKING STRUCTURE', 'HALVORSEN AERO — GATE 2', 'CAFÉ LUMEN', 'RIVERSIDE MOTEL RM 112',
  'NORTH CHANNEL BRIDGE', 'STOR-ALL UNIT 47B', 'DUNMORE PUBLIC LIBRARY', 'GREYLINE BUS DEPOT', 'MARLOWE ST PHARMACY', 'AIRPORT TERMINAL C', 'KETTERING PARK — EAST GATE', 'WRENFIELD MALL — LEVEL 2', 'HARBOR VIEW DINER'
];
const SOURCES = ['CCTV', 'LPR', 'CELL', 'CARD', 'WI-FI', 'FACIAL', 'TRANSIT'];
const MERCHANTS = ['GREYLINE TRANSIT', 'CAFÉ LUMEN', 'STOR-ALL SELF STORAGE', 'HARBOR VIEW DINER', 'KESTREL FUEL #2241', 'MARLOWE ST PHARMACY', 'NORTHGATE ELECTRONICS', 'RIVERSIDE MOTEL', 'CASH WITHDRAWAL — ATM 0931', 'WIRE TRANSFER — INTL', 'PREPAID CARD RELOAD', 'TRANSATLAS AIRWAYS', 'CITY PARKING AUTH.', 'QUICKMART #118'];
const FLAG_WORDS = ['SHIPMENT', 'ARCHIVE', 'PIER', 'THURSDAY', 'RELAY', 'CASH', 'CHARTER', 'DRIVES', 'NIGHTJAR'];

function buildSubjects() {
  const out = SUBJECT_SEED.map((s, i) => {
    const r = rng(hash(s.last + s.first) + 7);
    const id = 'CIV-' + (1001 + i);
    const year = 2026 - s.age;
    const dob = new Date(Date.UTC(year, Math.floor(r() * 12), 1 + Math.floor(r() * 27)));
    const ht = s.sex === 'M' ? 68 + Math.floor(r() * 8) : 62 + Math.floor(r() * 8);
    const wt = s.sex === 'M' ? 160 + Math.floor(r() * 60) : 118 + Math.floor(r() * 50);
    const phoneN = s.ph || (100 + Math.floor(r() * 100));
    const phone = `(${s.area}) 555-0${phoneN}`;
    const plate = s.plate || String.fromCharCode(65 + Math.floor(r() * 26), 65 + Math.floor(r() * 26), 65 + Math.floor(r() * 26)) + '-' + (1000 + Math.floor(r() * 8999));
    const vehicle = pick(r, ['Gray sedan, 4-door', 'Black SUV', 'White pickup', 'Dark blue hatchback', 'Silver minivan', 'Black sedan, tinted', 'Green compact']) + ', ' + (2012 + Math.floor(r() * 13));
    const addr = `${100 + Math.floor(r() * 8900)} ${pick(r, STREETS)}, ${s.city}`;
    const rec = { ...s, id, idLong: `${id}-${pad(Math.floor(r() * 9999), 4)}-${String.fromCharCode(65 + Math.floor(r() * 26))}`,
      name: `${s.first} ${s.mi}. ${s.last}`.toUpperCase(),
      dob: `${pad(dob.getUTCMonth() + 1)}/${pad(dob.getUTCDate())}/${year}`,
      height: `${Math.floor(ht / 12)}'${ht % 12}"`, weight: wt + ' LB', phone, plate, vehicle, addr,
      nid: `NID ${pad(Math.floor(r() * 99))}${String.fromCharCode(65 + Math.floor(r() * 26))}-${pad(Math.floor(r() * 99999), 5)}-${String.fromCharCode(65 + Math.floor(r() * 26))}`,
      imei: `35-${pad(Math.floor(r() * 999999), 6)}-${pad(Math.floor(r() * 999999), 6)}-${Math.floor(r() * 9)}`,
      ip: `${pick(r, ['192.0.2', '198.51.100', '203.0.113'])}.${1 + Math.floor(r() * 250)}`,
      lang: s.sex === 'F' ? pick(r, ['English, Spanish', 'English, French', 'English', 'English, Mandarin', 'English, Italian']) : pick(r, ['English', 'English, German', 'English, Spanish', 'English, Portuguese']),
      face: { seed: hash(s.first + s.last), sex: s.sex, hair: s.hair, age: s.age },
      lastSeen: null, moves: [], calls: [], txns: [], travel: [], assoc: []
    };
    // movements, last 72h
    const t0 = Date.UTC(2026, 9, 15, 14, 0) - 72 * 3600e3;
    let tt = t0;
    let x = .2 + r() * .6, y = .2 + r() * .6;
    const nm = 8 + Math.floor(r() * 5);
    for (let k = 0; k < nm; k++) {
      tt += (3 + r() * 6) * 3600e3;
      x = clamp(x + (r() - .5) * .35, .06, .94); y = clamp(y + (r() - .5) * .35, .08, .92);
      rec.moves.push({ t: tt, place: pick(r, PLACES), src: pick(r, SOURCES), x, y, conf: 70 + Math.floor(r() * 30) });
    }
    rec.lastSeen = rec.moves[rec.moves.length - 1];
    // calls
    const nc = 9 + Math.floor(r() * 6);
    for (let k = 0; k < nc; k++) {
      const d = t0 + r() * 72 * 3600e3;
      rec.calls.push({ t: d, dir: r() < .5 ? 'OUT' : 'IN', num: `(${pick(r, ['202', '703', '410', '757', '804', '212', '305'])}) 555-01${pad(Math.floor(r() * 100))}`, dur: Math.floor(5 + r() * 900),
        type: pick(r, ['VOICE', 'VOICE', 'SMS', 'SMS', 'DATA']), flag: s.threat > 40 && r() < .35 ? pick(r, FLAG_WORDS) : '' });
    }
    rec.calls.sort((a, b) => b.t - a.t);
    // transactions
    const nt = 10 + Math.floor(r() * 6);
    for (let k = 0; k < nt; k++) {
      const m = pick(r, MERCHANTS);
      const big = /WIRE|CASH|PREPAID/.test(m);
      rec.txns.push({ t: t0 - r() * 30 * 86400e3, m, amt: big ? 400 + Math.floor(r() * 9600) : 4 + Math.floor(r() * 180) + r(), card: '••' + pad(Math.floor(r() * 9999), 4), flag: big && s.threat > 40 });
    }
    rec.txns.sort((a, b) => b.t - a.t);
    rec.months = Array.from({ length: 12 }, (_, k) => Math.round(1500 + r() * 4000 + (s.threat > 60 && k > 6 ? r() * 9000 : 0)));
    // travel
    const routes = [['DCA', 'BOS'], ['IAD', 'LIS'], ['BWI', 'MIA'], ['ORF', 'ATL'], ['IAD', 'FRA'], ['DCA', 'ORD'], ['JFK', 'IST'], ['IAD', 'DEN'], ['MIA', 'PTY']];
    const ntr = 2 + Math.floor(r() * 4);
    for (let k = 0; k < ntr; k++) {
      const rt = pick(r, routes);
      rec.travel.push({ t: t0 - r() * 300 * 86400e3, from: rt[0], to: rt[1], flt: pick(r, ['TA', 'NW', 'CX', 'AV']) + ' ' + (100 + Math.floor(r() * 2800)), seat: (8 + Math.floor(r() * 30)) + pick(r, ['A', 'C', 'D', 'F']), flag: s.threat > 60 && r() < .5 });
    }
    rec.travel.sort((a, b) => b.t - a.t);
    return rec;
  });
  LINKS.forEach(([a, b, label]) => {
    out[a].assoc.push({ id: out[b].id, label });
    out[b].assoc.push({ id: out[a].id, label });
  });
  out.forEach((s, i) => {
    const r = rng(i * 991 + 3);
    const n = s.threat > 50 ? 2 : 1;
    for (let k = 0; k < n; k++) s.assoc.push({ id: null, label: pick(r, ['UNIDENTIFIED — ' + (6 + Math.floor(r() * 30)) + ' CALLS', 'BURNER DEVICE', 'UNKNOWN MALE', 'UNKNOWN FEMALE']), ghost: 'UNK-' + Math.floor(r() * 65535).toString(16).toUpperCase().padStart(4, '0') });
  });
  return out;
}

const SUBJECTS = buildSubjects();
const SUBJ = id => SUBJECTS.find(s => s.id === id);

/* Saved edits from prop control (per device). */
const EDITABLE = ['name', 'occ', 'emp', 'addr', 'phone', 'dob', 'height', 'weight', 'eyes', 'hair', 'vehicle', 'plate', 'notes', 'status', 'city'];
function loadSubjectEdits() {
  const ed = Store.get('subjects', {});
  Object.keys(ed).forEach(id => { const s = SUBJ(id); if (!s) return; Object.keys(ed[id]).forEach(k => { if (EDITABLE.includes(k) || k === 'photo' || k === 'threat') s[k] = ed[id][k]; }); });
}
function saveSubjectEdit(id, key, val) {
  const ed = Store.get('subjects', {});
  (ed[id] = ed[id] || {})[key] = val;
  const ok = Store.set('subjects', ed);
  const s = SUBJ(id); if (s) s[key] = val;
  Bus.emit('subject', id);
  return ok;
}
loadSubjectEdits();

/* ---------- satellites (fictional constellation) ---------- */
const SATS = [
  { id: 'NJ-1', name: 'HALCYON', type: 'EO/IR IMAGING', alt: 520, inc: 97.4, raan: 20, ph: 0, res: '0.11 M', band: 'X / Ka' },
  { id: 'NJ-4', name: 'VESPER', type: 'SIGINT COLLECTOR', alt: 1100, inc: 63.4, raan: 140, ph: 1.2, res: '—', band: 'S / L / UHF' },
  { id: 'LARK-7', name: 'LARK', type: 'SYNTHETIC APERTURE RADAR', alt: 680, inc: 42, raan: 250, ph: 2.4, res: '0.25 M', band: 'X' },
  { id: 'OBS-2', name: 'OBSIDIAN', type: 'EO IMAGING', alt: 450, inc: 51.6, raan: 80, ph: 3.3, res: '0.09 M', band: 'Ka' },
  { id: 'TERN-11', name: 'TERN', type: 'GEO RELAY', alt: 35786, inc: 0, raan: 0, ph: 0, geoLon: -77, res: '—', band: 'Ka / EHF' },
  { id: 'GNT-3', name: 'GANNET', type: 'ELINT', alt: 900, inc: 72, raan: 200, ph: 4.1, res: '—', band: 'C / X' },
  { id: 'PTR-9', name: 'PETREL', type: 'EO/IR IMAGING', alt: 600, inc: 98, raan: 310, ph: 5.2, res: '0.14 M', band: 'X' },
  { id: 'KST-5', name: 'KESTREL', type: 'EARLY WARNING (MEO)', alt: 20200, inc: 55, raan: 95, ph: .7, res: '—', band: 'SWIR' }
];
SATS.forEach((s, i) => { s.status = i === 5 ? 'DEGRADED' : 'NOMINAL'; s.signal = 62 + ((i * 37) % 36); });

const TARGETS = [
  { id: 'A', name: 'ARLINGTON, VA', lat: 38.88, lon: -77.10, seed: 11, note: 'MERCER RESIDENCE / HALVORSEN AERO' },
  { id: 'B', name: 'NORFOLK HARBOR, VA', lat: 36.85, lon: -76.29, seed: 22, note: 'PIER 9 — CALDER BAY MARITIME' },
  { id: 'C', name: 'BALTIMORE, MD', lat: 39.29, lon: -76.61, seed: 33, note: 'DOYLE INVESTIGATIONS OFFICE' },
  { id: 'D', name: 'RICHMOND, VA', lat: 37.54, lon: -77.44, seed: 44, note: 'PRUITT — RELAY NODE (SUSPECTED)' },
  { id: 'E', name: 'MIAMI, FL', lat: 25.77, lon: -80.19, seed: 55, note: 'ORTEGA AIR CHARTER HANGAR' },
  { id: 'F', name: 'DENVER, CO', lat: 39.74, lon: -104.99, seed: 66, note: 'POLARIS UPLINK — GROUND STATION' },
  { id: 'G', name: 'LISBON, PT', lat: 38.72, lon: -9.14, seed: 77, note: 'COPPER VEIL — DEAD DROP' },
  { id: 'H', name: 'ISTANBUL, TR', lat: 41.01, lon: 28.98, seed: 88, note: 'STATIC CROWN — MEETING SITE' }
];

/* ---------- operations ---------- */
const OPS = [
  { name: 'GLASS HARBOR', place: 'Norfolk, VA', lat: 36.85, lon: -76.29, status: 'ACTIVE', lead: 'R. HALLORAN', note: 'Cargo diversion inquiry at Pier 9. Three vessels under watch. Linked to LANG, MERCER.' },
  { name: 'IRON WREN', place: 'Washington, DC', lat: 38.9, lon: -77.03, status: 'ACTIVE', lead: '[REDACTED]', note: 'Domestic counter-intelligence. Asset WREN embedded with MERCER network.' },
  { name: 'NORTHERN LANTERN', place: 'Reykjavík', lat: 64.15, lon: -21.94, status: 'MONITORING', lead: 'K. ADEYEMI', note: 'Undersea cable landing anomaly. Signal integrity review ongoing.' },
  { name: 'COPPER VEIL', place: 'Lisbon', lat: 38.72, lon: -9.14, status: 'STANDBY', lead: 'M. FARRIS', note: 'Suspected dead drop used for archive hand-off. Team on 4-hour notice.' },
  { name: 'STATIC CROWN', place: 'Istanbul', lat: 41.01, lon: 28.98, status: 'ACTIVE', lead: 'J. OKONKWO', note: 'Buyer meeting expected within 10 days. Liaison channel open.' },
  { name: 'PALE ORCHARD', place: 'Singapore', lat: 1.29, lon: 103.85, status: 'MONITORING', lead: 'D. SATO', note: 'Shell company payments. Financial intelligence only.' },
  { name: 'SILENT HARROW', place: 'Anchorage, AK', lat: 61.22, lon: -149.9, status: 'ACTIVE', lead: 'L. VOSS', note: 'Arctic ground-station security review.' },
  { name: 'AMBER TIDE', place: 'Seoul', lat: 37.57, lon: 126.98, status: 'MONITORING', lead: 'H. PARK', note: 'Firmware supply-chain audit (TAKEDA lead).' },
  { name: 'HOLLOW PINE', place: 'Nairobi', lat: -1.29, lon: 36.82, status: 'STANDBY', lead: 'A. MWANGI', note: 'Regional relay fallback site.' },
  { name: 'BLUE TALLOW', place: 'Buenos Aires', lat: -34.6, lon: -58.38, status: 'CLOSED', lead: 'C. RUIZ', note: 'Closed 08/30. Findings archived.' },
  { name: 'GREY LATTICE', place: 'Denver, CO', lat: 39.74, lon: -104.99, status: 'MONITORING', lead: 'S. BRANDT', note: 'Polaris Uplink ground station. Passive monitoring.' },
  { name: 'NORTH STAIR', place: 'Seattle, WA', lat: 47.61, lon: -122.33, status: 'STANDBY', lead: 'E. NAKAMURA', note: 'Contingency team, west coast.' }
];
const OPS_STATUS = { ACTIVE: 't-red', MONITORING: 't-acc', STANDBY: 't-amb', CLOSED: 't-dim' };

const US_CITIES = [
  ['WASHINGTON', 38.9, -77.03], ['NEW YORK', 40.71, -74.0], ['CHICAGO', 41.88, -87.63], ['LOS ANGELES', 34.05, -118.24], ['HOUSTON', 29.76, -95.37], ['DENVER', 39.74, -104.99],
  ['SEATTLE', 47.61, -122.33], ['MIAMI', 25.77, -80.19], ['ATLANTA', 33.75, -84.39], ['BOSTON', 42.36, -71.06], ['SAN FRANCISCO', 37.77, -122.42], ['DALLAS', 32.78, -96.8],
  ['PHOENIX', 33.45, -112.07], ['DETROIT', 42.33, -83.05], ['MINNEAPOLIS', 44.98, -93.27], ['NORFOLK', 36.85, -76.29], ['KANSAS CITY', 39.1, -94.58], ['SALT LAKE CITY', 40.76, -111.89],
  ['NEW ORLEANS', 29.95, -90.07], ['PHILADELPHIA', 39.95, -75.17], ['RICHMOND', 37.54, -77.44], ['BALTIMORE', 39.29, -76.61], ['PORTLAND', 45.52, -122.68], ['ST. LOUIS', 38.63, -90.2]
];

/* ---------- intercepts ---------- */
const INTERCEPTS = [
  { id: 'INT-0447', type: 'VOICE', pri: 'FLASH', a: { name: 'DANIEL MERCER', num: '(703) 555-0147', subj: 'CIV-1001' }, b: { name: 'UNKNOWN — BURNER', num: '(202) 555-0183' }, tower: 'ARL-4471-S2',
    lines: [
      ['A', 'It\'s me. Are we clear on this line?'],
      ['B', 'Clear as it gets. You have it?'],
      ['A', 'Copied the whole archive last night. Seven drives.'],
      ['B', 'Not on the phone. Pier nine, Thursday, after the shift change.'],
      ['A', 'They\'ve had a car outside my building for three days.'],
      ['B', 'Then leave the car. Take the train. Nobody follows you onto the platform.'],
      ['A', 'And if they do?'],
      ['B', 'Then you never met me.']
    ], keys: ['ARCHIVE', 'PIER NINE', 'THURSDAY', 'DRIVES', 'PLATFORM'] },
  { id: 'INT-0451', type: 'SMS', pri: 'PRIORITY', a: { name: 'JONAH PRUITT', num: '(804) 555-0119', subj: 'CIV-1007' }, b: { name: 'DANIEL MERCER', num: '(703) 555-0147', subj: 'CIV-1001' }, tower: 'RIC-0932-S1',
    lines: [
      ['A', 'relay is up. use port 8443 not the usual'],
      ['B', 'how long do i have'],
      ['A', 'window closes 0300. after that the keys rotate'],
      ['B', 'and if it drops?'],
      ['A', 'burn everything. i mean everything'],
      ['B', 'understood']
    ], keys: ['RELAY', '0300', 'KEYS', 'BURN'] },
  { id: 'INT-0458', type: 'VOICE', pri: 'PRIORITY', a: { name: 'VICTOR LANG', num: '(757) 555-0164', subj: 'CIV-1009' }, b: { name: 'SAMUEL ORTEGA', num: '(305) 555-0128', subj: 'CIV-1011' }, tower: 'NFK-2210-S3',
    lines: [
      ['A', 'The crates go on the six a.m. charter. No manifest.'],
      ['B', 'Victor, I can\'t fly without a manifest. They check now.'],
      ['A', 'Then write one. Medical supplies. Nobody opens medical supplies.'],
      ['B', 'Same price as last time?'],
      ['A', 'Double. Cash at the hangar. Don\'t be late.']
    ], keys: ['CRATES', 'CHARTER', 'MANIFEST', 'CASH'] },
  { id: 'INT-0460', type: 'VOICE', pri: 'ROUTINE', a: { name: 'ELENA VASQUEZ-HART', num: '(202) 555-0171', subj: 'CIV-1002' }, b: { name: 'RAYMOND DOYLE', num: '(443) 555-0156', subj: 'CIV-1015' }, tower: 'DC-0021-S1',
    lines: [
      ['A', 'My source finally gave me a name for the program.'],
      ['B', 'Not on this line, Elena.'],
      ['A', 'Ray, it\'s just a word.'],
      ['B', 'I swept your apartment twice this month. Don\'t say it.'],
      ['A', 'Nightjar.'],
      ['B', '...I\'m coming over. Don\'t make any more calls.']
    ], keys: ['PROGRAM', 'SOURCE', 'NIGHTJAR'] },
  { id: 'INT-0462', type: 'VOICE', pri: 'ROUTINE', a: { name: 'THOMAS KESSLER', num: '(571) 555-0133', subj: 'CIV-1005' }, b: { name: 'GRACE WHITFIELD', num: '(301) 555-0190', subj: 'CIV-1010' }, tower: 'ALX-1180-S2',
    lines: [
      ['A', 'Grace. Did you talk to the reporter?'],
      ['B', 'I told her what was already public. Nothing more.'],
      ['A', 'They\'ll pull your file anyway.'],
      ['B', 'Let them. I\'m retired, Tom. I garden now.'],
      ['A', 'Burn the garden notebooks, then.']
    ], keys: ['REPORTER', 'FILE', 'BURN'] }
];

/* ---------- archive documents ---------- */
const DOCS = [
  { id: 'D-41C', title: 'DIRECTIVE 41-C', sub: 'Domestic Collection Authority', date: '03 JAN 2026', from: 'Office of the Director', to: 'All NIGHTJAR Program Staff', level: 'TOP SECRET // NOFORN', stamp: 'EYES ONLY',
    body: [
      '1. PURPOSE. This directive sets the authority under which NIGHTJAR collection platforms may task domestic sensors, including municipal camera networks, licence plate readers, and carrier metadata, against persons designated [[PRIORITY TARGET]].',
      '2. SCOPE. Collection is limited to persons listed in the Civilian Information Files with a threat score of 60 or higher, plus their first-degree associates. Second-degree collection requires written approval from [[DEPUTY DIRECTOR, OPERATIONS]].',
      '3. RETENTION. Incidental collection on cleared persons is minimized within 72 hours. Exceptions are logged under [[REDACTED]].',
      '4. OVERSIGHT. Quarterly summaries go to the review panel. Operational details, sources and methods are withheld from that summary under Section [[9(b)]].'
    ] },
  { id: 'D-P3', title: 'PROJECT NIGHTJAR — PHASE III', sub: 'Program Summary', date: '22 SEP 2026', from: 'Program Office, Sub-Level 4', to: 'Director (only)', level: 'TOP SECRET // SI // NIGHTJAR', stamp: 'TOP SECRET',
    body: [
      'Phase III joins satellite tasking, ground sensor networks, and the Civilian Information Files into a single targeting workflow. Average time from first detection to physical location fell from 31 hours (Phase II) to [[4 HOURS 12 MINUTES]].',
      'Constellation status: 7 of 8 platforms nominal. GANNET-3 is degraded after a solar event and is expected back by [[REDACTED]].',
      'Risk: the Phase II design archive was taken from Halvorsen Aerodynamics on or about 09/14. Suspect: [[MERCER, DANIEL R.]]. If the archive is published, the program\'s existence becomes public.',
      'Recommendation: proceed under Directive 41-C. Authorize [[CONTAINMENT PROTOCOL BLACKOUT]] if the archive leaves the country.'
    ] },
  { id: 'D-0917', title: 'INCIDENT REPORT 2026-0917', sub: 'Pier 9, Calder Bay', date: '18 SEP 2026', from: 'Field Team GLASS HARBOR', to: 'Operations Center', level: 'SECRET // NOFORN', stamp: 'SECRET',
    body: [
      'At 23:41 local, surveillance team observed two individuals moving three hard-sided cases from container [[CBMU 448120-7]] into a gray sedan, plate [[REDACTED]].',
      'Team lost visual at North Channel Bridge after a planned vehicle swap. One unidentified male was later treated at St. Brennan Medical Center for [[REDACTED]].',
      'LPR hits suggest the sedan travelled south on I-64 at 00:52. Hand-off to CCTV failed due to a [[CAMERA NETWORK OUTAGE]] lasting 19 minutes. Outage under investigation as possible deliberate interference.'
    ] },
  { id: 'D-WREN', title: 'ASSET DEBRIEF — WREN', sub: 'Contact Report #14', date: '09 OCT 2026', from: 'Handler [[REDACTED]]', to: 'IRON WREN Case File', level: 'TOP SECRET // HCS', stamp: 'EYES ONLY',
    body: [
      'WREN reports that MERCER appears anxious, has stopped using his personal phone, and mentioned a "last trip" to a friend. WREN assesses that MERCER plans to leave the country within [[TWO WEEKS]].',
      'MERCER mentioned a buyer he called "the Lisbon people". This is consistent with COPPER VEIL reporting.',
      'WREN asked for extraction if her cover is compromised. Request forwarded. WREN\'s true name and handling details are held in a separate compartment.'
    ] },
  { id: 'D-88K', title: 'SATELLITE TASKING ORDER 88-K', sub: 'Collection Request', date: '14 OCT 2026', from: 'Collection Management', to: 'Orbital Command', level: 'SECRET // REL NIGHTJAR', stamp: 'PRIORITY',
    body: [
      'Task HALCYON (NJ-1) and OBSIDIAN (OBS-2) to collect electro-optical imagery over TARGET B (Norfolk Harbor) on each pass from 15 OCT to 22 OCT.',
      'Task VESPER (NJ-4) to collect all emissions in the [[REDACTED]] band within 5 km of Pier 9.',
      'Priority: FLASH. Deliver products to the GLASS HARBOR team within [[15 MINUTES]] of downlink.'
    ] },
  { id: 'D-BLK', title: 'PROTOCOL BLACKOUT', sub: 'Containment Procedure', date: '01 FEB 2025', from: 'Office of the Director', to: 'Level 5 Only', level: 'TOP SECRET // NIGHTJAR // ORCON', stamp: 'LEVEL 5',
    body: [
      'Protocol BLACKOUT is invoked only by the Director when the program is at imminent risk of public disclosure.',
      'Steps: (1) Revoke all external relay keys. (2) Purge field terminals with [[REDACTED]]. (3) Issue legal hold notices to [[REDACTED]]. (4) Brief the review panel within [[48 HOURS]].',
      'All personnel are reminded that confirming the existence of this program to any unauthorized person is a criminal offence under [[REDACTED]].'
    ] }
];

const FEED_LINES = [
  ['VOICE', '(703) 555-0147 → (202) 555-0183', 'KEYWORD "ARCHIVE"', true],
  ['LPR', 'PLATE KXR-2190 · I-395 N · MILE 7', 'MATCH CIV-1001', true],
  ['FACIAL', 'CAM-07 UNION CONCOURSE B', 'CONF 0.94', false],
  ['SMS', '(804) 555-0119 → (703) 555-0147', 'KEYWORD "RELAY"', true],
  ['WI-FI', 'PROBE MAC 3C:A1:**:**:7F:22', 'DUNMORE LIBRARY', false],
  ['CARD', '••4471 STOR-ALL SELF STORAGE', '$49.00', false],
  ['CELL', 'IMEI 35-224418-…-3 HANDOVER', 'TWR NFK-2210', false],
  ['VOICE', '(757) 555-0164 → (305) 555-0128', 'KEYWORD "CHARTER"', true],
  ['DATA', '203.0.113.47 :8443 TLS', '2.3 GB OUT', true],
  ['TRANSIT', 'FARE CARD 0931 · LINE 2', 'CIV-1002', false],
  ['SAT', 'NJ-1 HALCYON DOWNLINK', 'TARGET B · 14 FRAMES', false],
  ['FACIAL', 'CAM-12 PIER 9 GATE', 'CONF 0.88', false],
  ['ADS-B', 'N-REG ****AC SQUAWK 1200', 'ORF → MIA', false],
  ['EMAIL', 'HEADER INTERCEPT · RELAY 198.51.100.9', 'PGP BLOCK', false]
];
