// Force Token Refresh Script
// Copy and paste this into your browser console while logged into the app

(async function forceTokenRefresh() {
  console.log('🔄 Starting token refresh...');

  try {
    // Get Firebase auth instance
    const auth = window.firebase?.auth?.() || null;

    if (!auth) {
      console.error('❌ Firebase auth not found. Make sure you are on the app page.');
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      console.error('❌ No user logged in. Please login first.');
      return;
    }

    console.log('👤 Current user:', user.uid);

    // Force token refresh
    console.log('🔄 Forcing token refresh...');
    const token = await user.getIdToken(true); // true forces refresh

    console.log('✅ Token refreshed successfully!');
    console.log('🔄 Reloading page...');

    // Reload the page to apply new permissions
    window.location.reload();

  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    console.log('💡 Please logout and login again manually.');
  }
})();
