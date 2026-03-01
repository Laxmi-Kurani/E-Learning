import { Modal, Form, Input, InputNumber, Select, message } from "antd";
import { useState, useEffect } from "react";
import { assessmentService } from "../../api/assessment.service";

const { Option } = Select;

function AssessmentModal({ isOpen, onClose, onSuccess, assessmentId = null, mode = "add" }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const isEditMode = mode === "edit" || assessmentId !== null;
  const modalTitle = isEditMode ? "Edit Assessment" : "Add New Assessment";
  const submitButtonText = isEditMode ? "Update Assessment" : "Add Assessment";
  const loadingText = isEditMode ? "Updating..." : "Adding...";

  useEffect(() => {
    if (isOpen && isEditMode && assessmentId) {
      fetchAssessment();
    } else if (isOpen && !isEditMode) {
      form.resetFields();
    }
  }, [isOpen, assessmentId, isEditMode]);

  const fetchAssessment = async () => {
    setFetchingData(true);
    try {
      const result = await assessmentService.getAssessmentById(assessmentId);
      if (result.success) {
        form.setFieldsValue({
          userId: result.data.user_id,
          courseId: result.data.course_id,
          score: result.data.score,
          totalQuestions: result.data.total_questions,
          passed: result.data.passed ? "PASSED" : "FAILED",
        });
      } else {
        message.error(result.error);
        onClose();
      }
    } catch {
      message.error("Failed to fetch assessment data");
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
        score: values.score,
        totalQuestions: values.totalQuestions,
        passed: values.passed === "PASSED",
      };
      let result;
      if (isEditMode) {
        result = await assessmentService.updateAssessment(assessmentId, payload);
      } else {
        result = await assessmentService.createAssessment(payload);
      }
      if (result.success) {
        message.success(isEditMode ? "Assessment updated successfully!" : "Assessment added successfully!");
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
          <span className="ml-3 text-gray-600">Loading assessment data...</span>
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
            score: 0,
            totalQuestions: 0,
            passed: "PASSED",
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

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Score"
              name="score"
              rules={[{ required: true, message: "Score is required" }]}
            >
              <InputNumber className="w-full" min={0} />
            </Form.Item>

            <Form.Item
              label="Total Questions"
              name="totalQuestions"
              rules={[{ required: true, message: "Total questions is required" }]}
            >
              <InputNumber className="w-full" min={1} />
            </Form.Item>
          </div>

          <Form.Item
            label="Status"
            name="passed"
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select>
              <Option value="PASSED">PASSED</Option>
              <Option value="FAILED">FAILED</Option>
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

export default AssessmentModal;