import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

const LocationsSubFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    parent_id: "",
  });

  const [parentBusinesses, setParentBusinesses] = useState([]);

  useEffect(() => {
    loadOptions();
    if (id) loadSubLocation();
  }, [id]);

  const loadOptions = async () => {
    const res = await api.get("/options/main-locations");
    setParentBusinesses(res.data || []);
  };

  const loadSubLocation = async () => {
    try {
      const res = await api.get(`/sub-locations/${id}`);
      setFormData(res.data);
    } catch {
      toast.error("Failed to load unit");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await api.put(`/sub-locations/${id}`, formData);
        toast.success("Updated");
      } else {
        await api.post("/sub-locations", formData);
        toast.success("Created");
      }
      navigate("/locations-sub");
    } catch {
      toast.error("Save failed");
    }
  };

  return (
    <>
      <h5 className="fw-bold mb-24">
        {id ? "Edit Sub Location" : "Add Sub Location"}
      </h5>

      <form onSubmit={handleSubmit} className="card p-24 radius-12">
        <div className="mb-3">
          <label className="form-label fw-bold">Unit Name</label>
          <input
            className="form-control"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Type</label>
          <input
            className="form-control"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value })
            }
          />
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold">Parent Business</label>
          <select
            className="form-select"
            value={formData.parent_id}
            onChange={(e) =>
              setFormData({ ...formData, parent_id: e.target.value })
            }
            required
          >
            <option value="">Select Business</option>
            {parentBusinesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.location_name}
              </option>
            ))}
          </select>
        </div>

        <div className="d-flex gap-3">
          <button type="submit" className="btn btn-primary-600">
            Save
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/locations-sub")}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};

export default LocationsSubFormPage;
