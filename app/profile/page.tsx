"use client";

import React, {useState, useEffect} from "react";
import axios from "axios";
import {Card, CardContent, CardFooter} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {toast} from "sonner"; // ✅ Toast notifications


const api = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true,
});

export default function AdminProfilePage() {

  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    profileImage: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [passwordError, setPasswordError] = useState("");


  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setFetchingProfile(true);
        const response = await api.get("/admin/profile");
        console.log("Fetched Profile:", response.data);

        const profileData = response.data.data;

        setProfile({
          name: profileData.name || "",
          phone: profileData.phone || "",
          email: profileData.email || "",
          profileImage: profileData.profileImage || "",
        });
      } catch(err) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load profile.");
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchProfile();
  }, []);


  const handleUpdateProfile = async () => {
    try {
      setProfileLoading(true);
      const payload = {
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        profileImage: profile.profileImage,
      };
      const response = await api.put("/admin/profile", payload);
      setProfile(response.data.data || response.data);
      toast.success("Profile updated successfully!");
    } catch(err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };


  const handleChangePassword = async () => {

    if(passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    } else {
      setPasswordError("");
    }

    try {
      setPasswordLoading(true);
      await api.put("/admin/change-password", passwordData);
      toast.success("Password changed successfully!");
      setPasswordData({currentPassword: "", newPassword: ""});
    } catch(err: any) {
      console.error("Error changing password:", err);
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };


  const avatarUrl =
    profile.profileImage && profile.profileImage.startsWith("http")
      ? profile.profileImage
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        profile.name || "Admin"
      )}&background=E11D48&color=fff&size=128`;

  //loading screen
  if(fetchingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-100 via-white to-pink-50">
        <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-pink-700 text-lg font-medium tracking-wide animate-pulse">
          Loading profile...
        </p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50 flex items-center justify-center ">
      <Card className="flex flex-col md:flex-row w-full max-w-5xl shadow-2xl rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-lg transition-transform hover:-translate-y-2 duration-300">

        {/* Left Side */}
        <div
          className="w-full md:w-1/3 flex flex-col items-center justify-center space-y-8 rounded-l-2xl text-white"
          style={{
            background: "linear-gradient(to bottom, #DB2777, #BE185D, #9D174D)",
          }}
        >
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-xl transition-transform hover:scale-105 duration-300"
          />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{profile.name || "Admin User"}</h2>
            <p className="text-sm opacity-90">System Administrator</p>
          </div>
        </div>

        {/* Right Side profile info*/}
        <CardContent className="w-full md:w-2/3 p-10 space-y-12">


          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-700 border-b pb-3">
              Profile Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label>Name</Label>
                <Input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({...profile, name: e.target.value})
                  }
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={profile.phone || ""}
                  onChange={(e) =>
                    setProfile({...profile, phone: e.target.value})
                  }
                  placeholder="Enter phone number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={profile.email}
                  readOnly
                  className="mt-1 bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Profile Image URL</Label>
                <Input
                  value={profile.profileImage}
                  onChange={(e) =>
                    setProfile({...profile, profileImage: e.target.value})
                  }
                  placeholder="Enter image URL"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleUpdateProfile}
                disabled={profileLoading}
                className="bg-pink-600 hover:bg-pink-700 text-white font-medium shadow-lg transition-transform hover:-translate-y-0.5 duration-200"
              >
                {profileLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </section>

          {/* Password Change Section */}
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-700 border-b pb-3">
              Change Password
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Enter current password"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Enter new password"
                  className="mt-1"
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="bg-pink-600 hover:bg-pink-700 text-white font-medium shadow-lg transition-transform hover:-translate-y-0.5 duration-200"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </section>
        </CardContent>

        <CardFooter />
      </Card>
    </div>
  );
}
