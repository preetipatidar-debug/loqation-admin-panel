import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Icon } from '@iconify/react';
import Breadcrumb from '../components/Breadcrumb';

const OverviewPage = () => {
  const [stats, setStats] = useState({
    totalTopLocations: 0,
    totalMainLocations: 0,
    totalSubLocations: 0,
    totalGooglePlaces: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data) {
          // Since keys match exactly, we can just spread res.data
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    };
    fetchStats();
  }, []);

  const cardData = [
    {
      title: 'Top Locations',
      value: stats.totalTopLocations,
      icon: 'solar:map-point-bold-duotone',
      color: 'primary',
    },
    {
      title: 'Main Locations',
      value: stats.totalMainLocations,
      icon: 'solar:buildings-bold-duotone',
      color: 'info',
    },
    {
      title: 'Sub Locations',
      value: stats.totalSubLocations,
      icon: 'solar:building-bold-duotone',
      color: 'success',
    },
    {
      title: 'Google Places',
      value: stats.totalGooglePlaces,
      icon: 'solar:google-play-bold-duotone',
      color: 'warning',
    },
    {
      title: 'Users',
      value: stats.totalUsers,
      icon: 'solar:user-bold-duotone',
      color: 'danger',
    },
  ];

  return (
    <>
      <Breadcrumb title="Dashboard" subtitle="Overview" />

      <div className="row g-4">
        {cardData.map((card, i) => (
          <div className="col-md-6 col-xl-4" key={i}>
            <div className={`card radius-12 border-0 shadow-sm bg-${card.color}-50`}>
              <div className="card-body p-24">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className={`text-${card.color}-600 fw-bold mb-4`}>{card.title}</p>
                    <h2 className="mb-0 fw-bold">{card.value}</h2>
                  </div>
                  <Icon icon={card.icon} className={`text-${card.color}-600`} style={{ fontSize: '48px' }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default OverviewPage;
