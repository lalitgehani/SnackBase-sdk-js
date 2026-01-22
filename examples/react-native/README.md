# React Native (Expo) Example App

This is a complete example of using SnackBase SDK with React Native and Expo.

## Features

- Cross-platform (iOS & Android)
- Authentication flows
- Real-time data updates
- Offline support preparation
- File uploads
- Navigation with React Navigation

## Setup

### 1. Create Expo App

```bash
npx create-expo-app my-snackbase-app
cd my-snackbase-app
npm install @snackbase/sdk
```

### 2. Install Additional Dependencies

```bash
# For navigation
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# For storage
npx expo expo-secure-store

# For UI components
npx expo react-native-paper
```

### 3. Create Environment Config

Create `config.js`:

```javascript
export const SNACKBASE_CONFIG = {
  baseUrl: "https://your-project.snackbase.dev",
  apiKey: "your-api-key",
};
```

## Usage Examples

### App Entry Point

Create `App.js`:

```javascript
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SnackBaseProvider } from "@snackbase/sdk/react";
import { SNACKBASE_CONFIG } from "./config";

import LoginPage from "./screens/LoginPage";
import PostsListScreen from "./screens/PostsListScreen";
import PostDetailScreen from "./screens/PostDetailScreen";
import CreatePostScreen from "./screens/CreatePostScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SnackBaseProvider {...SNACKBASE_CONFIG}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Login"
            component={LoginPage}
            options={{ title: "Login" }}
          />
          <Stack.Screen
            name="Posts"
            component={PostsListScreen}
            options={{ title: "Posts" }}
          />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{ title: "Post" }}
          />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{ title: "New Post" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SnackBaseProvider>
  );
}
```

### Login Screen

Create `screens/LoginPage.js`:

```javascript
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@snackbase/sdk/react";
import { useNavigation } from "@react-navigation/native";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigation = useNavigation();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Posts" }],
      });
    }
  }, [isAuthenticated, navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      // Navigation will happen via useEffect
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        password,
        passwordConfirm: password,
      });
    } catch (error) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Button title="Login" onPress={handleLogin} />
          <View style={styles.spacer} />
          <Button title="Register" onPress={handleRegister} color="#4CAF50" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  spacer: {
    height: 10,
  },
});
```

### Posts List Screen

Create `screens/PostsListScreen.js`:

```javascript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery, useSubscription, useAuth } from "@snackbase/sdk/react";
import { useNavigation } from "@react-navigation/native";

export default function PostsListScreen() {
  const [posts, setPosts] = useState([]);
  const { data, loading, error, refetch } = useQuery("posts", {
    sort: "-createdAt",
    expand: "author",
  });
  const { logout } = useAuth();
  const navigation = useNavigation();

  // Sync initial data
  useEffect(() => {
    if (data?.items) {
      setPosts(data.items);
    }
  }, [data]);

  // Real-time updates
  useSubscription("posts", "create", (event) => {
    setPosts((prev) => [event.record, ...prev]);
  });

  useSubscription("posts", "update", (event) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === event.record.id ? event.record : p)),
    );
  });

  useSubscription("posts", "delete", (event) => {
    setPosts((prev) => prev.filter((p) => p.id !== event.record.id));
  });

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
    >
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postMeta}>
        By {item.author?.name} · {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Text style={styles.postExcerpt} numberOfLines={2}>
        {item.excerpt || item.content?.substring(0, 100)}...
      </Text>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Posts</Text>
        <Text style={styles.headerCount}>{posts.length} posts</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const ListEmpty = () => {
    if (loading) {
      return <ActivityIndicator size="large" style={styles.empty} />;
    }
    if (error) {
      return (
        <View style={styles.empty}>
          <Text style={styles.errorText}>Error loading posts</Text>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No posts yet</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreatePost")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f44336",
    borderRadius: 5,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
  postItem: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  postMeta: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  postExcerpt: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: "#fff",
    marginTop: -4,
  },
});
```

### Post Detail Screen

Create `screens/PostDetailScreen.js`:

```javascript
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Button,
} from "react-native";
import { useRecord } from "@snackbase/sdk/react";

export default function PostDetailScreen({ route }) {
  const { postId } = route.params;
  const {
    data: post,
    loading,
    error,
  } = useRecord("posts", postId, {
    expand: "author,comments",
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load post</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{post.title}</Text>
      <View style={styles.meta}>
        <Text style={styles.author}>By {post.author?.name}</Text>
        <Text style={styles.date}>
          {" "}
          · {new Date(post.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.bodyText}>{post.content}</Text>
      </View>

      {post.comments && post.comments.length > 0 && (
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Comments ({post.comments.length})
          </Text>
          {post.comments.map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Text style={styles.commentAuthor}>{comment.author?.name}</Text>
              <Text style={styles.commentText}>{comment.content}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    padding: 16,
    paddingBottom: 8,
  },
  meta: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  author: {
    fontSize: 14,
    color: "#666",
  },
  date: {
    fontSize: 14,
    color: "#999",
  },
  content: {
    padding: 16,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  comment: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: "#333",
  },
});
```

### Create Post Screen

Create `screens/CreatePostScreen.js`:

```javascript
import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useMutation } from "@snackbase/sdk/react";
import { useNavigation } from "@react-navigation/native";

export default function CreatePostScreen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { create, loading } = useMutation("posts");
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await create({
        title: title.trim(),
        content: content.trim(),
        status: "published",
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to create post");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TextInput
        style={styles.titleInput}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.contentInput}
        placeholder="Write your post..."
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />
      {loading ? (
        <ActivityIndicator size="large" style={styles.button} />
      ) : (
        <Button title="Publish" onPress={handleSubmit} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 200,
  },
  button: {
    paddingVertical: 8,
  },
});
```

## File Upload Example

```javascript
import React, { useState } from 'react';
import { View, Button, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function FileUploadScreen() {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: image,
        type: 'image/jpeg',
        name: 'upload.jpg',
      } as any);

      // Upload using client
      await client.files.upload(formData as any);
      Alert.alert('Success', 'Image uploaded!');
      setImage(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick Image" onPress={pickImage} />
      {image && (
        <>
          <Image source={{ uri: image }} style={styles.image} />
          <Button title="Upload" onPress={uploadImage} disabled={uploading} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 225,
    marginVertical: 20,
  },
});
```

## Running the Example

```bash
npx expo start
```

Scan the QR code with Expo Go app on your device.

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [SnackBase Getting Started](../../docs/getting-started.md)
