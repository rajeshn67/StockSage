import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const Profile = () => {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const [form, setForm] = useState({
    name: "",
    shopName: "",
    phone: "",
    address: "",
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || "",
        shopName: user.shopName || "",
        phone: user.phone || "",
        address: user.address || "",
        oldPassword: "",
        password: "",
        confirmPassword: "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Password validation
    if ((form.password || form.confirmPassword || form.oldPassword) && form.password !== form.confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }
    if ((form.password || form.confirmPassword || form.oldPassword) && !form.oldPassword) {
      setError("Please enter your old password to change password");
      setLoading(false);
      return;
    }

    // Only send password fields if filled
    const payload = { ...form };
    if (!form.password) delete payload.password;
    if (!form.oldPassword) delete payload.oldPassword;
    if (!form.confirmPassword) delete payload.confirmPassword;

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setSuccess(data.message || "Profile updated successfully!");
      setForm((prev) => ({ ...prev, oldPassword: "", password: "", confirmPassword: "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            minLength={2}
            maxLength={50}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Shop Name</label>
          <input
            type="text"
            name="shopName"
            value={form.shopName}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            minLength={2}
            maxLength={100}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Phone</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            pattern="^[0-9]{10}$"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            minLength={10}
            maxLength={200}
            required
          />
        </div>

        {/* Change Password Section */}
        <div className="pt-4 border-t mt-6">
          <h3 className="text-lg font-semibold mb-2">Change Password</h3>
          <div className="mb-2">
            <label className="block mb-1 font-medium">Old Password</label>
            <input
              type="password"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              autoComplete="current-password"
              minLength={6}
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-medium">New Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              autoComplete="new-password"
              minLength={6}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              autoComplete="new-password"
              minLength={6}
            />
          </div>
        </div>

        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-500">{success}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
