import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/common/Navbar";
import ImgUpload from "./ImgUpload";
import Performance from "./Performance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin
} from "@fortawesome/free-brands-svg-icons";
import {
  faUser,
  faEnvelope,
  faPhone,
  faVenus,
  faMars,
  faCalendar,
  faBriefcase,
  faMapMarkerAlt,
  faBookOpen,
  faEdit,
  faTrophy
} from "@fortawesome/free-solid-svg-icons";
import { profileService } from "../../api/profile.service";
import { API_BASE_URL } from "../../api/constant";
import EditProfileModal from "./EditProfileModal";

function Profile() {
  const id = localStorage.getItem("id");
  const [userDetails, setUserDetails] = useState(null);
  const [profileImage, setProfileImage] = useState("");
  const [loadingImage, setLoadingImage] = useState(true);
  const [pendingFile, setPendingFile] = useState(null);   // file selected but not yet saved
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toAbsoluteImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('data:image/') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
      return path;
    }
    if (path.startsWith('/')) {
      return `${API_BASE_URL}${path}`;
    }
    return `${API_BASE_URL}/${path}`;
  };

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        setLoading(true);
        setLoadingImage(true);
        const userRes = await profileService.getUserDetails(id);
        if (userRes.success) {
          setUserDetails(userRes.data);

          // Normalize profile image path for rendering
          let profileImg = userRes.data.profile_image;
          console.log('Profile image from API:', profileImg);
          
          if (profileImg && profileImg.trim()) {
            const normalizedImg = profileImg.startsWith('data:image/')
              ? profileImg
              : toAbsoluteImageUrl(profileImg);
            console.log('Normalized image URL:', normalizedImg);
            setProfileImage(normalizedImg);
            setLoadingImage(false);
          } else {
            console.log('No profile image in user data, trying fallback endpoint...');
            // Fallback: use /api/users/:id/profile-image endpoint if available
            try {
              const imgRes = await profileService.getProfileImage(id);
              if (imgRes.success && imgRes.data) {
                console.log('Fallback image loaded:', imgRes.data);
                setProfileImage(imgRes.data);
              }
              setLoadingImage(false);
            } catch (lookupErr) {
              console.warn('Profile image fallback failed', lookupErr);
              setLoadingImage(false);
            }
          }
        } else {
          setError("Failed to load user details");
          setLoadingImage(false);
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError("Failed to load profile");
        setLoadingImage(false);
      } finally {
        setLoading(false);
      }
    }
    fetchUserDetails();
  }, [id]);

  const updateUser = async (updatedData) => {
    try {
      const res = await profileService.updateUser(id, updatedData);
      if (!res.success) return false;

      // Refresh from server so UI reflects saved values
      const userRes = await profileService.getUserDetails(id);
      if (userRes.success) {
        setUserDetails(userRes.data);
      } else {
        // Optimistic fallback
        setUserDetails(prev => ({ ...prev, ...updatedData }));
      }
      return true;
    } catch (err) {
      console.error("Error updating user:", err);
      return false;
    }
  };

  const handleEditProfile = () => {
    setIsEditModalVisible(true);
  };

  const handleModalClose = () => {
    setIsEditModalVisible(false);
  };

  const handleProfileUpdate = async (updatedData) => {
    const success = await updateUser(updatedData);
    return success;
  };

  // Step 1 – user picks a file → show preview + Save/Cancel buttons
  const handleFileSelect = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      alert('Image size must be less than 7MB');
      return;
    }
    setPendingFile(file);
  };

  // Step 2 – user clicks "Save Photo" → upload to API
  const handleSavePhoto = async () => {
    if (!pendingFile) return;

    setIsSaving(true);

    try {
      const res = await profileService.uploadProfileImage(id, pendingFile);

      if (!res.success) {
        alert(res.error || 'Failed to upload image. Please try again.');
        return;
      }

      // Use the base64 returned directly from the upload response — no need to re-fetch
      const savedImage = res.data?.profile_image;
      if (savedImage) {
        setProfileImage(savedImage);
        try { localStorage.setItem('profileImage', savedImage); } catch (_) { /* quota exceeded — skip */ }
      } else {
        // Fallback: re-fetch profile
        const userRes = await profileService.getUserDetails(id);
        if (userRes.success && userRes.data?.profile_image) {
          const img = toAbsoluteImageUrl(userRes.data.profile_image);
          setProfileImage(img);
          try { localStorage.setItem('profileImage', img); } catch (_) {}
          setUserDetails(userRes.data);
        }
      }

      setPendingFile(null);
    } catch (err) {
      console.error('Error saving profile image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel – discard the pending selection
  const handleCancelPhoto = () => {
    setPendingFile(null);
  };

  const getGenderIcon = (gender) => {
    if (gender?.toLowerCase() === 'female') return faVenus;
    if (gender?.toLowerCase() === 'male') return faMars;
    return faUser;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100">
        <Navbar page="profile" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100">
        <Navbar page="profile" />
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100">
        <Navbar page="profile" />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600">No user data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100">
      <Navbar page="profile" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">


          {/* Profile Info */}
          <div className="relative px-8 pb-8">
            {/* Profile Picture */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end mb-6">
              <div className="relative z-10">
                <ImgUpload
                  src={loadingImage ? null : profileImage}
                  isLoading={loadingImage}
                  pendingFile={pendingFile}
                  onFileSelect={handleFileSelect}
                  onSave={handleSavePhoto}
                  onCancel={handleCancelPhoto}
                  isSaving={isSaving}
                />
              </div>

              <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-1">
                      {userDetails?.username || "User"}
                    </h2>
                    <p className="text-gray-600 text-lg">{userDetails?.profession || "Learner"}</p>
                    {userDetails?.location && (<div className="flex items-center text-gray-500 mt-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-sm" />
                      {userDetails?.location}
                    </div>)}
                  </div>

                  <button
                    onClick={handleEditProfile}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {(userDetails?.linkedin_url || userDetails?.github_url) && (
              <div className="flex gap-4 mb-6">
                {userDetails?.linkedin_url && (
                  <a
                    href={userDetails.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faLinkedin} />
                    LinkedIn
                  </a>
                )}
                {userDetails?.github_url && (
                  <a
                    href={userDetails.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faGithub} />
                    GitHub
                  </a>
                )}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "overview"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                <FontAwesomeIcon icon={faUser} />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("performance")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "performance"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                <FontAwesomeIcon icon={faTrophy} />
                Performance
              </button>
            </div>
          </div>
        </div>

        {activeTab === "overview" ? (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-indigo-600" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard
                  icon={faEnvelope}
                  label="Email Address"
                  value={userDetails?.email}
                  iconColor="text-red-500"
                />
                <InfoCard
                  icon={faPhone}
                  label="Phone Number"
                  value={userDetails?.mobileNumber}
                  iconColor="text-green-500"
                />
                <InfoCard
                  icon={getGenderIcon(userDetails?.gender)}
                  label="Gender"
                  value={userDetails?.gender}
                  iconColor="text-purple-500"
                />
                <InfoCard
                  icon={faCalendar}
                  label="Date of Birth"
                  value={userDetails?.dob}
                  iconColor="text-blue-500"
                />
                <InfoCard
                  icon={faBriefcase}
                  label="Profession"
                  value={userDetails?.profession}
                  iconColor="text-orange-500"
                />
                <InfoCard
                  icon={faBookOpen}
                  label="Learning Courses"
                  value={userDetails?.learningCourses?.length || 0}
                  iconColor="text-indigo-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <Performance />
        )}
      </div>

      <EditProfileModal
        visible={isEditModalVisible}
        onCancel={handleModalClose}
        userDetails={userDetails}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
}

function InfoCard({ icon, label, value, iconColor = "text-gray-400" }) {
  return (
    <div className="group p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100">
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${iconColor}`}>
          <FontAwesomeIcon icon={icon} className="text-lg" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-600 mb-1">{label}</h4>
          <p className="text-gray-900 group-hover:text-indigo-600 transition-colors">
            {value || "Not specified"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Profile;