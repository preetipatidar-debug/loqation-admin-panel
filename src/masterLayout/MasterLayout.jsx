import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const MasterLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarActive, setSidebarActive] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // --- Search Logic ---
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 2) {
      try {
        const res = await api.get(`/api/search/global?q=${value}`);
        setSearchResults(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchResultClick = (result) => {
    setSearchResults([]);
    setSearchTerm("");
    const type = result.type.toLowerCase();
    if (type === 'area') navigate('/locations-top');
    else if (type === 'unit') navigate('/locations-sub');
    else navigate('/locations-main');
  };

  return (
    <section className={mobileMenu ? "overlay active" : "overlay"}>
      {/* Sidebar Section */}
      <aside className={`sidebar ${sidebarActive ? "active" : ""} ${mobileMenu ? "sidebar-open" : ""}`}>
        <button onClick={() => setMobileMenu(false)} className="sidebar-close-btn">
          <Icon icon="radix-icons:cross-2" />
        </button>

        <div className="sidebar-header p-24">
          <Link to="/" className="sidebar-logo d-flex align-items-center gap-2">
            <Icon icon="solar:map-point-bold-duotone" className="text-primary-600" style={{ fontSize: '32px' }} />
            <h4 className="mb-0 fw-bold" style={{ color: 'var(--neutral-700)' }}>LoQation</h4>
          </Link>
        </div>

        <div className="sidebar-menu-area">
          <ul className="sidebar-menu">
            <li className="sidebar-menu-group-title">DASHBOARD</li>
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? "active-page" : ""}>
                <Icon icon="solar:widget-add-line-duotone" className="menu-icon" />
                <span>Overview</span>
              </NavLink>
            </li>

            <li className="sidebar-menu-group-title">LOCATION MANAGEMENT</li>
            {/* Top Locations - Fixed Icon */}
            <li>
              <NavLink to="/locations-top" className={({ isActive }) => isActive ? "active-page" : ""}>
                <Icon icon="solar:map-bold-duotone" className="menu-icon" />
                <span>Top Locations</span>
              </NavLink>
            </li>
            {/* Main Locations */}
            <li>
              <NavLink to="/locations-main" className={({ isActive }) => isActive ? "active-page" : ""}>
                <Icon icon="solar:city-bold-duotone" className="menu-icon" />
                <span>Main Locations</span>
              </NavLink>
            </li>
            {/* Sub Locations */}
            <li>
              <NavLink to="/locations-sub" className={({ isActive }) => isActive ? "active-page" : ""}>
                <Icon icon="solar:map-point-bold-duotone" className="menu-icon" />
                <span>Sub Locations</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>

      <main className={`dashboard-main ${sidebarActive ? "active" : ""}`}>
        <div className="navbar-header p-16 bg-base border-bottom">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto d-flex align-items-center gap-4">
              <button onClick={() => setSidebarActive(!sidebarActive)} className="sidebar-toggle">
                <Icon icon={sidebarActive ? 'iconoir:arrow-right' : 'heroicons:bars-3-solid'} className="icon text-2xl" />
              </button>
              
              <div className="position-relative d-none d-lg-block">
                <form className="navbar-search" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="form-control radius-8 ps-40"
                    style={{ width: '300px' }}
                  />
                  <Icon icon="ion:search-outline" className="position-absolute start-0 top-50 translate-middle-y ms-12 text-secondary" />
                </form>

                {Array.isArray(searchResults) && searchResults.length > 0 && (
                  <div className="dropdown-menu show position-absolute w-100 shadow-lg mt-2 radius-8 border-0 p-8" style={{ zIndex: 1000 }}>
                    {searchResults.map((result, i) => (
                      <button
                        key={i}
                        className="dropdown-item radius-4 p-8 d-flex justify-content-between align-items-center"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <span className="fw-medium text-sm">{result.title}</span>
                        <span className="badge bg-primary-50 text-primary-600 text-xs">{result.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="col-auto d-flex align-items-center gap-3">
              <ThemeToggleButton />
              
              <div className="dropdown">
                <button className="d-flex align-items-center gap-2 border-0 bg-transparent" type="button" data-bs-toggle="dropdown">
                  <img src={user?.picture || 'assets/images/user.png'} alt="user" className="w-40-px h-40-px rounded-circle border" />
                  <div className="text-start d-none d-sm-block">
                    <p className="mb-0 text-sm fw-bold line-height-1">{user?.name || 'Admin'}</p>
                    <p className="mb-0 text-xs text-secondary-light">{user?.email}</p>
                  </div>
                </button>
                <div className="dropdown-menu dropdown-menu-end shadow-sm border-0 radius-8">
                  <Link className="dropdown-item px-16 py-8 text-sm d-flex align-items-center gap-2" to="/profile">
                    <Icon icon="solar:user-linear" /> My Profile
                  </Link>
                  <hr className="dropdown-divider" />
                  <button onClick={logout} className="dropdown-item px-16 py-8 text-sm text-danger d-flex align-items-center gap-2">
                    <Icon icon="lucide:power" /> Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-main-body p-24">
          {children}
        </div>
      </main>
    </section>
  );
};

export default MasterLayout;