import api from "./api";

async function getQuestions(courseId) {
  try {
    const { data } = await api.get(`/api/questions/assessment/${courseId}`);
    return { success: true, data };
  } catch (err) {
    console.error("Error fetching questions:", err);
    return { success: false, error: "Unable to fetch questions" };
  }
}

async function submitAssessment(userId, courseId, marks) {
  try {
    const payload = { courseId, userId, marks };
    const { data } = await api.post(`/api/assessments/add/${userId}/${courseId}`, payload);
    return { success: true, data };
  } catch (err) {
    console.error("Error submitting assessment:", err);
    return { success: false, error: "Unable to submit assessment" };
  }
}

// admin helper functions
async function getAllAssessments(params) {
  try {
    const { data } = await api.get('/api/assessments', { params });
    return { success: true, data };
  } catch (err) {
    console.error('Error fetching assessments:', err);
    return { success: false, error: err.response?.data?.message || 'Unable to fetch assessments' };
  }
}

async function createAssessment(payload) {
  try {
    const { data } = await api.post('/api/assessments', payload);
    return { success: true, data };
  } catch (err) {
    console.error('Error creating assessment:', err);
    return { success: false, error: err.response?.data?.message || 'Unable to create assessment' };
  }
}

async function updateAssessment(id, payload) {
  try {
    const { data } = await api.put(`/api/assessments/${id}`, payload);
    return { success: true, data };
  } catch (err) {
    console.error('Error updating assessment:', err);
    return { success: false, error: err.response?.data?.message || 'Unable to update assessment' };
  }
}

async function getAssessmentById(id) {
  try {
    const { data } = await api.get(`/api/assessments/${id}`);
    return { success: true, data };
  } catch (err) {
    console.error('Error fetching assessment by id:', err);
    return { success: false, error: err.response?.data?.message || 'Unable to fetch assessment' };
  }
}

async function deleteAssessment(id) {
  try {
    const { data } = await api.delete(`/api/assessments/${id}`);
    return { success: true, data };
  } catch (err) {
    console.error('Error deleting assessment:', err);
    return { success: false, error: err.response?.data?.message || 'Unable to delete assessment' };
  }
}

export const assessmentService = {
  getQuestions,
  submitAssessment,
  // admin
  getAllAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment
};
