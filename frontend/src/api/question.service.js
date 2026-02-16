import api from "./api";

async function getQuestionsByCourse(courseId) {
  try {
    const { data } = await api.get(`/api/questions/course/${courseId}`);
    // Map backend field names to frontend field names
    const mappedData = data.map(q => ({
      id: q.id,
      question: q.question_text,
      option1: q.option_a,
      option2: q.option_b,
      option3: q.option_c,
      option4: q.option_d,
      answer: q.correct_answer,
      courseId: q.course_id,
    }));
    return { success: true, data: mappedData };
  } catch (err) {
    console.error("Error fetching questions:", err);
    return { success: false, error: err.response?.data?.message || "Unable to fetch questions" };
  }
}

async function getQuestionById(questionId) {
  try {
    const { data } = await api.get(`/api/questions/${questionId}`);
    // Map backend field names to frontend field names
    const mappedData = {
      id: data.id,
      question: data.question_text,
      option1: data.option_a,
      option2: data.option_b,
      option3: data.option_c,
      option4: data.option_d,
      answer: data.correct_answer,
      courseId: data.course_id,
    };
    return { success: true, data: mappedData };
  } catch (err) {
    if (err.response?.status === 404) {
      return { success: false, error: "Question not found" };
    }
    console.error("Error fetching question:", err);
    return { success: false, error: err.response?.data?.message || "Unable to fetch question" };
  }
}

export const questionService = {
  getQuestionsByCourse,
  getQuestionById,
};
