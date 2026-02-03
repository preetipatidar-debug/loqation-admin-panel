import React from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

const DataTable = ({
  title,
  data = [],
  columns = [],
  actions = [],
  bulkActions = [],
  rowKey = "id",

  searchTerm = "",
  onSearchChange = () => {},

  // pagination (OPTIONAL)
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  pagination = true,

  loading = false,
  headerActions = [],
}) => {
  /* ================= SAFETY GUARDS ================= */

  const isPaginated =
    pagination === true &&
    Number.isFinite(page) &&
    Number.isFinite(limit) &&
    Number.isFinite(total) &&
    limit > 0 &&
    typeof onPageChange === "function";

  const safePage = isPaginated ? page : 1;
  const safeLimit = isPaginated ? limit : data.length || 1;
  const safeTotal = isPaginated ? total : data.length;
  const totalPages = isPaginated
    ? Math.max(1, Math.ceil(safeTotal / safeLimit))
    : 1;

  /* ================= BULK SELECTION ================= */

  const [selectedRows, setSelectedRows] = React.useState([]);

  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((row) => row[rowKey]));
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="card">
      {/* ================= HEADER ================= */}
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex flex-wrap align-items-center gap-3">
          {isPaginated && (
            <div className="d-flex align-items-center gap-2">
              <span>Show</span>
              <select
                className="form-select form-select-sm w-auto"
                value={safeLimit}
                onChange={(e) =>
                  onLimitChange && onLimitChange(Number(e.target.value))
                }
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="icon-field">
            <input
              type="text"
              className="form-control form-control-sm w-auto"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <span className="icon">
              <Icon icon="ion:search-outline" />
            </span>
          </div>

          {/* BULK ACTION BAR */}
          {bulkActions.length > 0 && selectedRows.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <span className="text-sm text-secondary">
                {selectedRows.length} selected
              </span>

              {bulkActions.map((action, i) => (
                <button
                  key={i}
                  className={`btn btn-sm ${action.className}`}
                  onClick={() => {
                    action.onClick(selectedRows);
                    setSelectedRows([]);
                  }}
                >
                  {action.icon && (
                    <Icon icon={action.icon} className="me-6" />
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="d-flex flex-wrap align-items-center gap-3">
          {headerActions.map((action, i) => (
            <button
              key={i}
              className={`btn btn-sm ${action.className}`}
              onClick={action.onClick}
            >
              {action.icon && (
                <Icon icon={action.icon} className="me-6" />
              )}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div className="card-body">
        <table className="table bordered-table mb-0">
          <thead>
            <tr>
              <th>
                <div className="form-check style-check d-flex align-items-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={
                      data.length > 0 &&
                      selectedRows.length === data.length
                    }
                    onChange={toggleAll}
                  />
                  <label className="form-check-label">S.L</label>
                </div>
              </th>

              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}

              {actions.length > 0 && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="text-center py-40"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="text-center py-40"
                >
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row[rowKey] ?? idx}>
                  <td>
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedRows.includes(row[rowKey])}
                        onChange={() => toggleRow(row[rowKey])}
                      />
                      <label className="form-check-label">
                        {String(idx + 1).padStart(2, "0")}
                      </label>
                    </div>
                  </td>

                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(row)
                        : row[col.key] ?? "--"}
                    </td>
                  ))}

                  {actions.length > 0 && (
                    <td>
                      {actions.map((action, i) => (
                        <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          action.onClick(row);
                        }}
                        className={`w-32-px h-32-px me-8 ${action.className} rounded-circle d-inline-flex align-items-center justify-content-center border-0`}
                        style={{ background: "transparent" }}
                      >
                        <Icon icon={action.icon} />
                      </button>
                      
                      ))}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ================= PAGINATION ================= */}
        {isPaginated && safeTotal > safeLimit && (
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-24">
            <span>
              Showing {(safePage - 1) * safeLimit + 1} to{" "}
              {Math.min(safePage * safeLimit, safeTotal)} of{" "}
              {safeTotal} entries
            </span>

            <ul className="pagination d-flex flex-wrap align-items-center gap-2">
              <li className="page-item">
                <button
                  className="page-link bg-base text-secondary-light border-0 w-32-px h-32-px d-flex align-items-center justify-content-center"
                  disabled={safePage === 1}
                  onClick={() => onPageChange(safePage - 1)}
                >
                  <Icon icon="ep:d-arrow-left" />
                </button>
              </li>

              {Array.from({ length: totalPages }).map((_, i) => (
                <li key={i} className="page-item">
                  <button
                    className={`page-link w-32-px h-32-px border-0 ${
                      safePage === i + 1
                        ? "bg-primary-600 text-white"
                        : "bg-primary-50 text-secondary-light"
                    }`}
                    onClick={() => onPageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}

              <li className="page-item">
                <button
                  className="page-link bg-base text-secondary-light border-0 w-32-px h-32-px d-flex align-items-center justify-content-center"
                  disabled={safePage === totalPages}
                  onClick={() => onPageChange(safePage + 1)}
                >
                  <Icon icon="ep:d-arrow-right" />
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
