import React, { useState, useCallback, useRef } from 'react';
import { DrawingManager, Polygon } from '@react-google-maps/api';

const DrawTools = ({ data, onChange }) => {
    const [polygonPath, setPolygonPath] = useState(() => {
        if (!data) return [];
        try {
            // Parses the stored JSON string back into a coordinate array
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    });

    const drawingManagerRef = useRef(null);

    // Triggered when a user finishes drawing a polygon
    const onPolygonComplete = useCallback((polygon) => {
        const path = polygon.getPath().getArray().map(latLng => ({
            lat: latLng.lat(),
            lng: latLng.lng()
        }));

        // Convert the path to a JSON string for database storage
        const jsonPath = JSON.stringify(path);
        setPolygonPath(path);
        onChange(jsonPath);

        // Remove the temporary drawing shape so we can render the state-controlled one
        polygon.setMap(null);
    }, [onChange]);

    // Handles path adjustments when the polygon is edited/dragged
    const onEdit = useCallback((e) => {
        if (drawingManagerRef.current) {
            // We find the polygon instance and get its updated path
            const path = e.getPath().getArray().map(latLng => ({
                lat: latLng.lat(),
                lng: latLng.lng()
            }));
            onChange(JSON.stringify(path));
        }
    }, [onChange]);

    return (
        <>
            <DrawingManager
                onLoad={dm => (drawingManagerRef.current = dm)}
                onPolygonComplete={onPolygonComplete}
                options={{
                    drawingControl: !data, // Hide tools if a boundary already exists
                    drawingControlOptions: {
                        position: window.google.maps.ControlPosition.TOP_CENTER,
                        drawingModes: ['polygon'],
                    },
                    polygonOptions: {
                        fillColor: '#485afe',
                        fillOpacity: 0.3,
                        strokeWeight: 2,
                        clickable: true,
                        editable: true,
                        zIndex: 1,
                    },
                }}
            />

            {/* Render the saved polygon if data exists */}
            {polygonPath.length > 0 && (
                <Polygon
                    paths={polygonPath}
                    options={{
                        fillColor: '#485afe',
                        fillOpacity: 0.3,
                        strokeColor: '#485afe',
                        strokeWeight: 2,
                        editable: true,
                        draggable: true
                    }}
                    onMouseUp={onEdit}
                    onDragEnd={onEdit}
                />
            )}
        </>
    );
};

export default DrawTools;