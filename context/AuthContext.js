"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [watchLater, setWatchLater] = useState([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for saved user on mount
  useEffect(() => {
    const savedUsername = Cookies.get("movielab_user");
    if (savedUsername) {
      login(savedUsername);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/login", { username });
      if (res.data.success) {
        setUser(res.data.user);
        setWatchLater(res.data.user.watchLater || []);
        Cookies.set("movielab_user", username, { expires: 365 }); // Persist for 1 year
        setIsLoginModalOpen(false);
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setWatchLater([]);
    Cookies.remove("movielab_user");
  };

  const toggleWatchLater = async (movie) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    const isSaved = watchLater.some((m) => m.id === movie.id.toString());

    try {
      let res;
      if (isSaved) {
        // Remove
        res = await axios.delete("/api/user/watch-later", {
          data: { username: user.username, movieId: movie.id },
        });
      } else {
        // Add
        res = await axios.post("/api/user/watch-later", {
          username: user.username,
          movie: {
            id: movie.id,
            title: movie.title || movie.name,
            poster_path: movie.poster_path,
            media_type: movie.media_type,
            vote_average: movie.vote_average,
            release_date: movie.release_date || movie.first_air_date,
          },
        });
      }

      if (res.data.success) {
        setWatchLater(res.data.list);
      }
    } catch (error) {
      console.error("Error updating watch later:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        watchLater,
        login,
        logout,
        toggleWatchLater,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
