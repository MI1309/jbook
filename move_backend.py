import os
import shutil
import glob

def move_files():
    backend_dir = 'backend'
    data_dir = os.path.join(backend_dir, 'data')
    scripts_dir = os.path.join(backend_dir, 'scripts')
    
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(scripts_dir, exist_ok=True)
    
    # Move JSON files
    json_files = glob.glob(os.path.join(backend_dir, '*.json'))
    for f in json_files:
        print(f"Moving {f} to {data_dir}")
        shutil.move(f, os.path.join(data_dir, os.path.basename(f)))
        
    # Move Python scripts
    patterns = [
        'populate_*.py',
        'import_*.py',
        'test_*.py',
        'check_*.py',
        'cleanup_*.py',
        'translate_*.py',
        'do_import.py',
        'update_admin.py'
    ]
    
    for pattern in patterns:
        py_files = glob.glob(os.path.join(backend_dir, pattern))
        for f in py_files:
            print(f"Moving {f} to {scripts_dir}")
            shutil.move(f, os.path.join(scripts_dir, os.path.basename(f)))
            
    # Move text files
    txt_files = glob.glob(os.path.join(backend_dir, '*.txt'))
    # Exclude requirements.txt
    for f in txt_files:
        if os.path.basename(f) != 'requirements.txt':
            print(f"Moving {f} to {scripts_dir}")
            shutil.move(f, os.path.join(scripts_dir, os.path.basename(f)))

if __name__ == '__main__':
    move_files()
