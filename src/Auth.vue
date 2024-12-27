<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-500 to-brown-500">
      <div class="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">Sign In</h1>
        <p class="text-center text-gray-600 mb-8">Welcome back! Please sign in to continue.</p>
  
        <!-- Google Sign-In Button -->
        <button
          @click="signInWithGoogle"
          class="w-full bg-blue-500 text-white py-3 px-6 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2.2c5.3 0 9.8 4.5 9.8 9.8s-4.5 9.8-9.8 9.8S2.2 17.3 2.2 12 6.7 2.2 12 2.2zM12 0c-6.6 0-12 5.4-12 12 0 2.1.6 4.1 1.7 5.8l5.3-3.2 4.8 2.8-4.8-2.8-2.3-4.8c1.3-1.2 3-1.9 4.8-1.9 3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6H6c0 4.4 3.6 7.9 8 7.9s8-3.6 8-8-3.6-8-8-8z" />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  </template>
  
<script setup>
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "vue-router";

const router = useRouter();
const auth = getAuth();
const db = getFirestore();

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // If the user doesn't exist, create a new document
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        createdAt: new Date().toISOString(),
      });
      console.log("User document created!");
    }

    // Redirect to the homepage
    router.push("/homepage");
  } catch (error) {
    console.error("Error during Google sign-in:", error);
  }
};

</script>