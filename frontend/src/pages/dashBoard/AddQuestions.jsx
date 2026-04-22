import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  message,
  Row,
  Col,
  Table,
  Modal,
  Popconfirm
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faQuestionCircle,
  faArrowLeft,
  faPlus,
  faEdit,
  faTrash,
  faList
} from '@fortawesome/free-solid-svg-icons';
import { adminService } from '../../api/admin.service';
import { questionService } from '../../api/question.service';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Defined OUTSIDE the parent component so React doesn't remount it on every render
const QuestionForm = ({ form, onFinish, loading, submitText, onClose }) => (
  <Form form={form} layout="vertical" onFinish={onFinish} size="large">
    <Form.Item
      label="Question"
      name="question"
      rules={[
        { required: true, message: 'Please enter the question' },
        { min: 10, message: 'Question must be at least 10 characters' },
        { max: 500, message: 'Question cannot exceed 500 characters' },
      ]}
    >
      <TextArea placeholder="Enter your question here..." rows={3} showCount maxLength={500} />
    </Form.Item>

    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Option A" name="option1" rules={[{ required: true, message: 'Option A is required' }]}>
          <Input placeholder="Enter option A" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Option B" name="option2" rules={[{ required: true, message: 'Option B is required' }]}>
          <Input placeholder="Enter option B" />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Option C" name="option3" rules={[{ required: true, message: 'Option C is required' }]}>
          <Input placeholder="Enter option C" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Option D" name="option4" rules={[{ required: true, message: 'Option D is required' }]}>
          <Input placeholder="Enter option D" />
        </Form.Item>
      </Col>
    </Row>

    <Form.Item
      label="Correct Answer"
      name="answer"
      rules={[{ required: true, message: 'Please select the correct answer' }]}
    >
      <Select placeholder="Select the correct answer">
        <Option value="option1">Option A</Option>
        <Option value="option2">Option B</Option>
        <Option value="option3">Option C</Option>
        <Option value="option4">Option D</Option>
      </Select>
    </Form.Item>

    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
      <Button onClick={onClose}>Cancel</Button>
      <Button type="primary" htmlType="submit" loading={loading}>
        {submitText}
      </Button>
    </div>
  </Form>
);

// Maps option key (option1-4) → letter (A-D)
const optionToLetter = { option1: 'A', option2: 'B', option3: 'C', option4: 'D' };
// Maps letter (A-D) → option key (option1-4)
const letterToOption = { A: 'option1', B: 'option2', C: 'option3', D: 'option4' };

