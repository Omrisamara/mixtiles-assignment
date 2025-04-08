from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import umap
import hdbscan
import logging
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def format_cluster_results(cluster_labels, file_indices):
    """
    Formats clustering results as an array of {fileId: string, cluster: number} objects.
    Excludes outliers (items with cluster label -1).
    
    Args:
        cluster_labels: Array of cluster labels for each embedding
        file_indices: List of file identifiers corresponding to the embeddings
        
    Returns:
        List of dictionaries mapping fileId to cluster, excluding outliers
    """
    return [
        {"fileId": str(file_indices[i]), "cluster": int(label)} 
        for i, label in enumerate(cluster_labels)
        if label != -1  # Exclude outliers
    ]

def get_outlier_file_ids(cluster_labels, file_indices):
    """
    Returns a list of file IDs that correspond to outliers.
    
    Args:
        cluster_labels: Array of cluster labels where -1 indicates outliers
        file_indices: List of file identifiers corresponding to the embeddings
        
    Returns:
        List of file IDs that are outliers
    """
    outlier_indices = np.where(cluster_labels == -1)[0]
    return [str(file_indices[i]) for i in outlier_indices]

def find_duplicate_embeddings(embeddings, file_indices, similarity_threshold=0.80):
    """
    Finds near-duplicate embeddings based on cosine similarity.
    
    Args:
        embeddings: Array of embeddings
        file_indices: List of file identifiers
        similarity_threshold: Threshold above which embeddings are considered duplicates
        
    Returns:
        tuple: (filtered_embeddings, filtered_indices, removed_duplicates)
        where removed_duplicates is a list of file IDs that were removed as duplicates
    """
    similarities = cosine_similarity(embeddings)
    np.fill_diagonal(similarities, 0)  # Ignore self-similarities
    
    # Keep track of which embeddings to remove
    to_remove = set()
    removed_duplicates = []
    
    for i in range(len(similarities)):
        if i in to_remove:
            continue
            
        # Find indices of highly similar embeddings
        similar_indices = np.where(similarities[i] > similarity_threshold)[0]
        
        # Add all similar embeddings to removed list (except the first one)
        for idx in similar_indices:
            if idx not in to_remove:
                to_remove.add(idx)
                removed_duplicates.append(str(file_indices[idx]))
    
    # Create mask for keeping embeddings
    keep_mask = np.ones(len(embeddings), dtype=bool)
    keep_mask[list(to_remove)] = False
    
    filtered_embeddings = embeddings[keep_mask]
    filtered_indices = [idx for i, idx in enumerate(file_indices) if keep_mask[i]]
    
    return filtered_embeddings, filtered_indices, removed_duplicates

@app.route('/cluster', methods=['POST'])
def cluster_images():
    try:
        data = request.json
        logger.info(f"Received clustering request with {len(data['embeddings'])} embeddings")
        
        # Extract embeddings from request
        embeddings = np.array([emb['vector'] for emb in data['embeddings']])
        file_indices = [emb.get('filename', str(i)) for i, emb in enumerate(data['embeddings'])]
        
        # Find and remove duplicates first
        filtered_embeddings, filtered_indices, removed_duplicates = find_duplicate_embeddings(
            embeddings, file_indices
        )
        
        logger.info(f"Found {len(removed_duplicates)} duplicate embeddings")
        
        # Apply UMAP for dimensionality reduction on filtered embeddings
        umap_reducer = umap.UMAP(
            n_neighbors=15, 
            n_components=5,
            min_dist=0.1,
            metric='cosine'
        )
        embedding_reduced = umap_reducer.fit_transform(filtered_embeddings)
        
        # Apply HDBSCAN for clustering on reduced embeddings
        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=5,
            min_samples=2,
            cluster_selection_epsilon=0.2,
            metric='euclidean'
        )
        cluster_labels = clusterer.fit_predict(embedding_reduced)
        
        # Format results
        result = {
            "fileClusterMapping": format_cluster_results(cluster_labels, filtered_indices),
            "outliers": get_outlier_file_ids(cluster_labels, filtered_indices),
            "duplicates": removed_duplicates
        }
        
        logger.info(f"Clustering complete: found {len(set(cluster_labels)) - (1 if -1 in cluster_labels else 0)} clusters")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error during clustering: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) 