import { Outlet } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { AssignmentsProvider } from '../context/AssignmentsContext';
import { InventoryProvider } from '../context/InventoryContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <AssignmentsProvider>
          <Outlet />
        </AssignmentsProvider>
      </InventoryProvider>
    </AuthProvider>
  );
}
