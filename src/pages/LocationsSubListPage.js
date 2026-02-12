import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DataTable from "../components/common/DataTable";
import api from "../services/api";
import { toast } from "react-toastify";
import { useDebounce } from "../hook/useDebounce";

const LocationsSubListPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

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
      const res = await api.get("/sub-locations", {
        params: {
          search,
          page,
          limit,
          parent_id: state?.filterBusinessId,
        },
      });

      setData(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch {
      toast.error("Failed to load sub locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, page, limit, state?.filterBusinessId]);

  return (
    <DataTable
      title="Sub Locations"
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
          label: "Add Unit",
          icon: "ri-add-line",
          className: "btn-primary-600",
          onClick: () => navigate("/locations-sub/new"),
        },
      ]}

      /* ===== TABLE COLUMNS ===== */
      columns={[
        { key: "name", label: "Unit Name" },
        { key: "type", label: "Type" },
        { key: "parent_main_name", label: "Parent Business" },
      ]}

      /* ===== ROW ACTIONS ===== */
      actions={[
        {
          icon: "lucide:edit",
          className: "bg-success-focus text-success-main",
          onClick: (row) =>
            navigate(`/locations-sub/${row.id}/edit`), // EDIT
        },
        {
          icon: "mingcute:delete-2-line",
          className: "bg-danger-focus text-danger-main",
          onClick: async (row) => {
            if (!window.confirm("Delete this sub location?")) return;

            try {
              await api.delete(`/sub-locations/${row.id}`);
              toast.success("Sub location deleted");
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

export default LocationsSubListPage;
