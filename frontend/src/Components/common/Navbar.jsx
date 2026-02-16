import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faChalkboardUser } from "@fortawesome/free-solid-svg-icons";
import { authService } from "../../api/auth.service";

function Navbar(props) {
  const value = props.page;
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isUserAuthenticated());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogOut = async () => {
    await authService.logout();
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div>
      <nav className="bg-white/95 backdrop-blur-md w-full flex flex-row justify-between items-center px-[4vw] py-2 shadow-lg sticky top-0 z-[999]">
        <div className="flex items-center justify-center cursor-pointer" onClick={() => navigate("/")}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">N2</span>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-none">
                E-Learning
              </h1>
              <p className="text-xs text-gray-500 font-medium">Learn. Grow. Succeed.</p>
            </div>
          </div>
        </div>
        <div className="flex">
          <div id="menu-btn" className="hidden">
            <div className="menu-dash" onClick={toggleMobileMenu}>
              &#9776;
            </div>
          </div>
          <i
            id="menu-close"
            className="fas fa-times hidden"
            onClick={closeMobileMenu}
          ></i>
          <ul className={`flex justify-end items-center ${isMobileMenuOpen ? "active" : ""}`}>
            {isMobileMenuOpen && (
              <li className="close-button">
                <button onClick={closeMobileMenu}>X</button>
              </li>
            )}
            {value === "home" ? (
              <li className="list-none ml-5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-md">
                <Link 
                  to={"/"} 
                  className="no-underline text-white text-[17px] font-bold transition-all duration-300 ease-in-out px-4 py-2 block hover:scale-105"
                >
                  Home
                </Link>
              </li>
            ) : (
              <li className="list-none ml-5">
                <Link 
                  to={"/"}
                  className="no-underline text-gray-700 text-[17px] font-bold transition-all duration-300 ease-in-out hover:text-purple-600 px-2"
                >
                  Home
                </Link>
              </li>
            )}
            {value === "courses" ? (
              <li className="list-none ml-5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-md">
                <Link
                  to={"/courses"}
                  className="no-underline text-white text-[17px] font-bold transition-all duration-300 ease-in-out px-4 py-2 block hover:scale-105"
                >
                  Courses
                </Link>
              </li>
            ) : (
              <li className="list-none ml-5">
                <Link 
                  to={"/courses"}
                  className="no-underline text-gray-700 text-[17px] font-bold transition-all duration-300 ease-in-out hover:text-purple-600 px-2"
                >
                  Courses
                </Link>
              </li>
            )}
            {isAuthenticated  ? (
              value === "profile" ? (
                <li className="list-none ml-5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-md">
                  <Link
                    to={"/profile"}
                    className="no-underline text-white text-[17px] font-bold transition-all duration-300 ease-in-out px-4 py-2 block hover:scale-105"
                  >
                    Profile
                    <FontAwesomeIcon icon={faUser} className="ml-2" />
                  </Link>
                </li>
              ) : (
                <li className="list-none ml-5">
                  <Link 
                    to={"/profile"}
                    className="no-underline text-gray-700 text-[17px] font-bold transition-all duration-300 ease-in-out hover:text-purple-600 px-2"
                  >
                    Profile
                    <FontAwesomeIcon icon={faUser} className="ml-2" />
                  </Link>
                </li>
              )
            ) : (
              <></>
            )}
            {isAuthenticated ? (
              value === "learnings" ? (
                <li className="list-none ml-5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-md">
                  <Link
                    to={"/learnings"}
                    className="no-underline text-white text-[17px] font-bold transition-all duration-300 ease-in-out px-4 py-2 block hover:scale-105"
                  >
                    Learnings
                    <FontAwesomeIcon icon={faChalkboardUser} className="ml-2" />
                  </Link>
                </li>
              ) : (
                <li className="list-none ml-5">
                  <Link 
                    to={"/learnings"}
                    className="no-underline text-gray-700 text-[17px] font-bold transition-all duration-300 ease-in-out hover:text-purple-600 px-2"
                  >
                    Learnings
                    <FontAwesomeIcon icon={faChalkboardUser} className="ml-2" />
                  </Link>
                </li>
              )
            ) : (
              <></>
            )}
            {isAuthenticated ? (
              <li className="list-none ml-5">
                <button 
                  onClick={handleLogOut} 
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 border-none rounded-xl text-white text-[15px] font-bold cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105"
                >
                  Sign Out
                </button>
              </li>
            ) : (
              <li className="list-none ml-5">
                <button 
                  onClick={() => navigate("/login")}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 border-none rounded-xl text-white text-[15px] font-bold cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105"
                >
                  Login/SignUp
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;