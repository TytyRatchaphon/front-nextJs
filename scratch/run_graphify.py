import json
import os
from pathlib import Path
from graphify.extract import extract
from graphify.graph import build_graph, cluster_graph
from graphify.viz import generate_html
from graphify.communities import label_communities

def run_graphify(path_str):
    root = Path(path_str)
    out_dir = Path('graphify-out')
    out_dir.mkdir(exist_ok=True)
    
    print(f"Extracting from {path_str}...")
    # Attempt extraction without semantic LLM if no keys
    # The library should fall back to AST-only if keys are missing or specifically told
    # Let's try to pass no_semantic if it supports it, or just let it fail/warn
    try:
        # Based on typical graphify behavior, if no keys, it does AST only
        nodes, edges = extract(root)
    except Exception as e:
        print(f"Extraction error: {e}")
        return

    print(f"Building graph with {len(nodes)} nodes and {len(edges)} edges...")
    graph = build_graph(nodes, edges)
    
    print("Clustering...")
    graph = cluster_graph(graph)
    
    print("Labeling communities...")
    graph = label_communities(graph)
    
    print("Saving graph.json...")
    with open(out_dir / 'graph.json', 'w', encoding='utf-8') as f:
        json.dump(graph, f, indent=2)
        
    print("Generating graph.html...")
    html = generate_html(graph)
    with open(out_dir / 'graph.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
    print("Done!")

if __name__ == "__main__":
    run_graphify('src')
