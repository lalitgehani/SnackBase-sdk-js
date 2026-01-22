# Vanilla JavaScript Example

This is a complete example of using SnackBase SDK with vanilla JavaScript.

## Features

- No framework required
- ES6 modules
- Real-time data updates
- Authentication
- CRUD operations
- File uploads

## Setup

### 1. Create Project

```bash
mkdir snackbase-vanilla-app
cd snackbase-vanilla-app
npm init -y
npm install @snackbase/sdk
```

### 2. Create HTML File

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SnackBase Vanilla Example</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
          sans-serif;
        background-color: #f5f5f5;
        padding: 20px;
      }

      .container {
        max-width: 800px;
        margin: 0 auto;
      }

      header {
        background: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      h1 {
        font-size: 24px;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .form-group {
        margin-bottom: 15px;
      }

      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
      }

      input,
      textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
      }

      textarea {
        min-height: 100px;
        resize: vertical;
      }

      button {
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
      }

      button:hover {
        background: #0056b3;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      button.secondary {
        background: #6c757d;
      }

      button.secondary:hover {
        background: #545b62;
      }

      button.danger {
        background: #dc3545;
      }

      button.danger:hover {
        background: #c82333;
      }

      .post {
        border: 1px solid #eee;
        border-radius: 5px;
        padding: 15px;
        margin-bottom: 15px;
      }

      .post-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 10px;
      }

      .post-meta {
        color: #666;
        font-size: 14px;
        margin-bottom: 10px;
      }

      .post-content {
        line-height: 1.6;
      }

      .hidden {
        display: none !important;
      }

      .error {
        background: #f8d7da;
        color: #721c24;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
      }

      .success {
        background: #d4edda;
        color: #155724;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
      }

      .loading {
        text-align: center;
        padding: 20px;
        color: #666;
      }

      .tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }

      .tab {
        padding: 8px 16px;
        background: #e9ecef;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }

      .tab.active {
        background: #007bff;
        color: white;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <div class="header-content">
          <h1>📝 My Blog</h1>
          <div class="user-info" id="userInfo">
            <!-- User info will be inserted here -->
          </div>
        </div>
      </header>

      <main>
        <!-- Login/Register Form -->
        <div id="authSection" class="card">
          <div class="tabs">
            <button class="tab active" onclick="showTab('login')">Login</button>
            <button class="tab" onclick="showTab('register')">Register</button>
          </div>

          <div id="error" class="error hidden"></div>

          <form id="loginForm">
            <div class="form-group">
              <label for="loginEmail">Email</label>
              <input type="email" id="loginEmail" required />
            </div>
            <div class="form-group">
              <label for="loginPassword">Password</label>
              <input type="password" id="loginPassword" required />
            </div>
            <button type="submit">Login</button>
          </form>

          <form id="registerForm" class="hidden">
            <div class="form-group">
              <label for="registerName">Name</label>
              <input type="text" id="registerName" />
            </div>
            <div class="form-group">
              <label for="registerEmail">Email</label>
              <input type="email" id="registerEmail" required />
            </div>
            <div class="form-group">
              <label for="registerPassword">Password</label>
              <input type="password" id="registerPassword" required />
            </div>
            <div class="form-group">
              <label for="registerPasswordConfirm">Confirm Password</label>
              <input type="password" id="registerPasswordConfirm" required />
            </div>
            <button type="submit">Register</button>
          </form>
        </div>

        <!-- Create Post Form -->
        <div id="createPostSection" class="card hidden">
          <h2>Create New Post</h2>
          <form id="createPostForm">
            <div class="form-group">
              <label for="postTitle">Title</label>
              <input type="text" id="postTitle" required />
            </div>
            <div class="form-group">
              <label for="postContent">Content</label>
              <textarea id="postContent" required></textarea>
            </div>
            <button type="submit">Publish Post</button>
          </form>
        </div>

        <!-- Posts List -->
        <div id="postsSection" class="card">
          <h2>Posts</h2>
          <div id="postsList">
            <div class="loading">Loading posts...</div>
          </div>
        </div>
      </main>
    </div>

    <script type="module">
      import { SnackBaseClient } from "https://cdn.jsdelivr.net/npm/@snackbase/sdk/dist/index.mjs";

      // Configuration
      const CONFIG = {
        baseUrl: "https://your-project.snackbase.dev",
        apiKey: "your-api-key", // Optional
      };

      // Initialize client
      const client = new SnackBaseClient(CONFIG);

      // DOM Elements
      const authSection = document.getElementById("authSection");
      const createPostSection = document.getElementById("createPostSection");
      const postsSection = document.getElementById("postsSection");
      const userInfo = document.getElementById("userInfo");
      const postsList = document.getElementById("postsList");
      const errorDiv = document.getElementById("error");

      // State
      let currentUser = null;
      let unsubscribe = null;

      // Show error message
      function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove("hidden");
        setTimeout(() => errorDiv.classList.add("hidden"), 5000);
      }

      // Update UI based on auth state
      function updateUI() {
        currentUser = client.user;

        if (currentUser) {
          // User is logged in
          authSection.classList.add("hidden");
          createPostSection.classList.remove("hidden");

          userInfo.innerHTML = `
          <span>Welcome, ${currentUser.name || currentUser.email}</span>
          <button class="secondary" onclick="handleLogout()">Logout</button>
        `;
        } else {
          // User is logged out
          authSection.classList.remove("hidden");
          createPostSection.classList.add("hidden");

          userInfo.innerHTML = `
          <span>Please log in</span>
        `;
        }
      }

      // Load posts
      async function loadPosts() {
        try {
          postsList.innerHTML = '<div class="loading">Loading posts...</div>';

          const result = await client.records.list("posts", {
            sort: "-createdAt",
            expand: "author",
            perPage: 50,
          });

          if (result.items.length === 0) {
            postsList.innerHTML =
              '<p style="text-align:center;color:#666;">No posts yet. Be the first!</p>';
            return;
          }

          postsList.innerHTML = result.items
            .map(
              (post) => `
          <div class="post">
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <div class="post-meta">
              By ${post.author?.name || "Unknown"} · ${formatDate(post.createdAt)}
            </div>
            <div class="post-content">${escapeHtml(post.content)}</div>
          </div>
        `,
            )
            .join("");
        } catch (error) {
          console.error("Failed to load posts:", error);
          postsList.innerHTML = '<div class="error">Failed to load posts</div>';
        }
      }

      // Subscribe to real-time updates
      function subscribeToPosts() {
        if (unsubscribe) {
          unsubscribe();
        }

        unsubscribe = client.realtime.subscribe("posts", (event) => {
          console.log("Post event:", event.action, event.record);
          loadPosts(); // Reload posts on any change
        });
      }

      // Tab switching
      window.showTab = function (tab) {
        const loginForm = document.getElementById("loginForm");
        const registerForm = document.getElementById("registerForm");
        const tabs = document.querySelectorAll(".tab");

        tabs.forEach((t) => t.classList.remove("active"));

        if (tab === "login") {
          loginForm.classList.remove("hidden");
          registerForm.classList.add("hidden");
          tabs[0].classList.add("active");
        } else {
          loginForm.classList.add("hidden");
          registerForm.classList.remove("hidden");
          tabs[1].classList.add("active");
        }
      };

      // Handle login
      document
        .getElementById("loginForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();

          const email = document.getElementById("loginEmail").value;
          const password = document.getElementById("loginPassword").value;

          try {
            await client.auth.login({ email, password });
            updateUI();
            loadPosts();
          } catch (error) {
            showError(error.message || "Login failed");
          }
        });

      // Handle registration
      document
        .getElementById("registerForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();

          const name = document.getElementById("registerName").value;
          const email = document.getElementById("registerEmail").value;
          const password = document.getElementById("registerPassword").value;
          const passwordConfirm = document.getElementById(
            "registerPasswordConfirm",
          ).value;

          if (password !== passwordConfirm) {
            showError("Passwords do not match");
            return;
          }

          try {
            await client.auth.register({
              email,
              password,
              passwordConfirm,
              name,
            });
            updateUI();
            loadPosts();
          } catch (error) {
            showError(error.message || "Registration failed");
          }
        });

      // Handle logout
      window.handleLogout = async function () {
        try {
          await client.auth.logout();
          updateUI();
        } catch (error) {
          showError(error.message || "Logout failed");
        }
      };

      // Handle create post
      document
        .getElementById("createPostForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();

          const title = document.getElementById("postTitle").value;
          const content = document.getElementById("postContent").value;

          try {
            await client.records.create("posts", {
              title,
              content,
              status: "published",
            });

            document.getElementById("createPostForm").reset();
            loadPosts();
          } catch (error) {
            showError(error.message || "Failed to create post");
          }
        });

      // Utility functions
      function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
      }

      function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Listen to auth changes
      client.on("auth:login", updateUI);
      client.on("auth:logout", updateUI);

      // Initialize
      updateUI();
      loadPosts();
      subscribeToPosts();
    </script>
  </body>
