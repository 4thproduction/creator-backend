import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Menu,
  LogOut,
  ContactRound,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../actions/authActions";
import logo from "../assets/cultmkt_logo.png";

const links = [
  {
    to: "/dashboard",
    label: "Dashboard",
    permission: "view_dashboard",
    icon: LayoutDashboard,
  },
  { to: "/users", label: "Users", permission: "read_user", icon: Users },
  { to: "/roles", label: "Roles", permission: "read_role", icon: Shield },
  {
    to: "/creators",
    label: "Creators",
    permission: "read_creator",
    icon: ContactRound,
  },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true",
  );
  const { userInfo } = useSelector((state) => state.auth);
  const permissions = userInfo?.user?.role?.permissions || [];

  const handleLogout = async () => {
    try { await dispatch(logout()); navigate("/", { replace: true }); }
    catch { window.alert("Could not sign out. Please try again."); }
  };

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const handleNavigation = (event, destination) => {
    setOpen(false);

    if (!collapsed) return;

    event.preventDefault();
    setCollapsed(false);
    localStorage.setItem("sidebar-collapsed", "false");
    window.setTimeout(() => navigate(destination), 300);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-30 rounded-xl border border-stone-200 bg-white p-2 text-stone-800 shadow-sm md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-stone-950/45 md:hidden"
        />
      )}
      <aside
        className={`portal-sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-stone-200 bg-[#f8f5ed] transition-[width,transform] duration-300 ease-in-out md:translate-x-0 ${collapsed ? "is-collapsed md:w-20" : "md:w-72"} ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex min-h-[76px] items-center border-b border-stone-200 px-6 transition-[padding] duration-300 ${collapsed ? "md:px-2" : "md:px-4"}`}
        >
          <div
            className={`flex w-full items-center overflow-hidden ${collapsed ? "md:justify-center" : "gap-3"}`}
          >
            <img
              src={logo}
              alt="CULTMKT"
              className={`h-10 w-10 shrink-0 rounded-xl shadow-sm ${collapsed ? "md:hidden" : ""}`}
            />
            <div
              className={`min-w-0 flex-1 whitespace-nowrap ${collapsed ? "md:hidden" : ""}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.19em] text-stone-600">
                Creator Network
              </p>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={
                collapsed ? "Expand navigation" : "Collapse navigation"
              }
              title={collapsed ? "Expand navigation" : "Collapse navigation"}
              className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-200 text-stone-700 transition-colors hover:bg-stone-300 hover:text-stone-900 md:flex ${collapsed ? "" : "ml-6"}`}
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
        <nav
          aria-label="Main navigation"
          className={`flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-4 py-7 transition-[padding] duration-300 ${collapsed ? "md:px-3" : ""}`}
        >
          <p
            className={`mb-4 overflow-hidden whitespace-nowrap px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500 transition-opacity duration-200 ${collapsed ? "md:opacity-0" : "opacity-100"}`}
          >
            Workspace
          </p>
          {links
            .filter((link) => permissions.includes(link.permission))
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={(event) => handleNavigation(event, link.to)}
                aria-label={collapsed ? link.label : undefined}
                title={collapsed ? link.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${collapsed ? "md:justify-center md:gap-0 md:px-3" : ""} ${isActive ? "bg-stone-800 text-white shadow-sm" : "text-stone-600 hover:bg-white hover:text-stone-900"}`
                }
              >
                <link.icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap opacity-100 transition-all duration-200 ${collapsed ? "md:w-0 md:opacity-0" : "w-auto"}`}
                >
                  {link.label}
                </span>
              </NavLink>
            ))}
        </nav>
        <div className="border-t border-stone-200 p-4">
          <div
            className={`mb-4 overflow-hidden rounded-xl border border-stone-200 bg-white p-3 opacity-100 transition-all duration-200 ${collapsed ? "md:h-0 md:border-0 md:p-0 md:opacity-0" : ""}`}
          >
            <p className="truncate text-sm font-semibold text-stone-800">
              {userInfo?.user?.name}
            </p>
            <p className="truncate text-xs text-stone-500">
              {userInfo?.user?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title={collapsed ? "Sign out" : undefined}
            className={`flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-red-700 transition-all hover:bg-red-50 ${collapsed ? "md:justify-center md:px-2" : ""}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span
              className={`ml-2 w-auto overflow-hidden whitespace-nowrap opacity-100 transition-all duration-200 ${collapsed ? "md:ml-0 md:w-0 md:opacity-0" : ""}`}
            >
              Sign out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
