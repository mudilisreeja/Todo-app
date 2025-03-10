import React, { useState, useEffect } from "react";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://127.0.0.1:8000/tasks");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to fetch tasks. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const addTask = async () => {
    if (newTask.title.trim() === "") {
      setError("Task title cannot be empty!");
      return;
    }

    setError("");
    try {
      const response = await fetch("http://127.0.0.1:8000/tasks/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      fetchTasks();
      setNewTask({ title: "", description: "" });
    } catch (error) {
      console.error("Error adding task:", error);
      setError("Failed to add task. Please try again.");
    }
  };

  const editTask = async (taskId, currentTask) => {
    const updatedTitle = prompt("Edit Task Title:", currentTask.title);
    const updatedDescription = prompt(
      "Edit Task Description:",
      currentTask.description
    );

    if (
      (updatedTitle !== null && updatedTitle.trim() === "") ||
      (updatedDescription !== null && updatedDescription.trim() === "")
    ) {
      setError("Task title and description cannot be empty!");
      return;
    }

    setError("");
    try {
      const response = await fetch(`http://127.0.0.1:8000/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: updatedTitle,
          description: updatedDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task. Please try again.");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task. Please try again.");
    }
  };

  return (
    <div className="to-do">
      <h1>To-Do List</h1>

      {error && <p className="error-message">{error}</p>}

      <div>
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
        <button className="add-button" onClick={addTask}>
          Add
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ol>
          {tasks.map((task) => (
            <li key={task.id}>
              <span className="text">
                <strong>{task.title}</strong>: {task.description}
              </span>
              <button
                className="edit-button"
                onClick={() => editTask(task.id, task)}
              >
                Edit
              </button>
              <button
                className="delete-button"
                onClick={() => deleteTask(task.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default App;