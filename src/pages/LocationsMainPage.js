import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import api from '../services/api'; 
import { toast } from 'react-toastify';
import { Icon } from "@iconify/react";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api'; 
import { GOOGLE_MAPS_LIBRARIES } from '../components/MapConfig';
import { useGoogleMaps } from '../hook/useGoogleMaps';
const MAP_CONTAINER_STYLE = { width: '100%', height: '400px' };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const TABS = [
    "Basic Info", "Location", "Description", "Communication", 
    "Opening Hours", "Amenities", "Media", "Google Sync", 
    "Attributes", "Accessibility", "Services", "Health & Safety", "Payments"
];

const LocationsMainPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    
    const [locations, setLocations] = useState([]);
    const [parentAreas, setParentAreas] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'location_name', direction: 'asc' });
    const [activeFilter, setActiveFilter] = useState(state?.filterAreaId || null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 25;

    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [activeTab, setActiveTab] = useState("Basic Info");
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        location_name: '', top_location_id: '', city: '',
        street_address: '', state: '', postal_code: '', 
        lat: 28.6139, lng: 77.2090, phone_number: '', 
        email: '', website_url: '', description: '', 
        sync_status: 'PENDING',
        opening_hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' }
    });

   

    const { isLoaded } = useGoogleMaps();

    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [locs, areas] = await Promise.all([ api.get('/main-locations'), api.get('/options/top-locations') ]);
            setLocations(Array.isArray(locs.data) ? locs.data : (locs.data?.data || []));
            setParentAreas(areas.data || []);
        } catch (err) { toast.error("Error loading data"); } finally { setLoading(false); }
    };

    const handleOpenAdd = () => {
        setEditId(null);
        setFormData({
            location_name: '', top_location_id: '', city: '', street_address: '', 
            state: '', postal_code: '', lat: 28.6139, lng: 77.2090, 
            phone_number: '', email: '', website_url: '', description: '', 
            sync_status: 'PENDING',
            opening_hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' }
        });
        setActiveTab("Basic Info");
        setShowModal(true);
    };

    const handleEdit = (loc) => {
        setEditId(loc.id);
        setFormData({ ...loc, opening_hours: loc.opening_hours || formData.opening_hours });
        setActiveTab("Basic Info");
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editId ? 'put' : 'post';
            const url = editId ? `/main-locations/${editId}` : '/main-locations';
            await api[method](url, formData);
            toast.success("Business profile saved!");
            setShowModal(false);
            fetchData();
        } catch (err) { toast.error("Save failed"); }
    };

    const onPlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry) {
            const newPos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
            setFormData(prev => ({ 
                ...prev, lat: newPos.lat, lng: newPos.lng, street_address: place.formatted_address,
                city: place.address_components?.find(c => c.types.includes("locality"))?.long_name || prev.city
            }));
            mapRef.current.panTo(newPos);
        }
    };

    const filteredData = locations.filter(loc => 
        loc.location_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (activeFilter ? String(loc.top_location_id) === String(activeFilter) : true)
    ).sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const currentItems = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <>
            {/* Header & Table (UI maintained as per your previous screenshots) */}
            <div className="d-flex justify-content-between align-items-center mb-24 px-10">
                <div className="d-flex align-items-center gap-3">
                    <h5 className="mb-0 fw-bold">Main Locations (Businesses)</h5>
                    {activeFilter && <span className="badge bg-primary-100 text-primary-600 px-12 py-8 radius-8 pointer" onClick={() => setActiveFilter(null)}>Filtered <Icon icon="lucide:x" /></span>}
                </div>
                <div className="d-flex gap-3">
                    <div className="position-relative">
                        <Icon icon="lucide:search" className="position-absolute top-50 start-0 translate-middle-y ms-12 text-secondary-light" />
                        <input type="text" className="form-control ps-40 radius-8" placeholder="Search businesses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={handleOpenAdd} className="btn btn-primary-600 radius-12 px-24">Add Business</button>
                </div>
            </div>

            <div className="card radius-12 border-0 shadow-sm overflow-hidden">
                <table className="table mb-0 align-middle">
                    <thead className="text-secondary-light border-bottom bg-white" style={{ fontSize: '13px', cursor: 'pointer' }}>
                        <tr>
                            <th className="ps-24" style={{ width: '40px' }}><input type="checkbox" className="form-check-input" /></th>
                            <th onClick={() => setSortConfig({ key: 'location_name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>Name <Icon icon="lucide:arrow-up-down" width="12" /></th>
                            <th>Parent Area</th><th>City</th><th>Status</th><th className="text-end pe-24">Opts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (<tr><td colSpan="6" className="text-center py-40">Loading...</td></tr>) : currentItems.map(loc => (
                            <tr key={loc.id} className="border-bottom">
                                <td className="ps-24"><input type="checkbox" className="form-check-input" /></td>
                                <td className="fw-bold text-primary-600 pointer" onClick={() => navigate('/locations-sub', { state: { filterBusinessId: loc.id, filterBusinessName: loc.location_name } })}>{loc.location_name}</td>
                                <td>{loc.top_location_name || '--'}</td><td>{loc.city}</td>
                                <td><span className={`badge px-12 ${loc.sync_status === 'SYNCED' ? 'bg-success-100 text-success' : 'bg-warning-100 text-warning'}`}>{loc.sync_status}</span></td>
                                <td className="text-end pe-24">
                                    <Icon icon="lucide:edit-3" width="18" className="pointer me-3" onClick={() => handleEdit(loc)} />
                                    <Icon icon="lucide:trash-2" width="18" className="pointer text-danger" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL WITH LEFT SIDEBAR TABS --- */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '95%' }}>
                        <div className="modal-content radius-16 border-0 shadow-lg overflow-hidden">
                            <form onSubmit={handleSubmit} className="d-flex flex-column" style={{ height: '85vh' }}>
                                {/* Modal Header */}
                                <div className="modal-header border-bottom p-20 bg-base d-flex justify-content-between align-items-center flex-shrink-0">
                                    <h6 className="mb-0 fw-bold">{editId ? 'Edit Business Profile' : 'New Business Profile'}</h6>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-close shadow-none"></button>
                                </div>
                                
                                <div className="modal-body p-0 d-flex flex-grow-1 overflow-hidden">
                                    {/* LEFT SIDEBAR: Tabs */}
                                    <div className="sidebar-tabs bg-neutral-50 border-end flex-shrink-0" style={{ width: '220px', overflowY: 'auto' }}>
                                        {TABS.map(tab => (
                                            <button 
                                                key={tab} 
                                                type="button" 
                                                className={`w-100 text-start py-16 px-24 border-bottom text-sm fw-bold transition-all ${activeTab === tab ? 'bg-white text-primary-600 border-start border-start-4 border-primary-600' : 'text-secondary border-transparent'}`}
                                                onClick={() => setActiveTab(tab)}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    {/* RIGHT SIDE: Content Area */}
                                    <div className="tab-content-area flex-grow-1 p-32 overflow-auto bg-white">
                                        <h5 className="mb-24 fw-bold border-bottom pb-12">{activeTab}</h5>
                                        
                                        {activeTab === "Basic Info" && (
                                            <div className="row g-4">
                                                <div className="col-md-6"><label className="form-label fw-bold">Business Name</label><input type="text" className="form-control" value={formData.location_name} onChange={e => setFormData({...formData, location_name: e.target.value})} required /></div>
                                                <div className="col-md-6"><label className="form-label fw-bold">Parent Area</label><select className="form-select" value={formData.top_location_id} onChange={e => setFormData({...formData, top_location_id: e.target.value})}><option value="">Select Area</option>{parentAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}</select></div>
                                                <div className="col-12"><label className="form-label fw-bold">Internal Description</label><textarea className="form-control" rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                                            </div>
                                        )}

                                        {activeTab === "Location" && (
                                            <div className="row g-4">
                                                <div className="col-lg-5">
                                                    <label className="form-label fw-bold">Google Address Search</label>
                                                    {isLoaded && <Autocomplete onLoad={a => autocompleteRef.current = a} onPlaceChanged={onPlaceChanged}><input type="text" className="form-control mb-3" placeholder="Type address..." /></Autocomplete>}
                                                    <div className="mb-3"><label className="form-label text-xs fw-bold">Street Address</label><textarea className="form-control" rows="2" value={formData.street_address} onChange={e => setFormData({...formData, street_address: e.target.value})} /></div>
                                                    <div className="row g-2">
                                                        <div className="col-6"><label className="text-xs">City</label><input type="text" className="form-control" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
                                                        <div className="col-6"><label className="text-xs">Zip Code</label><input type="text" className="form-control" value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} /></div>
                                                    </div>
                                                </div>
                                                <div className="col-lg-7 border radius-12 overflow-hidden shadow-sm p-0">
                                                    {isLoaded && <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={{ lat: Number(formData.lat), lng: Number(formData.lng) }} zoom={15} onLoad={m => mapRef.current = m} options={{ disableDefaultUI: true, zoomControl: true }}><Marker position={{ lat: Number(formData.lat), lng: Number(formData.lng) }} draggable onDragEnd={(e) => setFormData({...formData, lat: e.latLng.lat(), lng: e.latLng.lng()})} /></GoogleMap>}
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "Opening Hours" && (
                                            <div className="row g-3">
                                                {Object.keys(formData.opening_hours).map(day => (
                                                    <div key={day} className="col-md-6 d-flex align-items-center gap-3 mb-2">
                                                        <span className="fw-bold text-capitalize" style={{ width: '100px' }}>{day}</span>
                                                        <input type="text" className="form-control" placeholder="09:00 - 18:00" value={formData.opening_hours[day]} onChange={e => setFormData({...formData, opening_hours: {...formData.opening_hours, [day]: e.target.value}})} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === "Communication" && (
                                            <div className="row g-4">
                                                <div className="col-md-6"><label className="form-label fw-bold">Phone</label><input type="text" className="form-control" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
                                                <div className="col-md-6"><label className="form-label fw-bold">Email</label><input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                                                <div className="col-12"><label className="form-label fw-bold">Website</label><input type="url" className="form-control" value={formData.website_url} onChange={e => setFormData({...formData, website_url: e.target.value})} /></div>
                                            </div>
                                        )}

                                        {/* Generic UI for Checkbox Tabs (Amenities, Payments, Accessibility, etc.) */}
                                        {["Amenities", "Accessibility", "Health & Safety", "Payments", "Attributes", "Services"].includes(activeTab) && (
                                            <div className="row g-4">
                                                <div className="col-12"><p className="text-secondary-light mb-16">Select all that apply for this location:</p></div>
                                                {["Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Option 6"].map(opt => (
                                                    <div key={opt} className="col-md-4">
                                                        <div className="form-check p-12 border radius-8 hover-bg-neutral-50 transition-all">
                                                            <input className="form-check-input ms-0 me-12" type="checkbox" id={opt} />
                                                            <label className="form-check-label pointer fw-medium" htmlFor={opt}>{opt}</label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === "Media" && (
                                            <div className="p-60 text-center border-dashed radius-16 bg-neutral-50">
                                                <Icon icon="solar:camera-bold-duotone" width="64" className="text-primary-600 mb-16 opacity-50" />
                                                <h5>Media Assets</h5>
                                                <p className="text-secondary-light">Upload Logo, Cover Photo, and Gallery images here.</p>
                                                <button type="button" className="btn btn-primary-600 mt-16 px-32">Select Files</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="modal-footer p-20 border-top bg-base flex-shrink-0">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline-secondary px-32 radius-8">Discard</button>
                                    <button type="submit" className="btn btn-primary-600 px-40 radius-8">Save Business Profile</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LocationsMainPage;