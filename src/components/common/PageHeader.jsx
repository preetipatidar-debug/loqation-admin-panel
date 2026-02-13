import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

const PageHeader = ({ title, subtitle }) => {
  return (
    <div className="page-header mb-24 d-flex align-items-center justify-content-between flex-wrap gap-3">
      
      <div className="page-header-left">
        <h6 className="page-title mb-0">
          {title}{" "}
          {subtitle && (
            <span className="text-primary fw-semibold">{subtitle}</span>
          )}
        </h6>
      </div>

      <div className="page-header-right">
        <ul className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link to="/" className="text-secondary-light d-flex align-items-center gap-1">
              <Icon icon="solar:home-smile-outline" />
              Home
            </Link>
          </li>
          <li className="breadcrumb-item active">{title}</li>
        </ul>
      </div>

    </div>
  );
};

export default PageHeader;
