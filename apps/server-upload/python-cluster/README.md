# Image Clustering Microservice

This is a Python microservice that provides UMAP + HDBSCAN clustering for image embeddings.

## Requirements

- Python 3.9+
- Docker (optional, for containerized deployment)

## Local Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the service:
   ```
   python app.py
   ```

   The service will be available at `http://localhost:5000`.

## Docker Setup

1. Build the Docker image:
   ```
   docker build -t image-clustering-service .
   ```

2. Run the container:
   ```
   docker run -p 5000:5000 image-clustering-service
   ```

## API Usage

### POST /cluster

Clusters image embeddings using UMAP + HDBSCAN.

**Request Body:**

```json
{
  "embeddings": [
    { "id": "image1", "vector": [0.1, 0.2, ...] },
    { "id": "image2", "vector": [0.3, 0.4, ...] },
    ...
  ],
  "imagesTakenTime": [
    { "id": "image1", "time": "2023-01-01T12:00:00Z" },
    ...
  ],
  "imagesTakenLocation": [
    { "id": "image1", "location": { "lat": 40.7128, "lng": -74.0060 } },
    ...
  ]
}
```

**Response:**

```json
{
  "clusterIds": [0, 1, 0, -1, 2, ...],
  "outliers": [3, 7, ...]
}
```

- `clusterIds`: Array of cluster IDs for each image. `-1` indicates an outlier.
- `outliers`: Array of indices of images that are outliers. 