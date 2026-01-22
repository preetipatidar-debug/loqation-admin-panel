import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Icon } from "@iconify/react";
import axios from 'axios';

const Discovery = ({ topLocation, onClose, onSaveComplete }) => {
    const [results, setResults] = useState([]);
    const [scanning, setScanning] = useState(false);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"
    });

    const startDiscovery = async () => {
        setScanning(true);
        try {
            const res = await axios.post('/api/discover', { 
                lat: topLocation.latitude, 
                lng: topLocation.longitude,
                radius: 5000 
            });
            setResults(res.data.results || []);
        } catch (err) {
            console.error("Discovery error:", err);
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content radius-12 border-0">
                    <div className="modal-header border-bottom bg-base py-16 px-24">
                        <h6 className="text-lg fw-semibold mb-0">Discovering: {topLocation.name}</h6>
                        <button onClick={onClose} className="btn-close"></button>
                    </div>
                    
                    <div className="modal-body p-24">
                        <div className="row g-4">
                            {/* Map Section */}
                            <div className="col-lg-7">
                                <div className="radius-12 overflow-hidden border" style={{ height: '400px' }}>
                                    {isLoaded ? (
                                        <GoogleMap
                                            mapContainerStyle={{ width: '100%', height: '100%' }}
                                            center={{ lat: topLocation.latitude, lng: topLocation.longitude }}
                                            zoom={14}
                                        >
                                            {results.map((r, i) => (
                                                <Marker key={i} position={r.geometry.location} />
                                            ))}
                                        </GoogleMap>
                                    ) : <div>Loading Map...</div>}
                                </div>
                            </div>

                            {/* Results Section */}
                            <div className="col-lg-5">
                                <div className="d-flex justify-content-between align-items-center mb-16">
                                    <span className="text-secondary-light fw-medium">Found: {results.length} Locations</span>
                                    <button 
                                        onClick={startDiscovery} 
                                        disabled={scanning}
                                        className="btn btn-primary-600 radius-8 px-20"
                                    >
                                        {scanning ? 'Scanning...' : 'Start Scan'}
                                    </button>
                                </div>
                                <div className="max-h-300-px overflow-y-auto pe-8">
                                    {results.map((item, idx) => (
                                        <div key={idx} className="p-12 mb-8 border radius-8 d-flex align-items-center justify-content-between">
                                            <div>
                                                <h6 className="text-sm mb-0">{item.name}</h6>
                                                <p className="text-xs text-secondary-light mb-0">{item.vicinity}</p>
                                            </div>
                                            <Icon icon="lucide:check-circle" className="text-success-main" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer border-top p-24">
                        <button onClick={onClose} className="btn btn-outline-secondary-600 radius-8">Close</button>
                        <button className="btn btn-success-600 radius-8 px-24">Save to Business List</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Discovery;