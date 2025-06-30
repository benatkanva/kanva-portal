# Kanva Portal

Custom implementation of the Kanva Quotes application with UI refinements.

## Getting Started at Work

Follow these steps to set up the project on your work machine:

### Prerequisites
- Git installed
- A web server (local development server or hosting solution)

### Clone the Repository

```bash
# Navigate to where you want to create the project
cd c:\Projects    # Or your preferred directory

# Clone the repository
git clone https://github.com/benatkanva/kanva-portal.git

# Navigate into the project folder
cd kanva-portal
```

### Running the Application

Since this is a static web application, you can serve it using any web server. Some options:

#### Using Python (if installed)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Using Node.js (if installed)
```bash
# Install serve globally (only needed once)
npm install -g serve

# Serve the application
serve .
```

#### Using VS Code Live Server extension
If you're using VS Code, install the "Live Server" extension and click "Go Live" in the bottom right corner.

### Making Changes

```bash
# Create a new branch for your changes
git checkout -b feature/your-feature-name

# After making changes, stage them
git add .

# Commit your changes
git commit -m "Description of changes made"

# Push to GitHub
git push origin feature/your-feature-name
```

## Recent Changes
- Removed subtotal text and related code from the product and order detail sections
- Fixed "Unknown Product" line that appeared on app load
- Enhanced empty state handling

## Deployment
The application is hosted using GitHub Pages at: https://benatkanva.github.io/kanva-portal/
