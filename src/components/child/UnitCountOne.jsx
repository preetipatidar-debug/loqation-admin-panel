import { Icon } from "@iconify/react";

const UnitCountOne = ({ title, value, icon, color, trend }) => {
  return (
    <div className="col-xxl-3 col-sm-6">
      <div className="card radius-12 border-0 shadow-none bg-base h-100">
        <div className="card-body p-24">
          <div className="d-flex gap-3 align-items-center justify-content-between">
            <div>
              <span className="text-secondary-light fw-medium mb-12 d-block">
                {title}
              </span>
              <h4 className="mb-4 fw-bold">{value}</h4>
              <p className="mb-0 text-sm">
                <span className="text-success-main fw-semibold">
                  {trend}
                </span>
                <span className="text-secondary-light ms-1">
                  Last 30 days
                </span>
              </p>
            </div>

            <div
              className={`w-56-px h-56-px bg-${color}-100 text-${color}-600 rounded-circle d-flex align-items-center justify-content-center`}
            >
              <Icon icon={icon} width="32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitCountOne;
