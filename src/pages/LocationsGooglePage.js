import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/common/DataTable";
import api from "../services/api";
import { toast } from "react-toastify";

const LocationsGooglePage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/google-places", {
        params: { search, page, limit },
      });

      setData(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch {
      toast.error("Failed to load Google Places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, page, limit]);

  return (
    <DataTable
      title="Google Places"
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
          label: "Add Place",
          icon: "ri-add-line",
          className: "btn-primary-600",
          onClick: () => navigate("/google-places/new"),
        },
      ]}

      /* ===== TABLE COLUMNS ===== */
      columns={[
        { key: "display_name_text", label: "Name" },
        { key: "formatted_address", label: "Address" },
        { key: "rating", label: "Rating" },
        {
          key: "business_status",
          label: "Status",
          render: (row) => (
            <span className="badge bg-info">
              {row.business_status}
            </span>
          ),
        },
      ]}

      /* ===== ROW ACTIONS ===== */
      actions={[
        {
          icon: "lucide:edit",
          className: "bg-success-focus text-success-main",
          onClick: (row) =>
            navigate(`/google-places/${row.id}/edit`),
        },
        {
          icon: "mingcute:delete-2-line",
          className: "bg-danger-focus text-danger-main",
          onClick: async (row) => {
            if (!window.confirm("Delete this Google Place?")) return;

            try {
              await api.delete(`/google-places/${row.id}`);
              toast.success("Google Place deleted");
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

export default LocationsGooglePage;
