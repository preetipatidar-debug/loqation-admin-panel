import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DataTable from "../components/common/DataTable";
import api from "../services/api";
import { toast } from "react-toastify";
import { useDebounce } from "../hook/useDebounce";
const LocationsMainListPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // ===== ACTIVE FILTER FROM TOP LOCATIONS =====
  const activeAreaId = state?.filterAreaId || null;
  const activeAreaName = state?.filterAreaName || null;

  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 500);
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/main-locations", {
        params: {
          search,
          page,
          limit,
          ...(activeAreaId && { top_location_id: activeAreaId }),
        },
      });

      setData(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch {
      toast.error("Failed to load main locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, page, limit, activeAreaId]);

  return (
    <>
      {/* ===== ACTIVE FILTER BADGE ===== */}
      {activeAreaId && (
        <div className="mb-12 px-10">
          <span
            className="badge bg-primary-100 text-primary-600 px-12 py-8 radius-8 pointer"
            onClick={() =>
              navigate("/locations-main", { replace: true })
            }
          >
            Filtered by Top Area: {activeAreaName} ✕
          </span>
        </div>
      )}

      <DataTable
        title="Main Locations"
        data={data}
        loading={loading}
        searchTerm={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={(v) => {
          setLimit(v);
          setPage(1);
        }}

        /* ===== HEADER BUTTON ===== */
        headerActions={[
          {
            label: "Add Business",
            icon: "ri-add-line",
            className: "btn-primary-600",
            onClick: () => navigate("/locations-main/new"),
          },
        ]}

        /* ===== TABLE COLUMNS ===== */
        columns={[
          {
            key: "location_name",
            label: "Name",
            render: (row) => (
              <span
                className="text-primary-600 pointer"
                onClick={() =>
                  navigate("/locations-sub", {
                    state: {
                      filterBusinessId: row.id,
                      filterBusinessName: row.location_name,
                    },
                  })
                }
              >
                {row.location_name}
              </span>
            ),
          },
          { key: "top_location_name", label: "Parent Area" },
          { key: "city", label: "City" },
          {
            key: "sync_status",
            label: "Status",
            render: (row) => (
              <span
                className={`badge ${
                  row.sync_status === "SYNCED"
                    ? "bg-success-focus text-success-main"
                    : "bg-warning-focus text-warning-main"
                }`}
              >
                {row.sync_status}
              </span>
            ),
          },
        ]}

        /* ===== ROW ACTIONS (NO VIEW) ===== */
        actions={[
          {
            icon: "lucide:edit",
            className: "bg-success-focus text-success-main",
            onClick: (row) =>
              navigate(`/locations-main/${row.id}/edit`),
          },
          {
            icon: "mingcute:delete-2-line",
            className: "bg-danger-focus text-danger-main",
            onClick: async (row) => {
              if (!window.confirm("Delete this main location?")) return;

              try {
                await api.delete(`/main-locations/${row.id}`);
                toast.success("Main location deleted");
                fetchData();
              } catch {
                toast.error("Delete failed");
              }
            },
          },
        ]}
      />
    </>
  );
};

export default LocationsMainListPage;
