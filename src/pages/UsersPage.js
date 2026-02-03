import React, { useEffect, useState } from "react";
import DataTable from "../components/common/DataTable";
import api from "../services/api";
import { toast } from "react-toastify";

const UsersPage = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users", { params: { search } });
      setData(Array.isArray(res.data) ? res.data : res.data.users || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleDelete = async (row) => {
    if (!window.confirm("Revoke access?")) return;
    await api.delete(`/users/${row.id}`);
    toast.success("Access revoked");
    fetchUsers();
  };

  return (
    <DataTable
        title="Authorized Users"
        data={data}
        loading={loading}
        searchTerm={search}
        onSearchChange={setSearch}
        pagination={false}
        headerActions={[
          {
            label: "Authorize Email",
            className: "btn-primary-600",
            icon: "ri-add-line",
            onClick: () => setShowModal(true),
          },
        ]}
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
        ]}
        actions={[
          {
            icon: "mingcute:delete-2-line",
            className: "bg-danger-focus text-danger-main",
            onClick: handleDelete,
          },
        ]}
      />

  );
};

export default UsersPage;
