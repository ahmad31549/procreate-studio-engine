import React, { useState, useEffect, useCallback } from "react";
import { Head } from "@inertiajs/react";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export default function AdminDashboard() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [jobs, setJobs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch(`${API_BASE}/admin/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem("adminToken", data.access_token);
    } catch (err) {
      alert(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    setToken(null);
    localStorage.removeItem("adminToken");
    setJobs([]);
    setActivities([]);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [jobsRes, actRes] = await Promise.all([
        fetch(`${API_BASE}/admin/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (jobsRes.status === 401 || actRes.status === 401) {
        handleLogout();
        return;
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(Object.values(jobsData));
      }

      if (actRes.ok) {
        setActivities(await actRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  }, [token, handleLogout]);

  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, fetchDashboardData]);

  if (!token) {
    return (
      <div className="loginWrapper">
        <Head title="Admin Login" />
        <div className="loginBox">
          <div className="loginContent">
            <h2 style={{ color: "white", marginBottom: "2rem" }}>
              Procreate Rebrand Studio Admin
            </h2>
            <form onSubmit={handleLogin}>
              <div className="inputGroup">
                <input
                  type="text"
                  placeholder="Username"
                  className="inputField"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="inputGroup">
                <input
                  type="password"
                  placeholder="Password"
                  className="inputField"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="loginBtn"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Login Securely"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adminContainer">
      <Head title="Admin Dashboard" />
      <header className="header">
        <h1 className="title">Procreate Rebrand Studio Admin</h1>
        <button onClick={handleLogout} className="logoutBtn">
          Sign Out
        </button>
      </header>

      <main className="mainContent">
        <section className="card">
          <h2 className="cardTitle">
            <div className="statusIndicator"></div>
            Operational Data Pipeline
          </h2>
          <ul className="list">
            {jobs.length === 0 ? (
              <li style={{ color: "#94a3b8" }}>No jobs found.</li>
            ) : (
              jobs
                .sort((a, b) => b.created_at - a.created_at)
                .slice(0, 5)
                .map((job) => (
                  <li key={job.id} className="listItem">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      <span style={{ color: "white", fontWeight: 500 }}>
                        {job.id.substring(0, 8)}...
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                        {new Date((job.created_at || 0) * 1000).toLocaleString()}
                      </span>
                    </div>
                    <span className={`badge ${job.status || ""}`}>
                      {job.status}
                    </span>
                  </li>
                ))
            )}
          </ul>
        </section>

        <section className="card">
          <h2 className="cardTitle">System Activity & Security Log</h2>
          <ul className="list">
            {activities.length === 0 ? (
              <li style={{ color: "#94a3b8" }}>No activities recorded.</li>
            ) : (
              activities.map((act, i) => (
                <li key={i} className="listItem" style={{ gap: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        color: "#e2e8f0",
                        fontWeight: 500,
                        textTransform: "capitalize",
                      }}
                    >
                      {act.action.replace("_", " ")}
                    </span>
                    <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                      IP: {act.details?.ip || "unknown"}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      className="badge"
                      style={{
                        background: "linear-gradient(135deg, #10b981, #34d399)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {act.admin_user}
                    </span>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "0.75rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      {new Date(act.timestamp * 1000).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
