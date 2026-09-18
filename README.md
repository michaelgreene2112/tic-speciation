# TIC Speciation Calculator

Splits a measured **total inorganic carbon** (TIC / DIC) into dissolved CO<sub>2</sub>,
bicarbonate and carbonate from pH, temperature and water matrix. Single self-contained
HTML page — no build step, no dependencies, no backend.

**Live:** https://USERNAME.github.io/tic-speciation/

## What it returns

- Species split as fraction of TIC, mol/L, mmol/L, mg/L as species, and mg C/L
- Free CO<sub>2</sub>, carbonate alkalinity (meq/L and mg/L as CaCO<sub>3</sub>), total alkalinity
- Equilibrium pCO<sub>2</sub> and ratio to air
- Calcite and aragonite saturation index, LSI
- Ionic strength, activity coefficients, conditional pK values, charge balance error
- Bjerrum plot across pH 2–13 with the sample pH and pK′ values marked

## Method

Two equilibria over one conserved total:

```
CO2(aq) + H2O  <-> H+ + HCO3-     K1 = {H+}{HCO3-}/{CO2}
HCO3-          <-> H+ + CO3(2-)   K2 = {H+}{CO3(2-)}/{HCO3-}
CT = [CO2*] + [HCO3-] + [CO3(2-)]
```

With `h = 10^-pH` the fractions are closed form, so no iteration on pH is required:

```
a0 = 1 / (1 + K1'/h + K1'K2'/h^2)
a1 = 1 / (h/K1' + 1 + K2'/h)
a2 = 1 / (h^2/(K1'K2') + h/K2' + 1)
```

Two selectable constant sets:

| | Model A (default) | Model B |
|---|---|---|
| Constants | Plummer & Busenberg (1982) thermodynamic | Millero et al. (2006) / Millero (2010) stoichiometric |
| Activities | Explicit — Davies, Truesdell–Jones (WATEQ), or DH limiting law; Setchenow salting-out for neutral CO<sub>2</sub> | Folded into the fitted constant |
| pH scale | NBS / free (glass electrode) | Seawater or total |
| Validity | 0–90 °C, I ≲ 0.5 mol/L | S = 1–50, 0–50 °C |

Model A forms conditional constants as `K1' = K1·γ(CO2)/γ(HCO3-)` and
`K2' = K2·γ(HCO3-)/γ(CO3(2-))`, so a meter's activity-scale pH is handled
correctly rather than being treated as a concentration. Ionic strength is
iterated: speciated HCO<sub>3</sub><sup>-</sup> and CO<sub>3</sub><sup>2-</sup> feed back into I.

Solubility: K<sub>H</sub> from Plummer & Busenberg (model A) or Weiss (1974) (model B).
Carbonate solubility products from Plummer & Busenberg or Mucci (1983).

## Validation

Constants reproduce their published check values:

| Quantity | Computed | Reference |
|---|---|---|
| pK₁, 25 °C, pure water | 6.3519 | 6.352 |
| pK₂, 25 °C, pure water | 10.3289 | 10.329 |
| pK<sub>H</sub>, 25 °C | 1.4679 | 1.468 |
| pK<sub>w</sub>, 25 °C | 13.9995 | 13.997 |
| pK₁*, S=35, 25 °C | 5.8401 | 5.8401 (Millero) |
| pK₂*, S=35, 25 °C | 8.9636 | 8.9636 (Millero) |
| K*<sub>sp</sub> calcite, S=35, 25 °C | 4.272e-7 | 4.27e-7 (Mucci) |

Seawater benchmark — DIC 2000 µmol/kg, pH 8.10 (total), S=35, 25 °C:
CO<sub>2</sub> 9.6, HCO<sub>3</sub><sup>-</sup> 1751, CO<sub>3</sub><sup>2-</sup> 240 µmol/kg,
alkalinity 2230 µeq/kg — all within the expected envelope.

## Reading a Shimadzu IC result into this tool

