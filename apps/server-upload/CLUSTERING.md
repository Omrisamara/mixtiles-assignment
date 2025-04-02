# Image Clustering with UMAP + HDBSCAN

This document explains how the image clustering system works using UMAP and HDBSCAN algorithms via a Python microservice.

## Architecture

The clustering system consists of two main components:

1. **Node.js Server**: Handles image processing, extracts features, and communicates with the Python clustering service
2. **Python Microservice**: Implements UMAP + HDBSCAN clustering algorithms

```
┌─────────────────┐     REST API      ┌────────────────────┐
│                 │ ────────────────► │                    │
│  Node.js Server │                   │ Python Clustering  │
│                 │ ◄──────────────── │     Service        │
└─────────────────┘                   └────────────────────┘
```

## Setup and Running

### Option 1: Running Locally

1. **Start the Node.js server:**
   ```
   nx serve server-upload
   ```

2. **Set up the Python environment:**
   ```
   cd apps/server-upload
   npm run setup:cluster
   ```

3. **Start the Python clustering service:**
   ```
   cd apps/server-upload
   npm run start:cluster
   ```

### Option 2: Running with Docker

1. **Build the Docker images:**
   ```
   cd apps/server-upload
   npm run docker:build
   ```

2. **Run the services:**
   ```
   cd apps/server-upload
   npm run docker:up
   ```

## How It Works

1. Images are processed and their features are extracted in the Node.js server
2. Image embeddings, along with metadata like time and location, are sent to the Python service
3. The Python service applies:
   - **UMAP**: For dimensionality reduction while preserving the structure of the data
   - **HDBSCAN**: For density-based clustering to identify groups of similar images
4. The clustering results are returned to the Node.js server for further processing

## API Flow

```
1. Client uploads images
2. Node.js extracts features and embeddings
3. Node.js sends embeddings to Python service
4. Python service performs UMAP + HDBSCAN clustering
5. Python service returns cluster assignments
6. Node.js processes clustering results
7. Results returned to client
```

## Customization

The clustering parameters can be adjusted in the Python service:

- **UMAP parameters**: `n_neighbors`, `min_dist`, `n_components`
- **HDBSCAN parameters**: `min_cluster_size`, `min_samples`, `cluster_selection_epsilon`

## Troubleshooting

- **Connection issues**: Ensure both services are running and the PYTHON_CLUSTER_SERVICE_URL is correct in .env
- **Clustering quality**: Tune the parameters in the Python service
- **Memory issues**: For large datasets, consider batch processing 