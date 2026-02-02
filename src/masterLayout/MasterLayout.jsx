import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { useAuth } from "../context/AuthContext"; // Use your Auth context

const MasterLayout = ({ children }) => {
  let [sidebarActive, seSidebarActive] = useState(false);
  let [mobileMenu, setMobileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Get user and logout function

  // Sidebar Dropdown Logic (Original Theme Logic)
  useEffect(() => {
    const handleDropdownClick = (event) => {
      event.preventDefault();
      const clickedLink = event.currentTarget;
      const clickedDropdown = clickedLink.closest(".dropdown");
      if (!clickedDropdown) return;
      const isActive = clickedDropdown.classList.contains("open");

      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
        const submenu = dropdown.querySelector(".sidebar-submenu");
        if (submenu) submenu.style.maxHeight = "0px";
      });

      if (!isActive) {
        clickedDropdown.classList.add("open");
        const submenu = clickedDropdown.querySelector(".sidebar-submenu");
        if (submenu) submenu.style.maxHeight = `${submenu.scrollHeight}px`;
      }
    };

    const dropdownTriggers = document.querySelectorAll(".sidebar-menu .dropdown > a");
    dropdownTriggers.forEach((trigger) => trigger.addEventListener("click", handleDropdownClick));

    return () => {
      dropdownTriggers.forEach((trigger) => trigger.removeEventListener("click", handleDropdownClick));
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  let sidebarControl = () => seSidebarActive(!sidebarActive);
  let mobileMenuControl = () => setMobileMenu(!mobileMenu);

  return (
    <section className={mobileMenu ? "overlay active" : "overlay "}>
      {/* sidebar */}
      <aside className={sidebarActive ? "sidebar active " : mobileMenu ? "sidebar sidebar-open" : "sidebar"}>
        <button onClick={mobileMenuControl} type='button' className='sidebar-close-btn'>
          <Icon icon='radix-icons:cross-2' />
        </button>
        <div>
          <Link to='/' className='sidebar-logo'>
            <img src='assets/images/logo.png' alt='site logo' className='light-logo' />
            <img src='assets/images/logo-light.png' alt='site logo' className='dark-logo' />
            <img src='assets/images/logo-icon.png' alt='site logo' className='logo-icon' />
          </Link>
        </div>
        
        <div className='sidebar-menu-area'>
  <ul className='sidebar-menu' id='sidebar-menu'>

    {/* LOCATION MANAGEMENT GROUP */}
    <li className='sidebar-menu-group-title'>Top Locations</li>
    <li>
      <NavLink 
        to='/locations-top' 
        className={(navData) => navData.isActive ? "active-page" : ""}
      >
        <Icon icon='solar:global-linear' className='menu-icon' />
        <span>List View</span>
      </NavLink>
    </li>
        <li>
      <NavLink 
        to='/locations-google' 
        className={(navData) => navData.isActive ? "active-page" : ""}
      >
        <Icon icon='solar:streets-map-point-linear' className='menu-icon' />
        <span>Google Locations</span>
      </NavLink>
    </li>

    <li className='sidebar-menu-group-title'>Main Locations</li>
    <li>
      <NavLink 
        to='/locations-main' 
        className={(navData) => navData.isActive ? "active-page" : ""}
      >
        <Icon icon='solar:city-outline' className='menu-icon' />
        <span>List View</span>
      </NavLink>
    </li>

    <li className='sidebar-menu-group-title'>Sub Locations</li>
    <li>
      <NavLink 
        to='/locations-sub' 
        className={(navData) => navData.isActive ? "active-page" : ""}
      >
        <Icon icon='solar:shop-outline' className='menu-icon' />
        <span>List View</span>
      </NavLink>
    </li>
    <li>
      <NavLink 
        to='/locations-sub' 
        className={(navData) => navData.isActive ? "active-page" : ""}
      >
        <Icon icon='solar:panorama-outline' className='menu-icon' />
        <span>Permanent Layout</span>
      </NavLink>
    </li>
      <li>
      <NavLink 
        to='/locations-sub' 
        className={(navData) => navData.isActive ? "active-page" : ""}
      >
        <Icon icon='solar:clock-circle-outline' className='menu-icon' />
        <span>Events</span>
      </NavLink>
    </li>

    {/* ADMIN GROUP */}
    <li className='sidebar-menu-group-title'>Client Information</li>
    <li>
      <NavLink 
        to='/users' 
        className={(navData) => navData.isActive ? "active-page" : ""}
      >
        <Icon icon='solar:buildings-2-linear' className='menu-icon' />
        <span>Company</span>
      </NavLink>
    </li>

        <li>
      <NavLink 
        to='/users' 
        className={(navData) => navData.isActive ? "active-page" : ""}
      >
        <Icon icon='solar:user-outline' className='menu-icon' />
        <span>Users</span>
      </NavLink>
    </li>

    <li className='sidebar-menu-group-title'>Support</li>
    <li>
      <NavLink 
        to='https://www.google.com' 
        className={(navData) => navData.isActive ? "active-page" : ""}
      >
        <Icon icon='solar:notes-outline' className='menu-icon' />
        <span>Ticket System</span>
      </NavLink>
    </li>

  </ul>
</div>
      </aside>

      <main className={sidebarActive ? "dashboard-main active" : "dashboard-main"}>
        <div className='navbar-header'>
          <div className='row align-items-center justify-content-between'>
            <div className='col-auto'>
              <div className='d-flex flex-wrap align-items-center gap-4'>
                <button type='button' className='sidebar-toggle' onClick={sidebarControl}>
                  <Icon icon={sidebarActive ? 'iconoir:arrow-right' : 'heroicons:bars-3-solid'} className='icon text-2xl non-active' />
                </button>
                <button onClick={mobileMenuControl} type='button' className='sidebar-mobile-toggle'>
                  <Icon icon='heroicons:bars-3-solid' className='icon' />
                </button>
              </div>
            </div>
            
            <div className='col-auto'>
              <div className='d-flex flex-wrap align-items-center gap-3'>
                <ThemeToggleButton />
                
                {/* UPDATED PROFILE DROPDOWN */}
                <div className='dropdown'>
                  <button className='d-flex justify-content-center align-items-center rounded-circle' type='button' data-bs-toggle='dropdown'>
                    <img
                      src={user?.picture || 'assets/images/user.png'}
                      alt='user'
                      className='w-40-px h-40-px object-fit-cover rounded-circle border'
                    />
                  </button>
                  <div className='dropdown-menu to-top dropdown-menu-sm'>
                    <div className='py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2'>
                      <div>
                        <h6 className='text-lg text-primary-light fw-semibold mb-0'>{user?.name || 'User'}</h6>
                        <span className='text-secondary-light fw-medium text-sm text-capitalize'>{user?.role || 'Guest'}</span>
                      </div>
                    </div>
                    <ul className='to-top-list'>
                      <li>
                        <Link className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3' to='/view-profile'>
                          <Icon icon='solar:user-linear' className='icon text-xl' /> My Profile
                        </Link>
                      </li>
                      <li>
                        <button 
                          className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3 w-100 border-0 bg-transparent' 
                          onClick={handleLogout}
                        >
                          <Icon icon='lucide:power' className='icon text-xl' /> Log Out
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='dashboard-main-body'>{children}</div>

        <footer className='d-footer'>
          <div className='row align-items-center justify-content-between'>
            <div className='col-auto'>
              <p className='mb-0'>© 2026 Qiu AI GmbH. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </section>
  );
};

export default MasterLayout;