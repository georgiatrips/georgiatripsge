"""
Builds the transfer calculator's own place index from OpenStreetMap.

    pip install osmium
    curl -L -o georgia.osm.pbf https://download.geofabrik.de/europe/georgia-latest.osm.pbf
    python scripts/build-transfer-index.py georgia.osm.pbf

Writes app/lib/transfers/data/osm-places.json: every named settlement, hotel,
sight, restaurant, station, shopping centre, named building/complex and
street in Georgia, as compact rows the /api/transfers/places route searches
in memory. Geofabrik refreshes the extract daily, so re-running this picks up
places added to the map since the last build.

Row: [name, nameEn, nameRu, altNames, type, lat, lng, cityKa, cityEn, rank]
"""

import json
import math
import os
import sys

import osmium

OUT = os.path.join(os.path.dirname(__file__), "..", "app", "lib", "transfers", "data", "osm-places.json")

# Georgia's land border plus a margin; the extract also carries bits of the
# neighbours, which the calculator does not serve.
BOUNDS = (40.95, 43.65, 39.9, 46.8)  # minLat, maxLat, minLng, maxLng

PLACE_TYPES = {
    "city": ("city", 100), "town": ("city", 85),
    "village": ("village", 45), "hamlet": ("village", 25), "isolated_dwelling": ("village", 10),
    "suburb": ("region", 50), "quarter": ("region", 40), "neighbourhood": ("region", 35), "locality": ("place", 20),
}
TOURISM = {
    "hotel": ("hotel", 60), "hostel": ("hotel", 45), "guest_house": ("hotel", 45), "motel": ("hotel", 45),
    "apartment": ("hotel", 45), "chalet": ("hotel", 40), "camp_site": ("hotel", 35), "alpine_hut": ("hotel", 35),
    "attraction": ("sight", 55), "museum": ("sight", 55), "viewpoint": ("sight", 45), "zoo": ("sight", 50),
    "theme_park": ("sight", 50), "aquarium": ("sight", 50), "gallery": ("sight", 35), "artwork": ("sight", 25),
    "picnic_site": ("nature", 20), "wine_cellar": ("sight", 40),
}
AMENITY = {
    "place_of_worship": ("church", 40), "bus_station": ("station", 60), "ferry_terminal": ("station", 55),
    "hospital": ("place", 45), "clinic": ("place", 25), "university": ("place", 40), "college": ("place", 25),
    "restaurant": ("food", 30), "cafe": ("food", 25), "bar": ("food", 20), "pub": ("food", 20),
    "fast_food": ("food", 15), "marketplace": ("shop", 35), "theatre": ("sight", 40), "cinema": ("place", 30),
    "casino": ("place", 35), "nightclub": ("place", 25), "embassy": ("place", 35), "townhall": ("place", 30),
    "arts_centre": ("sight", 30), "events_venue": ("place", 30), "conference_centre": ("place", 30),
    "spa": ("place", 25), "public_bath": ("place", 25),
}
NATURAL = {
    "peak": ("nature", 40), "volcano": ("nature", 40), "waterfall": ("nature", 50), "cave_entrance": ("nature", 45),
    "beach": ("nature", 45), "glacier": ("nature", 40), "spring": ("nature", 25), "water": ("nature", 30),
    "bay": ("nature", 25), "gorge": ("nature", 40), "valley": ("nature", 30), "canyon": ("nature", 45),
}
LEISURE = {
    "park": ("nature", 40), "nature_reserve": ("nature", 45), "water_park": ("sight", 45), "beach_resort": ("hotel", 45),
    "marina": ("place", 35), "stadium": ("place", 40), "resort": ("hotel", 45), "garden": ("nature", 30),
    "ski_resort": ("nature", 50), "golf_course": ("place", 30),
}
SHOP = {"mall": ("shop", 50), "department_store": ("shop", 35), "supermarket": ("shop", 20)}
STREETS = {
    "motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential",
    "living_street", "pedestrian", "service", "road",
}


def classify(tags):
    """(type, rank) for a feature worth listing, else None."""
    t = tags.get
    if t("aeroway") in ("aerodrome", "terminal"):
        return ("airport", 90 if t("iata") else 50)
    if t("railway") in ("station", "halt") or t("public_transport") == "station":
        return ("station", 55)
    if t("place") in PLACE_TYPES:
        return PLACE_TYPES[t("place")]
    for key, table in (("tourism", TOURISM), ("amenity", AMENITY), ("natural", NATURAL), ("leisure", LEISURE), ("shop", SHOP)):
        if t(key) in table:
            return table[t(key)]
    if t("historic"):
        return ("church" if t("historic") in ("church", "monastery") else "sight", 50)
    if t("boundary") in ("national_park", "protected_area"):
        return ("nature", 45)
    if t("landuse") == "residential" or t("building") or t("office") or t("club"):
        return ("address", 20)
    return None


