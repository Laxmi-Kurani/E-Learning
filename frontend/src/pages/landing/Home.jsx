import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/common/Navbar";
import Footer from "../../Components/common/Footer";
import { faGraduationCap, faAward, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import c1 from "../../assets/images/c1.jpg";
import c2 from "../../assets/images/html.png";
import c3 from "../../assets/images/sql.jpg";
import c4 from "../../assets/images/python.jpg";
import c5 from "../../assets/images/java.png";
import c6 from "../../assets/images/css.png";
import bannerImg from "../../assets/images/home-banner.png";

function Home() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((distance / 1000 / 60) % 60),
        seconds: Math.floor((distance / 1000) % 60),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const courses = [
    { id: 1, title: "JavaScript Beginner Course", img: c1, price: 499 },
    { id: 2, title: "HTML Complete Course", img: c2, price: 499 },
    { id: 3, title: "SQL Beginner Course", img: c3, price: 499 },
    { id: 4, title: "Python Master Course", img: c4, price: 499 },
    { id: 5, title: "Java Essentials", img: c5, price: 499 },
    { id: 6, title: "CSS Complete Course", img: c6, price: 499 },
  ];

  const featureData = [
    {
      icon: faGraduationCap,
      title: "Scholarship Facility",
      desc: "Originality is the essence of true scholarship.",
      color: "primary"
    },
    {
      icon: faStar,
      title: "Valuable Courses",
      desc: "Online education is like a rising tide—it lifts all boats.",
      color: "warning"
    },
    {
      icon: faAward,
      title: "Global Certification",
      desc: "A certificate without knowledge is like a gun without bullets.",
      color: "accent"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen">
      <Navbar page="home" />

      {/* Hero Section */}
      <section className="relative text-center px-6 min-h-screen overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src={bannerImg}
            alt="E-Learning Banner"
            className="w-full h-full object-cover blur-sm opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-indigo-900/40"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(0,0,0,0))]"></div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="mb-6 inline-block">
            <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
              🎓 Transform Your Future Today
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 animate-fadeInUp">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Enhance Your Future with
            </span>
            <br />
            <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mt-4 block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-2xl">
              E-Learning
            </span>
          </h1>
          
          <p className="text-gray-700 max-w-3xl mx-auto text-lg md:text-xl lg:text-2xl mb-10 animate-fadeInUp delay-200 font-medium leading-relaxed">
            Unlock your potential with world-class courses, industry-recognized certifications, and cutting-edge skills to accelerate your career journey.
          </p>
          
          <div className="mt-10 flex flex-wrap justify-center gap-4 animate-fadeInUp delay-400">
            <button
              onClick={() => navigate("/courses")}
              className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 transform"
            >
              <span className="flex items-center gap-2">
                Explore Courses
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            <a
              href="#features"
              className="px-8 py-4 rounded-2xl bg-white/90 backdrop-blur-sm text-purple-600 font-bold text-lg shadow-xl hover:bg-white hover:shadow-2xl hover:scale-105 transition-all duration-300 transform border-2 border-purple-200"
            >
              Learn More
            </a>
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { number: "50K+", label: "Students" },
              { number: "200+", label: "Courses" },
              { number: "95%", label: "Success Rate" },
              { number: "24/7", label: "Support" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-semibold mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="px-6 py-20 text-center bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 text-sm font-bold rounded-full">
              ✨ Why Choose Us
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Awesome Features
          </h1>
          <p className="text-gray-600 text-lg mb-16 max-w-2xl mx-auto">
            Discover the perfect opportunity to enhance yourself with our comprehensive learning platform
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 md:px-12">
            {featureData.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-white to-gray-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FontAwesomeIcon
                      icon={feature.icon}
                      className="text-white text-3xl"
                    />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 text-gray-800 group-hover:text-purple-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="course" className="px-6 py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 text-sm font-bold rounded-full">
              🔥 Trending Now
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Our Popular Courses
          </h1>
          <p className="text-gray-600 text-lg text-center mb-16">
            Join 10,000+ students already learning with us
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:px-12">
            {courses.map((course) => (
              <div
                key={course.id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={course.img}
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    Bestseller
                  </div>
                </div>
                
                <div className="p-6">
                  <h6 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-purple-600 transition-colors">
                    {course.title}
                  </h6>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FontAwesomeIcon key={i} icon={faStar} className="text-sm" />
                      ))}
                    </div>
                    <span className="ml-2 text-gray-500 text-sm font-medium">(239 reviews)</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ₹{course.price}
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105">
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Section with Timer */}
      <section className="relative px-6 py-24 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative z-10 max-w-4xl">
          <div className="mb-6">
            <span className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-black rounded-full shadow-2xl animate-pulse">
              🎉 LIMITED TIME OFFER
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-white drop-shadow-2xl">
            Get 100 Online Courses for Free
          </h1>
          
          <p className="mb-4 text-xl md:text-2xl font-bold text-yellow-300">
            Register Now and Unlock Your Learning Journey
          </p>
          
          <p className="mb-12 text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Join thousands of learners and access our top courses for free. Enhance your skills, earn certifications, and grow your future with E-Learning.
          </p>

          <div className="flex flex-wrap md:gap-6 gap-3 justify-center mb-10">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Minutes", value: timeLeft.minutes },
              { label: "Seconds", value: timeLeft.seconds },
            ].map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center bg-white/95 backdrop-blur-md md:px-10 md:py-8 px-6 py-4 rounded-3xl shadow-2xl hover:scale-110 transition-transform duration-300"
              >
                <p className="text-4xl md:text-6xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {String(item.value).padStart(2, '0')}
                </p>
                <span className="text-sm md:text-base font-bold mt-2 tracking-wide text-gray-600 uppercase">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/register")}
            className="px-10 py-5 bg-white text-purple-600 rounded-2xl font-black text-xl shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all duration-300 transform"
          >
            Register Now - It's Free! 🚀
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
