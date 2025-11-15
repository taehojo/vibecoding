# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is Study-02, part of the VibeCoding educational series. Study-01 implemented a handwritten digit recognition system using TensorFlow/Keras with both desktop (Tkinter) and web (Flask) interfaces.

## Git Repository Configuration Issue

**IMPORTANT**: The git repository is currently initialized at the user home directory level (`C:/Users/taehj`) rather than at the project level. This causes it to track system files unnecessarily. When working on this project:
- Consider initializing a new git repository at the project level: `git init` in the Study-02 directory
- Create a proper `.gitignore` file to exclude unnecessary files

## Expected Project Structure

Based on Study-01 pattern, this project may follow a similar structure:
```
Study-02/
├── desktop_version/    # Desktop GUI application
├── web_version/        # Web-based application
└── CLAUDE.md          # This file
```

## Common Development Patterns from Study-01

### Python Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### TensorFlow/Keras ML Projects
- Use TensorFlow 2.x with Keras API
- Implement clear model architecture with Sequential or Functional API
- Include model visualization and training history plots
- Handle image preprocessing (resize, normalize)
- Save/load trained models in `.h5` format

### Desktop Applications (if using Tkinter)
- Single-file implementation for simplicity
- Clear separation of GUI and ML logic
- Canvas widget for drawing input
- Real-time prediction display

### Web Applications (if using Flask)
- RESTful API endpoints for predictions
- Static files organization (css/, js/)
- HTML5 Canvas for drawing interface
- Base64 image encoding for API communication
- CORS handling if needed

## Windows-Specific Considerations

- Use batch files for common operations (install.bat, run.bat)
- Path separators: Use raw strings or forward slashes in Python
- Virtual environment activation differs from Unix systems

## Code Style Guidelines

- Follow PEP 8 for Python code
- Use descriptive variable names
- Include docstrings for functions and classes
- Keep ML model architecture clearly documented
- Separate concerns: UI, business logic, ML models

## Testing Approach

For ML projects:
- Test data preprocessing functions
- Validate model input/output shapes
- Test API endpoints (if web version)
- Manual testing of GUI interactions

## Security Considerations

- Never commit trained model files to git (add to .gitignore)
- Don't include API keys or credentials
- Validate and sanitize user input
- Use environment variables for configuration

## Common Tasks

### Starting a New ML Project
1. Set up virtual environment
2. Install core dependencies: `tensorflow`, `numpy`, `pillow`
3. Create model architecture file
4. Implement data preprocessing
5. Build interface (desktop or web)

### Running Applications
- Desktop: `python main.py` or `python [app_name].py`
- Web: `flask run` or `python app.py`

Note: This is a new, empty project directory. The above guidelines are based on patterns observed in Study-01 and common Python ML project practices.