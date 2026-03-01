import { Modal, Form, Input, Select, message } from "antd";
import { useState, useEffect } from "react";
import certificateService from "../../api/certificate.service";

const { Option } = Select;

function CertificateModal({ isOpen, onClose, onSuccess, certificateId = null, mode = "add" }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const isEditMode = mode === "edit" || certificateId !== null;
  const modalTitle = isEditMode ? "Edit Certificate" : "Add New Certificate";
  const submitButtonText = isEditMode ? "Update Certificate" : "Add Certificate";
  const loadingText = isEditMode ? "Updating..." : "Adding...";

  useEffect(() => {
    if (isOpen && isEditMode && certificateId) {
      fetchCertificate();
    } else if (isOpen && !isEditMode) {
      form.resetFields();
    }
  }, [isOpen, certificateId, isEditMode]);

  const fetchCertificate = async () => {
    setFetchingData(true);
    try {
      const result = await certificateService.getCertificateById(certificateId);
      if (result.success) {
        const cert = result.data;
        form.setFieldsValue({
          userId: cert.user_id,
          courseId: cert.course_id,
          certificateUrl: cert.certificate_url || "",
          status: cert.status,
        });
      } else {
        message.error(result.error);
        onClose();
      }
    } catch {
      message.error("Failed to fetch certificate data");
      onClose();
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        userId: values.userId,
        courseId: values.courseId,
        certificateUrl: values.certificateUrl,
        status: values.status,
      };
      let result;
      if (isEditMode) {
        result = await certificateService.updateCertificate(certificateId, payload);
      } else {
        result = await certificateService.createCertificate(payload);
      }
      if (result.success) {
        message.success(isEditMode ? "Certificate updated successfully!" : "Certificate added successfully!");
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
      className="custom-modal"
      destroyOnHidden
    >
      {fetchingData ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <span className="ml-3 text-gray-600">Loading certificate data...</span>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-2 space-y-4"
          initialValues={{
            userId: "",
            courseId: "",
            certificateUrl: "",
            status: "ISSUED",
          }}
        >
          <Form.Item
            label="User ID"
            name="userId"
            rules={[{ required: true, message: "User ID is required" }]}
          >
            <Input placeholder="User ID" type="number" />
          </Form.Item>

          <Form.Item
            label="Course ID"
            name="courseId"
            rules={[{ required: true, message: "Course ID is required" }]}
          >
            <Input placeholder="Course ID" type="number" />
          </Form.Item>

          <Form.Item label="Certificate URL" name="certificateUrl">
            <Input placeholder="Optional URL" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select>
              <Option value="ISSUED">ISSUED</Option>
              <Option value="REVOKED">REVOKED</Option>
              <Option value="NOT_ISSUED">NOT_ISSUED</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[140px] flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {loadingText}
                </>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </Form>
      )}
    </Modal>
  );
}

export default CertificateModal;