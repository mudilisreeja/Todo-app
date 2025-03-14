import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "todo" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: "" });
  const [registerData, setRegisterData] = useState({ email: "", username: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tasksToDelete, setTasksToDelete] = useState([]);

  useEffect(() => {
    // Check if user is already logged in (could store in localStorage)
    const savedUser = localStorage.getItem("todoUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    // Fetch tasks when user is logged in
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`http://127.0.0.1:8000/tasks/user/${user.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      setTasks(data);
      // Reset selected tasks when fetching new data
      setSelectedTasks([]);
    } catch (error) {
      setError("Failed to fetch tasks. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginInputChange = (event) => {
    const { name, value } = event.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterInputChange = (event) => {
    const { name, value } = event.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const login = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("todoUser", JSON.stringify(userData));
      setLoginData({ email: "" });
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    }
  };

  const register = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("todoUser", JSON.stringify(userData));
      setRegisterData({ email: "", username: "" });
      setIsRegistering(false);
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("todoUser");
    setTasks([]);
    setSelectedTasks([]);
  };

  const addTask = async () => {
    if (!user) {
      setError("You must be logged in to add a task");
      return;
    }
    
    if (newTask.title.trim() === "" || newTask.description.trim() === "") {
      setError("Both title and description are required!");
      return;
    }

    setError("");
    try {
      const response = await fetch(`http://127.0.0.1:8000/tasks/?user_id=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add task");
      }

      fetchTasks();
      setNewTask({ title: "", description: "", status: "pending" });
    } catch (error) {
      setError(error.message || "Failed to add task. Please try again.");
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/tasks/${taskId}?user_id=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update task");
      }

      fetchTasks();
    } catch (error) {
      setError(error.message || "Failed to update task. Please try again.");
    }
  };

  const deleteTask = async (taskId) => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/tasks/${taskId}?user_id=${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete task");
      }

      fetchTasks();
    } catch (error) {
      setError(error.message || "Failed to delete task. Please try again.");
    }
  };

  // Handle single task selection
  const handleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  // Handle select all functionality
  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(task => task.id));
    }
  };

  const handleDeleteSelected = () => {
    const cancelledSelectedTasks = tasks
      .filter(task => selectedTasks.includes(task.id) && task.status === "cancelled")
      .map(task => task.id);
    
    if (cancelledSelectedTasks.length === 0) {
      setError("Only cancelled tasks can be deleted.");
      return;
    }
    
    setTasksToDelete(cancelledSelectedTasks);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setError("");
    let hasError = false;
    
    // Delete tasks one by one
    for (const taskId of tasksToDelete) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/tasks/${taskId}?user_id=${user.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          hasError = true;
        }
      } catch (error) {
        hasError = true;
      }
    }

    // Close dialog and refresh tasks
    setShowDeleteConfirm(false);
    setTasksToDelete([]);
    fetchTasks();
    
    if (hasError) {
      setError("Some tasks could not be deleted. Please try again.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTasksToDelete([]);
  };

  const exportToExcel = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "ID,Title,Description,Status\n";
    
    // Add task data
    tasks.forEach(task => {
      csvContent += `${task.id},"${task.title.replace(/"/g, '""')}","${task.description.replace(/"/g, '""')}",${task.status}\n`;
    });
    
    // Create download link and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tasks_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <div className="auth-container">
        <h1>Todo App</h1>
        {error && <p className="error-message">{error}</p>}
        
        {isRegistering ? (
          <div className="auth-form">
            <h2>Register</h2>
            <form onSubmit={register}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={registerData.email}
                onChange={handleRegisterInputChange}
                required
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={registerData.username}
                onChange={handleRegisterInputChange}
                required
              />
              <button type="submit">Register</button>
            </form>
            <p>
              Already have an account?{" "}
              <button onClick={() => setIsRegistering(false)}>Login</button>
            </p>
          </div>
        ) : (
          <div className="auth-form">
            <h2>Login</h2>
            <form onSubmit={login}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={loginData.email}
                onChange={handleLoginInputChange}
                required
              />
              <button type="submit">Login</button>
            </form>
            <p>
              Don't have an account?{" "}
              <button onClick={() => setIsRegistering(true)}>Register</button>
            </p>
          </div>
        )}
      </div>
    );
  }

  // Count selected cancelled tasks
  const selectedCancelledTasksCount = tasks.filter(
    task => selectedTasks.includes(task.id) && task.status === "cancelled"
  ).length;

  return (
    <div className="to-do">
      <div className="header">
        <h1>To-Do List</h1>
        <div className="user-info">
          <span>
            <i className="user-icon"></i> Welcome, {user.username}!
          </span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="task-form">
        <input
          type="text"
          name="title"
          placeholder="Enter a task title"
          value={newTask.title}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="description"
          placeholder="Enter a task description"
          value={newTask.description}
          onChange={handleInputChange}
        />
        <select
          name="status"
          value={newTask.status}
          onChange={handleInputChange}
        >
          <option value="todo">todo</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="add-button" onClick={addTask}>
          Add
        </button>
      </div>

      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="task-list-container">
          {/* Table header with select all */}
          <div className="task-list-header">
            <div className="task-checkbox">
              <input
                type="checkbox"
                checked={selectedTasks.length === tasks.length && tasks.length > 0}
                onChange={handleSelectAll}
              />
            </div>
            <div className="task-header-title">Task</div>
            <div className="task-header-status">Status</div>
            
          </div>
          
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={`task-item ${task.status.replace("_", "-")} ${selectedTasks.includes(task.id) ? 'selected' : ''}`}>

                <div className="task-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={() => handleTaskSelection(task.id)}
                  />
                </div>
                <div className="task-content">
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                </div>
                <div className="task-meta">
                <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    className="status-dropdown"
                  >
                    <option value="todo">todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="task-actions-bar">
        <button 
          className="delete-button"
          onClick={handleDeleteSelected}
          disabled={selectedCancelledTasksCount === 0}
        >
          Delete 
        </button>
        <button 
          className="export-button"
          onClick={exportToExcel}
          disabled={tasks.length === 0}
        >
          <i className="download-icon"></i> Export
        </button>
        {selectedTasks.length > 0 && (
          <span className="selection-info">
            {selectedTasks.length} task(s) selected
            {selectedCancelledTasksCount > 0 && ` (${selectedCancelledTasksCount} cancelled)`}
          </span>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete {tasksToDelete.length} task(s)?</p>
            <div className="modal-actions">
              <button onClick={cancelDelete} className="cancel-button">Cancel</button>
              <button onClick={confirmDelete} className="confirm-button">Delete</button>
            </div>
          </div>
        </div>
      )}
      +
    </div>
  );
}

export default App;