The IC channel on a Shimadzu TOC-L / TOC-V acidifies with phosphoric acid (or HCl to
pH < 3) and sparges, converting every inorganic carbon species to CO<sub>2</sub> for NDIR
detection. It is calibrated with sodium bicarbonate as a **carbon** standard, so the
reported number is carbon mass covering CO<sub>2</sub>, HCO<sub>3</sub><sup>-</sup> and
CO<sub>3</sub><sup>2-</sup> together. That is exactly C<sub>T</sub>.

Enter it as **mg C/L**. Using the "as HCO<sub>3</sub><sup>-</sup>" basis understates
C<sub>T</sub> roughly fivefold.

The dominant error is sampling, not the instrument. The split is governed by the pH the
water had *in situ*: a sample that picked up headspace has already lost free CO<sub>2</sub>
and gained pH. Sample with no headspace, measure pH and temperature at the moment of
collection, keep cold, analyse promptly.

## Phone and tablet

Installable as a PWA: Android/Chrome offers an install prompt; on iOS use Share -> Add to
Home Screen. It then launches standalone and works fully offline. Installed home-screen
web apps are exempt from Safari's 7-day storage eviction, so saved inputs persist.

Layout below 640 px: the species table is replaced by stacked per-species cards (no
sideways scrolling), plot geometry is resized so axis type stays legible, numeric fields
use `inputmode="decimal"`, inputs are 16 px to stop iOS zooming on focus, and controls
meet a 44 px tap target. Where the table does still scroll — narrow desktop windows and
tablets — the header row and the species column are frozen via `position: sticky`.

This is not a store app. Play Store distribution is possible via PWABuilder (Trusted Web
Activity, $25 one-time); App Store would need a Capacitor wrapper and runs into Apple's
minimum-functionality guideline 4.2.

## Known limitations

- **No ion pairing.** In hard or high-sulfate water a real fraction sits as CaCO<sub>3</sub><sup>0</sup>,
  CaHCO<sub>3</sub><sup>+</sup>, MgCO<sub>3</sub><sup>0</sup>, NaCO<sub>3</sub><sup>-</sup>. Free
  CO<sub>3</sub><sup>2-</sup> is therefore lower than reported and calcite SI is optimistic.
- **Above I ≈ 0.7 mol/L** the activity models are out of their depth. For RO concentrate,
  treat CO<sub>2</sub> and HCO<sub>3</sub><sup>-</sup> as solid and the CO<sub>3</sub><sup>2-</sup>
  fraction and SI as indicative; confirm in a Pitzer code (PHREEQC, `pitzer.dat`).
- **Alkalinity is carbonate + water only.** No ammonia, borate, silicate, phosphate,
  sulfide or organic acids.
- **Atmospheric pressure only.** No correction for pressurised membrane feed channels.
- Mixing pH scales is the commonest silent error; the app warns when the selected scale
  and constant set disagree.

## References

- Plummer, L.N. & Busenberg, E. (1982) *Geochim. Cosmochim. Acta* **46**, 1011.
- Millero, F.J. et al. (2006) *Mar. Chem.* **100**, 80; Millero, F.J. (2010) *Mar. Freshwater Res.* **61**, 139.
- Weiss, R.F. (1974) *Mar. Chem.* **2**, 203.
- Mucci, A. (1983) *Am. J. Sci.* **283**, 780.
- Stumm, W. & Morgan, J.J., *Aquatic Chemistry*, 3rd ed.

## Deploying

Everything is static. Push to a repository, then **Settings → Pages → Source: Deploy from
a branch → `main` / `/ (root)`**. First build takes 1–2 minutes.

The page registers a service worker (`sw.js`) so it works offline once loaded and can be
installed to a phone home screen or desktop. The page itself is fetched network-first, so
a new commit appears on the next online load. If you change `sw.js` or the precache list,
bump `CACHE_VERSION`.

## Local preview

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Service workers need `https://` or `localhost`; they will not register from a `file://` path.

## Disclaimer

An engineering aid, not a substitute for site-specific analysis or a full geochemical
speciation model. Verify against measured alkalinity and titration data before using the
output for design.

## License

MIT — see [LICENSE](LICENSE).
