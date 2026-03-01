import { useState, useEffect } from "react";
import { Table, Input, Button, Space, message } from "antd";
import { adminService } from "../../api/admin.service";
import CategoryModal from "./CategoryModal";
import DeleteModal from "./DeleteModal";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [categoryModal, setCategoryModal] = useState({
    isOpen: false,
    mode: "add",
    categoryId: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    category: null,
  });

  useEffect(() => {
    fetchCategories();
  }, [searchText]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllCategories(searchText);
      if (res.success) {
        setCategories(res.data);
      } else {
        message.error(res.error);
      }
    } catch {
      message.error("Error fetching categories");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setCategoryModal({ isOpen: true, mode: "add", categoryId: null });
  };

  const openEditModal = (cat) => {
    setCategoryModal({ isOpen: true, mode: "edit", categoryId: cat.id });
  };

  const closeCategoryModal = () => {
    setCategoryModal({ isOpen: false, mode: "add", categoryId: null });
  };

  const handleCategorySuccess = () => {
    fetchCategories();
  };

  const openDeleteModal = (cat) => {
    setDeleteModal({ isOpen: true, category: cat });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, category: null });
  };

  const handleDeleteCategory = async (cat) => {
    return await adminService.deleteCategory(cat.id);
  };

  const handleDeleteSuccess = () => {
    fetchCategories();
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button onClick={() => openEditModal(record)} size="small">
            Edit
          </Button>
          <Button danger onClick={() => openDeleteModal(record)} size="small">
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
          Course Categories
        </h3>
        <p className="text-slate-600 mt-2">Manage course categories</p>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Search categories"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
        <Button type="primary" onClick={openAddModal} icon={<i className="bx bx-plus" />}>
          Add Category
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <CategoryModal
        isOpen={categoryModal.isOpen}
        onClose={closeCategoryModal}
        onSuccess={handleCategorySuccess}
        categoryId={categoryModal.categoryId}
        mode={categoryModal.mode}
      />

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onSuccess={handleDeleteSuccess}
        onDelete={handleDeleteCategory}
        item={deleteModal.category}
        itemType="Category"
        title="Delete Category"
        description="Are you sure you want to delete this category?"
        itemDisplayName={deleteModal.category?.name}
      />
    </div>
  );
}

export default Categories;