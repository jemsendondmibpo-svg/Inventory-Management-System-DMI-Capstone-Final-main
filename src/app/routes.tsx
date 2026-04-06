import { createBrowserRouter } from "react-router";
import RootLayout from "./layout/RootLayout";
import Root from "./layout/Root";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Assignments from "./pages/Assignments";
import AddAssignment from "./pages/AddAssignment";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import RoleRoute from "./components/RoleRoute";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Login />,
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <Root />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <RoleRoute allowedRoles={["Admin", "IT Officers", "HR Officers"]}>
                <Dashboard />
              </RoleRoute>
            ),
          },
          {
            path: "inventory",
            element: (
              <RoleRoute allowedRoles={["Admin", "IT Officers", "HR Officers"]}>
                <Inventory />
              </RoleRoute>
            ),
          },
          {
            path: "assignments",
            element: (
              <RoleRoute allowedRoles={["Admin", "IT Officers", "HR Officers"]}>
                <Assignments />
              </RoleRoute>
            ),
          },
          { 
            path: "add-assignment",
            element: (
              <RoleRoute
                allowedRoles={["Admin", "IT Officers"]}
                message="Only Admin and IT Officers can create assignments."
              >
                <AddAssignment />
              </RoleRoute>
            ),
          },
          {
            path: "edit-assignment/:id",
            element: (
              <RoleRoute
                allowedRoles={["Admin", "IT Officers"]}
                message="Only Admin and IT Officers can edit assignments."
              >
                <AddAssignment />
              </RoleRoute>
            ),
          },
          {
            path: "reports",
            element: (
              <RoleRoute allowedRoles={["Admin", "IT Officers", "HR Officers"]}>
                <Reports />
              </RoleRoute>
            ),
          },
          { 
            path: "user-management", 
            element: (
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            ) 
          },
          {
            path: "settings",
            element: (
              <RoleRoute allowedRoles={["Admin", "IT Officers", "HR Officers"]}>
                <SettingsPage />
              </RoleRoute>
            ),
          },
        ],
      },
    ],
  },
]);
