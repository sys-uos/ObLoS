# Data License

The MIT license in [`LICENSE`](LICENSE) covers the **source code** of ObLoS only. The bundled obstacle database is licensed separately.

## `public/obstacle_data.json`

This file is a derivative database built from OpenStreetMap and BASt data by the pipeline in [`meta/`](meta/README.md). Because it contains data extracted from OpenStreetMap, it is made available under the
**[Open Database License (ODbL) v1.0](https://opendatacommons.org/licenses/odbl/1-0/)**.
Individual contents of the database are licensed under the [Database Contents License (DbCL) v1.0](https://opendatacommons.org/licenses/dbcl/1-0/).

When you use or redistribute this file, or databases derived from it, you must keep the attributions below. Any derived database you share publicly must also be released under the ODbL.

### Sources and attribution

- **OpenStreetMap:** © OpenStreetMap contributors, available under the ODbL.
  <https://www.openstreetmap.org/copyright>
- **Bundesanstalt für Straßen- und Verkehrswesen (BASt):** bridge statistics of the German federal trunk roads (Brückenstatistik).
  Quelle der Daten: Bundesanstalt für Straßen- und Verkehrswesen (CC BY 4.0), <https://www.bast.de/fokusbruecken>.
  License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Modifications: columns selected and renamed, width derived from area/length, coordinates converted from UTM (zone 32N) to WGS 84, and records matched to OpenStreetMap ways.
- **Neural network and rule-based width estimates** (`nn_width`, `est_width`): produced by the ObLoS authors and released under the same ODbL terms.
