import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { GoogleMap, useJsApiLoader, Marker, Polygon, Circle, Autocomplete } from '@react-google-maps/api';
import { Trash2, X } from 'lucide-react';
import HoursEditor from './HoursEditor';
import DrawTools from './DrawTools'; 
import './BoothForm.css'; 
import { COUNTRIES, CATEGORIES } from './constants';

const TABS = [
  "Basic Info", "Location", "Description", "Communication", "Opening Hours", 
  "Parking", "Planning", "Identifier", "Accessibility", "Amenities", 
  "Crowd", "Media", "Geometrics"
];

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 }; 
const LIBRARIES = ['drawing', 'places', 'geometry']; 

// Helper to safely parse polygon JSON
const parsePolygon = (data) => {
    if (!data) return [];
    let json = data;
    if (typeof data === 'string') {
        try { json = JSON.parse(data); } catch (e) { return []; }
    }
    if (json.type === 'Polygon' && json.coordinates && json.coordinates[0]) {
        return json.coordinates[0].map(c => ({ lng: c[0], lat: c[1] }));
    }
    if (Array.isArray(json)) {
         const poly = json.find(s => s.type === 'polygon');
         if (poly && poly.path) return poly.path;
         if (json.length > 0 && (json[0].lat || json[0].lat === 0)) return json;
    }
    return [];
};

