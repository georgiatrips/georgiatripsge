"use client";

/**
 * Mini map for the transfer calculator: the pickup (A) and drop-off (B)
 * points and the road between them. Dragging a pin, or clicking the map while
 * a field is still empty, sets that point exactly — for places the search
 * does not know. Loaded with next/dynamic (ssr: false): Leaflet needs window.
 */

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const GEORGIA_CENTER = [42.1, 43.4];
const START_COLOR = "#3a9296"; // --gt-teal, like the "From" field dot
const END_COLOR = "#e0a93b"; // --gt-gold, like the "To" field dot
const ROUTE_COLOR = "#2a6592";

const pinIcon = (letter, color) =>
  L.divIcon({
    className: "tf-map-pin",
    html: `<span style="background:${color}"><b>${letter}</b></span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
  });

export default function TransferMap({ from, to, path, onPick, hint }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({ from: null, to: null, line: null });
  // Latest props for Leaflet's event handlers, which are bound once.
  const latest = useRef({ from, to, onPick });
  latest.current = { from, to, onPick };

  useEffect(() => {
    const map = L.map(elRef.current, {
      center: GEORGIA_CENTER,
      zoom: 6,
      scrollWheelZoom: false, // the page scrolls over the map
      attributionControl: true,
    });
    map.attributionControl.setPrefix(false);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", (e) => {
      const { from: a, to: b, onPick: pick } = latest.current;
      if (!a) pick("from", e.latlng.lat, e.latlng.lng);
      else if (!b) pick("to", e.latlng.lat, e.latlng.lng);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = { from: null, to: null, line: null };
    };
  }, []);

  // Pins: moved in place when they exist, so a drag is not undone by a re-render.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = layersRef.current;
    for (const [key, point, letter, color] of [
      ["from", from, "A", START_COLOR],
      ["to", to, "B", END_COLOR],
    ]) {
      if (!point) {
        layers[key]?.remove();
        layers[key] = null;
      } else if (layers[key]) {
        layers[key].setLatLng([point.lat, point.lng]);
      } else {
        const marker = L.marker([point.lat, point.lng], { icon: pinIcon(letter, color), draggable: true, keyboard: false });
        marker.on("dragend", () => {
          const ll = marker.getLatLng();
          latest.current.onPick(key, ll.lat, ll.lng);
        });
        layers[key] = marker.addTo(map);
      }
    }
  }, [from?.lat, from?.lng, to?.lat, to?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // Road line, or a dashed straight line until the road is known.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = layersRef.current;
    layers.line?.remove();
    layers.line = null;
    if (!from || !to) return;
    const road = path && path.length > 1;
    layers.line = L.polyline(road ? path : [[from.lat, from.lng], [to.lat, to.lng]], {
      color: ROUTE_COLOR,
      weight: road ? 4 : 2,
      opacity: road ? 0.85 : 0.6,
      dashArray: road ? null : "6 6",
      interactive: false,
    }).addTo(map);
  }, [from?.lat, from?.lng, to?.lat, to?.lng, path]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep both points (and the road) in view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const points = [from, to].filter(Boolean).map((p) => [p.lat, p.lng]);
    if (path?.length) points.push(...path);
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(points, { padding: [28, 28], maxZoom: 15 });
  }, [from?.lat, from?.lng, to?.lat, to?.lng, path]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tf-map">
      <div ref={elRef} className="tf-map-canvas" />
      {hint && <p className="tf-map-hint">{hint}</p>}
    </div>
  );
}
