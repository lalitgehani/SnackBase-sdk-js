# Vue/Nuxt Example App

This is a complete example of using SnackBase SDK with Vue 3 and Nuxt 3.

## Features

- Vue 3 Composition API
- Nuxt 3 server-side rendering
- Pinia store for state management
- Real-time data updates
- Authentication flows
- File uploads

## Setup

### 1. Create Nuxt App

```bash
npx nuxi@latest init my-snackbase-app
cd my-snackbase-app
npm install @snackbase/sdk
```

### 2. Install Additional Dependencies

```bash
# For Pinia store
npm install pinia

# For validation
npm install zod

# For UI components
npm install @nuxtjs/tailwindcss
```

### 3. Create Environment File

Create `.env`:

```env
NUXT_PUBLIC_SNACKBASE_URL=https://your-project.snackbase.dev
SNACKBASE_API_KEY=your-api-key
```

### 4. Configure Nuxt

Update `nuxt.config.ts`:

```typescript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      snackbaseUrl: process.env.NUXT_PUBLIC_SNACKBASE_URL,
      snackbaseApiKey: process.env.SNACKBASE_API_KEY,
    },
  },
});
```

### 5. Create SnackBase Plugin

Create `plugins/snackbase.ts`:

```typescript
import { SnackBaseClient } from "@snackbase/sdk";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const client = new SnackBaseClient({
    baseUrl: config.public.snackbaseUrl as string,
    apiKey: config.public.snackbaseApiKey as string,
  });

  return {
    provide: {
      snackbase: client,
    },
  };
});
```

## Usage Examples

### Composable for SnackBase

Create `composables/useSnackBase.ts`:

```typescript
export const useSnackBase = () => {
  const nuxtApp = useNuxtApp();
  return nuxtApp.$snackbase as SnackBaseClient;
};
```

### Composable for Authentication

Create `composables/useAuth.ts`:

```typescript
import { ref, computed } from "vue";

const authState = ref({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null as Error | null,
});

export const useAuth = () => {
  const client = useSnackBase();

  // Initialize auth state
  if (process.client) {
    authState.value.user = client.user;
    authState.value.isAuthenticated = client.isAuthenticated;

    // Listen to auth changes
    client.on("auth:login", (state) => {
      authState.value.user = state.user;
      authState.value.isAuthenticated = true;
      authState.value.error = null;
    });

    client.on("auth:logout", () => {
      authState.value.user = null;
      authState.value.isAuthenticated = false;
    });

    client.on("auth:error", (error) => {
      authState.value.error = error;
    });
  }

  const login = async (email: string, password: string) => {
    authState.value.loading = true;
    authState.value.error = null;

    try {
      return await client.auth.login({ email, password });
    } catch (error) {
      authState.value.error = error as Error;
      throw error;
    } finally {
      authState.value.loading = false;
    }
  };

  const logout = async () => {
    authState.value.loading = true;
    try {
      await client.auth.logout();
    } finally {
      authState.value.loading = false;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    authState.value.loading = true;
    authState.value.error = null;

    try {
      return await client.auth.register({
        email,
        password,
        passwordConfirm: password,
        name,
      });
    } catch (error) {
      authState.value.error = error as Error;
      throw error;
    } finally {
      authState.value.loading = false;
    }
  };

  return {
    user: computed(() => authState.value.user),
    isAuthenticated: computed(() => authState.value.isAuthenticated),
    loading: computed(() => authState.value.loading),
    error: computed(() => authState.value.error),
    login,
    logout,
    register,
  };
};
```

### Composable for Records

Create `composables/useRecords.ts`:

```typescript
import { ref, computed } from "vue";

export const useRecords = <T = any>(collection: string) => {
  const client = useSnackBase();

  const items = ref<T[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const totalItems = ref(0);
  const page = ref(1);
  const perPage = ref(20);

  const fetch = async (params?: Record<string, any>) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await client.records.list<T>(collection, {
        page: page.value,
        perPage: perPage.value,
        ...params,
      });

      items.value = result.items;
      totalItems.value = result.totalItems;
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  };

  const create = async (data: Partial<T>) => {
    loading.value = true;
    error.value = null;

    try {
      const record = await client.records.create<T>(collection, data);
      items.value.unshift(record);
      totalItems.value += 1;
      return record;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const update = async (id: string, data: Partial<T>) => {
    loading.value = true;
    error.value = null;

    try {
      const record = await client.records.update<T>(collection, id, data);
      const index = items.value.findIndex((item) => (item as any).id === id);
      if (index !== -1) {
        items.value[index] = record;
      }
      return record;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const remove = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      await client.records.delete(collection, id);
      items.value = items.value.filter((item) => (item as any).id !== id);
      totalItems.value -= 1;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    items: computed(() => items.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    totalItems: computed(() => totalItems.value),
    page,
    perPage,
    fetch,
    create,
    update,
    remove,
  };
};
```

