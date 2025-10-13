"""
Optimized FridgeChef application with performance improvements and safety fixes
"""
import streamlit as st
import time
import json
import asyncio
from datetime import datetime
import io
import threading
from functools import lru_cache
import logging

# Import optimized backend modules
from backend.config import Config
from backend.openrouter_client import OpenRouterClient
from backend.image_service_optimized import OptimizedImageProcessor
from backend.database_optimized import OptimizedRecipeDatabase
from backend.auth_optimized import OptimizedAuthManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Page configuration with optimized settings
st.set_page_config(
    page_title="FridgeChef - AI Recipe Assistant",
    page_icon="🍳",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        'About': "FridgeChef - AI-powered recipe suggestions from your fridge"
    }
)

# Performance monitoring decorator
def monitor_performance(func):
    """Decorator to monitor function performance"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        elapsed_time = time.time() - start_time

        if elapsed_time > 1.0:  # Log slow operations
            logger.warning(f"{func.__name__} took {elapsed_time:.2f} seconds")

        return result
    return wrapper

# Cache configuration
@st.cache_resource(ttl=3600)
def get_database_connection():
    """Get cached database connection"""
    return OptimizedRecipeDatabase()

@st.cache_resource(ttl=3600)
def get_auth_manager():
    """Get cached auth manager"""
    return OptimizedAuthManager()

@st.cache_data(ttl=300)
def get_cached_recipes(filters: str) -> list:
    """Get cached recipes based on filters"""
    db = get_database_connection()
    filters_dict = json.loads(filters) if filters else {}
    return db.get_recipes(filters_dict, limit=50)

# Rate limiting for API calls
class RateLimiter:
    """Simple rate limiter for API calls"""

    def __init__(self, max_calls: int = 10, window_seconds: int = 60):
        self.max_calls = max_calls
        self.window_seconds = window_seconds
        self.calls = []
        self._lock = threading.Lock()

    def can_call(self) -> tuple:
        """Check if call is allowed"""
        with self._lock:
            current_time = time.time()

            # Remove old calls outside window
            self.calls = [t for t in self.calls if current_time - t < self.window_seconds]

            if len(self.calls) >= self.max_calls:
                wait_time = self.window_seconds - (current_time - self.calls[0])
                return False, f"Rate limit exceeded. Wait {int(wait_time)} seconds"

            self.calls.append(current_time)
            return True, ""

# Initialize rate limiter
if 'rate_limiter' not in st.session_state:
    st.session_state.rate_limiter = RateLimiter()

# Initialize session state with proper defaults
def init_session_state():
    """Initialize all session state variables"""
    defaults = {
        'recognized_ingredients': None,
        'processing': False,
        'history': [],
        'user': None,
        'last_rerun_time': 0,
        'rerun_count': 0,
        'cached_results': {},
        'upload_counter': 0
    }

    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

# Prevent infinite rerun loops
def safe_rerun():
    """Safely rerun the app with loop prevention"""
    current_time = time.time()

    # Reset counter if enough time has passed
    if current_time - st.session_state.last_rerun_time > 5:
        st.session_state.rerun_count = 0

    # Check for rapid reruns
    if st.session_state.rerun_count >= 3:
        logger.warning("Prevented potential infinite rerun loop")
        st.error("Too many rapid updates. Please refresh the page if needed.")
        return

    st.session_state.rerun_count += 1
    st.session_state.last_rerun_time = current_time
    st.rerun()

@monitor_performance
def main():
    """Main application function with optimizations"""

    # Initialize session state
    init_session_state()

    # Validate configuration once
    try:
        Config.validate()
    except ValueError as e:
        st.error(f"Configuration error: {e}")
        st.stop()

    # Get managers
    db = get_database_connection()
    auth = get_auth_manager()

    # Header with user info
    col1, col2, col3 = st.columns([3, 1, 1])

    with col1:
        st.title("🍳 FridgeChef - Optimized")
        st.caption("AI-powered recipe suggestions with enhanced performance")

    with col2:
        if st.session_state.user:
            st.write(f"Welcome, {st.session_state.user['username']}")

    with col3:
        if st.session_state.user:
            if st.button("Logout"):
                auth.logout(st.session_state.get('token'))
                st.session_state.user = None
                st.session_state.token = None
                safe_rerun()
        else:
            if st.button("Login"):
                st.session_state.show_login = True

    # Sidebar with optimized controls
    with st.sidebar:
        st.header("Control Panel")

        # Performance stats
        if st.checkbox("Show Performance Stats"):
            stats = auth.get_stats()
            st.json(stats)

        # API test with rate limiting
        if st.button("Test API Connection"):
            can_call, message = st.session_state.rate_limiter.can_call()

            if not can_call:
                st.warning(message)
            else:
                with st.spinner("Testing connection..."):
                    client = OpenRouterClient()
                    if client.test_connection():
                        st.success("API connection successful")
                    else:
                        st.error("API connection failed")

        # History with pagination
        if st.session_state.history:
            st.divider()
            st.header("Recent History")

            # Show only last 5 items to avoid memory issues
            for item in st.session_state.history[-5:]:
                with st.expander(f"{item['time']} - {item['items']} items"):
                    st.json(item.get('details', {}))

        # Clear cache button
        if st.button("Clear Cache"):
            st.cache_data.clear()
            st.session_state.cached_results = {}
            st.success("Cache cleared")

    # Main content area
    main_container = st.container()

    with main_container:
        tabs = st.tabs(["Image Upload", "Recipe Search", "Profile"])

        # Image Upload Tab
        with tabs[0]:
            handle_image_upload(db, auth)

        # Recipe Search Tab
        with tabs[1]:
            handle_recipe_search(db)

        # Profile Tab
        with tabs[2]:
            handle_user_profile(auth)

    # Footer with performance info
    st.divider()
    col1, col2, col3 = st.columns(3)

    with col1:
        st.caption(f"Version: {Config.APP_VERSION}")

    with col2:
        st.caption(f"Active Sessions: {auth.session_manager.get_active_sessions_count()}")

    with col3:
        st.caption(f"Cache Size: {len(st.session_state.cached_results)}")

@monitor_performance
def handle_image_upload(db, auth):
    """Handle image upload with optimizations"""
    col1, col2 = st.columns([1, 1])

    with col1:
        st.header("Upload Fridge Image")

        # Unique key for file uploader to prevent stale state
        upload_key = f"file_uploader_{st.session_state.upload_counter}"

        uploaded_file = st.file_uploader(
            "Select an image of your fridge",
            type=['jpg', 'jpeg', 'png', 'webp'],
            key=upload_key,
            help="Upload a clear image of your fridge contents"
        )

        if uploaded_file is not None:
            # Display image info without loading full image
            processor = OptimizedImageProcessor()

            # Get image info first
            file_stream = io.BytesIO(uploaded_file.getvalue())
            image_info = processor.get_image_info(file_stream)

            if image_info:
                st.info(f"Image: {image_info['width']}x{image_info['height']}, "
                       f"Size: {image_info['file_size_mb']}MB")

            # Create thumbnail for display
            file_stream.seek(0)
            thumbnail = processor.create_thumbnail(file_stream)

            if thumbnail:
                st.image(f"data:image/jpeg;base64,{thumbnail}",
                        caption="Image preview", use_container_width=True)

            # Validate before processing
            file_stream.seek(0)
            is_valid, error_msg, file_size = processor.validate_image_stream(file_stream)

            if not is_valid:
                st.error(error_msg)
            else:
                st.success("Image validated successfully")

                # Process button with rate limiting
                if st.button("Analyze Ingredients", type="primary",
                           disabled=st.session_state.processing):

                    can_call, message = st.session_state.rate_limiter.can_call()

                    if not can_call:
                        st.warning(message)
                    else:
                        process_image_optimized(uploaded_file, processor)

    with col2:
        st.header("Recognition Results")

        if st.session_state.processing:
            # Show progress without blocking
            progress_placeholder = st.empty()
            with progress_placeholder.container():
                st.info("Processing image... This may take a few seconds.")
                st.progress(0.5)

        if st.session_state.recognized_ingredients:
            display_results_optimized(st.session_state.recognized_ingredients)

@monitor_performance
def process_image_optimized(uploaded_file, processor):
    """Process image with optimizations and error handling"""
    st.session_state.processing = True

    try:
        # Process image safely
        file_stream = io.BytesIO(uploaded_file.getvalue())
        image_base64, error = processor.process_image_safe(
            file_stream, uploaded_file.name
        )

        if error:
            st.error(f"Image processing failed: {error}")
            return

        # Check cache first
        cache_key = f"ingredients_{hashlib.md5(image_base64.encode()).hexdigest()[:8]}"

        if cache_key in st.session_state.cached_results:
            result = st.session_state.cached_results[cache_key]
            st.info("Using cached results")
        else:
            # Call API
            client = OpenRouterClient()

            with st.spinner("Analyzing ingredients..."):
                result = client.recognize_ingredients(image_base64)

            # Cache the result
            if result.get('status') == 'success':
                st.session_state.cached_results[cache_key] = result

        if result.get('status') == 'success':
            st.session_state.recognized_ingredients = result

            # Add to history
            history_item = {
                'time': datetime.now().strftime("%H:%M:%S"),
                'items': result.get('total_items', 0),
                'details': result.get('ingredients', {})
            }

            st.session_state.history.append(history_item)

            # Keep history size limited
            if len(st.session_state.history) > 20:
                st.session_state.history = st.session_state.history[-20:]

            st.success(f"Found {result.get('total_items', 0)} ingredients")
            st.balloons()

        else:
            st.error(f"Recognition failed: {result.get('error', 'Unknown error')}")

    except Exception as e:
        logger.error(f"Processing error: {e}")
        st.error(f"An error occurred: {str(e)}")

    finally:
        st.session_state.processing = False
        # Increment upload counter to reset file uploader
        st.session_state.upload_counter += 1
        safe_rerun()

def display_results_optimized(result):
    """Display results with optimized rendering"""
    ingredients = result.get('ingredients', {})

    if not ingredients:
        st.warning("No ingredients detected")
        return

    # Use columns for better layout
    num_categories = len([c for c in ingredients.values() if c])

    if num_categories > 0:
        cols = st.columns(min(3, num_categories))
        col_index = 0

        for category, items in ingredients.items():
            if items:  # Only show non-empty categories
                with cols[col_index % len(cols)]:
                    st.subheader(category)

                    # Use markdown for faster rendering
                    items_text = "\n".join([f"- {item}" for item in items])
                    st.markdown(items_text)

                col_index += 1

    # Statistics
    st.divider()
    metrics = st.columns(4)

    with metrics[0]:
        st.metric("Total Items", result.get('total_items', 0))

    with metrics[1]:
        st.metric("Categories", num_categories)

    with metrics[2]:
        st.metric("Confidence", f"{result.get('confidence', 0):.1%}")

    with metrics[3]:
        if st.button("Generate Recipes"):
            st.session_state.show_recipes = True

@monitor_performance
def handle_recipe_search(db):
    """Handle recipe search with caching"""
    st.header("Recipe Search")

    # Search filters
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        cuisine = st.selectbox("Cuisine", ["All", "Korean", "Italian", "Chinese", "Japanese"])

    with col2:
        difficulty = st.selectbox("Difficulty", ["All", "Easy", "Medium", "Hard"])

    with col3:
        max_time = st.number_input("Max Time (min)", min_value=0, value=60)

    with col4:
        min_score = st.slider("Min Match Score", 0.0, 1.0, 0.5)

    # Build filters
    filters = {}
    if cuisine != "All":
        filters['cuisine'] = cuisine
    if difficulty != "All":
        filters['difficulty'] = difficulty
    if max_time > 0:
        filters['max_time'] = max_time
    if min_score > 0:
        filters['min_score'] = min_score

    # Search button
    if st.button("Search Recipes"):
        with st.spinner("Searching..."):
            # Use cached function
            recipes = get_cached_recipes(json.dumps(filters))

            if recipes:
                st.success(f"Found {len(recipes)} recipes")

                # Display recipes in grid
                cols = st.columns(3)
                for idx, recipe in enumerate(recipes[:9]):  # Limit display
                    with cols[idx % 3]:
                        with st.container():
                            st.subheader(recipe['name'])
                            st.caption(f"Time: {recipe.get('cooking_time', 'N/A')} min")
                            st.caption(f"Difficulty: {recipe.get('difficulty', 'N/A')}")

                            if st.button("View", key=f"view_{recipe['id']}"):
                                st.session_state.selected_recipe = recipe['id']

            else:
                st.info("No recipes found")

def handle_user_profile(auth):
    """Handle user profile management"""
    if not st.session_state.user:
        # Show login form
        st.header("Login")

        with st.form("login_form"):
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Login")

            if submitted:
                result = auth.login(email, password)

                if result['success']:
                    st.session_state.user = result['user']
                    st.session_state.token = result['token']
                    st.success("Login successful")
                    safe_rerun()
                else:
                    st.error(result['error'])

        # Registration form
        with st.expander("Register New Account"):
            with st.form("register_form"):
                reg_email = st.text_input("Email", key="reg_email")
                reg_username = st.text_input("Username", key="reg_username")
                reg_password = st.text_input("Password", type="password", key="reg_password")
                reg_submitted = st.form_submit_button("Register")

                if reg_submitted:
                    result = auth.register(reg_email, reg_username, reg_password)

                    if result['success']:
                        st.success(result['message'])
                    else:
                        st.error(result['error'])

    else:
        # Show profile
        st.header("User Profile")

        user = st.session_state.user
        profile = user.get('profile', {})

        # Display profile info
        col1, col2 = st.columns(2)

        with col1:
            st.subheader("Account Info")
            st.write(f"Username: {user['username']}")
            st.write(f"Email: {user['email']}")

        with col2:
            st.subheader("Statistics")
            stats = user.get('stats', {})
            st.metric("Recipes Saved", stats.get('recipes_saved', 0))
            st.metric("Recipes Cooked", stats.get('recipes_cooked', 0))

        # Profile editing
        with st.expander("Edit Profile"):
            with st.form("profile_form"):
                nickname = st.text_input("Nickname", value=profile.get('nickname', ''))
                bio = st.text_area("Bio", value=profile.get('bio', ''))
                cooking_level = st.selectbox(
                    "Cooking Level",
                    ["Beginner", "Intermediate", "Advanced"],
                    index=["Beginner", "Intermediate", "Advanced"].index(
                        profile.get('cooking_level', 'Beginner')
                    )
                )

                if st.form_submit_button("Update Profile"):
                    new_profile = {
                        'nickname': nickname,
                        'bio': bio,
                        'cooking_level': cooking_level
                    }

                    if auth.update_profile(user['id'], new_profile):
                        st.success("Profile updated")
                        # Update session
                        st.session_state.user['profile'].update(new_profile)
                        safe_rerun()
                    else:
                        st.error("Failed to update profile")

if __name__ == "__main__":
    main()