</html>
```

## Running the Example

### Using a Local Server

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Using PHP
php -S localhost:8000
```

Open http://localhost:8000

### Using ES Modules in Production

For production, you may want to bundle the SDK:

```bash
npm install @snackbase-sdk
```

Then use a bundler like esbuild or webpack:

```javascript
import { SnackBaseClient } from "@snackbase/sdk";

const client = new SnackBaseClient({
  baseUrl: "https://your-project.snackbase.dev",
});
```

## Using with a CDN

You can also use the SDK directly from a CDN without npm:

```html
<script type="module">
  import { SnackBaseClient } from "https://cdn.jsdelivr.net/npm/@snackbase/sdk/dist/index.mjs";

  const client = new SnackBaseClient({
    baseUrl: "https://your-project.snackbase.dev",
  });

  // Use the client...
</script>
```

## Additional Examples

### File Upload

```javascript
async function uploadFile(file) {
  try {
    const record = await client.files.upload(file);
    console.log("File uploaded:", record);
    return record;
  } catch (error) {
    console.error("Upload failed:", error);
  }
}

// Usage
document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) {
    await uploadFile(file);
  }
});
```

### Real-Time Dashboard

```javascript
function setupRealtimeDashboard() {
  const metrics = {
    posts: 0,
    users: 0,
  };

  // Subscribe to posts
  client.realtime.subscribe("posts", (event) => {
    if (event.action === "create") {
      metrics.posts++;
    } else if (event.action === "delete") {
      metrics.posts--;
    }
    updateDashboard();
  });

  // Update dashboard
  function updateDashboard() {
    document.getElementById("postsCount").textContent = metrics.posts;
  }
}
```

### Query with Filters

```javascript
async function searchPosts(query) {
  const result = await client.records.list("posts", {
    filter: {
      title: { $regex: query, $options: "i" },
    },
  });

  console.log("Search results:", result.items);
}
```

## Additional Resources

- [Getting Started Guide](../../docs/getting-started.md)
- [API Reference](../../docs/api-reference.md)
- [Authentication Guide](../../docs/authentication.md)
