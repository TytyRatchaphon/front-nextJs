import os
import re

def scan_logs(root_dir):
    unsafe_logs = []
    
    # regex for standalone console log line:
    # ^\s*console\.(log|warn|error|info|debug)\(
    standalone_pattern = re.compile(r'^\s*console\.(log|warn|error|info|debug)\(')
    
    # regex for ANY console log
    any_pattern = re.compile(r'console\.(log|warn|error|info|debug)\(')

    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if not filename.endswith(('.ts', '.tsx', '.js', '.jsx')):
                continue
                
            filepath = os.path.join(dirpath, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    
                for i, line in enumerate(lines):
                    if any_pattern.search(line):
                        # It has a console log.
                        # Is it standalone?
                        if not standalone_pattern.match(line):
                            # Unsafe!
                            unsafe_logs.append(f"{filepath}:{i+1}: {line.strip()}")
            except Exception as e:
                print(f"Error reading {filepath}: {e}")

    return unsafe_logs

if __name__ == "__main__":
    src_dir = r"c:\Users\dev\Desktop\enjoybook-test\front\src"
    unsafe = scan_logs(src_dir)
    print(f"Found {len(unsafe)} unsafe logs:")
    for log in unsafe:
        print(log)
