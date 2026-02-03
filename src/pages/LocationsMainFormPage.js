import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { useGoogleMaps } from "../hook/useGoogleMaps";

const MAP_CONTAINER_STYLE = { width: "100%", height: "400px" };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const TABS = [
  "Basic Info",
  "Location",
  "Description",
  "Communication",
  "Opening Hours",
  "Amenities",
  "Media",
  "Google Sync",
  "Attributes",
  "Accessibility",
  "Services",
  "Health & Safety",
  "Payments",
];

const emptyHours = {
  monday: "",
  tuesday: "",
  wednesday: "",
  thursday: "",
  friday: "",
  saturday: "",
  sunday: "",
};

const LocationsMainFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps();

  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [parentAreas, setParentAreas] = useState([]);
  const [activeTab, setActiveTab] = useState("Basic Info");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    location_name: "",
    top_location_id: "",
    city: "",
    street_address: "",
    state: "",
    postal_code: "",
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng,
    phone_number: "",
    email: "",
    website_url: "",
    description: "",
    sync_status: "PENDING",
    opening_hours: emptyHours,
  });

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadOptions();
    if (id) loadLocation();
    else setLoading(false);
  }, [id]);

  const loadOptions = async () => {
    try {
      const res = await api.get("/options/top-locations");
      setParentAreas(res.data || []);
    } catch {
      toast.error("Failed to load parent locations");
    }
  };

  const loadLocation = async () => {
    try {
      const res = await api.get(`/main-locations/${id}`);
      setFormData({
        ...res.data,
        opening_hours: res.data.opening_hours || emptyHours,
      });
    } catch {
      toast.error("Failed to load location");
    } finally {
      setLoading(false);
    }
  };

  /* ================= MAP ================= */
  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry) return;

    const newPos = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    setFormData((p) => ({
      ...p,
      lat: newPos.lat,
      lng: newPos.lng,
      street_address: place.formatted_address || p.street_address,
      city:
        place.address_components?.find((c) =>
          c.types.includes("locality")
        )?.long_name || p.city,
    }));

    mapRef.current?.panTo(newPos);
  };

  /* ================= SAVE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await api.put(`/main-locations/${id}`, formData);
        toast.success("Business profile updated");
      } else {
        await api.post("/main-locations", formData);
        toast.success("Business profile created");
      }
      navigate("/locations-main");
    } catch {
      toast.error("Save failed");
    }
  };

  if (loading) {
    return <div className="text-center py-60">Loading...</div>;
  }

  return (
    <>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-24">
        <h5 className="fw-bold mb-0">
          {id ? "Edit Business Profile" : "New Business Profile"}
        </h5>

        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/locations-main")}
        >
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card radius-16 border-0 shadow-sm">
        <div className="d-flex" style={{ minHeight: "80vh" }}>
          {/* LEFT TABS */}
          <div
            className="border-end bg-neutral-50"
            style={{ width: 220, overflowY: "auto" }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`w-100 text-start py-16 px-24 border-bottom fw-bold ${
                  activeTab === tab
                    ? "bg-white text-primary-600 border-start border-start-4 border-primary-600"
                    : "text-secondary"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* CONTENT */}
          <div className="flex-grow-1 p-32 overflow-auto bg-white">
            <h5 className="fw-bold border-bottom pb-12 mb-24">{activeTab}</h5>

            {/* BASIC INFO */}
            {activeTab === "Basic Info" && (
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Business Name
                  </label>
                  <input
                    className="form-control"
                    value={formData.location_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Parent Area
                  </label>
                  <select
                    className="form-select"
                    value={formData.top_location_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        top_location_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Area</option>
                    {parentAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* LOCATION */}
            {activeTab === "Location" && (
              <div className="row g-4">
                <div className="col-lg-5">
                  {isLoaded && (
                    <Autocomplete
                      onLoad={(a) => (autocompleteRef.current = a)}
                      onPlaceChanged={onPlaceChanged}
                    >
                      <input
                        className="form-control mb-3"
                        placeholder="Search address..."
                      />
                    </Autocomplete>
                  )}

                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.street_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        street_address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="col-lg-7 border radius-12 p-0 overflow-hidden">
                  {isLoaded && (
                    <GoogleMap
                      mapContainerStyle={MAP_CONTAINER_STYLE}
                      center={{
                        lat: Number(formData.lat),
                        lng: Number(formData.lng),
                      }}
                      zoom={15}
                      onLoad={(m) => (mapRef.current = m)}
                    >
                      <Marker
                        position={{
                          lat: Number(formData.lat),
                          lng: Number(formData.lng),
                        }}
                        draggable
                        onDragEnd={(e) =>
                          setFormData({
                            ...formData,
                            lat: e.latLng.lat(),
                            lng: e.latLng.lng(),
                          })
                        }
                      />
                    </GoogleMap>
                  )}
                </div>
              </div>
            )}

            {/* OPENING HOURS */}
            {activeTab === "Opening Hours" && (
              <div className="row g-3">
                {Object.keys(formData.opening_hours).map((day) => (
                  <div
                    key={day}
                    className="col-md-6 d-flex align-items-center gap-3"
                  >
                    <span
                      className="fw-bold text-capitalize"
                      style={{ width: 100 }}
                    >
                      {day}
                    </span>
                    <input
                      className="form-control"
                      placeholder="09:00 - 18:00"
                      value={formData.opening_hours[day]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          opening_hours: {
                            ...formData.opening_hours,
                            [day]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* COMMUNICATION */}
            {activeTab === "Communication" && (
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Phone</label>
                  <input
                    className="form-control"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone_number: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* PLACEHOLDER TABS */}
            {[
              "Amenities",
              "Accessibility",
              "Health & Safety",
              "Payments",
              "Attributes",
              "Services",
              "Media",
              "Google Sync",
              "Description",
            ].includes(activeTab) && (
              <div className="p-40 text-secondary-light">
                UI retained for future implementation.
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-20 border-top d-flex justify-content-end gap-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/locations-main")}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary-600">
            Save
          </button>
        </div>
      </form>
    </>
  );
};

export default LocationsMainFormPage;