function AddQuestion({ courseId, onBack }) {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [courseId]);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const result = await questionService.getQuestionsByCourse(courseId);
      if (result.success) {
        setQuestions(result.data);
      } else {
        message.error(result.error || 'Failed to fetch questions');
      }
    } catch {
      message.error('Failed to fetch questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // CREATE
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const result = await adminService.createQuestion({
        question: values.question,
        option1: values.option1,
        option2: values.option2,
        option3: values.option3,
        option4: values.option4,
        answer: optionToLetter[values.answer], // e.g. "option2" → "B"
        courseId,
      });

      if (result.success) {
        message.success('Question added successfully!');
        form.resetFields();
        setIsAddModalVisible(false);
        fetchQuestions();
      } else {
        message.error(result.error || 'Failed to add question');
      }
    } catch {
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal and pre-fill form
  const handleEdit = (question) => {
    setEditingQuestion(question);
    editForm.setFieldsValue({
      question: question.question,
      option1: question.option1,
      option2: question.option2,
      option3: question.option3,
      option4: question.option4,
      answer: letterToOption[question.answer] || 'option1', // e.g. "B" → "option2"
    });
    setIsEditModalVisible(true);
  };

  // UPDATE
  const handleEditSubmit = async (values) => {
    if (!editingQuestion) return;
    try {
      const result = await adminService.updateQuestion(editingQuestion.id, {
        question: values.question,
        option1: values.option1,
        option2: values.option2,
        option3: values.option3,
        option4: values.option4,
        answer: optionToLetter[values.answer], // e.g. "option3" → "C"
        courseId,
      });

      if (result.success) {
        message.success('Question updated successfully!');
        setIsEditModalVisible(false);
        setEditingQuestion(null);
        editForm.resetFields();
        fetchQuestions();
      } else {
        message.error(result.error || 'Failed to update question');
      }
    } catch {
      message.error('An unexpected error occurred');
    }
  };

  // DELETE
  const handleDelete = async (questionId) => {
    try {
      const result = await adminService.deleteQuestion(questionId);
      if (result.success) {
        message.success('Question deleted successfully!');
        fetchQuestions();
      } else {
        message.error(result.error || 'Failed to delete question');
      }
    } catch {
      message.error('An unexpected error occurred');
    }
  };

  const columns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      width: '55%',
      render: (text) => <span style={{ color: '#111827', fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Options',
      key: 'options',
      width: '25%',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {['option1', 'option2', 'option3', 'option4'].map((opt, idx) => (
            <Button
              key={opt}
              type={record.answer === String.fromCharCode(65 + idx) ? 'primary' : 'default'}
              size="small"
              title={record[opt]}
            >
              {String.fromCharCode(65 + idx)}
            </Button>
          ))}
        </div>
      ),
    },
    {
      title: 'Correct',
      key: 'correct',
      width: '10%',
      render: (_, record) => (
        <span style={{ color: '#16a34a', fontWeight: 600 }}>{record.answer}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="text" size="small" onClick={() => handleEdit(record)} style={{ color: '#2563eb' }}>
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Popconfirm
            title="Delete this question?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" size="small" style={{ color: '#dc2626' }}>
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button type="text" onClick={onBack}>
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back
              </Button>
              <Title level={3} className="!mb-0">
                <FontAwesomeIcon icon={faQuestionCircle} className="mr-2 text-blue-600" />
                Question Management
              </Title>
            </div>
            <Button
              type="primary"
              size="large"
              onClick={() => { form.resetFields(); setIsAddModalVisible(true); }}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add New Question
            </Button>
          </div>
        </Card>

        {/* Questions Table */}
        <Card className="rounded-2xl shadow-sm">
          <Title level={4} className="!mb-4">
            <FontAwesomeIcon icon={faList} className="mr-2 text-green-600" />
            Existing Questions ({questions.length})
          </Title>
          <Table
            columns={columns}
            dataSource={questions}
            rowKey="id"
            loading={loadingQuestions}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 700 }}
            locale={{
              emptyText: (
                <div className="py-8 text-center text-gray-500">
                  No questions yet. Click "Add New Question" to get started.
                </div>
              ),
            }}
          />
        </Card>

        {/* Add Modal */}
        <Modal
          title={<><FontAwesomeIcon icon={faPlus} className="mr-2 text-blue-600" />Add New Question</>}
          open={isAddModalVisible}
          onCancel={() => { setIsAddModalVisible(false); form.resetFields(); }}
          footer={null}
          width={750}
          destroyOnHidden
        >
          <QuestionForm
            form={form}
            onFinish={handleSubmit}
            loading={loading}
            submitText="Add Question"
            onClose={() => { setIsAddModalVisible(false); form.resetFields(); }}
          />
        </Modal>

        {/* Edit Modal */}
        <Modal
          title={<><FontAwesomeIcon icon={faEdit} className="mr-2 text-blue-600" />Edit Question</>}
          open={isEditModalVisible}
          onCancel={() => { setIsEditModalVisible(false); setEditingQuestion(null); editForm.resetFields(); }}
          footer={null}
          width={750}
          destroyOnHidden={false}
        >
          <QuestionForm
            form={editForm}
            onFinish={handleEditSubmit}
            loading={false}
            submitText="Update Question"
            onClose={() => { setIsEditModalVisible(false); setEditingQuestion(null); editForm.resetFields(); }}
          />
        </Modal>
      </div>
    </div>
  );
}

export default AddQuestion;
