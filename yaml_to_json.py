import os
import yaml
import json
import sys

def process_directory(path, depth=0):
    """
    Process a directory and return its representation as a dictionary.
    """
    print(f"{'  ' * depth}Processing directory: {path}")
    
    # Always initialize with a valid structure
    category_data = {"children": []}
    tools_file = os.path.join(path, "tools.yaml")
    
    # If tools.yaml exists, read it
    if os.path.exists(tools_file):
        try:
            with open(tools_file, 'r') as f:
                yaml_content = yaml.safe_load(f)
                if yaml_content and isinstance(yaml_content, dict) and "tools" in yaml_content:
                    tools = yaml_content["tools"]
                    # Only set children if tools is not None and is a list
                    if tools is not None and isinstance(tools, list):
                        category_data["children"] = tools
                    else:
                        print(f"{'  ' * depth}Warning: tools is None or not a list in {tools_file}")
                        # Ensure children is always a list
                        category_data["children"] = []
                else:
                    print(f"{'  ' * depth}Warning: Invalid YAML content in {tools_file}")
        except Exception as e:
            print(f"{'  ' * depth}Error reading {tools_file}: {e}")
    
    # Process subcategories
    subcategories = []
    try:
        for item in os.listdir(path):
            item_path = os.path.join(path, item)
            if os.path.isdir(item_path):
                print(f"{'  ' * depth}Found subdirectory: {item}")
                try:
                    # Recursive call with increased depth for debug indentation
                    subcategory_data = process_directory(item_path, depth + 1)
                    
                    # Defensive check - ensure we got valid data back
                    if subcategory_data is None:
                        print(f"{'  ' * depth}Warning: Got None from {item_path}, using empty dict")
                        subcategory_data = {"children": []}
                    
                    # Only add if it has children
                    if isinstance(subcategory_data, dict) and "children" in subcategory_data and subcategory_data["children"]:
                        try:
                            subcategory_name = item.split('-')[1].strip() if '-' in item else item
                            subcategories.append({
                                "name": subcategory_name,
                                "children": subcategory_data["children"]
                            })
                            print(f"{'  ' * depth}Added subcategory: {subcategory_name}")
                        except IndexError:
                            # Handle case where the folder naming doesn't follow the expected pattern
                            subcategories.append({
                                "name": item,
                                "children": subcategory_data["children"]
                            })
                            print(f"{'  ' * depth}Added subcategory with original name: {item}")
                    else:
                        print(f"{'  ' * depth}Skipping {item_path} - no children")
                except Exception as e:
                    print(f"{'  ' * depth}Error processing subdirectory {item_path}: {e}")
                    continue
    except Exception as e:
        print(f"{'  ' * depth}Error listing directory {path}: {e}")
    
    # If there are subcategories, add them to the children list
    if subcategories:
        # Double check that category_data is properly initialized
        if category_data is None:
            print(f"{'  ' * depth}Warning: category_data is None before extend, reinitializing")
            category_data = {"children": []}
        elif not isinstance(category_data, dict):
            print(f"{'  ' * depth}Warning: category_data is not a dict, type: {type(category_data)}")
            category_data = {"children": []}
        elif "children" not in category_data:
            print(f"{'  ' * depth}Warning: children key missing in category_data")
            category_data["children"] = []
        
        try:
            category_data["children"].extend(subcategories)
            print(f"{'  ' * depth}Extended with {len(subcategories)} subcategories")
        except Exception as e:
            print(f"{'  ' * depth}Error extending children: {e}")
            # Last resort - create a new dictionary
            category_data = {"children": subcategories}
    
    print(f"{'  ' * depth}Returning data for {path} with {len(category_data.get('children', []))} children")
    return category_data

def main():
    root_path = "data"
    tree_data = process_directory(root_path)
    tree_data = {"name":"OSINT Explorer","children":tree_data["children"]}
    
    # Ensure the public directory exists
    os.makedirs("public", exist_ok=True)
    
    # Save the result as JSON
    with open("public/data.json", 'w') as f:
        json.dump(tree_data, f, indent=4)
    
    print(f"Successfully converted YAML to JSON: public/data.json")

if __name__ == "__main__":
    main()
