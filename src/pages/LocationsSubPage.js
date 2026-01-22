import React, { useState, useEffect } from 'react';
import MasterLayout from '../masterLayout/MasterLayout';
import api from '../services/api'; 
import { toast } from 'react-toastify';
import { Icon } from "@iconify/react";

const LocationsSubPage = () => {
    const [subLocations, setSubLocations] = useState([]);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/sub-locations');
            setSubLocations(Array.isArray(res.data) ? res.data : []);
        } catch (err) { toast.error("Error loading sub-locations"); }
    };

    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = subLocations.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(subLocations.length / rowsPerPage);

    return (
        <MasterLayout>
            <div className="d-flex justify-content-between align-items-center mb-24 px-10">
                <h5 className="mb-0 fw-bold">Sub Locations (Units)</h5>
                <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2 text-secondary-light">
                        <span className="text-sm">Rows:</span>
                        <select className="form-select form-select-sm border-0 bg-transparent fw-bold" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                            <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                        </select>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary-600 radius-12 px-24"><Icon icon="lucide:plus" className="me-2" /> Add Unit</button>
                </div>
            </div>

            <div className="card radius-12 border-0 shadow-sm overflow-hidden">
                <div className="table-responsive">
                    <table className="table mb-0 align-middle">
                        <thead className="text-secondary-light border-bottom" style={{ fontSize: '13px' }}>
                            <tr>
                                <th className="ps-24 py-16" style={{ width: '40px' }}><input type="checkbox" className="form-check-input" /></th>
                                <th>Name</th><th>Type</th><th>Parent Business</th><th className="text-end pe-24">Opts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(sub => (
                                <tr key={sub.id} className="border-bottom">
                                    <td className="ps-24"><input type="checkbox" className="form-check-input" /></td>
                                    <td className="fw-bold">{sub.name}</td>
                                    <td className="text-secondary text-sm">{sub.type}</td>
                                    <td><div className="d-flex align-items-center gap-2">{sub.parent_main_name}<Icon icon="lucide:chevron-down" width="14" /></div></td>
                                    <td className="text-end pe-24">
                                        <div className="d-flex justify-content-end gap-3 align-items-center">
                                            <Icon icon="lucide:edit-3" width="18" /><Icon icon="lucide:trash-2" width="18" className="text-danger" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="d-flex justify-content-between align-items-center p-20 border-top">
                    <span className="text-sm">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, subLocations.length)} of {subLocations.length} items</span>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
                        <button className="btn btn-sm btn-primary-600 px-15">{currentPage}</button>
                        <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
};

export default LocationsSubPage;