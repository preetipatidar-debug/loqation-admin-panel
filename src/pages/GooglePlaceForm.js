import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

const GooglePlaceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    display_name_text: '',
    formatted_address: '',
    rating: '',
    user_ratings_total: '',
    business_status: '',
    lat: '',
    lng: '',
  });

  useEffect(() => {
    if (id) {
      api.get('/google-places', { params: { id } })
        .then(res => {
          if (res.data.data?.length) {
            setForm(res.data.data[0]);
          }
        });
    }
  }, [id]);

  const submit = async () => {
    try {
      if (id) {
        await api.put(`/google-locations/${id}`, form);
        toast.success("Updated successfully");
      } else {
        await api.post('/google-locations', form);
        toast.success("Added successfully");
      }
      navigate('/google-places');
    } catch {
      toast.error("Save failed");
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5>{id ? 'Edit' : 'Add'} Google Place</h5>
      </div>

      <div className="card-body">
        {Object.keys(form).map(key => (
          <input
            key={key}
            className="form-control mb-2"
            placeholder={key.replaceAll('_', ' ')}
            value={form[key] ?? ''}
            onChange={e => setForm({ ...form, [key]: e.target.value })}
          />
        ))}

        <button className="btn btn-primary" onClick={submit}>
          Save
        </button>
      </div>
    </div>
  );
};

export default GooglePlaceForm;
