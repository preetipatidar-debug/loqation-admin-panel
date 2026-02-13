import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { useAuth } from "../context/AuthContext";

const MasterLayout = ({ children }) => {
  const [sidebarActive, setSidebarActive] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [imgError, setImgError] = useState(false); // Track if image fails
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const getInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : "U";
  };

  return (
    <section className={mobileMenu ? "overlay active" : "overlay"}>
      {/* ========== SIDEBAR (Your Original Menu) ========== */}
      <aside className={`sidebar ${sidebarActive ? "active" : ""} ${mobileMenu ? "sidebar-open" : ""}`}>
        <button className="sidebar-close-btn" onClick={() => setMobileMenu(false)}>
          <Icon icon="radix-icons:cross-2" />
        </button>

        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <img src="/assets/images/logo.png" className="light-logo" alt="logo" />
            <img src="/assets/images/logo-light.png" className="dark-logo" alt="logo" />
          </Link>
        </div>

        <div className="sidebar-menu-area">
          <ul className="sidebar-menu">
            <li className="sidebar-menu-group-title">Top Locations</li>
            <li><NavLink to="/locations-top"><Icon icon="solar:global-linear" className="menu-icon" /><span>List View</span></NavLink></li>
            <li><NavLink to="/locations-google"><Icon icon="solar:streets-map-point-linear" className="menu-icon" /><span>Google Locations</span></NavLink></li>

            <li className="sidebar-menu-group-title">Main Locations</li>
            <li><NavLink to="/locations-main"><Icon icon="solar:city-outline" className="menu-icon" /><span>List View</span></NavLink></li>

            <li className="sidebar-menu-group-title">Sub Locations</li>
            <li><NavLink to="/locations-sub"><Icon icon="solar:shop-outline" className="menu-icon" /><span>List View</span></NavLink></li>

            <li className="sidebar-menu-group-title">Client Information</li>
            <li><NavLink to="/company"><Icon icon="solar:buildings-2-linear" className="menu-icon" /><span>Company</span></NavLink></li>
            <li><NavLink to="/users"><Icon icon="solar:user-outline" className="menu-icon" /><span>Users</span></NavLink></li>

            <li className="sidebar-menu-group-title">Support</li>
            <li><a href="https://www.google.com" target="_blank" rel="noreferrer"><Icon icon="solar:notes-outline" className="menu-icon" /><span>Ticket System</span></a></li>
          </ul>
        </div>
      </aside>

      {/* ========== MAIN ========== */}
      <main className={`dashboard-main ${sidebarActive ? "active" : ""}`}>
        <div className="navbar-header">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <div className="d-flex align-items-center gap-3">
                <button type="button" className="sidebar-toggle" onClick={() => setSidebarActive(!sidebarActive)}>
                  <Icon icon="heroicons:bars-3-solid" />
                </button>
                
                {sidebarActive && (
                  <Link to="/" className="d-none d-lg-flex align-items-center ms-1">
                    <img src="/assets/images/logo-icon.png" alt="mini logo" style={{ height: '32px' }} />
                  </Link>
                )}
              </div>
            </div>

            <div className="col-auto">
              <div className="d-flex align-items-center gap-3">
                <ThemeToggleButton />
                <div className="dropdown">
                  <button data-bs-toggle="dropdown" className="border-0 bg-transparent p-0">
                    {/* UPDATED LOGIC: If no error and picture exists, show image. Otherwise show Initial Circle. */}
                    {user?.picture && !imgError ? (
                      <img 
                        src={user.picture} 
                        alt="user" 
                        className="w-40-px h-40-px rounded-circle object-fit-cover"
                        onError={() => setImgError(true)} 
                      />
                    ) : (
                      <div className="w-40-px h-40-px rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold text-lg">
                        {getInitial()}
                      </div>
                    )}
                  </button>
                  <div className="dropdown-menu dropdown-menu-end shadow-sm">
                    <div className="px-16 py-8 border-bottom">
                      <h6 className="text-sm mb-0">{user?.name || "User"}</h6>
                    </div>
                    <button className="dropdown-item text-danger d-flex align-items-center gap-2 py-8" onClick={handleLogout}>
                      <Icon icon="lucide:power" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-main-body">
          {children}
        </div>
      </main>
    </section>
  );
};

export default MasterLayout;