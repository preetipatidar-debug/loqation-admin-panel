import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MasterLayout from '../masterLayout/MasterLayout';
import api from '../services/api'; 
import { toast } from 'react-toastify';
import { Icon } from "@iconify/react";
import { GoogleMap, useJsApiLoader, DrawingManager, Autocomplete, Polygon } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES } from '../components/MapConfig';

const MAP_CONTAINER_STYLE = { width: '100%', height: '550px' };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const LocationsTopPage = () => {
    const navigate = useNavigate();
    const [areas, setAreas] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 25; 

    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', geometrics_outline: '[]' });
    const [polygons, setPolygons] = useState([]); 

    const { isLoaded } = useJsApiLoader({ 
        id: 'google-map-script', 
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, 
        libraries: GOOGLE_MAPS_LIBRARIES 
    });
    
    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);

    useEffect(() => { fetchAreas(); }, []);

    const fetchAreas = async () => {
        try {
            const res = await api.get('/top-locations');
            setAreas(Array.isArray(res.data) ? res.data : []);
        } catch (err) { toast.error("Failed to load areas"); }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const onPlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.geometry) {
            mapRef.current.panTo(place.geometry.location);
            mapRef.current.setZoom(15);
        }
    };

    const onPolygonComplete = (polygon) => {
        const path = polygon.getPath().getArray().map(latLng => ({ lat: latLng.lat(), lng: latLng.lng() }));
        const updatedPolygons = [...polygons, path];
        setPolygons(updatedPolygons);
        setFormData(prev => ({ ...prev, geometrics_outline: JSON.stringify(updatedPolygons) }));
        polygon.setMap(null);
    };

    const filteredData = areas.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
    const currentItems = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <MasterLayout>
            <div className="d-flex justify-content-between align-items-center mb-24 px-10">
                <h5 className="mb-0 fw-bold">Top Locations (Areas)</h5>
                <div className="d-flex gap-3 align-items-center">
                    <div className="position-relative">
                        <Icon icon="lucide:search" className="position-absolute top-50 start-0 translate-middle-y ms-12 text-secondary-light" />
                        <input type="text" className="form-control ps-40 radius-8" placeholder="Search areas..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary-600 radius-12 px-24 d-flex align-items-center">
                        <Icon icon="lucide:plus" className="me-2" /> Add Area
                    </button>
                </div>
            </div>

            <div className="card radius-12 border-0 shadow-sm overflow-hidden">
                <div className="table-responsive">
                    <table className="table mb-0 align-middle">
                        <thead className="text-secondary-light border-bottom bg-white" style={{ fontSize: '13px', cursor: 'pointer' }}>
                            <tr>
                                <th className="ps-24" style={{ width: '40px' }}><input type="checkbox" className="form-check-input" /></th>
                                <th onClick={() => handleSort('name')}>Name <Icon icon="lucide:arrow-up-down" width="12" /></th>
                                <th>Description</th>
                                <th onClick={() => handleSort('created_at')}>Created <Icon icon="lucide:arrow-up-down" width="12" /></th>
                                <th className="text-center">Businesses</th>
                                <th className="text-end pe-24">Opts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(area => (
                                <tr key={area.id} className="border-bottom">
                                    <td className="ps-24"><input type="checkbox" className="form-check-input" /></td>
                                    <td className="fw-bold">{area.name}</td>
                                    <td className="text-secondary">{area.description}</td>
                                    <td className="text-secondary">{new Date(area.created_at).toLocaleDateString('en-GB')}</td>
                                    <td className="text-center">
                                        <button className="btn btn-outline-secondary btn-sm radius-20 px-15" onClick={() => navigate('/locations-main', { state: { filterAreaId: area.id, filterAreaName: area.name } })}>View</button>
                                    </td>
                                    <td className="text-end pe-24 text-secondary">
                                        <div className="d-flex justify-content-end gap-3 align-items-center">
                                            <Icon icon="lucide:edit-3" width="18" className="pointer" onClick={() => { setEditId(area.id); setPolygons(JSON.parse(area.geometrics_outline || '[]')); setFormData({name: area.name, description: area.description, geometrics_outline: area.geometrics_outline}); setShowModal(true); }} />
                                            <Icon icon="lucide:trash-2" width="18" className="pointer text-danger" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="d-flex justify-content-between align-items-center p-20 border-top bg-white">
                    <span className="text-sm text-secondary-light">Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}</span>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary px-12" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
                        <button className="btn btn-sm btn-primary-600 px-15">{currentPage}</button>
                        <button className="btn btn-sm btn-outline-secondary px-12" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '95%' }}>
                        <div className="modal-content radius-16 border-0 shadow-lg">
                            <form onSubmit={(e) => { e.preventDefault(); api[editId ? 'put' : 'post'](editId ? `/top-locations/${editId}` : '/top-locations', formData).then(() => { toast.success("Saved"); setShowModal(false); fetchAreas(); }); }}>
                                <div className="modal-header border-bottom p-20 bg-base d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0 fw-bold">{editId ? 'Modify Area' : 'New Area Boundary'}</h6>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-close shadow-none"></button>
                                </div>
                                <div className="modal-body p-24 bg-neutral-50">
                                    <div className="row g-4">
                                        <div className="col-lg-4">
                                            <div className="card border-0 radius-12 p-20 shadow-sm h-100">
                                                <div className="mb-16">
                                                    <label className="form-label fw-bold">Location Name</label>
                                                    <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                                                </div>
                                                <div className="mb-16">
                                                    <label className="form-label fw-bold">Description</label>
                                                    <textarea className="form-control" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                                </div>
                                                <label className="form-label fw-bold">Geometrics (JSON)</label>
                                                <textarea className="form-control text-xs font-monospace bg-light flex-grow-1" style={{ minHeight: '250px' }} value={formData.geometrics_outline} onChange={e => setFormData({...formData, geometrics_outline: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="col-lg-8 border rounded-8 overflow-hidden bg-white">
                                            {/* RESTORED: Autocomplete Input Container */}
                                            <div className="p-12 border-bottom bg-white">
                                                {isLoaded && (
                                                    <Autocomplete onLoad={a => autocompleteRef.current = a} onPlaceChanged={onPlaceChanged}>
                                                        <input 
                                                            type="text" 
                                                            className="form-control border-0 shadow-none px-0" 
                                                            placeholder="Type an address to center the map..." 
                                                            style={{ fontSize: '14px' }}
                                                        />
                                                    </Autocomplete>
                                                )}
                                            </div>
                                            {isLoaded ? (
                                                <GoogleMap 
                                                    mapContainerStyle={MAP_CONTAINER_STYLE} 
                                                    center={DEFAULT_CENTER} 
                                                    zoom={11} 
                                                    onLoad={m => mapRef.current = m}
                                                    options={{ disableDefaultUI: true, zoomControl: true }}
                                                >
                                                    <DrawingManager 
                                                        onPolygonComplete={onPolygonComplete} 
                                                        options={{ 
                                                            drawingControl: true, 
                                                            drawingControlOptions: { 
                                                                position: window.google.maps.ControlPosition.TOP_CENTER, 
                                                                drawingModes: ['polygon'] 
                                                            }, 
                                                            polygonOptions: { fillColor: '#485afe', fillOpacity: 0.3, strokeWeight: 2, editable: true } 
                                                        }} 
                                                    />
                                                    {polygons.map((path, idx) => ( 
                                                        <Polygon 
                                                            key={idx} 
                                                            paths={path} 
                                                            options={{ fillColor: '#485afe', fillOpacity: 0.3, strokeColor: '#485afe', strokeWeight: 2, editable: true }} 
                                                        /> 
                                                    ))}
                                                </GoogleMap>
                                            ) : <div className="p-40 text-center">Loading Map...</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer p-20 border-top bg-white d-flex justify-content-end gap-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline-secondary px-32 radius-8">Discard</button>
                                    <button type="submit" className="btn btn-primary-600 px-40 radius-8">Save Area Definition</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

export default LocationsTopPage;