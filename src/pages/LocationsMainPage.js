import React, { useState, useEffect, useRef } from 'react';
import MasterLayout from '../masterLayout/MasterLayout';
import api from '../services/api'; 
import { toast } from 'react-toastify';
import { Icon } from "@iconify/react";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api'; 
import { GOOGLE_MAPS_LIBRARIES } from '../components/MapConfig';
import '../custom.css';

const MAP_CONTAINER_STYLE = { width: '100%', height: '350px' };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

// Tabs defined exactly as per your UI requirements
const TABS = [
    "Basic Info", "Location", "Communication", 
    "Opening Hours", "Media", "Google Sync"
];

const LocationsMainPage = () => {
    // 1. List & Pagination State
    const [locations, setLocations] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    
    // 2. Form & Modal State
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [activeTab, setActiveTab] = useState("Basic Info");
    const [parentAreas, setParentAreas] = useState([]);
    
    const [formData, setFormData] = useState({
        location_name: '', top_location_id: '', city: '',
        street_address: '', state: '', postal_code: '', 
        lat: 28.6139, lng: 77.2090, phone_number: '', 
        email: '', sync_status: 'PENDING'
    });

    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [locs, areas] = await Promise.all([
                api.get('/main-locations'),
                api.get('/options/top-locations')
            ]);
            setLocations(Array.isArray(locs.data) ? locs.data : (locs.data?.data || []));
            setParentAreas(areas.data || []);
        } catch (err) { 
            toast.error("Error loading data"); 
            setLocations([]);
        } finally {
            setLoading(false);
        }
    };

    // 3. Modal Handlers
    const handleOpenAdd = () => {
        setEditId(null);
        setFormData({
            location_name: '', top_location_id: '', city: '',
            street_address: '', state: '', postal_code: '', 
            lat: 28.6139, lng: 77.2090, phone_number: '', 
            email: '', sync_status: 'PENDING'
        });
        setActiveTab("Basic Info");
        setShowModal(true);
    };

    const handleEdit = (loc) => {
        setEditId(loc.id);
        setFormData({ ...loc });
        setActiveTab("Basic Info");
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setEditId(null);
    };

    const onPlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry) {
            const newPos = { 
                lat: place.geometry.location.lat(), 
                lng: place.geometry.location.lng() 
            };
            setFormData(prev => ({ 
                ...prev, 
                lat: newPos.lat, 
                lng: newPos.lng, 
                street_address: place.formatted_address,
                city: place.address_components?.find(c => c.types.includes("locality"))?.long_name || prev.city
            }));
            mapRef.current.panTo(newPos);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editId ? 'put' : 'post';
            const url = editId ? `/main-locations/${editId}` : '/main-locations';
            await api[method](url, formData);
            toast.success("Business profile saved!");
            handleClose();
            fetchData();
        } catch (err) { toast.error("Save failed"); }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = locations.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(locations.length / rowsPerPage) || 1;

    return (
        <MasterLayout>
            <div className="d-flex justify-content-between align-items-center mb-24 px-10">
                <h5 className="mb-0 fw-bold">Main Locations (Businesses)</h5>
                <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2 text-secondary-light">
                        <span className="text-sm">Rows:</span>
                        <select className="form-select form-select-sm border-0 bg-transparent fw-bold" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                            <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                        </select>
                    </div>
                    <button onClick={handleOpenAdd} className="btn btn-primary-600 radius-12 px-24">
                        <Icon icon="lucide:plus" className="me-2" /> Add Business
                    </button>
                </div>
            </div>

            <div className="card radius-12 border-0 shadow-sm overflow-hidden">
                <div className="table-responsive">
                    <table className="table mb-0 align-middle">
                        <thead className="text-secondary-light border-bottom bg-white" style={{ fontSize: '13px' }}>
                            <tr>
                                <th className="ps-24 py-16" style={{ width: '40px' }}><input type="checkbox" className="form-check-input" /></th>
                                <th>Business Name</th><th>Parent Area</th><th>City</th><th>Status</th><th className="text-end pe-24">Opts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-40">Loading...</td></tr>
                            ) : currentItems.map(loc => (
                                <tr key={loc.id} className="border-bottom">
                                    <td className="ps-24"><input type="checkbox" className="form-check-input" /></td>
                                    <td className="fw-bold text-dark">{loc.location_name}</td>
                                    <td><div className="d-flex align-items-center gap-2">{loc.top_location_name || '-- No Parent --'}<Icon icon="lucide:chevron-down" width="14" /></div></td>
                                    <td className="text-secondary">{loc.city}</td>
                                    <td>
                                        <span className={`badge px-12 ${loc.sync_status === 'SYNCED' ? 'bg-success-100 text-success' : 'bg-warning-100 text-warning'}`}>
                                            {loc.sync_status}
                                        </span>
                                    </td>
                                    <td className="text-end pe-24 text-secondary">
                                        <div className="d-flex justify-content-end gap-3 align-items-center">
                                            <Icon icon="logos:google-icon" width="18" className="pointer" />
                                            <Icon icon="lucide:edit-3" width="18" className="pointer" onClick={() => handleEdit(loc)} />
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
                    <span className="text-sm text-secondary-light">Showing {locations.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, locations.length)} of {locations.length} entries</span>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
                        <button className="btn btn-sm btn-primary-600 px-15">{currentPage}</button>
                        <button className="btn btn-sm btn-outline-secondary" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                    </div>
                </div>
            </div>

            {/* RESTORED MODAL */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '92%' }}>
                        <div className="modal-content radius-16 border-0 shadow-lg overflow-hidden">
                            <form onSubmit={handleSubmit}>
                                <div className="modal-header border-bottom p-20 bg-base d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0 fw-bold">{editId ? 'Edit Business Profile' : 'New Business Profile'}</h6>
                                    <button type="button" onClick={handleClose} className="btn-close shadow-none"></button>
                                </div>
                                
                                <div className="bg-neutral-50 border-bottom px-24 d-flex gap-4 overflow-auto">
                                    {TABS.map(tab => (
                                        <button key={tab} type="button" 
                                            className={`py-15 px-10 border-bottom-2 text-sm fw-bold transition-all ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary'}`}
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <div className="modal-body p-24" style={{ minHeight: '500px' }}>
                                    {activeTab === "Basic Info" && (
                                        <div className="row g-4">
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold">Business Name</label>
                                                <input type="text" className="form-control" value={formData.location_name} onChange={e => setFormData({...formData, location_name: e.target.value})} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold">Parent Area</label>
                                                <select className="form-select" value={formData.top_location_id} onChange={e => setFormData({...formData, top_location_id: e.target.value})}>
                                                    <option value="">Select Area</option>
                                                    {parentAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "Location" && (
                                        <div className="row g-4">
                                            <div className="col-lg-4">
                                                <label className="form-label fw-bold">Address Search</label>
                                                {isLoaded && (
                                                    <Autocomplete onLoad={a => autocompleteRef.current = a} onPlaceChanged={onPlaceChanged}>
                                                        <input type="text" className="form-control mb-3" placeholder="Search address..." />
                                                    </Autocomplete>
                                                )}
                                                <div className="mb-3">
                                                    <label className="form-label text-xs fw-bold">Street</label>
                                                    <textarea className="form-control" rows="2" value={formData.street_address} onChange={e => setFormData({...formData, street_address: e.target.value})} />
                                                </div>
                                                <div className="row g-2">
                                                    <div className="col-6"><input type="text" className="form-control" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
                                                    <div className="col-6"><input type="text" className="form-control" placeholder="Zip" value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} /></div>
                                                </div>
                                            </div>
                                            <div className="col-lg-8 border rounded-8 overflow-hidden">
                                                {isLoaded ? (
                                                    <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={{ lat: Number(formData.lat), lng: Number(formData.lng) }} zoom={15} onLoad={m => mapRef.current = m}>
                                                        <Marker position={{ lat: Number(formData.lat), lng: Number(formData.lng) }} draggable onDragEnd={(e) => setFormData({...formData, lat: e.latLng.lat(), lng: e.latLng.lng()})} />
                                                    </GoogleMap>
                                                ) : <div className="p-40 text-center">Loading Map...</div>}
                                            </div>
                                        </div>
                                    )}
                                    {/* (Other tabs follow the same UI pattern) */}
                                </div>

                                <div className="modal-footer p-20 border-top bg-base">
                                    <button type="button" onClick={handleClose} className="btn btn-outline-secondary px-32 radius-8">Discard</button>
                                    <button type="submit" className="btn btn-primary-600 px-40 radius-8">Save Business Profile</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

export default LocationsMainPage;