def inside(lat, lng):
    return BOUNDS[0] <= lat <= BOUNDS[1] and BOUNDS[2] <= lng <= BOUNDS[3]


class Collector(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.rows = {}  # key -> row
        self.streets = {}  # (name, cell) -> [sumLat, sumLng, n, row]

    def add(self, key, tags, lat, lng, kind):
        name = tags.get("name") or tags.get("name:ka")
        if not name or not inside(lat, lng):
            return
        name_en = tags.get("name:en") or tags.get("int_name") or ""
        name_ru = tags.get("name:ru") or ""
        alts = {tags.get(k) for k in ("alt_name", "old_name", "short_name", "official_name", "brand", "name:ka", "name:tr")}
        alts = ";".join(sorted(a for a in alts if a and a not in (name, name_en, name_ru)))[:200]
        typ, rank = kind
        if tags.get("stars"):
            rank += 5
        if tags.get("wikidata") or tags.get("wikipedia"):
            rank += 10
        pop = tags.get("population", "").replace(",", "").replace(" ", "")
        if pop.isdigit():
            rank += min(30, int(math.log10(int(pop) + 1) * 5))
        self.rows[key] = [name, name_en if name_en != name else "", name_ru if name_ru != name else "", alts, typ, round(lat, 5), round(lng, 5), "", "", rank]

    def node(self, n):
        if not n.tags or not n.location.valid():
            return
        kind = classify(n.tags)
        if kind:
            self.add(f"n{n.id}", n.tags, n.location.lat, n.location.lon, kind)

    def way(self, w):
        tags = w.tags
        hw = tags.get("highway")
        name = tags.get("name")
        if hw in STREETS and name and not w.is_closed():
            pts = [(nd.lat, nd.lon) for nd in w.nodes if nd.location.valid()]
            if not pts:
                return
            lat, lng = pts[len(pts) // 2]
            if not inside(lat, lng):
                return
            # One row per street name per ~2 km cell: long streets keep a
            # few points, and a city's many segments of one street collapse.
            cell = (name, round(lat * 50), round(lng * 37))
            if cell not in self.streets:
                self.streets[cell] = [name, tags.get("name:en") or "", tags.get("name:ru") or "", lat, lng]

    def area(self, a):
        tags = a.tags
        kind = classify(tags)
        if not kind:
            return
        lat_sum = lng_sum = 0.0
        count = 0
        try:
            for ring in a.outer_rings():
                for nd in ring:
                    lat_sum += nd.lat
                    lng_sum += nd.lon
                    count += 1
        except osmium.InvalidLocationError:
            return
        if count:
            key = f"{'w' if a.from_way() else 'r'}{a.orig_id()}"
            self.add(key, tags, lat_sum / count, lng_sum / count, kind)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "georgia.osm.pbf"
    c = Collector()
    c.apply_file(src, locations=True)

    rows = list(c.rows.values())
    for name, en, ru, lat, lng in c.streets.values():
        rows.append([name, en if en != name else "", ru if ru != name else "", "", "street", round(lat, 5), round(lng, 5), "", "", 5])

    # Nearest town/city within 15 km (else village within 4 km) as the
    # "detail" line, via a coarse grid of settlements.
    settlements = [r for r in rows if r[4] in ("city", "village") and r[9] >= 25]
    grid = {}
    for s in settlements:
        grid.setdefault((int(s[5] * 10), int(s[6] * 10)), []).append(s)

    def nearest(lat, lng):
        best = None
        best_d = 1e9
        for dx in (-2, -1, 0, 1, 2):
            for dy in (-2, -1, 0, 1, 2):
                for s in grid.get((int(lat * 10) + dx, int(lng * 10) + dy), ()):
                    d = math.hypot((s[5] - lat) * 111, (s[6] - lng) * 83)
                    limit = 15 if s[4] == "city" else 4
                    # Towns win over a closer village unless the village is very close.
                    score = d if s[4] == "city" else d * 2.5
                    if d <= limit and score < best_d:
                        best, best_d = s, score
        return best

    for r in rows:
        if r[4] == "city":
            continue
        s = nearest(r[5], r[6])
        if s and s is not r:
            r[7] = s[0]
            r[8] = s[1]

    rows.sort(key=lambda r: -r[9])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))
    counts = {}
    for r in rows:
        counts[r[4]] = counts.get(r[4], 0) + 1
    print(len(rows), "places,", round(os.path.getsize(OUT) / 1e6, 1), "MB", counts)


if __name__ == "__main__":
    main()
