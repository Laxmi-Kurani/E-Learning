import api from "./api";

// Get all certificates (Admin only)
async function getAllCertificates(page = 1, limit = 10) {
  try {
    const { data } = await api.get("/api/certificates", {
      params: { page, limit }
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching certificates:", error);
    throw error;
  }
}

// Get user's certificates
async function getUserCertificates() {
  try {
    const { data } = await api.get("/api/certificates/my-certificates");
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching user certificates:", error);
    throw error;
  }
}

// Get single certificate details
async function getCertificateById(certificateId) {
  try {
    const { data } = await api.get(`/api/certificates/${certificateId}`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching certificate:", error);
    throw error;
  }
}

// Issue certificate (Admin only)
async function issueCertificate(userId, courseId, certificateUrl = null) {
  try {
    const { data } = await api.post("/api/certificates/issue", {
      userId,
      courseId,
      certificateUrl
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error issuing certificate:", error);
    throw error;
  }
}

// Revoke certificate (Admin only)
async function revokeCertificate(certificateId) {
  try {
    const { data } = await api.put(`/api/certificates/${certificateId}/revoke`);
    return { success: true, data };
  } catch (error) {
    console.error("Error revoking certificate:", error);
    throw error;
  }
}

const certificateService = {
  getAllCertificates,
  getUserCertificates,
  getCertificateById,
  issueCertificate,
  revokeCertificate
};

export default certificateService;
