import { Modal, Form, Input, Select, message } from "antd";
import { useState, useEffect } from "react";
import { adminService } from "../../api/admin.service";

const { Option } = Select;

function UserModal({ isOpen, onClose, onSuccess, userId = null, mode = "add", defaultRole = "" }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const isEditMode = mode === "edit" || userId !== null;
  const title = isEditMode ? "Edit User" : "Create New User";
  const submitText = isEditMode ? "Update" : "Create";

  useEffect(() => {
    if (isOpen && isEditMode && userId) {
      loadUser();
    } else if (isOpen && !isEditMode) {
      form.resetFields();
    }
  }, [isOpen, userId, isEditMode]);

  const loadUser = async () => {
    setFetching(true);
    try {
      const res = await adminService.getAllUsers({});
      if (res.success) {
        const found = res.data.find((u) => u.id === userId);
        if (found) {
          form.setFieldsValue({
            username: found.username,
            email: found.email,
            role: found.role,
            isActive: found.isActive,
            mobileNumber: found.mobileNumber,
            gender: found.gender,
            dob: found.dob,
            profession: found.profession,
            location: found.location,
            linkedin_url: found.linkedin_url,
            github_url: found.github_url,
          });
        }
      }
    } catch (err) {
      message.error("Failed to load user data");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let res;
      if (isEditMode) {
        res = await adminService.updateUser(userId, values);
      } else {
        res = await adminService.createUser(values);
      }

      if (res.success) {
        message.success(isEditMode ? "User updated" : "User created");
        form.resetFields();
        onClose();
        onSuccess();
      } else {
        message.error(res.error);
      }
    } catch (err) {
      message.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={() => { form.resetFields(); onClose(); }}
      footer={null}
      width={600}
      destroyOnHidden
    >
      {fetching ? (
        <p>Loading...</p>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ role: defaultRole || "USER", isActive: true }}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Username required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email required" },
              { type: "email", message: "Enter valid email" },
            ]}
          >
            <Input />
          </Form.Item>

          {!isEditMode && (
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Password required" }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item label="Role" name="role">
            <Select>
              <Option value="USER">USER</Option>
              <Option value="ADMIN">ADMIN</Option>
              <Option value="INSTRUCTOR">INSTRUCTOR</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Status" name="isActive">
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item className="text-right">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-6 py-2 font-medium hover:scale-105 transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Saving..." : submitText}
            </button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

export default UserModal;
