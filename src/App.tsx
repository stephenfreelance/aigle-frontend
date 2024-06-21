// App.tsx
import { AUTH_ME_ENDPOINT } from '@/api-endpoints';
import { User } from '@/models/user';
import Map from '@/routes/Map/index.tsx';
import CollectiviteList from '@/routes/admin/collectivite/CollectiviteList';
import ObjectTypeCategoryForm from '@/routes/admin/object-type-category/ObjectTypeCategoryForm';
import ObjectTypeCategoryList from '@/routes/admin/object-type-category/ObjectTypeCategoryList';
import ObjectTypeForm from '@/routes/admin/object-type/ObjectTypeForm';
import ObjectTypeList from '@/routes/admin/object-type/ObjectTypeList';
import TileSetForm from '@/routes/admin/tile-set/TileSetForm';
import TileSetList from '@/routes/admin/tile-set/TileSetList';
import UserGroupForm from '@/routes/admin/user-group/UserGroupForm';
import UserGroupList from '@/routes/admin/user-group/UserGroupList';
import UserForm from '@/routes/admin/user/UserForm';
import UserList from '@/routes/admin/user/UserList';
import Login from '@/routes/auth/Login';
import ResetPassword from '@/routes/auth/ResetPassword';
import ResetPasswordConfirmation from '@/routes/auth/ResetPasswordConfirmation';
import ProtectedRoute from '@/utils/ProtectedRoute';
import api from '@/utils/api';
import { useAuth } from '@/utils/auth-context';
import { DEFAULT_ROUTE } from '@/utils/constants';
import React, { useCallback, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

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
                <Route path="/login" element={isAuthenticated_ ? <Navigate to={DEFAULT_ROUTE} /> : <Login />} />
                <Route
                    path="/reset-password/:uid/:token"
                    element={isAuthenticated_ ? <Navigate to={DEFAULT_ROUTE} /> : <ResetPasswordConfirmation />}
                />
                <Route
                    path="/reset-password"
                    element={isAuthenticated_ ? <Navigate to={DEFAULT_ROUTE} /> : <ResetPassword />}
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
                    path="/admin/users/form/:uuid"
                    element={
                        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                            <UserForm />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/user-groups"
                    element={
                        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                            <UserGroupList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/user-groups/form"
                    element={
                        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                            <UserGroupForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/user-groups/form/:uuid"
                    element={
                        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                            <UserGroupForm />
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

                <Route
                    path="/admin/object-type-categories"
                    element={
                        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                            <ObjectTypeCategoryList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/object-type-categories/form"
                    element={
                        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                            <ObjectTypeCategoryForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/object-type-categories/form/:uuid"
                    element={
                        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                            <ObjectTypeCategoryForm />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/tile-sets"
                    element={
                        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                            <TileSetList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/tile-sets/form"
                    element={
                        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                            <TileSetForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/tile-sets/form/:uuid"
                    element={
                        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                            <TileSetForm />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
};

export default App;