### Composable for Real-Time

Create `composables/useSubscription.ts`:

```typescript
import { onUnmounted } from "vue";

export const useSubscription = (
  collection: string,
  callback: (event: any) => void,
) => {
  const client = useSnackBase();
  let unsubscribe: (() => void) | null = null;

  onMounted(() => {
    unsubscribe = client.realtime.subscribe(collection, callback);
  });

  onUnmounted(() => {
    unsubscribe?.();
  });

  return {
    connected: computed(() => client.realtime.isConnected),
  };
};
```

### Pages

Create `pages/index.vue`:

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm">
      <div
        class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"
      >
        <h1 class="text-xl font-bold">My Blog</h1>
        <div v-if="isAuthenticated">
          <span class="mr-4">{{ user?.name }}</span>
          <button @click="logout" class="text-red-600">Logout</button>
        </div>
        <NuxtLink v-else to="/login" class="text-blue-600">Login</NuxtLink>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading posts...</p>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600">Failed to load posts</p>
      </div>

      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="post in items"
          :key="post.id"
          class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
          <NuxtLink :to="`/posts/${post.id}`">
            <div class="p-6">
              <h2 class="text-xl font-semibold mb-2">{{ post.title }}</h2>
              <p class="text-gray-600 mb-4 line-clamp-3">
                {{ post.excerpt || post.content?.substring(0, 150) }}
              </p>
              <div
                class="flex justify-between items-center text-sm text-gray-500"
              >
                <span>{{ post.author?.name }}</span>
                <span>{{ formatDate(post.createdAt) }}</span>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from "@/utils/date";

const { isAuthenticated, user, logout } = useAuth();
const { items, loading, error, fetch } = useRecords<Post>("posts");

// Fetch posts on mount
onMounted(() => {
  fetch({ sort: "-createdAt" });
});
</script>
```

Create `pages/login.vue`:

```vue
<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4"
  >
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div v-if="error" class="bg-red-50 text-red-600 p-3 rounded text-sm">
          {{ error.message }}
        </div>

        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ loading ? "Signing in..." : "Sign in" }}
          </button>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/register"
            class="text-blue-600 hover:text-blue-500 text-sm"
          >
            Don't have an account? Sign up
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const { login, loading, error, isAuthenticated } = useAuth();
const router = useRouter();

const email = ref("");
const password = ref("");

const handleSubmit = async () => {
  try {
    await login(email.value, password.value);
    if (isAuthenticated.value) {
      router.push("/");
    }
  } catch (err) {
    // Error is handled by the composable
  }
};
</script>
```

Create `pages/posts/[id].vue`:

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-4xl mx-auto px-4 py-8">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading post...</p>
      </div>

      <article v-else-if="post" class="bg-white rounded-lg shadow-sm p-8">
        <h1 class="text-4xl font-bold mb-4">{{ post.title }}</h1>

        <div class="flex items-center text-gray-600 mb-8">
          <span class="mr-4">By {{ post.author?.name }}</span>
          <span>{{ formatDate(post.createdAt) }}</span>
        </div>

        <div class="prose max-w-none">
          {{ post.content }}
        </div>

        <section v-if="post.comments?.length" class="mt-12 pt-8 border-t">
          <h2 class="text-2xl font-bold mb-6">Comments</h2>
          <div class="space-y-4">
            <div
              v-for="comment in post.comments"
              :key="comment.id"
              class="bg-gray-50 p-4 rounded-lg"
            >
              <p class="font-semibold mb-2">{{ comment.author?.name }}</p>
              <p>{{ comment.content }}</p>
            </div>
          </div>
        </section>
      </article>

      <div v-else class="text-center py-12">
        <p class="text-gray-500">Post not found</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from "@/utils/date";

const route = useRoute();
const client = useSnackBase();

const post = ref<Post | null>(null);
const loading = ref(true);
const error = ref<Error | null>(null);

onMounted(async () => {
  try {
    post.value = await client.records.get<Post>(
      "posts",
      route.params.id as string,
      {
        expand: "author,comments",
      },
    );
  } catch (e) {
    error.value = e as Error;
  } finally {
    loading.value = false;
  }
});
</script>
```

### Utility Functions

Create `utils/date.ts`:

```typescript
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
```

## Running the Example

```bash
npm run dev
```

Open http://localhost:3000

## Additional Resources

- [Nuxt Documentation](https://nuxt.com/docs)
- [Vue Composition API](https://vuejs.org/guide/introduction.html)
- [SnackBase Getting Started](../../docs/getting-started.md)
