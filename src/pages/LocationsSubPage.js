import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import api from '../services/api'; 
import { toast } from 'react-toastify';
import { Icon } from "@iconify/react";

const LocationsSubPage = () => {
    const { state } = useLocation();
    const [subLocations, setSubLocations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [activeFilter, setActiveFilter] = useState(state?.filterBusinessId || null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 25;

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/sub-locations');
            setSubLocations(Array.isArray(res.data) ? res.data : []);
        } catch (err) { toast.error("Error loading data"); }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const filteredData = subLocations.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBusiness = activeFilter ? String(item.parent_id) === String(activeFilter) : true;
        return matchesSearch && matchesBusiness;
    }).sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const currentItems = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-24 px-10">
                <div className="d-flex align-items-center gap-3">
                    <h5 className="mb-0 fw-bold">Sub Locations (Units)</h5>
                    {activeFilter && <span className="badge bg-primary-100 text-primary-600 px-12 py-8 radius-8 pointer" onClick={() => setActiveFilter(null)}>Filtered by Business <Icon icon="lucide:x" /></span>}
                </div>
                <div className="position-relative w-25">
                    <Icon icon="lucide:search" className="position-absolute top-50 start-0 translate-middle-y ms-12 text-secondary-light" />
                    <input type="text" className="form-control ps-40 radius-8" placeholder="Search units..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                </div>
            </div>

            <div className="card radius-12 border-0 shadow-sm overflow-hidden">
                <table className="table mb-0 align-middle text-nowrap">
                    <thead className="text-secondary-light border-bottom bg-white" style={{ fontSize: '13px', cursor: 'pointer' }}>
                        <tr>
                            <th className="ps-24" style={{ width: '40px' }}><input type="checkbox" className="form-check-input" /></th>
                            <th onClick={() => handleSort('name')}>Unit Name <Icon icon="lucide:arrow-up-down" width="12" /></th>
                            <th onClick={() => handleSort('type')}>Type <Icon icon="lucide:arrow-up-down" width="12" /></th>
                            <th>Parent Business</th>
                            <th className="text-end pe-24">Opts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map(sub => (
                            <tr key={sub.id} className="border-bottom">
                                <td className="ps-24"><input type="checkbox" className="form-check-input" /></td>
                                <td className="fw-bold">{sub.name}</td>
                                <td className="text-secondary text-sm">{sub.type}</td>
                                <td>{sub.parent_main_name}</td>
                                <td className="text-end pe-24 text-secondary">
                                    <Icon icon="lucide:edit-3" width="18" className="pointer me-3" />
                                    <Icon icon="lucide:trash-2" width="18" className="pointer text-danger" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="d-flex justify-content-between align-items-center p-20 border-top bg-white">
                    <span className="text-sm">Showing {filteredData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}</span>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
                        <button className="btn btn-sm btn-primary-600">{currentPage}</button>
                        <button className="btn btn-sm btn-outline-secondary" disabled={currentPage >= Math.ceil(filteredData.length / rowsPerPage)} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LocationsSubPage;