import os
import re

dir_path = r'i:\RLLT\Webapp\frontend\src\pages\admin'

# The goal is to:
# 1. Ensure .map() in mobile view uses .slice(first, first + rows)
# 2. Inject mobile paginator at the end of the block md:hidden div

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 1. Find block md:hidden
    # There are typically two: the top action bar and the Mobile Card List.
    # We want the one containing .map(
    
    # Let's find the array name used for the desktop Paginator to know what variable we are paginating
    paginator_match = re.search(r'<Paginator[^>]+totalRecords=\{([a-zA-Z0-9_]+)\.length\}', content)
    if not paginator_match:
        # If no explicit Paginator, look for DataTable with paginator
        dt_match = re.search(r'<DataTable[^>]+value=\{([a-zA-Z0-9_]+)\}[^>]+paginator', content)
        if dt_match:
            arr_name = dt_match.group(1)
        else:
            print(f"Skipping {filepath} - couldn't find Paginator or paginator in DataTable")
            return
    else:
        arr_name = paginator_match.group(1)

    print(f"File: {os.path.basename(filepath)}, array: {arr_name}")

    # 2. Inject .slice() if missing
    # We look for something like `arr_name.map` or `arr_name.filter(...).map`
    # and replace `.map` with `.slice(first, first + rows).map`
    # Warning: this might match desktop map if any, but usually it's in mobile view.
    
    # Instead of full auto regex, let's do targeted replacements
    if f"{arr_name}.slice(first, first + rows).map" not in content:
        # Find arr_name.map
        content = re.sub(rf'\b{arr_name}\.map\(', rf'{arr_name}.slice(first, first + rows).map(', content)
        
        # If it has filter: arr_name.filter(...).map(
        # We need to slice AFTER filter
        content = re.sub(rf'\b({arr_name}\.filter\([\s\S]*?\))\s*\.map\(', r'\1.slice(first, first + rows).map(', content)

    # 3. Inject Mobile Paginator
    # Check if already has mobile paginator
    if "template=\"PrevPageLink PageLinks NextPageLink\"" not in content:
        # Find the end of the block md:hidden div.
        # This is tricky in JSX. Let's find:
        # {/* External Paginator Card */}
        # or <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
        # And inject right before it:
        
        paginator_html = f"""
                    {{/* Mobile Paginator */}}
                    {{{arr_name}.length > 0 && (
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 block md:hidden">
                            <Paginator 
                                first={{first}} 
                                rows={{rows}} 
                                totalRecords={{{arr_name}.length}} 
                                onPageChange={{(e) => {{ setFirst(e.first); setRows(e.rows); }}}}
                                template="PrevPageLink PageLinks NextPageLink" 
                            />
                        </div>
                    )}}
        """

        # Usually followed by external paginator block
        if "{/* External Paginator Card */}" in content:
            content = content.replace("{/* External Paginator Card */}", paginator_html + "\n                {/* External Paginator Card */}")
        else:
            # If no external paginator, maybe just before Dialog
            if "<Dialog " in content:
                # Find first dialog
                idx = content.find("<Dialog ")
                if idx != -1:
                    content = content[:idx] + paginator_html + "\n            " + content[idx:]
            
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")
    else:
        print(f"No changes for {os.path.basename(filepath)}")

for filename in os.listdir(dir_path):
    if filename.endswith(".jsx"):
        process_file(os.path.join(dir_path, filename))
