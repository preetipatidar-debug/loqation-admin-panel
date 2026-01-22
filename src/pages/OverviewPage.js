import React, { useEffect, useState } from 'react';
import MasterLayout from '../masterLayout/MasterLayout';
import Breadcrumb from '../components/Breadcrumb';
import api from '../services/api';
import { Icon } from "@iconify/react";

const OverviewPage = () => {
    // 1. Keep safe default values (0) so the UI doesn't show NaN or undefined
    const [stats, setStats] = useState({ 
        totalAreas: 0, 
        totalBusinesses: 0, 
        totalUnits: 0 
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // FIXED: Removed the redundant '/api' prefix
                const res = await api.get('/dashboard/stats');
                
                // 2. Safely update state only if data exists
                if (res.data) {
                    setStats({
                        totalAreas: res.data.totalAreas || 0,
                        totalBusinesses: res.data.totalBusinesses || 0,
                        totalUnits: res.data.totalUnits || 0
                    });
                }
            } catch (err) { 
                console.error("Dashboard Stats Fetch Error:", err);
                // On error, stats remain 0 rather than crashing the page
            }
        };
        fetchStats();
    }, []);

    // 3. Define cards dynamically based on current state
    const cards = [
        { title: "Top Areas", count: stats.totalAreas, icon: "solar:map-draw-bold-duotone", color: "primary" },
        { title: "Businesses", count: stats.totalBusinesses, icon: "solar:shop-bold-duotone", color: "success" },
        { title: "Units & ATMs", count: stats.totalUnits, icon: "solar:card-2-bold-duotone", color: "info" },
    ];

    return (
        <MasterLayout>
            <Breadcrumb title="Performance Overview" />
            
            <div className="row g-4">
                {/* 4. Safe Mapping of cards */}
                {cards.map((card, i) => (
                    <div className="col-md-4" key={i}>
                        <div className="card radius-12 border-0 shadow-sm overflow-hidden">
                            {/* Using dynamic background and text colors from the card object */}
                            <div className={`card-body p-24 bg-${card.color}-50`}>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className={`text-${card.color}-600 fw-bold mb-4`}>{card.title}</p>
                                        <h2 className="mb-0 fw-bold">{card.count}</h2>
                                    </div>
                                    <Icon 
                                        icon={card.icon} 
                                        className={`text-${card.color}-600`} 
                                        style={{fontSize: '48px'}} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Call to Action Section */}
            <div className="mt-32 p-40 text-center radius-16 bg-white border border-dashed">
                <Icon icon="solar:routing-bold-duotone" className="text-neutral-200 mb-16" style={{fontSize: '64px'}} />
                <h5 className="text-secondary">Ready to manage your network?</h5>
                <p className="text-secondary-light">Select a category from the sidebar to begin drawing areas or syncing business profiles.</p>
            </div>
        </MasterLayout>
    );
};

export default OverviewPage;