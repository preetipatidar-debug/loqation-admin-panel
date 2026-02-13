import { Icon } from "@iconify/react";

const UnitCountOne = ({ title, value, icon, color, trend }) => {
  return (
    <div className="col-xxl-3 col-md-6 col-sm-12">
      <div className="card radius-12 border-0 bg-base h-100">
        <div className="card-body p-24">
          <div className="d-flex align-items-center justify-content-between gap-3">

            <div>
              <span className="text-muted fw-medium mb-12 d-block">
                {title}
              </span>

              <h4 className="mb-4 fw-bold text-dark">
                {value}
              </h4>

              <p className="mb-0 text-sm">
                <span className="text-success fw-semibold">
                  {trend}
                </span>
                <span className="text-muted ms-1">
                  Last 30 days
                </span>
              </p>
            </div>

            <div
              className={`w-56-px h-56-px bg-${color}-100 text-${color}-600 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
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
