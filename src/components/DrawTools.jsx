import React, { useEffect, useRef, useState } from "react";
import { DrawingManager, Polygon, useGoogleMap } from "@react-google-maps/api";

/* ================= NORMALIZATION ================= */

const normalizePolygons = (data) => {
  if (!data) return [];

  let parsed;
  try {
    parsed = typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    return [];
  }

  // Case 1: single path [{lat,lng}]
  if (Array.isArray(parsed) && parsed.length && parsed[0]?.lat !== undefined) {
    return [parsed];
  }

  // Case 2: array of paths
  if (Array.isArray(parsed) && parsed.every(p => Array.isArray(p))) {
    return parsed.filter(p => p.length);
  }

  // Case 3: old wrapped format [{ type:'polygon', path:[...] }]
  if (Array.isArray(parsed)) {
    const extracted = parsed
      .map(p => p?.path)
      .filter(p => Array.isArray(p) && p.length);
    if (extracted.length) return extracted;
  }

  return [];
};

const polygonToPath = (polygon) =>
  polygon.getPath().getArray().map(p => ({
    lat: p.lat(),
    lng: p.lng()
  }));

/* ================= COMPONENT ================= */

const DrawTools = ({ data, onChange }) => {
  const map = useGoogleMap();

  const [polygons, setPolygons] = useState([]);
  const initializedRef = useRef(false);

  /* ===== INITIAL LOAD (EDIT MODE ONLY) ===== */
  useEffect(() => {
    if (initializedRef.current) return;

    const normalized = normalizePolygons(data);
    if (normalized.length) {
      setPolygons(normalized);
    }

    initializedRef.current = true;
  }, [data]);

  /* ===== FIT MAP TO POLYGONS ===== */
  useEffect(() => {
    if (!map || polygons.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();

    polygons.forEach(path => {
      if (!Array.isArray(path)) return;
      path.forEach(point => {
        if (point?.lat != null && point?.lng != null) {
          bounds.extend(point);
        }
      });
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }
  }, [map, polygons]);

  /* ===== DRAW ===== */
  const onPolygonComplete = (polygon) => {
    const newPath = polygonToPath(polygon);
    polygon.setMap(null);

    setPolygons(prev => {
      const updated = [...prev, newPath];
      onChange(JSON.stringify(updated));
      return updated;
    });
  };

  /* ===== EDIT ===== */
  const attachEditListeners = (polygon, index) => {
    const update = () => {
      setPolygons(prev => {
        const updated = [...prev];
        updated[index] = polygonToPath(polygon);
        onChange(JSON.stringify(updated));
        return updated;
      });
    };

    polygon.getPath().addListener("set_at", update);
    polygon.getPath().addListener("insert_at", update);
  };

  return (
    <>
      <DrawingManager
        onPolygonComplete={onPolygonComplete}
        options={{
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ["polygon"]
          },
          polygonOptions: {
            fillColor: "#485afe",
            fillOpacity: 0.3,
            strokeColor: "#485afe",
            strokeWeight: 2,
            editable: true
          }
        }}
      />

      {polygons.map((path, index) =>
        Array.isArray(path) ? (
          <Polygon
            key={index}
            paths={path}
            onLoad={(poly) => attachEditListeners(poly, index)}
            options={{
              fillColor: "#485afe",
              fillOpacity: 0.3,
              strokeColor: "#485afe",
              strokeWeight: 2,
              editable: true
            }}
          />
        ) : null
      )}
    </>
  );
};

export default DrawTools;