export default function LocationForm({ initialData, onSubmit, onCancel }) {
  const formType = initialData?.formType || 'MAIN'; 
  
  const [activeTab, setActiveTab] = useState("Basic Info");
  const [parents, setParents] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [drawVersion, setDrawVersion] = useState(0); // Key to force-reset drawing tools
  
  const mapRef = useRef(null);
  const placesServiceRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  // --- STATE INITIALIZATION ---
  const [formData, setFormData] = useState(() => {
    const derivedParentId = initialData?.parent_id 
                         || initialData?.top_location_id 
                         || initialData?.main_location_id 
                         || '';

    return {
      parent_id: derivedParentId, 
      attributes: {},
      lat: '', lng: '', country: 'IN',
      geometrics_outline: '',
      radius: '1000', 
      category: '',
      type: '',
      street_address: '', city: '', state: '', postal_code: '', 
      ...initialData,
      parent_id: derivedParentId,
      attributes: (typeof initialData?.attributes === 'string' ? JSON.parse(initialData.attributes) : initialData?.attributes) || {}
    };
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPois, setSelectedPois] = useState({});
  const [parentOverlay, setParentOverlay] = useState(null);

  // 1. Fetch Parent Options
  useEffect(() => {
    let url = '';
    if (formType === 'MAIN') url = '/api/options/top-locations';
    if (formType === 'SUB') url = '/api/options/main-locations';
    if (url) axios.get(url).then(res => setParents(res.data)).catch(console.error);
  }, [formType]);

  // 2. Parent Auto-Center Logic
  useEffect(() => {
    if ((formType === 'SUB' || formType === 'MAIN') && formData.parent_id && mapRef.current && parents.length > 0) {
        const selected = parents.find(p => String(p.id) === String(formData.parent_id));
        if (selected) {
            setParentOverlay({ 
                lat: selected.lat, 
                lng: selected.lng, 
                polygon: selected.geometrics_outline 
            });

            let didFitBounds = false;
            if (selected.geometrics_outline) {
                const path = parsePolygon(selected.geometrics_outline);
                if (path && path.length > 0) {
                    const bounds = new window.google.maps.LatLngBounds();
                    path.forEach(p => bounds.extend(p));
                    mapRef.current.fitBounds(bounds);
                    didFitBounds = true;
                }
            } 
            if (!didFitBounds && selected.lat && selected.lng) {
                 mapRef.current.panTo({ lat: parseFloat(selected.lat), lng: parseFloat(selected.lng) });
                 mapRef.current.setZoom(16);
            }
            if (!formData.lat && selected.lat && selected.lng) {
                 setFormData(prev => ({ ...prev, lat: selected.lat, lng: selected.lng }));
            }
        }
    } else if (!formData.parent_id) {
        setParentOverlay(null);
    }
  }, [formData.parent_id, formType, parents, mapReady]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  
  const onLoad = useCallback((map) => {
    mapRef.current = map;
    setMapReady(true);
    if (window.google) placesServiceRef.current = new window.google.maps.places.PlacesService(map);

    if (formType === 'TOP' && formData.geometrics_outline) {
        try {
            const path = parsePolygon(formData.geometrics_outline);
            if (path.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                path.forEach(p => bounds.extend(p));
                map.fitBounds(bounds);
            }
        } catch (e) {}
    } else if (formData.lat && formData.lng) {
        map.panTo({ lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) });
        map.setZoom(16);
    }
  }, [formType, formData.geometrics_outline, formData.lat, formData.lng]);

  const onMapClick = useCallback((e) => {
    if (formType !== 'TOP') {
        setFormData(prev => ({ ...prev, lat: e.latLng.lat(), lng: e.latLng.lng() }));
    }
  }, [formType]);

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            mapRef.current?.panTo({ lat, lng });
            mapRef.current?.setZoom(17);

            const updates = { lat, lng };
            if (formType === 'MAIN') {
                let addr = { city: '', state: '', country: 'IN', postal: '', route: '', number: '' };
                place.address_components?.forEach(c => {
                    if(c.types.includes('locality')) addr.city = c.long_name;
                    if(c.types.includes('administrative_area_level_1')) addr.state = c.long_name;
                    if(c.types.includes('country')) addr.country = c.short_name; 
                    if(c.types.includes('postal_code')) addr.postal = c.long_name;
                    if(c.types.includes('route')) addr.route = c.long_name;
                    if(c.types.includes('street_number')) addr.number = c.long_name;
                });
                updates.street_address = `${addr.number} ${addr.route}`.trim();
                updates.city = addr.city;
                updates.state = addr.state;
                updates.postal_code = addr.postal;
                updates.country = addr.country;
            }
            setFormData(prev => ({ ...prev, ...updates }));
        }
    }
  };

  // --- FIX: Force Reset Drawing Tools on Clear ---
  const clearPolygon = () => {
      if(confirm("Delete the current boundary polygon?")) {
          setFormData(prev => ({ ...prev, geometrics_outline: '' }));
          setDrawVersion(v => v + 1); // Increment version to remount DrawTools
      }
  };

  const handlePoiSearch = () => {
      if (!placesServiceRef.current) return;
      const radius = formData.radius ? parseInt(formData.radius) : 1000;
      let typeFilter = formData.category ? formData.category.replace('gcid:', '') : '';
      const request = { 
          query: searchKeyword || typeFilter || 'point of interest', 
          fields: ['name', 'geometry', 'formatted_address', 'types', 'place_id'], 
          location: mapRef.current.getCenter(), 
          radius: radius 
      };
      if (typeFilter) request.type = typeFilter;

      placesServiceRef.current.textSearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              const center = mapRef.current.getCenter();
              const strictResults = results.filter(place => {
                  if (!place.geometry?.location) return false;
                  const distance = window.google.maps.geometry.spherical.computeDistanceBetween(center, place.geometry.location);
                  return distance <= radius;
              });
              if (strictResults.length === 0) { alert("No results found in radius."); setSearchResults([]); } 
              else { setSearchResults(strictResults); const bounds = new window.google.maps.LatLngBounds(); strictResults.forEach(p => bounds.extend(p.geometry.location)); mapRef.current.fitBounds(bounds); }
          } else { alert("No results."); setSearchResults([]); }
      });
  };

  const togglePoiSelection = (place) => {
      setSelectedPois(prev => {
          const next = { ...prev };
          if (next[place.place_id]) delete next[place.place_id];
          else next[place.place_id] = place;
          return next;
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData, formType };

    if (formType === 'MAIN') payload.top_location_id = formData.parent_id;
    else if (formType === 'SUB') payload.main_location_id = formData.parent_id;

    if (formType === 'SUB' && Object.keys(selectedPois).length > 0) {
        const bulkPayload = Object.values(selectedPois).map(poi => ({
            parent_id: formData.parent_id,
            main_location_id: formData.parent_id,
            name: poi.name,
            type: poi.types ? poi.types[0].replace(/_/g, ' ').toUpperCase() : 'POI',
            description: poi.formatted_address,
            category: formData.category,
            radius: formData.radius,
            formType: 'SUB'
        }));
        onSubmit(bulkPayload);
    } else {
        onSubmit(payload);
    }
  };

  const getFormTitle = () => {
      if (initialData?.id) return `Edit ${initialData.location_name || initialData.name || 'Location'}`;
      if (formType === 'TOP') return 'Add New Area';
      if (formType === 'SUB') return 'Add New Unit';
      return 'Add New Business';
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2 className="form-title">{getFormTitle()}</h2>
        <button type="button" className="btn-icon" onClick={onCancel} style={{ width: 40, height: 40 }}>
            <X size={28} style={{ width: 28, height: 28, color: '#5f6368' }} />
        </button>
      </div>

      <div className="form-body">
        <form id="locForm" onSubmit={handleSubmit} style={{height: '100%'}}>
            
            {/* --- TOP LOCATION (AREA) --- */}
            {formType === 'TOP' && (
                <div className="form-grid">
                    <div className="w-1-3">
                        <div className="form-section-title">Area Details</div>
                        <div className="form-field" style={{marginBottom: 20}}><Input label="Area Name" required value={formData.name} onChange={v => handleChange('name', v)} /></div>
                        <div className="form-field" style={{marginBottom: 20}}><Input label="Description" value={formData.description} onChange={v => handleChange('description', v)} /></div>
                        <div className="form-field">
                            <label className="form-label" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                Boundary Data
                                {formData.geometrics_outline && (
                                    <button type="button" onClick={clearPolygon} className="btn-icon" style={{color:'#d93025', width:'auto', padding:'4px 8px', fontSize:'11px', display:'flex', gap:'4px', background:'#fce8e6', borderRadius:'4px', height:'24px'}}>
                                        <Trash2 size={12}/> Clear Map
                                    </button>
                                )}
                            </label>
                            <textarea className="form-control" style={{height:250, fontSize:12, fontFamily:'monospace', background:'#f1f3f4', color:'#666'}} value={formData.geometrics_outline} readOnly placeholder="Draw on map..." />
                        </div>
                    </div>
                    <div className="w-2-3" style={{ height: '600px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ zIndex: 10 }}>
                             {isLoaded && <Autocomplete onLoad={a => autocompleteRef.current = a} onPlaceChanged={onPlaceChanged}><input type="text" className="form-control" placeholder="Search address to center map..." style={{boxShadow:'0 2px 6px rgba(0,0,0,0.1)'}} /></Autocomplete>}
                        </div>
                        <div className="map-container" style={{ flex: 1 }}>
                            {isLoaded && (
                                <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={DEFAULT_CENTER} zoom={11} onLoad={onLoad}>
                                    
                                    {/* Floating Delete Button */}
                                    {formData.geometrics_outline && (
                                        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 50 }}>
                                            <button 
                                                type="button" 
                                                onClick={clearPolygon}
                                                style={{
                                                    background: 'white', border: 'none', borderRadius: '2px', 
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)', cursor: 'pointer',
                                                    padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6,
                                                    color: '#d93025', fontWeight: 500, fontSize: '13px'
                                                }}
                                            >
                                                <Trash2 size={16} /> Delete Boundary
                                            </button>
                                        </div>
                                    )}

                                    {/* DrawTools with version key to force remount on delete */}
                                    <DrawTools 
                                        key={drawVersion}
                                        data={formData.geometrics_outline}
                                        onChange={(newJson) => setFormData(prev => ({ ...prev, geometrics_outline: newJson }))}
                                    />
                                </GoogleMap>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- SUB LOCATION --- */}
            {formType === 'SUB' && (
                <div className="form-grid" style={{height: '100%', overflow:'hidden'}}>
                    <div className="w-1-3" style={{display:'flex', flexDirection:'column', gap:16, height:'600px'}}>
                        <div className="form-section-title">Configuration</div>
                        <div className="form-field"><label className="form-label">Parent Business</label><select className="form-control" value={formData.parent_id} onChange={e => handleChange('parent_id', e.target.value)} required><option value="">-- Select Parent --</option>{parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                        <div className="form-field"><SelectInput label="Category Filter" value={formData.category} onChange={v => handleChange('category', v)} options={CATEGORIES} valueKey="id" labelKey="name" /></div>
                        <div className="form-row"><div className="w-1-2"><Input label="Radius (m)" type="number" value={formData.radius} onChange={v => handleChange('radius', v)} placeholder="1000" /></div><div className="w-1-2"><Input label="Type Tag" value={formData.type} onChange={v => handleChange('type', v)} placeholder="e.g. ATM" /></div></div>
                        <div style={{display:'flex', gap:8}}><input className="form-control" placeholder="Keyword..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} /><button type="button" className="btn btn-secondary" onClick={handlePoiSearch}>Search</button></div>
                        <div style={{flex:1, overflowY:'auto', border:'1px solid var(--border)', borderRadius:4, background:'white'}}>{searchResults.map(p => <div key={p.place_id} onClick={() => togglePoiSelection(p)} style={{padding:10, borderBottom:'1px solid #eee', cursor:'pointer', background: selectedPois[p.place_id] ? '#e8f0fe' : 'white', display:'flex', gap:10, alignItems:'center'}}><input type="checkbox" checked={!!selectedPois[p.place_id]} onChange={() => {}} style={{width:16, height:16}} /><div><div style={{fontWeight:500, fontSize:13}}>{p.name}</div><div style={{fontSize:11, color:'#666'}}>{p.formatted_address}</div></div></div>)}</div>
                    </div>
                    <div className="w-2-3" style={{ height: '600px' }}>
                        <div className="map-container">
                            {isLoaded && <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={DEFAULT_CENTER} zoom={13} onLoad={onLoad}>
                                {parentOverlay && <><Marker key={`marker-${formData.parent_id}`} position={{ lat: parseFloat(parentOverlay.lat), lng: parseFloat(parentOverlay.lng) }} label="P" />{parentOverlay.polygon && <Polygon key={`poly-${formData.parent_id}`} paths={parsePolygon(parentOverlay.polygon)} options={{ fillColor: '#FFA500', fillOpacity: 0.1, strokeColor: '#FFA500', clickable: false }} />}{parentOverlay.lat && formData.radius && <Circle center={{ lat: parseFloat(parentOverlay.lat), lng: parseFloat(parentOverlay.lng) }} radius={parseInt(formData.radius) || 1000} options={{ fillColor: '#2563eb', fillOpacity: 0.05, strokeColor: '#2563eb', strokeWeight: 1, clickable: false }} />}</>}
                                {searchResults.map(p => <Marker key={p.place_id} position={p.geometry.location} icon={selectedPois[p.place_id] ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'} onClick={() => togglePoiSelection(p)} />)}
                            </GoogleMap>}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAIN LOCATION --- */}
            {formType === 'MAIN' && (
                <>
                    <div className="form-tabs">
                        <div className="tab-nav">{TABS.map(tab => <button key={tab} type="button" className={`tab-btn ${activeTab === tab ? 'tab-btn-active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
                    </div>
                    {activeTab === 'Basic Info' && (
                        <div className="form-grid">
                            <div className="w-1-3">
                                <Input label="Store Code (Optional)" value={formData.internal_id} onChange={v => handleChange('internal_id', v)} />
                                <Input label="Business Name" required value={formData.location_name} onChange={v => handleChange('location_name', v)} />
                                <div className="form-group"><label className="form-label">Parent Area</label><select className="form-control" value={formData.parent_id} onChange={e => handleChange('parent_id', e.target.value)}><option value="">-- No Parent --</option>{parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'Location' && (
                        <div className="form-grid" style={{height:'600px'}}>
                            <div className="w-1-3">
                                <div className="form-section-title">Address Details</div>
                                <Input label="Street Address" value={formData.street_address} onChange={v => handleChange('street_address', v)} placeholder="123 Main St" />
                                <div className="form-row">
                                    <div className="w-1-2"><Input label="City" value={formData.city} onChange={v => handleChange('city', v)} /></div>
                                    <div className="w-1-2"><Input label="Zip" value={formData.postal_code} onChange={v => handleChange('postal_code', v)} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="w-1-2"><Input label="State" value={formData.state} onChange={v => handleChange('state', v)} /></div>
                                    <div className="w-1-2"><SelectInput label="Country" value={formData.country} onChange={v => handleChange('country', v)} options={COUNTRIES} valueKey="code" labelKey="name" /></div>
                                </div>
                                <div style={{marginTop:8, paddingTop: 10, borderTop: '1px solid #eee'}}>
                                    <div style={{fontSize: 11, fontWeight: 'bold', color: '#555', marginBottom: 8}}>GEO COORDINATES</div>
                                    <Input label="Lat" value={formData.lat} onChange={v => handleChange('lat', v)} />
                                    <Input label="Lng" value={formData.lng} onChange={v => handleChange('lng', v)} />
                                </div>
                            </div>
                            <div className="w-2-3" style={{height:'100%', display: 'flex', flexDirection: 'column', gap: 10}}>
                                {isLoaded && (
                                    <div style={{zIndex: 10, padding: 10}}>
                                        <Autocomplete onLoad={a => autocompleteRef.current = a} onPlaceChanged={onPlaceChanged}>
                                            <input type="text" className="form-control" placeholder="Search map to auto-fill address..." style={{boxShadow:'0 2px 6px rgba(0,0,0,0.1)'}} />
                                        </Autocomplete>
                                    </div>
                                )}
                                <div className="map-container" style={{flex: 1}}>
                                    {isLoaded && (
                                        <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={DEFAULT_CENTER} zoom={13} onLoad={onLoad} onClick={onMapClick}>
                                            {parentOverlay && (
                                                <>
                                                    <Marker key={`marker-${formData.parent_id}`} position={{ lat: parseFloat(parentOverlay.lat), lng: parseFloat(parentOverlay.lng) }} label="P" />
                                                    {parentOverlay.polygon && <Polygon key={`poly-${formData.parent_id}`} paths={parsePolygon(parentOverlay.polygon)} options={{ fillColor: '#FFA500', fillOpacity: 0.1, strokeColor: '#FFA500', clickable: false }} />}
                                                </>
                                            )}
                                            {formData.lat && formData.lng && <Marker position={{ lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) }} draggable={true} onDragEnd={e => { handleChange('lat', e.latLng.lat()); handleChange('lng', e.latLng.lng()); }} />}
                                        </GoogleMap>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'Description' && <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}><div className="form-row"><div style={{ flex: 2, marginRight: 20 }}><label className="form-label">Desc</label><textarea className="form-control" style={{height:200}} value={formData.description} onChange={e=>handleChange('description', e.target.value)}/></div><div style={{ flex: 1 }}><SelectInput label="Category" value={formData.primary_category_id} onChange={v => handleChange('primary_category_id', v)} options={CATEGORIES} valueKey="id" labelKey="name" /><Input label="Other Cat" value={formData.additional_category} onChange={v => handleChange('additional_category', v)} /></div></div></div>}
                    {activeTab === 'Communication' && <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}><div style={{ maxWidth: '600px' }}><div className="form-section-title">Contact</div><div className="form-row"><div className="w-1-2"><Input label="Phone" value={formData.phone_number} onChange={v => handleChange('phone_number', v)} /></div><div className="w-1-2"><Input label="Code" value={formData.phone_country_code} onChange={v => handleChange('phone_country_code', v)} /></div></div><Input label="Email" value={formData.email} onChange={v => handleChange('email', v)} /><Input label="Website" value={formData.website_url} onChange={v => handleChange('website_url', v)} /></div></div>}
                    {activeTab === 'Opening Hours' && <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}><HoursEditor formData={formData} onChange={handleChange} /></div>}
                    {['Parking', 'Planning', 'Accessibility', 'Identifier', 'Amenities', 'Crowd', 'Media', 'Geometrics'].includes(activeTab) && <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}><div className="checkbox-group"><p style={{color:'#666', fontStyle:'italic'}}>Settings for {activeTab} will go here.</p></div></div>}
                </>
             )}

        </form>
      </div>

      <div className="form-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" type="submit" form="locForm">Save</button>
      </div>
    </div>
  );
}

function Input({ label, required, value, onChange, placeholder, type='text' }) {
    return <div className="form-group"><label className="form-label">{label} {required && <span className="required">*</span>}</label><input className="form-control" type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} /></div>
}
function SelectInput({ label, onChange, value, options, valueKey, labelKey }) {
    return <div className="form-group"><label className="form-label">{label}</label><select className="form-control" value={value||''} onChange={e=>onChange(e.target.value)}><option value="">-- Select --</option>{options.map((o,i)=><option key={i} value={o[valueKey]}>{o[labelKey]}</option>)}</select></div>
}