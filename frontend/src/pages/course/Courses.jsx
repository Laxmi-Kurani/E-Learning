import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../../Components/common/Navbar";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { courseService } from "../../api/course.service";
import { learningService } from "../../api/learning.service";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");
  const [displayCount, setDisplayCount] = useState(6);
  
  const userId = localStorage.getItem("id");
  const authToken = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await courseService.getAllCourses();
        if (coursesRes.success) setCourses(coursesRes.data);

        // Only fetch enrollments if user is logged in
        if (userId && authToken) {
          const enrollmentsRes = await learningService.getEnrollments(userId);
          if (enrollmentsRes.success) {
            // Map to course IDs - handle both 'id' and 'course_id' fields
            const enrolledIds = enrollmentsRes.data.map((item) => item.course_id || item.id);
            setEnrolled(enrolledIds);
            console.log('Enrolled course IDs:', enrolledIds); // Debug log
          }
        }
      } catch (err) {
        console.error("Error loading courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, authToken]);

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses.filter(course => {
      const matchesSearch = (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (course.instructor || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterBy === "enrolled") return matchesSearch && enrolled.includes(course.id);
      if (filterBy === "available") return matchesSearch && !enrolled.includes(course.id);
      return matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.title || '').localeCompare(b.title || '');
        case "instructor":
          return (a.instructor || '').localeCompare(b.instructor || '');
        case "price":
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          return priceA - priceB;
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, searchTerm, sortBy, filterBy, enrolled]);

  const displayedCourses = filteredAndSortedCourses.slice(0, displayCount);

  const enrollCourse = async (courseId) => {
    if (!authToken) {
      message.info("Please login to enroll in this course");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    // Check if already enrolled
    if (enrolled.includes(courseId)) {
      message.warning("You are already enrolled in this course");
      return;
    }

    const res = await learningService.enrollCourse(userId, courseId);
    if (res.success) {
      message.success("Enrollment request submitted! Waiting for admin approval.");
      // Refresh enrollments instead of full page reload
      const enrollmentsRes = await learningService.getEnrollments(userId);
      if (enrollmentsRes.success) {
        const enrolledIds = enrollmentsRes.data.map((item) => item.course_id || item.id);
        setEnrolled(enrolledIds);
      }
    } else {
      message.error(res.error || "Failed to enroll in course");
    }
  };

  const handleCourseClick = (courseId) => {
    if (!authToken) {
      message.info("Please login to view course details");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }
    navigate(`/course/${courseId}`);
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + 6);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar page="courses" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search courses or instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="name">Sort by Name</option>
                <option value="instructor">Sort by Instructor</option>
                <option value="price">Sort by Price</option>
              </select>
              
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All Courses</option>
                <option value="available">Available</option>
                <option value="enrolled">Enrolled</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {displayedCourses.length} of {filteredAndSortedCourses.length} courses</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAndSortedCourses.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">No courses found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {displayedCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl shadow-lg border-0 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group backdrop-blur-sm cursor-pointer"
                  onClick={() => handleCourseClick(course.id)}
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={course.image_url} 
                      alt={course.title} 
                      className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-200" 
                    />
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                        ${course.price}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                      {course.title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-6 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      by {course.instructor || 'Unknown'}
                    </p>

                    {authToken && enrolled.includes(course.id) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/learnings");
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-semibold hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border border-green-200 shadow-md hover:shadow-lg"
                      >
                        ✓ Enrolled - View in My Learnings
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          enrollCourse(course.id);
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {authToken ? 'Enroll Now' : 'Login to Enroll'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {displayedCourses.length < filteredAndSortedCourses.length && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                >
                  Load More Courses
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Courses;