import React, { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/common/PageHeader";
import { Icon } from '@iconify/react';

const OverviewPage = () => {
  const [stats, setStats] = useState({
    totalTopLocations: 0,
    totalMainLocations: 0,
    totalSubLocations: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      }
    };
    fetchStats();
  }, []);

  const cardData = [
    { title: 'Total Top Locations', value: stats.totalTopLocations, icon: 'solar:map-point-bold', color: 'primary', trend: '+2' },
    { title: 'Total Main Locations', value: stats.totalMainLocations, icon: 'solar:buildings-bold', color: 'success', trend: '+15' },
    { title: 'Total Sub Locations', value: stats.totalSubLocations, icon: 'solar:shop-bold', color: 'info', trend: '+1' },
    { title: 'Total Users', value: stats.totalUsers, icon: 'solar:user-bold', color: 'warning', trend: '+0' },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="AI" />

      <div className="row gy-4">
        {cardData.map((card, i) => (
          <div className="col-xxl-3 col-sm-6" key={i}>
            <div className="card radius-12 border-0 shadow-none bg-base h-100">
              <div className="card-body p-24">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-secondary-light fw-medium mb-12 d-block">{card.title}</span>
                    <h4 className="mb-4 fw-bold">{card.value}</h4>
                    <p className="mb-0 text-sm">
                      <span className="text-success-main fw-semibold">{card.trend}</span>
                      <span className="text-secondary-light ms-1">Last 30 days</span>
                    </p>
                  </div>
                  <div className={`w-56-px h-56-px bg-${card.color}-100 text-${card.color}-600 rounded-circle d-flex align-items-center justify-content-center`}>
                    <Icon icon={card.icon} width="32" />
                  </div>
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