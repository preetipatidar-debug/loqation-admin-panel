import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import {
  GoogleMap,
  Autocomplete
} from "@react-google-maps/api";
import { useGoogleMaps } from "../hook/useGoogleMaps";
import DrawTools from "../components/DrawTools";

const MAP_CONTAINER_STYLE = { width: "100%", height: "520px" };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const LocationsTopFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps();

  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [drawVersion, setDrawVersion] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    geometrics_outline: ""
  });

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/top-locations/${id}`);
      setFormData({
        name: res.data.name,
        description: res.data.description,
        geometrics_outline: res.data.geometrics_outline || ""
      });
      setDrawVersion(v => v + 1);
    } catch {
      toast.error("Failed to load location");
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await api.put(`/top-locations/${id}`, formData);
        toast.success("Updated");
      } else {
        await api.post("/top-locations", formData);
        toast.success("Created");
      }
      navigate("/locations-top");
    } catch {
      toast.error("Save failed");
    }
  };

  return (
    <>
      <h5 className="fw-bold mb-24">
        {id ? "Edit Top Location" : "Add Top Location"}
      </h5>

      <form onSubmit={handleSubmit} className="row g-4">
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
            readOnly
            style={{ height: 220, fontFamily: "monospace", fontSize: 12 }}
            value={formData.geometrics_outline}
          />
        </div>

        <div className="col-lg-8">
          {isLoaded && (
            <>
              <Autocomplete
                onLoad={(a) => (autocompleteRef.current = a)}
                onPlaceChanged={onPlaceChanged}
              >
                <input className="form-control mb-2" placeholder="Search..." />
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
                    setFormData((p) => ({
                      ...p,
                      geometrics_outline: json
                    }))
                  }
                />
              </GoogleMap>
            </>
          )}
        </div>

        <div className="col-12 d-flex gap-3">
          <button type="submit" className="btn btn-primary-600">
            Save
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/locations-top")}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};

export default LocationsTopFormPage;
