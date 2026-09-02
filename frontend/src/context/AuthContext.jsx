/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";

import { authApi } from "../api/client";
import { getAccess, setTokens, clearTokens } from "../api/axios";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(
        () => Boolean(getAccess())
    );
    const [loading, setLoading] = useState(Boolean(getAccess()));


    const loadUser = useCallback(async () => {
        try {
            const me = await authApi.me();
            setUser(me);
            setIsAuthenticated(true);
        } catch {
            clearTokens();
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        if (getAccess()) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, [loadUser]);


    const login = useCallback(async (username, password) => {
        const data = await authApi.login(username, password);
        setTokens({ access: data.access, refresh: data.refresh });
        await loadUser();
    }, [loadUser]);


    const register = useCallback(async (payload) => {
        await authApi.register(payload);
        await login(payload.username, payload.password);
    }, [login]);


    const logout = useCallback(() => {
        clearTokens();
        setIsAuthenticated(false);
        setUser(null);
    }, []);


    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                isAuthenticated,
                loading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
