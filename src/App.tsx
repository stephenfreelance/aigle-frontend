// App.tsx
import ProtectedRoute from '@/utils/ProtectedRoute';
import React, { useCallback, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import Login from '@/routes/Login/index.tsx';
import Map from '@/routes/Map/index.tsx';
import { DEFAULT_ROUTE } from '@/utils/constants';
import { useAuth } from '@/utils/auth';
import api from '@/utils/api';
import { User } from '@/models/user';
import { AUTH_ME_ENDPOINT } from '@/api-endpoints';
import UserList from '@/routes/admin/UserList';
import CollectiviteList from '@/routes/admin/CollectiviteList';
import UserForm from '@/routes/admin/UserForm';
import ObjectTypeList from '@/routes/admin/ObjectTypeList';
import ObjectTypeForm from '@/routes/admin/ObjectTypeForm';

const App: React.FC = () => {
  const { isAuthenticated, setUser } = useAuth();

  const isAuthenticated_ = isAuthenticated();

  const getUser = useCallback(async () => {
    try {
      const res = await api.get<User>(AUTH_ME_ENDPOINT);
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [setUser]);

  useEffect(() => {
    if (isAuthenticated_) {
      getUser();
    }
  }, [isAuthenticated_, getUser]);

  return (
    <Router>
      <Routes>
        <Route index element={<Navigate to="/map" replace />} />
        <Route
          path="/login"
          element={
            isAuthenticated_ ? <Navigate to={DEFAULT_ROUTE} /> : <Login />
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <Map />
            </ProtectedRoute>
          }
        />

        <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <UserList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/form"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <UserForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/collectivites"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <CollectiviteList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/object-types"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <ObjectTypeList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/object-types/form"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <ObjectTypeForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/object-types/form/:uuid"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <ObjectTypeForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
