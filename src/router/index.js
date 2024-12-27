import { createRouter, createWebHistory } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: () => import("../Auth.vue") },
    { path: "/homepage", component: () => import("../Homepage.vue") }
  ]
})

const getCurrentUser = () => {
    return new Promise((resolve,reject) => {
        const removeListener = onAuthStateChanged(
            getAuth(),
            (user) => {
                removeListener();
                resolve(user);
            },
            reject
        )
    })
}

// Navigation guard to protect the homepage route
router.beforeEach(async (to, from, next) => {
  // Check if the user is authenticated
  const user = await getCurrentUser();
  if(to.path === '/') {
    if ( user) { 
      next('/homepage');
    }
    else {
      next('/login');
    }
  }
  if (to.path === '/homepage' && !user) {
    // If the user is not logged in, redirect to login page
    next('/login');
  } else if (to.path === '/login' && user) {
    next('/homepage');
  } else {
    // Otherwise, allow the navigation
    next();
  }
});

export default router;
