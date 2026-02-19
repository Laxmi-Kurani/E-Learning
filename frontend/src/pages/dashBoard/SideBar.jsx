import img1 from "../../assets/images/user.png";
import { useNavigate } from "react-router-dom";
import { authService } from "../../api/auth.service";

function SideBar({ current, onSelect }) {
  const navigate = useNavigate();
  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: "bx bxs-dashboard" },
    { key: "user", label: "Users", icon: "bx bxs-group" },
    { key: "courses", label: "Courses", icon: "bx bxs-book" },
    { key: "enrollments", label: "Enrollments", icon: "bx bxs-user-check" },
  ];

  return (
    <div className="bg-white shadow-lg flex flex-col p-4 px-10 min-h-screen">
      <div
        className="flex items-center gap-3 px-3 py-5 border-b border-gray-200 cursor-pointer"
        onClick={() => onSelect("dashboard")}
      >
        <img src={img1} alt="Admin Logo" className="w-10 h-10 rounded-full" />
        <span className="text-lg font-semibold text-blue-900">LMS Admin</span>
      </div>
      <ul className="flex flex-col mt-6">
        {menuItems.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => onSelect(item.key)}
              className={`w-full flex items-center gap-3 p-3 transition-colors rounded-lg mx-3 mb-3 text-left ${
                current === item.key
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i className={`${item.icon} text-lg`} />
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-auto px-4 py-4">
        <button
          onClick={async () => {
            await authService.logout();
            navigate('/login');
          }}
          className="w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-red-500 text-white hover:bg-red-600"
        >
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default SideBar;
