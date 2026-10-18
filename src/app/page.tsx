
"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
};

type AuthMode = "login" | "signup" | "forgot" | "new-password";

const emptyTask = {
  title: "",
  description: "",
  priority: "medium" as Task["priority"],
  due_date: "",
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4f6fb",
    color: "#172033",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  centered: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    background: "#fff",
    border: "1px solid #e6e9f0",
    borderRadius: 18,
    padding: 28,
    boxShadow: "0 12px 36px rgba(30, 45, 80, .07)",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #d9deea",
    borderRadius: 9,
    marginTop: 6,
    marginBottom: 14,
    fontSize: 15,
    background: "#fff",
    color: "#172033",
  },
  button: {
    padding: "11px 16px",
    borderRadius: 9,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  secondary: {
    padding: "10px 13px",
    borderRadius: 9,
    border: "1px solid #d9deea",
    background: "#fff",
    color: "#26324b",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
  },
  muted: {
    color: "#667085",
    fontSize: 13,
  },
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [taskForm, setTaskForm] = useState(emptyTask);

  // Authentication listener
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("new-password");
        setMessage("Choose a new password for your account.");
      }

      setUser(session?.user ?? null);
    });

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) return;

        if (sessionError) {
          setError(sessionError.message);
        }

        setUser(data.session?.user ?? null);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // REAL-TIME TASK UPDATES
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setRealtimeStatus("disconnected");
      return;
    }

    let active = true;

    async function refreshTasks() {
      if (!active) return;

      setLoadingTasks(true);

      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTasks((data ?? []) as Task[]);
      }

      setLoadingTasks(false);
    }

    // Load existing tasks.
    void refreshTasks();

    // Subscribe to INSERT, UPDATE, and DELETE events.
    const channel = supabase
      .channel(`tasks-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          // Refresh the list whenever the database changes.
          void refreshTasks();
        }
      )
      .subscribe((status) => {
        if (!active) return;

        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeStatus("disconnected");
        } else {
          setRealtimeStatus("connecting");
        }
      });

    return () => {
      active = false;
      setRealtimeStatus("disconnected");
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setAuthLoading(true);

    try {
      if (authMode === "signup") {
        const { data, error: authError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
          });

        if (authError) throw authError;

        if (data.session) {
          setMessage("Account created successfully!");
        } else {
          setMessage(
            "Account created. Check your email to confirm your account, then log in."
          );
          setAuthMode("login");
        }
      } else if (authMode === "login") {
        const { error: authError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (authError) throw authError;

        setMessage("Login successful!");
      } else if (authMode === "forgot") {
        const { error: resetError } =
          await supabase.auth.resetPasswordForEmail(
            email.trim(),
            {
              redirectTo: window.location.origin,
            }
          );

        if (resetError) throw resetError;

        setMessage(
          "If an account exists for this email, a reset link has been sent. Check your inbox and spam folder."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleNewPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError(
        "Your new password must contain at least 6 characters."
      );
      return;
    }

    setAuthLoading(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) throw updateError;

      setNewPassword("");
      setPassword("");
      setAuthMode("login");

      const { error: logoutError } =
        await supabase.auth.signOut();

      if (logoutError) {
        setMessage(
          "Password updated successfully. Please log in again."
        );
      } else {
        setMessage(
          "Password updated successfully. You can now log in."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update password."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    setError("");

    const { error: logoutError } =
      await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    setUser(null);
    setTasks([]);
    setAuthMode("login");
    setMessage("You have logged out.");
  }

  function startNewTask() {
    setEditingId(null);
    setTaskForm({ ...emptyTask });
    setShowForm(true);
    setError("");
    setMessage("");
  }

  function startEdit(task: Task) {
    setEditingId(task.id);

    setTaskForm({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      due_date: task.due_date ?? "",
    });

    setShowForm(true);
    setError("");
    setMessage("");
  }

  async function saveTask(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user) return;

    if (!taskForm.title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    setTaskLoading(true);
    setError("");
    setMessage("");

    const values = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || null,
      priority: taskForm.priority,
      due_date: taskForm.due_date || null,
    };

    try {
      if (editingId) {
        const { data, error: updateError } = await supabase
          .from("tasks")
          .update(values)
          .eq("id", editingId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setTasks((previous) =>
          previous.map((task) =>
            task.id === editingId
              ? (data as Task)
              : task
          )
        );

        setMessage("Task updated successfully.");
      } else {
        const { data, error: insertError } = await supabase
          .from("tasks")
          .insert({
            ...values,
            user_id: user.id,
            status: "pending",
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setTasks((previous) => [
          data as Task,
          ...previous,
        ]);

        setMessage("Task created successfully.");
      }

      setTaskForm({ ...emptyTask });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save the task."
      );
    } finally {
      setTaskLoading(false);
    }
  }

  async function changeStatus(task: Task) {
    if (!user) return;

    const nextStatus: Task["status"] =
      task.status === "completed"
        ? "pending"
        : "completed";

    setError("");

    const { data, error: updateError } = await supabase
      .from("tasks")
      .update({ status: nextStatus })
      .eq("id", task.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id
          ? (data as Task)
          : item
      )
    );
  }

  async function deleteTask(task: Task) {
    if (!user) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    setError("");

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", task.id)
      .eq("user_id", user.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setTasks((previous) =>
      previous.filter((item) => item.id !== task.id)
    );

    setMessage("Task deleted successfully.");
  }

  const stats = useMemo(() => {
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;

    const pending = tasks.filter(
      (task) => task.status !== "completed"
    ).length;

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const overdue = tasks.filter(
      (task) =>
        task.status !== "completed" &&
        task.due_date &&
        task.due_date < today
    ).length;

    return {
      total: tasks.length,
      completed,
      pending,
      overdue,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const query = search.toLowerCase();

      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        (task.description ?? "")
          .toLowerCase()
          .includes(query);

      const today = new Date()
        .toISOString()
        .slice(0, 10);

      const matchesFilter =
        filter === "all" ||
        (filter === "pending" &&
          task.status === "pending") ||
        (filter === "in_progress" &&
          task.status === "in_progress") ||
        (filter === "completed" &&
          task.status === "completed") ||
        (filter === "overdue" &&
          task.status !== "completed" &&
          !!task.due_date &&
          task.due_date < today);

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, filter]);

  // LOGIN, SIGNUP, AND PASSWORD RESET SCREENS
  if (!user || authMode === "new-password") {
    const title =
      authMode === "signup"
        ? "Create your account"
        : authMode === "forgot"
          ? "Reset your password"
          : authMode === "new-password"
            ? "Choose a new password"
            : "Welcome back";

    return (
      <main style={styles.page}>
        <div style={styles.centered}>
          <section
            style={{
              ...styles.card,
              width: "100%",
              maxWidth: 420,
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: 25,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  background: "#4f46e5",
                  color: "#fff",
                  padding: "12px 14px",
                  borderRadius: 13,
                  fontWeight: 800,
                  fontSize: 22,
                }}
              >
                T
              </div>

              <h1
                style={{
                  fontSize: 29,
                  marginBottom: 8,
                }}
              >
                TaskFlow
              </h1>

              <p style={styles.muted}>
                Organize your work. Focus on what matters.
              </p>
            </div>

            <h2
              style={{
                fontSize: 22,
                marginBottom: 8,
              }}
            >
              {title}
            </h2>

            <p
              style={{
                ...styles.muted,
                marginBottom: 22,
              }}
            >
              {authMode === "signup"
                ? "Create an account to manage your tasks."
                : authMode === "forgot"
                  ? "Enter your email to receive a reset link."
                  : authMode === "new-password"
                    ? "Enter a strong new password."
                    : "Log in to continue to your dashboard."}
            </p>

            {message && (
              <p
                role="status"
                style={{
                  background: "#ecfdf3",
                  color: "#067647",
                  padding: 12,
                  borderRadius: 9,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {message}
              </p>
            )}

            {error && (
              <p
                role="alert"
                style={{
                  background: "#fef3f2",
                  color: "#b42318",
                  padding: 12,
                  borderRadius: 9,
                  fontSize: 13,
                  lineHeight: 1.5,
                  overflowWrap: "anywhere",
                }}
              >
                {error}
              </p>
            )}

            {authMode === "new-password" ? (
              <form onSubmit={handleNewPassword}>
                <label
                  htmlFor="new-password"
                  style={{ fontSize: 14 }}
                >
                  New password
                </label>

                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  placeholder="At least 6 characters"
                  style={styles.input}
                />

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    ...styles.button,
                    width: "100%",
                  }}
                >
                  {authLoading
                    ? "Updating..."
                    : "Update password"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuth}>
                <label
                  htmlFor="email"
                  style={{ fontSize: 14 }}
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  style={styles.input}
                />

                {authMode !== "forgot" && (
                  <>
                    <label
                      htmlFor="password"
                      style={{ fontSize: 14 }}
                    >
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      autoComplete={
                        authMode === "signup"
                          ? "new-password"
                          : "current-password"
                      }
                      minLength={6}
                      required
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      style={styles.input}
                    />
                  </>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    ...styles.button,
                    width: "100%",
                  }}
                >
                  {authLoading
                    ? "Please wait..."
                    : authMode === "signup"
                      ? "Create account"
                      : authMode === "forgot"
                        ? "Send reset link"
                        : "Log in"}
                </button>
              </form>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 13,
                marginTop: 22,
                fontSize: 14,
              }}
            >
              {authMode === "login" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("forgot");
                      setError("");
                      setMessage("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      cursor: "pointer",
                    }}
                  >
                    Forgot password?
                  </button>

                  <span>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signup");
                        setError("");
                        setMessage("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#4f46e5",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Sign up
                    </button>
                  </span>
                </>
              )}

              {authMode === "signup" && (
                <span>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setError("");
                      setMessage("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Log in
                  </button>
                </span>
              )}

              {authMode === "forgot" && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setError("");
                    setMessage("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4f46e5",
                    cursor: "pointer",
                  }}
                >
                  Back to login
                </button>
              )}

              {authMode === "new-password" && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setError("");
                    setMessage("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4f46e5",
                    cursor: "pointer",
                  }}
                >
                  Back to login
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  // TASKFLOW DASHBOARD
  return (
    <main style={styles.page}>
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e6e9f0",
          padding: "18px 5%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 25,
              color: "#4f46e5",
            }}
          >
            TaskFlow
          </h1>

          <span style={styles.muted}>
            Your personal productivity space
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "#667085",
            }}
          >
            {user.email}
          </span>

          <button
            onClick={logout}
            style={styles.secondary}
          >
            Log out
          </button>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1150,
          margin: "0 auto",
          padding: "32px 20px 60px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
            marginBottom: 25,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 29,
                margin: "0 0 8px",
              }}
            >
              My Dashboard
            </h2>

            <p
              style={{
                ...styles.muted,
                margin: 0,
              }}
            >
              Welcome back! Here&apos;s your task overview.
            </p>
          </div>

          <button
            onClick={startNewTask}
            style={styles.button}
          >
            + Add new task
          </button>
        </div>

        {/* REAL-TIME CONNECTION STATUS */}
        <div
          role="status"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            marginBottom: 20,
            borderRadius: 20,
            background:
              realtimeStatus === "connected"
                ? "#ecfdf3"
                : realtimeStatus === "connecting"
                  ? "#fffaeb"
                  : "#fef3f2",
            color:
              realtimeStatus === "connected"
                ? "#027a48"
                : realtimeStatus === "connecting"
                  ? "#b54708"
                  : "#b42318",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "currentColor",
            }}
          />

          {realtimeStatus === "connected"
            ? "Real-time connected"
            : realtimeStatus === "connecting"
              ? "Connecting to real-time..."
              : "Real-time disconnected"}
        </div>

        {message && (
          <p
            role="status"
            style={{
              background: "#ecfdf3",
              color: "#067647",
              padding: 13,
              borderRadius: 9,
            }}
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            style={{
              background: "#fef3f2",
              color: "#b42318",
              padding: 13,
              borderRadius: 9,
              overflowWrap: "anywhere",
            }}
          >
            {error}
          </p>
        )}

        {/* DASHBOARD STATISTICS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 16,
            marginBottom: 30,
          }}
        >
          {[
            {
              label: "Total tasks",
              value: stats.total,
              color: "#4f46e5",
            },
            {
              label: "Pending",
              value: stats.pending,
              color: "#d97706",
            },
            {
              label: "Completed",
              value: stats.completed,
              color: "#059669",
            },
            {
              label: "Overdue",
              value: stats.overdue,
              color: "#dc2626",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...styles.card,
                padding: 22,
              }}
            >
              <p
                style={{
                  ...styles.muted,
                  margin: "0 0 12px",
                }}
              >
                {item.label}
              </p>

              <div
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: item.color,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* CREATE AND EDIT FORM */}
        {showForm && (
          <section
            style={{
              ...styles.card,
              marginBottom: 28,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {editingId
                ? "Edit task"
                : "Create a new task"}
            </h3>

            <form onSubmit={saveTask}>
              <label
                htmlFor="task-title"
                style={{ fontSize: 14 }}
              >
                Task title *
              </label>

              <input
                id="task-title"
                required
                maxLength={150}
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm({
                    ...taskForm,
                    title: event.target.value,
                  })
                }
                placeholder="What do you need to do?"
                style={styles.input}
              />

              <label
                htmlFor="task-description"
                style={{ fontSize: 14 }}
              >
                Description
              </label>

              <textarea
                id="task-description"
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm({
                    ...taskForm,
                    description: event.target.value,
                  })
                }
                placeholder="Add some details..."
                rows={3}
                style={{
                  ...styles.input,
                  resize: "vertical",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 14,
                }}
              >
                <div>
                  <label
                    htmlFor="task-priority"
                    style={{ fontSize: 14 }}
                  >
                    Priority
                  </label>

                  <select
                    id="task-priority"
                    value={taskForm.priority}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        priority: event.target
                          .value as Task["priority"],
                      })
                    }
                    style={styles.input}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="task-date"
                    style={{ fontSize: 14 }}
                  >
                    Due date
                  </label>

                  <input
                    id="task-date"
                    type="date"
                    value={taskForm.due_date}
                    onChange={(event) =>
                      setTaskForm({
                        ...taskForm,
                        due_date: event.target.value,
                      })
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="submit"
                  disabled={taskLoading}
                  style={styles.button}
                >
                  {taskLoading
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Create task"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setTaskForm({ ...emptyTask });
                    setError("");
                  }}
                  style={styles.secondary}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* TASK LIST */}
        <section style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 21,
              }}
            >
              My Tasks
            </h3>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                flex: "1 1 300px",
                justifyContent: "flex-end",
              }}
            >
              <input
                aria-label="Search tasks"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search tasks..."
                style={{
                  ...styles.input,
                  margin: 0,
                  maxWidth: 240,
                }}
              />

              <select
                aria-label="Filter tasks"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
                style={{
                  ...styles.input,
                  margin: 0,
                  maxWidth: 180,
                }}
              >
                <option value="all">All tasks</option>
                <option value="pending">Pending</option>
                <option value="in_progress">
                  In progress
                </option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {loadingTasks ? (
            <p style={styles.muted}>
              Loading your tasks...
            </p>
          ) : filteredTasks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "35px 10px",
              }}
            >
              <div
                style={{
                  fontSize: 38,
                  marginBottom: 12,
                }}
              >
                ✓
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                }}
              >
                No tasks found
              </h3>

              <p style={styles.muted}>
                {tasks.length === 0
                  ? "Create your first task to get started."
                  : "Try changing your search or filter."}
              </p>

              {tasks.length === 0 && (
                <button
                  onClick={startNewTask}
                  style={styles.button}
                >
                  Create your first task
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              {filteredTasks.map((task) => {
                const today = new Date()
                  .toISOString()
                  .slice(0, 10);

                const overdue =
                  task.status !== "completed" &&
                  !!task.due_date &&
                  task.due_date < today;

                return (
                  <article
                    key={task.id}
                    style={{
                      border: "1px solid #e6e9f0",
                      borderRadius: 13,
                      padding: 18,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 18,
                      flexWrap: "wrap",
                      background:
                        task.status === "completed"
                          ? "#fafbfc"
                          : "#fff",
                    }}
                  >
                    <div
                      style={{
                        flex: "1 1 240px",
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: 17,
                            overflowWrap: "anywhere",
                            textDecoration:
                              task.status === "completed"
                                ? "line-through"
                                : "none",
                            color:
                              task.status === "completed"
                                ? "#667085"
                                : "#172033",
                          }}
                        >
                          {task.title}
                        </h4>

                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            background:
                              task.priority === "high"
                                ? "#fef3f2"
                                : task.priority === "medium"
                                  ? "#fffaeb"
                                  : "#ecfdf3",
                            color:
                              task.priority === "high"
                                ? "#b42318"
                                : task.priority === "medium"
                                  ? "#b54708"
                                  : "#027a48",
                          }}
                        >
                          {task.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>

                      {task.description && (
                        <p
                          style={{
                            color: "#667085",
                            fontSize: 14,
                            lineHeight: 1.6,
                            margin: "10px 0",
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {task.description}
                        </p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                          marginTop: 11,
                          fontSize: 12,
                          color: "#667085",
                        }}
                      >
                        <span>
                          Status:{" "}
                          {task.status
                            .replace("_", " ")
                            .toUpperCase()}
                        </span>

                        {task.due_date && (
                          <span
                            style={{
                              color: overdue
                                ? "#b42318"
                                : "#667085",
                              fontWeight: overdue
                                ? 700
                                : 400,
                            }}
                          >
                            {overdue ? "Overdue: " : "Due: "}
                            {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => void changeStatus(task)}
                        style={{
                          ...styles.secondary,
                          color:
                            task.status === "completed"
                              ? "#b54708"
                              : "#027a48",
                        }}
                      >
                        {task.status === "completed"
                          ? "Reopen"
                          : "Mark complete"}
                      </button>

                      <button
                        onClick={() => startEdit(task)}
                        style={styles.secondary}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => void deleteTask(task)}
                        style={{
                          ...styles.secondary,
                          color: "#b42318",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p
          style={{
            ...styles.muted,
            textAlign: "center",
            marginTop: 28,
          }}
        >
          TaskFlow · Stay organized, one task at a time.
        </p>
      </div>
    </main>
  );
}
