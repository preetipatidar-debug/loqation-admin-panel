import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/common/DataTable";
import api from "../services/api";
import { toast } from "react-toastify";
import { useDebounce } from "../hook/useDebounce";
const LocationsTopListPage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 500);
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/top-locations", {
        params: { search, page, limit },
      });

      setData(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch {
      toast.error("Failed to load top locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, page, limit]);

  return (
    <DataTable
      title="Top Locations"
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
          label: "Add Location",
          icon: "ri-add-line",
          className: "btn-primary-600",
          onClick: () => navigate("/locations-top/new"),
        },
      ]}

      /* ===== TABLE COLUMNS ===== */
      columns={[
        { key: "name", label: "Name" },
        { key: "description", label: "Description" },
      ]}

      /* ===== ROW ACTIONS ===== */
      actions={[
        {
          icon: "iconamoon:eye-light",
          className: "bg-primary-light text-primary-600",
          onClick: (row) =>
            navigate("/locations-main", {
              state: {
                filterAreaId: row.id,
                filterAreaName: row.name,
              },
            }),
        },
        {
          icon: "lucide:edit",
          className: "bg-success-focus text-success-main",
          onClick: (row) =>
            navigate(`/locations-top/${row.id}/edit`),
        },
        {
          icon: "mingcute:delete-2-line",
          className: "bg-danger-focus text-danger-main",
          onClick: async (row) => {
            if (!window.confirm("Delete this top location?")) return;

            try {
              await api.delete(`/top-locations/${row.id}`);
              toast.success("Top location deleted");
              fetchData();
            } catch {
              toast.error("Delete failed");
            }
          },
        },
      ]}
    />
  );
};

export default LocationsTopListPage;
