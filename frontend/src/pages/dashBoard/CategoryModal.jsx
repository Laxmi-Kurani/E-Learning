import { Modal, Form, Input, message } from "antd";
import { useState, useEffect } from "react";
import { adminService } from "../../api/admin.service";

function CategoryModal({ isOpen, onClose, onSuccess, categoryId = null, mode = "add" }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const isEditMode = mode === "edit" || categoryId !== null;
  const modalTitle = isEditMode ? "Edit Category" : "Add Category";
  const submitButtonText = isEditMode ? "Update Category" : "Add Category";

  useEffect(() => {
    if (isOpen && isEditMode && categoryId) {
      fetchCategory();
    } else if (isOpen && !isEditMode) {
      form.resetFields();
    }
  }, [isOpen, categoryId, isEditMode]);

  const fetchCategory = async () => {
    setFetchingData(true);
    try {
      const res = await adminService.getAllCategories();
      if (res.success) {
        const category = res.data.find((c) => c.id === categoryId);
        if (category) {
          form.setFieldsValue({ name: category.name });
        } else {
          message.error("Category not found");
          onClose();
        }
      } else {
        message.error(res.error);
        onClose();
      }
    } catch {
      message.error("Failed to fetch category");
      onClose();
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let result;
      if (isEditMode) {
        result = await adminService.updateCategory(categoryId, values);
      } else {
        result = await adminService.createCategory(values);
      }

      if (result.success) {
        message.success(
          isEditMode ? "Category updated successfully" : "Category added successfully"
        );
        form.resetFields();
        onClose();
        onSuccess?.();
      } else {
        message.error(result.error);
      }
    } catch {
      message.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={modalTitle}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={500}
      destroyOnHidden
    >
      {fetchingData ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <span className="ml-3 text-gray-600">Loading category...</span>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-2"
          initialValues={{ name: "" }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Category name is required" }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item className="text-right">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-6 py-2 font-medium hover:scale-105 transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Saving..." : submitButtonText}
            </button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

export default CategoryModal;