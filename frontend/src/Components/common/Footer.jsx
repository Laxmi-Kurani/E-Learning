import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faInstagram,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";

function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-gray-300 py-16 px-6 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Top Section - Brand & Description */}
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            E-Learning
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl">
            Empowering learners worldwide with cutting-edge courses and certifications. 
            Transform your career with industry-leading education.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Master Courses */}
          <div className="group">
            <div className="flex items-center mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
              <h3 className="text-xl font-bold text-white">
                Master Courses
              </h3>
            </div>
            <ul className="space-y-3">
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Web Development
              </li>
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Programming
              </li>
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Machine Learning
              </li>
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Project Fundamentals
              </li>
            </ul>
          </div>

          {/* Intermediate Courses */}
          <div className="group">
            <div className="flex items-center mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-3"></div>
              <h3 className="text-xl font-bold text-white">
                Intermediate Courses
              </h3>
            </div>
            <ul className="space-y-3">
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Web Development
              </li>
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Programming
              </li>
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Machine Learning
              </li>
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Project Fundamentals
              </li>
            </ul>
          </div>

          {/* Beginner Courses */}
          <div className="group">
            <div className="flex items-center mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-red-500 rounded-full mr-3"></div>
              <h3 className="text-xl font-bold text-white">
                Beginner Courses
              </h3>
            </div>
            <ul className="space-y-3">
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Web Development
              </li>
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Programming
              </li>
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Machine Learning
              </li>
              <li className="hover:text-white cursor-pointer transition-all duration-300 hover:translate-x-2 flex items-center">
                <span className="mr-2">→</span> Project Fundamentals
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <div className="flex items-center mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full mr-3"></div>
              <h3 className="text-xl font-bold text-white">
                Stay Connected
              </h3>
            </div>
            <p className="text-gray-400 mb-4 text-sm">
              Subscribe to get updates on new courses and special offers.
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright + Socials */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} <span className="font-bold text-white">E-Learning</span>. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Designed by Akxay • Empowering Education Worldwide
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden md:block">Follow us:</span>
            <div className="flex space-x-3">
              <a
                href="#"
                className="group w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50"
              >
                <FontAwesomeIcon icon={faFacebookF} className="group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="#"
                className="group w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/50"
              >
                <FontAwesomeIcon icon={faInstagram} className="group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="#"
                className="group w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50"
              >
                <FontAwesomeIcon icon={faLinkedinIn} className="group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;