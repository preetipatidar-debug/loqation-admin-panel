import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react";
import {
  GoogleMap,
  Autocomplete
} from "@react-google-maps/api";
import { useGoogleMaps } from "../hook/useGoogleMaps";
import DrawTools from "../components/DrawTools";

/* ================= CONSTANTS ================= */
const MAP_CONTAINER_STYLE = { width: "100%", height: "520px" };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const LocationsTopPage = () => {
  const navigate = useNavigate();

  /* ================= LIST ================= */
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  /* ================= MODAL / FORM ================= */
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [drawVersion, setDrawVersion] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    geometrics_outline: ""
  });

  /* ================= MAP ================= */
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const { isLoaded } = useGoogleMaps();

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const res = await api.get("/top-locations");
      setAreas(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load top locations");
    } finally {
      setLoading(false);
    }
  };

  /* ================= MAP LOAD ================= */
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry && mapRef.current) {
      mapRef.current.panTo(place.geometry.location);
      mapRef.current.setZoom(15);
    }
  };

  /* ================= SAVE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/top-locations/${editId}`, formData);
        toast.success("Location updated");
      } else {
        await api.post("/top-locations", formData);
        toast.success("Location created");
      }
      setShowModal(false);
      fetchAreas();
    } catch {
      toast.error("Save failed");
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this top location?")) return;
    try {
      await api.delete(`/top-locations/${id}`);
      toast.success("Location deleted");
      fetchAreas();
    } catch {
      toast.error("Delete failed");
    }
  };

  const filteredAreas = areas.filter((a) =>
    a.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="d-flex justify-content-between align-items-center mb-24">
        <div>
          <h5 className="fw-bold mb-4">Top Locations - List View</h5>
        </div>

        <button
          className="btn btn-primary-600 d-flex align-items-center gap-2"
          onClick={() => {
            setEditId(null);
            setFormData({ name: "", description: "", geometrics_outline: "" });
            setDrawVersion(v => v + 1);
            setShowModal(true);
          }}
        >
          <Icon icon="lucide:plus" />
          Add Top Location
        </button>
      </div>
               
      {/* ================= SEARCH ================= */}
              <div className="position-relative w-25">
        <div className="card-body py-12">
          <input
            className="form-control"
            placeholder="Search Top Locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="card radius-12 border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light border-bottom">
              <tr>
                <th className="ps-24">Name</th>
                <th>Description</th>
                <th className="text-end pe-24">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5" className="text-center py-24">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && filteredAreas.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-24">
                    No locations found
                  </td>
                </tr>
              )}

              {!loading &&
                filteredAreas.map((area) => (
                  <tr key={area.id}>
                    <td className="ps-24 fw-semibold">{area.name}</td>
                    <td>{area.description || "-"}</td>
                    <td className="text-end pe-24">
                      <div className="d-inline-flex gap-3">
                        <Icon
                          icon="lucide:eye"
                          className="text-primary pointer"
                          onClick={() =>
                            navigate("/locations-main", {
                              state: {
                                filterAreaId: area.id,
                                filterAreaName: area.name
                              }
                            })
                          }
                        />
                        <Icon
                          icon="lucide:edit-3"
                          className="text-warning pointer"
                          onClick={() => {
                            setEditId(area.id);
                            setFormData({
                              name: area.name,
                              description: area.description,
                              geometrics_outline: area.geometrics_outline || ""
                            });
                            setDrawVersion(v => v + 1);
                            setShowModal(true);
                          }}
                        />
                        <Icon
                          icon="lucide:trash-2"
                          className="text-danger pointer"
                          onClick={() => handleDelete(area.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {showModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: "95%" }}>
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h6>{editId ? "Edit Top Location" : "Add Top Location"}</h6>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>

              <div className="modal-body row g-4">
                {/* LEFT FORM */}
                <div className="col-lg-4">
                  <input
                    className="form-control mb-3"
                    placeholder="Location Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />

                  <textarea
                    className="form-control mb-3"
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />

                  <textarea
                    className="form-control"
                    style={{ height: 220, fontFamily: "monospace", fontSize: 12 }}
                    readOnly
                    value={formData.geometrics_outline}
                    placeholder="Draw boundary on map..."
                  />
                </div>

                {/* MAP */}
                <div className="col-lg-8">
                  {isLoaded && (
                    <>
                      <Autocomplete
                        onLoad={(a) => (autocompleteRef.current = a)}
                        onPlaceChanged={onPlaceChanged}
                      >
                        <input
                          className="form-control mb-2"
                          placeholder="Search place..."
                        />
                      </Autocomplete>

                      <GoogleMap
                        mapContainerStyle={MAP_CONTAINER_STYLE}
                        center={DEFAULT_CENTER}
                        zoom={11}
                        onLoad={onMapLoad}
                      >
                        <DrawTools
                          key={drawVersion}
                          data={formData.geometrics_outline}
                          onChange={(json) =>
                            setFormData((prev) => ({
                              ...prev,
                              geometrics_outline: json
                            }))
                          }
                        />
                      </GoogleMap>
                    </>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary-600">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LocationsTopPage;
