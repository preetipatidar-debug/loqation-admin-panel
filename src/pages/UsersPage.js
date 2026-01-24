import React, { useState, useEffect } from 'react';
import MasterLayout from '../masterLayout/MasterLayout';
import api from '../services/api'; 
import { toast } from 'react-toastify';
import { Icon } from "@iconify/react";

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'editor' });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            // SAFETY: Handle different API response structures
            const data = Array.isArray(res.data) ? res.data : (res.data.users || []);
            setUsers(data);
        } catch (err) { 
            console.error("Fetch users error:", err);
            toast.error("Error loading users"); 
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', newUser);
            toast.success("User authorized!");
            setShowModal(false);
            setNewUser({ name: '', email: '', role: 'editor' });
            fetchUsers();
        } catch (err) { toast.error(err.response?.data?.message || "Failed to authorize"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Revoke access?")) return;
        try {
            await api.delete(`/users/${id}`);
            toast.info("Access revoked");
            fetchUsers();
        } catch (err) { toast.error("Action failed"); }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-24 px-10">
                <h5 className="mb-0 fw-bold">Authorized Users</h5>
                <div className="d-flex gap-3">
                    <input type="text" className="form-control radius-8" placeholder="Search email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <button onClick={() => setShowModal(true)} className="btn btn-primary-600 radius-12 px-24">Authorize Email</button>
                </div>
            </div>

            <div className="card radius-12 border-0 shadow-sm overflow-hidden">
                <table className="table mb-0 align-middle">
                    <thead className="bg-light border-bottom">
                        <tr>
                            <th className="ps-24">User</th><th>Email</th><th>Role</th><th>Last Login</th><th className="text-end pe-24">Opts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                                <tr key={u.id} className="border-bottom">
                                    <td className="ps-24 fw-bold">{u.name}</td>
                                    <td className="text-secondary">{u.email}</td>
                                    <td><span className="badge bg-primary-100 text-primary-600 px-12">{u.role}</span></td>
                                    <td className="text-sm">{u.last_login ? new Date(u.last_login).toLocaleString('en-GB') : 'Never Logged In'}</td>
                                    <td className="text-end pe-24">
                                        <Icon icon="lucide:trash-2" className="text-danger pointer" onClick={() => handleDelete(u.id)} />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="text-center py-40 text-secondary">No authorized users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal code remains the same as previous response */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content radius-16 border-0">
                            <form onSubmit={handleAddUser}>
                                <div className="modal-header border-bottom p-20">
                                    <h6 className="mb-0 fw-bold">Authorize New User</h6>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-close shadow-none"></button>
                                </div>
                                <div className="modal-body p-24">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Full Name</label>
                                        <input type="text" className="form-control" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Google Email</label>
                                        <input type="email" className="form-control" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Role</label>
                                        <select className="form-select" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                            <option value="admin">Admin</option>
                                            <option value="editor">Editor</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer p-20 border-top">
                                    <button type="submit" className="btn btn-primary-600 w-100 radius-8">Authorize & Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UsersPage;