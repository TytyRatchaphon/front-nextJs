import os
import re

def remove_console_calls(content):
    # This pattern finds the start of a console call
    pattern = re.compile(r'console\.(log|debug|info|warn|error)\s*\(')
    
    output = []
    last_pos = 0
    
    while True:
        match = pattern.search(content, last_pos)
        if not match:
            output.append(content[last_pos:])
            break
            
        start_index = match.start()
        
        # Check parens balance
        open_parens = 1
        i = match.end()
        valid_parse = True
        
        while i < len(content) and open_parens > 0:
            char = content[i]
            if char in ['"', "'", '`']:
                quote = char
                i += 1
                while i < len(content):
                    if content[i] == quote and content[i-1] != '\\':
                        break
                    i += 1
                if i >= len(content):
                    valid_parse = False
                    break
            elif char == '(':
                open_parens += 1
            elif char == ')':
                open_parens -= 1
            i += 1
            
        if not valid_parse or open_parens > 0:
            output.append(content[last_pos:match.end()])
            last_pos = match.end()
            continue
            
        end_index = i # char after closing paren
        
        # Check for trailing semicolon
        if end_index < len(content) and content[end_index] == ';':
            end_index += 1
            
        # Determine if we consume the whole line(s)
        # Scan backwards from start_index to new line
        line_start = content.rfind('\n', 0, start_index) + 1
        prefix = content[line_start:start_index]
        
        # Scan forward from end_index to newline
        line_end = content.find('\n', end_index)
        if line_end == -1: line_end = len(content)
        suffix = content[end_index:line_end]
        
        is_standalone = prefix.strip() == '' and suffix.strip() == ''
        
        # Append text before the match (excluding prefix if standalone)
        if is_standalone:
            # Append everything up to line_start (start of this line)
            output.append(content[last_pos:line_start])
            # Skip the log and the suffix (which is whitespace) and the newline
            # But line_end points to the newline char position.
            if line_end < len(content):
                last_pos = line_end + 1
            else:
                last_pos = line_end
        else:
            # Inline. Just remove the console log statement.
            output.append(content[last_pos:start_index])
            last_pos = end_index

    return "".join(output)

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = remove_console_calls(content)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Cleaned {filepath}")
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    src_dir = r"c:\Users\dev\Desktop\enjoybook-test\front\src"
    for dirpath, dirnames, filenames in os.walk(src_dir):
        for filename in filenames:
            if filename.endswith(('.ts', '.tsx', '.js', '.jsx')):
                process_file(os.path.join(dirpath, filename))
