import os
import yaml
import json

def process_directory(path):
    """
    Process a directory and return its representation as a dictionary.
    """
    category_data = {}
    tools_file = os.path.join(path, "tools.yaml")
    
    # If tools.yaml exists, read it
    if os.path.exists(tools_file):
        with open(tools_file, 'r') as f:
            tools = yaml.safe_load(f)["tools"]
            category_data["children"] = tools  # Change here
    
    # Process subcategories
    subcategories = []
    for item in os.listdir(path):
        item_path = os.path.join(path, item)
        if os.path.isdir(item_path):
            subcategory_data = process_directory(item_path)
            subcategory_name = item.split('-')[1]  # Extract name from "01-name"
            subcategories.append({
                "name": subcategory_name,
                "children": subcategory_data["children"]
            })
    
    # If there are subcategories, add them to the children list
    if subcategories:
        if "children" not in category_data:
            category_data["children"] = []
        category_data["children"].extend(subcategories)
    
    return category_data

def main():
    root_path = "data"
    tree_data = process_directory(root_path)
    tree_data = {"name":"OSINT Explorer","children":tree_data["children"]}
    
    # Save the result as JSON
    with open("public/data.json", 'w') as f:
        json.dump(tree_data, f, indent=4)

if __name__ == "__main__":
    main()
