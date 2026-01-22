import React, { useState, useEffect, useRef } from 'react';
import MasterLayout from '../masterLayout/MasterLayout';
import Breadcrumb from '../components/Breadcrumb';
import api from '../services/api'; 
import { toast } from 'react-toastify';
import { Icon } from "@iconify/react";
import { GoogleMap, useJsApiLoader, DrawingManager, Autocomplete, Polygon } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES } from '../components/MapConfig';
import '../custom.css';

const MAP_CONTAINER_STYLE = { width: '100%', height: '550px' };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const LocationsTopPage = () => {
    const [areas, setAreas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [formData, setFormData] = useState({ name: '', description: '', geometrics_outline: '[]' });
    const [polygons, setPolygons] = useState([]); 

    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);
    const polygonRefs = useRef({});

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES
    });

    useEffect(() => { fetchAreas(); }, []);

    const fetchAreas = async () => {
        try {
            const res = await api.get('/top-locations');
            setAreas(Array.isArray(res.data) ? res.data : []);
        } catch (err) { toast.error("Failed to load areas"); }
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
        setSelectedIndex(updatedPolygons.length - 1);
    };

    const handleClose = () => {
        setShowModal(false);
        setEditId(null);
        setPolygons([]);
        setSelectedIndex(null);
        setFormData({ name: '', description: '', geometrics_outline: '[]' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editId ? `/top-locations/${editId}` : '/top-locations';
            await api[editId ? 'put' : 'post'](url, formData);
            toast.success("Area saved!");
            handleClose();
            fetchAreas();
        } catch (err) { toast.error("Save failed"); }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = areas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(areas.length / rowsPerPage);

    return (
        <MasterLayout>
            <div className="d-flex justify-content-between align-items-center mb-24 px-10">
                <h5 className="mb-0 fw-bold">Top Locations (Areas)</h5>
                <div className="d-flex gap-3 align-items-center">
                    <div className="d-flex align-items-center gap-2 text-secondary-light">
                        <span className="text-sm">Rows:</span>
                        <select className="form-select form-select-sm border-0 bg-transparent fw-bold pointer" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary-600 radius-12 px-24"><Icon icon="lucide:plus" className="me-2" /> Add Area</button>
                </div>
            </div>

            <div className="card radius-12 border-0 shadow-sm overflow-hidden">
                <div className="table-responsive">
                    <table className="table mb-0 align-middle">
                        <thead className="text-secondary-light border-bottom bg-white" style={{ fontSize: '13px' }}>
                            <tr>
                                <th className="ps-24 py-16" style={{ width: '40px' }}><input type="checkbox" className="form-check-input" /></th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Created</th>
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
                                    <td className="text-secondary">{new Date(area.created_at || Date.now()).toLocaleDateString('en-GB')}</td>
                                    <td className="text-center"><button className="btn btn-outline-secondary btn-sm radius-20 px-15">View</button></td>
                                    <td className="text-end pe-24 text-secondary">
                                        <div className="d-flex justify-content-end gap-3 align-items-center">
                                            <Icon icon="lucide:search" width="18" className="pointer" />
                                            <Icon icon="lucide:edit-3" width="18" className="pointer" onClick={() => { setEditId(area.id); setPolygons(JSON.parse(area.geometrics_outline || '[]')); setFormData({name: area.name, description: area.description, geometrics_outline: area.geometrics_outline}); setShowModal(true); }} />
                                            <Icon icon="lucide:trash-2" width="18" className="pointer text-danger" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Footer */}
                <div className="d-flex justify-content-between align-items-center p-20 border-top bg-white">
                    <span className="text-secondary-light text-sm">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, areas.length)} of {areas.length} entries</span>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button key={i} className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary-600' : 'btn-outline-secondary'}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                        ))}
                        <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                    </div>
                </div>
            </div>

            {/* Modal Logic remains the same (Polygon Drawing & JSON Textarea) */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '95%' }}>
                        <div className="modal-content radius-16 border-0 shadow-lg">
                            <form onSubmit={handleSubmit}>
                                <div className="modal-header border-bottom p-20 bg-base d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0 fw-bold">{editId ? 'Modify Area' : 'New Area'}</h6>
                                    <button type="button" onClick={handleClose} className="btn-close shadow-none"></button>
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
                                                <label className="form-label fw-bold">Coordinates (JSON)</label>
                                                <textarea className="form-control text-xs font-monospace bg-light flex-grow-1" style={{ minHeight: '200px' }} value={formData.geometrics_outline} onChange={e => setFormData({...formData, geometrics_outline: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="col-lg-8">
                                            <div className="card border-0 radius-12 p-2 shadow-sm">
                                                <div className="mb-12 p-12 bg-white rounded">
                                                    {isLoaded && (
                                                        <Autocomplete onLoad={a => autocompleteRef.current = a} onPlaceChanged={onPlaceChanged}>
                                                            <input type="text" className="form-control border shadow-none" placeholder="Search address to center map..." onKeyDown={e => e.key === 'Enter' && e.preventDefault()} />
                                                        </Autocomplete>
                                                    )}
                                                </div>
                                                <div className="rounded-bottom overflow-hidden border-top">
                                                    {isLoaded ? (
                                                        <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={DEFAULT_CENTER} zoom={11} onLoad={m => mapRef.current = m}>
                                                            <DrawingManager onPolygonComplete={onPolygonComplete} options={{ drawingControl: true, drawingControlOptions: { position: window.google.maps.ControlPosition.TOP_CENTER, drawingModes: ['polygon'] }, polygonOptions: { fillColor: '#485afe', fillOpacity: 0.3, strokeWeight: 2, editable: true } }} />
                                                            {polygons.map((path, idx) => ( <Polygon key={idx} paths={path} options={{ fillColor: '#485afe', fillOpacity: 0.3, strokeColor: '#485afe', strokeWeight: 2, editable: true }} /> ))}
                                                        </GoogleMap>
                                                    ) : <div className="p-40 text-center">Loading Maps...</div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer p-20 border-top bg-base">
                                    <button type="button" onClick={handleClose} className="btn btn-outline-secondary px-32 radius-8">Discard</button>
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