import api from "./api";

async function getUserDetails(userId) {
  try {
    // Use /profile endpoint which gets user from token
    const { data } = await api.get(`/api/users/profile`);
    return { success: true, data };
  } catch (err) {
    console.error("Error fetching user details:", err);
    return { success: false, error: "Unable to fetch user details" };
  }
}

async function getProfileImage(userId) {
  try {
    const res = await api.get(`/api/users/${userId}/profile-image`, {
      responseType: "blob",
    });
    const blobUrl = URL.createObjectURL(res.data);
    return { success: true, data: blobUrl };
  } catch (err) {
    // Profile image not found is expected, return default
    console.log("Profile image not available, using default");
    return { success: false, error: "No profile image" };
  }
}

async function updateUser(userId, updatedData) {
  try {
    // Use /profile endpoint which updates current user from token
    const { data } = await api.put(`/api/users/profile`, updatedData);
    return { success: true, data };
  } catch (err) {
    console.error("Error updating user:", err);
    return { success: false, error: "Unable to update user" };
  }
}

async function uploadProfileImage(userId, file) {
  try {
    // Convert file to base64
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    const imageData = await base64Promise;
    
    await api.post(`/api/users/${userId}/upload-image`, { imageData });
    return { success: true };
  } catch (err) {
    console.error("Error uploading profile image:", err);
    return { success: false, error: "Unable to upload image" };
  }
}

export const profileService = {
  getUserDetails,
  getProfileImage,
  uploadProfileImage,
  updateUser,
};
