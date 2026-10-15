# NIGHTJAR — Intelligence OS (screen prop)

A fictional government-intelligence operating system built as an on-camera
touchscreen prop for an iPad. Everything in it is invented: the agency
(**Directorate of Strategic Observation / NIGHTJAR**), every person, every
record, every phone number (555-01xx) and IP address (documentation ranges).
It looks like the real thing but does nothing real — the login is theatrical
and nothing collects or verifies a real credential.

**`index.html` is the whole prop.** One self-contained file, no build step and
no internet needed on set (fonts fall back to the system if offline). Open it
full-screen in any browser.

## Running it on an iPad

1. Put `index.html` somewhere the iPad can open it (AirDrop it, host it, or
   open the published link).
2. Open it in Safari.
3. **Share → Add to Home Screen**, then launch it from the icon. This hides
   Safari's bars and runs it edge-to-edge like a real OS.
4. For a locked-down shoot, turn on **Guided Access** (Settings → Accessibility)
   so a stray tap can't leave the app.

## Apps

| App | What it does |
|-----|--------------|
| Civilian Information Files | Searchable subject dossiers: face scan, threat gauge, movements map, call records, financials, link chart |
| Orbital Command | Interactive dotted globe, 8 satellites on live orbits, tap to task a target and pull imagery |
| Surveillance Network | Six procedural CCTV feeds, day/night/thermal, PTZ, tap a person and ENHANCE to a facial match |
| Aerial Reconnaissance | Overhead city with live traffic; tap a vehicle to lock and track; EO / IR / night vision |
| Signals Intercept | Live spectrum + waterfall, scripted phone intercepts that type out with keyword flags, cell-tower trace |
| Biometric Identification | Press-and-hold fingerprint search across a print database; facial comparison ranking |
| Global Operations | World map with day/night terminator, operation markers, satellite tracks, and a domestic view |
| Link Analysis | Drag-able force-directed network of every subject; find the shortest path between two people |
| Classified Archive | Browsable classified documents with tap-to-reveal redactions and authentication seals |

## Prop control (hidden crew panel)

The actor never sees this. To open it on set:

- **Press and hold** the row of clocks in the top bar, **or** tap the NIGHTJAR
  logo (top-left) five times, **or** press the **` ` `** (backtick) key.

From it the crew can:

- **Fire cues** on camera: Access Denied / Granted, Intrusion Alert (whole UI
  goes red), Lockdown, Match Found, Incoming Message, Screen Glitch, Countdown,
  No Signal. Keyboard shortcuts **Ctrl+1…9**, **Ctrl+0** clears.
- **Rename everything** — the agency, OS name, operator, classification banner
  — and set the login passcode, the "match" subject, the countdown length and
  the on-screen message text.
- **Restyle** — accent color (cyan / blue / green / amber / white; no purple),
  film grain, scanlines, UI sounds.
- **Edit mode** — tap any outlined field in a subject file to retype it, or tap
  a portrait to drop in an actor's photo. Changes stay on that iPad.

All crew settings and edits are saved per device in the browser, so the prop
comes back the way you left it. "Reset everything" in the panel wipes it.

## Editing the source

The single file is assembled from `src/` by `src/build.py`:

```
cd src && python3 build.py            # writes ../index.html
```

`src/css/` holds the styles, `src/js/` the engine and `src/js/apps/` one file
per app. The map data in `src/js/geo.js` is Natural Earth coastline rasterized
to a compact bitmap.
